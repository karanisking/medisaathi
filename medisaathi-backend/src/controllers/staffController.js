import { Token, TOKEN_STATUS, SKIP_REASON, ACTIVE_STATUSES } from '../models/token.js';
import { QueueState }   from '../models/queueState.js';
import { sendSuccess, sendError }  from '../utils/responseUtil.js';
import { getTodayIST }             from '../utils/dateUtil.js';
import { updateAnalyticsOnComplete, updateAnalyticsOnSkip } from '../services/analyticsService.js';
import {
  emitTokenCalled,
  emitTokenCompleted,
  emitTokenSkipped,
  emitQueuePaused,
  emitQueueResumed,
  clearSkipTimer,
} from '../socket/queueEvent.js';

// Staff's branch comes from req.user.branch (set on their account)
const getStaffBranch = (req) => req.user.branch.toString();

// ── GET /api/staff/queue ──────────────────────────────────────────────────────
export const getLiveQueue = async (req, res, next) => {
  try {
    const branchId = getStaffBranch(req);
    const today    = getTodayIST();

    const state = await QueueState.findOne({ branch: branchId });

    const tokens = await Token
      .find({ branch: branchId, queueDate: today, status: { $in: ACTIVE_STATUSES } })
      .populate('patient', 'name email')
      .select('tokenSequence problemType problemNote status attemptNumber createdAt calledAt')
      .sort({ tokenSequence: 1 });

    return sendSuccess(res, {
      data: {
        queueState: {
          isPaused:          state?.isPaused ?? false,
          currentSequence:   state?.currentSequence ?? 0,
          lastSequence:      state?.lastSequence ?? 0,
          avgServiceTimeMin: state?.avgServiceTimeMin ?? 10,
          totalCompleted:    state?.totalCompletedToday ?? 0,
        },
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/staff/queue/next ────────────────────────────────────────────────
export const callNextToken = async (req, res, next) => {
  try {
    const branchId = getStaffBranch(req);
    const today    = getTodayIST();

    // Find the next WAITING token in sequence
    const nextToken = await Token.findOne({
      branch:    branchId,
      queueDate: today,
      status:    TOKEN_STATUS.WAITING,
    }).sort({ tokenSequence: 1 });

    if (!nextToken) {
      return sendError(res, { statusCode: 404, message: 'No waiting tokens in queue' });
    }

    // Mark previous currentToken as SKIPPED if it was still CALLED
    // (edge case: staff calls next without completing current)
    const state = await QueueState.findOne({ branch: branchId });
    if (state?.currentToken) {
      const prev = await Token.findById(state.currentToken);
      if (prev && prev.status === TOKEN_STATUS.CALLED) {
        prev.status     = TOKEN_STATUS.SKIPPED;
        prev.skipReason = SKIP_REASON.TIMEOUT;
        prev.skippedAt  = new Date();
        await prev.save();
        clearSkipTimer(branchId);
      }
    }

    // Update token to CALLED
    nextToken.status   = TOKEN_STATUS.CALLED;
    nextToken.calledAt = new Date();
    await nextToken.save();

    // Update QueueState
    await QueueState.findOneAndUpdate(
      { branch: branchId },
      {
        currentToken:    nextToken._id,
        currentSequence: nextToken.tokenSequence,
      }
    );

    // Emit to branch room + start 25s skip timer
    emitTokenCalled(branchId, nextToken);

    // Count remaining waiting tokens for response
    const remaining = await Token.countDocuments({
      branch: branchId, queueDate: today, status: TOKEN_STATUS.WAITING,
    });

    return sendSuccess(res, {
      message: `Token #${nextToken.tokenSequence} called`,
      data: {
        calledToken: {
          id:            nextToken._id,
          tokenSequence: nextToken.tokenSequence,
          problemType:   nextToken.problemType,
        },
        remainingInQueue: remaining,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/staff/tokens/:id/skip ──────────────────────────────────────────
export const skipToken = async (req, res, next) => {
  try {
    const branchId = getStaffBranch(req);
    const token    = await Token.findById(req.params.id);

    if (!token) {
      return sendError(res, { statusCode: 404, message: 'Token not found' });
    }

    // Only tokens in this staff's branch
    if (token.branch.toString() !== branchId) {
      return sendError(res, { statusCode: 403, message: 'Token does not belong to your branch' });
    }

    if (![TOKEN_STATUS.WAITING, TOKEN_STATUS.CALLED].includes(token.status)) {
      return sendError(res, {
        statusCode: 400,
        message: `Cannot skip token with status: ${token.status}`,
      });
    }

    token.status     = TOKEN_STATUS.SKIPPED;
    token.skipReason = SKIP_REASON.MANUAL; // staff skipped → patient cannot rejoin
    token.skippedAt  = new Date();
    await token.save();

    clearSkipTimer(branchId);

    // Clear currentToken if this was the active one
    const state = await QueueState.findOne({ branch: branchId });
    if (state?.currentToken?.toString() === token._id.toString()) {
      await QueueState.findOneAndUpdate(
        { branch: branchId },
        { currentToken: null }
      );
    }

    await updateAnalyticsOnSkip({
      branchId,
      hospitalId: token.hospital,
      today:      token.queueDate,
      isManual:   true,
    });

    emitTokenSkipped(branchId, {
      tokenSequence: token.tokenSequence,
      tokenId:       token._id,
      reason:        'manual',
    });

    return sendSuccess(res, {
      message: `Token #${token.tokenSequence} skipped`,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/staff/tokens/:id/complete ──────────────────────────────────────
export const completeToken = async (req, res, next) => {
  try {
    const branchId = getStaffBranch(req);
    const token    = await Token.findById(req.params.id);

    if (!token) {
      return sendError(res, { statusCode: 404, message: 'Token not found' });
    }

    if (token.branch.toString() !== branchId) {
      return sendError(res, { statusCode: 403, message: 'Token does not belong to your branch' });
    }

    if (![TOKEN_STATUS.CALLED, TOKEN_STATUS.SERVING].includes(token.status)) {
      return sendError(res, {
        statusCode: 400,
        message: `Cannot complete token with status: ${token.status}`,
      });
    }

    const now = new Date();
    token.status      = TOKEN_STATUS.COMPLETED;
    token.completedAt = now;
    if (!token.servingAt) token.servingAt = now;
    await token.save();

    clearSkipTimer(branchId);

    // Update rolling average service time
    const serviceDurationMin = (now - token.calledAt) / 60000;
    const state = await QueueState.findOne({ branch: branchId });
    const prevCompleted = state?.totalCompletedToday ?? 0;
    const prevAvg       = state?.avgServiceTimeMin   ?? 10;
    const newAvg = ((prevAvg * prevCompleted) + serviceDurationMin) / (prevCompleted + 1);

    await QueueState.findOneAndUpdate(
      { branch: branchId },
      {
        currentToken:        null,
        $inc: { totalCompletedToday: 1 },
        avgServiceTimeMin:   Math.round(newAvg * 10) / 10, // 1 decimal
      }
    );

    // Count remaining
    const remaining = await Token.countDocuments({
      branch: branchId, queueDate: token.queueDate, status: TOKEN_STATUS.WAITING,
    });

    const updatedState = await QueueState.findOne({ branch: branchId });

    await updateAnalyticsOnComplete({
      branchId,
      hospitalId:      token.hospital,
      today:           token.queueDate,
      waitMin:         (token.calledAt - token.createdAt) / 60000,
      serviceMin:      serviceDurationMin,
    });

    emitTokenCompleted(branchId, {
      tokenSequence:    token.tokenSequence,
      remainingInQueue: remaining,
      avgWaitMin:       updatedState?.avgServiceTimeMin ?? 10,
    });

    return sendSuccess(res, {
      message: `Token #${token.tokenSequence} completed`,
      data: { remainingInQueue: remaining },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/staff/queue/pause ───────────────────────────────────────────────
export const pauseQueue = async (req, res, next) => {
  try {
    const branchId = getStaffBranch(req);
    const state    = await QueueState.findOne({ branch: branchId });

    if (!state) {
      return sendError(res, { statusCode: 400, message: 'Queue has not been started today' });
    }
    if (state.isPaused) {
      return sendError(res, { statusCode: 400, message: 'Queue is already paused' });
    }

    await QueueState.findOneAndUpdate({ branch: branchId }, { isPaused: true });
    emitQueuePaused(branchId);

    return sendSuccess(res, { message: 'Queue paused' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/staff/queue/resume ──────────────────────────────────────────────
export const resumeQueue = async (req, res, next) => {
  try {
    const branchId = getStaffBranch(req);
    const state    = await QueueState.findOne({ branch: branchId });

    if (!state) {
      return sendError(res, { statusCode: 400, message: 'Queue has not been started today' });
    }
    if (!state.isPaused) {
      return sendError(res, { statusCode: 400, message: 'Queue is not paused' });
    }

    await QueueState.findOneAndUpdate({ branch: branchId }, { isPaused: false });
    emitQueueResumed(branchId);

    return sendSuccess(res, { message: 'Queue resumed' });
  } catch (err) {
    next(err);
  }
};