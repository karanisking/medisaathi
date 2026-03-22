import { Token, TOKEN_STATUS, SKIP_REASON, ACTIVE_STATUSES } from '../models/token.js';
import { QueueState }  from '../models/queueState.js';
import { Branch }      from '../models/branch.js';
import { sendSuccess, sendError } from '../utils/responseUtil.js';
import { getTodayIST } from '../utils/dateUtil.js';
import { emitTokenLeft } from '../socket/queueEvent.js';
import { updateAnalyticsOnJoin } from '../services/analyticsService.js';

// ── POST /api/tokens — Join queue ─────────────────────────────────────────────
export const joinQueue = async (req, res, next) => {
  try {
    const { branchId, problemType, problemNote = '' } = req.body;
    const patientId = req.user._id;
    const today     = getTodayIST();

    // 1. Check branch exists and queue is enabled
    const branch = await Branch.findOne({ _id: branchId, isActive: true });
    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }
    if (!branch.queueEnabled) {
      return sendError(res, { statusCode: 400, message: 'Queue is not active for this branch' });
    }

    // 2. Check patient has no active token at any branch right now
    const activeToken = await Token.findOne({
      patient: patientId,
      status:  { $in: ACTIVE_STATUSES },
    });
    if (activeToken) {
      return sendError(res, {
        statusCode: 409,
        message: 'You already have an active token. Leave your current queue first.',
      });
    }

    // 3. Check daily attempt limit (max 2 per branch per day)
    const todayTokens = await Token.find({
      patient:   patientId,
      branch:    branchId,
      queueDate: today,
    });

    if (todayTokens.length >= 2) {
      return sendError(res, {
        statusCode: 429,
        message: 'You have reached the maximum of 2 tokens per day for this branch',
      });
    }

    // 4. If this is a second attempt — verify eligibility
    //    Patient must have been timeout-skipped (not manually skipped, not left)
    if (todayTokens.length === 1) {
      const prev = todayTokens[0];

      const wasTimeoutSkipped =
        prev.status === TOKEN_STATUS.SKIPPED &&
        prev.skipReason === SKIP_REASON.TIMEOUT;

      if (!wasTimeoutSkipped) {
        return sendError(res, {
          statusCode: 403,
          message: 'You can only rejoin if your previous token was auto-skipped due to timeout',
        });
      }

      // Also verify their previous token sequence < currentSequence
      // (i.e. the queue has genuinely moved past them)
      const state = await QueueState.findOne({ branch: branchId });
      if (state && prev.tokenSequence >= state.currentSequence) {
        return sendError(res, {
          statusCode: 403,
          message: 'Queue has not moved past your token yet. Please wait.',
        });
      }
    }

    // 5. Get or create QueueState for this branch
    let state = await QueueState.findOne({ branch: branchId });

    if (!state || state.queueDate !== today) {
      // First token of the day — upsert a fresh QueueState
      state = await QueueState.findOneAndUpdate(
        { branch: branchId },
        {
          $set: {
            branch:              branchId,
            hospital:            branch.hospital,
            queueDate:           today,
            lastSequence:        0,
            currentSequence:     0,
            isPaused:            false,
            currentToken:        null,
            avgServiceTimeMin:   10,
            totalCompletedToday: 0,
            lastResetAt:         new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    if (state.isPaused) {
      return sendError(res, {
        statusCode: 400,
        message: 'Queue is currently paused. Please try again shortly.',
      });
    }

    // 6. Atomically increment lastSequence to get the next token number
    const updatedState = await QueueState.findOneAndUpdate(
      { branch: branchId, queueDate: today },
      { $inc: { lastSequence: 1 } },
      { new: true }
    );

    const tokenSequence = updatedState.lastSequence;
    const attemptNumber = todayTokens.length + 1; // 1 or 2

    // 7. Create the token
    const token = await Token.create({
      branch:        branchId,
      hospital:      branch.hospital,
      patient:       patientId,
      tokenSequence,
      problemType,
      problemNote:   problemType === 'other' ? problemNote : '',
      queueDate:     today,
      attemptNumber,
    });

    // 8. Calculate position and estimated wait
    const tokensAhead = tokenSequence - updatedState.currentSequence - 1;
    const estimatedWaitMin = Math.max(0, tokensAhead) * updatedState.avgServiceTimeMin;

    // 9. Update analytics
    await updateAnalyticsOnJoin({ branchId, hospitalId: branch.hospital, problemType, today });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Joined queue successfully',
      data: {
        token: {
          id:             token._id,
          tokenSequence,
          status:         token.status,
          problemType:    token.problemType,
          problemNote:    token.problemNote,
          queueDate:      token.queueDate,
          attemptNumber:  token.attemptNumber,
          joinedAt:       token.createdAt,
        },
        queueInfo: {
          currentSequence:  updatedState.currentSequence,
          tokensAhead:      Math.max(0, tokensAhead),
          estimatedWaitMin,
          isPaused:         updatedState.isPaused,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tokens/mine ──────────────────────────────────────────────────────
// Returns patient's active token with live queue info
export const getMyToken = async (req, res, next) => {
  try {
    const today = getTodayIST();

    const token = await Token
      .findOne({
        patient:  req.user._id,
        status:   { $in: ACTIVE_STATUSES },
        queueDate: today,
      })
      .populate('branch', 'name city queueEnabled skipTimeoutSec');

    if (!token) {
      return sendSuccess(res, {
        data: { token: null, message: 'No active token' },
      });
    }

    const state = await QueueState.findOne({ branch: token.branch._id });

    const tokensAhead = state
      ? Math.max(0, token.tokenSequence - state.currentSequence - 1)
      : 0;

    const estimatedWaitMin = state
      ? tokensAhead * state.avgServiceTimeMin
      : 0;

    return sendSuccess(res, {
      data: {
        token: {
          id:            token._id,
          tokenSequence: token.tokenSequence,
          status:        token.status,
          problemType:   token.problemType,
          problemNote:   token.problemNote,
          queueDate:     token.queueDate,
          attemptNumber: token.attemptNumber,
          joinedAt:      token.createdAt,
          branch: {
            id:           token.branch._id,
            name:         token.branch.name,
            city:         token.branch.city,
            queueEnabled: token.branch.queueEnabled,
          },
        },
        queueInfo: {
          currentSequence:  state?.currentSequence ?? 0,
          tokensAhead,
          estimatedWaitMin,
          isPaused:         state?.isPaused ?? false,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMyHistory = async (req, res, next) => {
  try {
    const tokens = await Token
      .find({ patient: req.user._id })
      .populate('branch', 'name city hospital')
      .populate({
        path:   'branch',
        select: 'name city hospital',
        populate: {
          path:   'hospital',
          select: 'name',
        },
      })
      .select('-patient -__v')
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, { data: { tokens } });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tokens/:id/leave ──────────────────────────────────────────────
export const leaveQueue = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return sendError(res, { statusCode: 404, message: 'Token not found' });
    }

    // Ensure this token belongs to the requesting patient
    if (token.patient.toString() !== req.user._id.toString()) {
      return sendError(res, { statusCode: 403, message: 'Not your token' });
    }

    if (!ACTIVE_STATUSES.includes(token.status)) {
      return sendError(res, {
        statusCode: 400,
        message: `Cannot leave — token status is already: ${token.status}`,
      });
    }

    token.status = TOKEN_STATUS.LEFT;
    token.leftAt = new Date();
    await token.save();

    // Notify all clients in the branch room that queue shrunk
    emitTokenLeft(token.branch.toString(), token.tokenSequence);

    return sendSuccess(res, { message: 'Left queue successfully' });
  } catch (err) {
    next(err);
  }
};