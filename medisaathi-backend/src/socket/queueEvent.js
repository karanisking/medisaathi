import { getIO }          from './socket.js';
import { Token, TOKEN_STATUS, SKIP_REASON } from '../models/Token.js';
import { QueueState }     from '../models/QueueState.js';
import { notifyPatientsNearTurn } from '../services/queueService.js';
import { updateAnalyticsOnSkip }  from '../services/analyticsService.js';
import { getTodayIST }    from '../utils/dateUtil.js';

const skipTimers = new Map();

const branchRoom = (branchId) => `branch:${branchId}`;

export const emitTokenCalled = (branchId, tokenData, skipTimeoutSec = 25) => {
  const io = getIO();

  clearSkipTimer(branchId);

  io.to(branchRoom(branchId)).emit('queue:token_called', {
    branchId,
    tokenSequence: tokenData.tokenSequence,
    tokenId:       tokenData._id,
  });

  if (tokenData.patient) {
    io.to(`patient:${tokenData.patient}`).emit('token:your_turn', {
      branchId,
      tokenSequence: tokenData.tokenSequence,
    });
  }

  notifyPatientsNearTurn(branchId, tokenData.tokenSequence)
    .catch((err) => console.error('[Socket] notifyPatientsNearTurn error:', err.message));

  const timeoutMs = (skipTimeoutSec ?? 25) * 1000;
  const timer = setTimeout(async () => {
    await autoSkipToken(branchId, tokenData._id, tokenData.tokenSequence);
  }, timeoutMs);

  skipTimers.set(String(branchId), timer);
};

export const emitTokenServing = (branchId, tokenData) => {
  clearSkipTimer(branchId);
  getIO().to(branchRoom(branchId)).emit('queue:token_serving', {
    branchId,
    tokenSequence: tokenData.tokenSequence,
  });
};

export const emitTokenCompleted = (branchId, payload) => {
  clearSkipTimer(branchId);
  getIO().to(branchRoom(branchId)).emit('queue:token_completed', {
    branchId,
    ...payload,
  });

  if (payload.currentSequence !== undefined) {
    notifyPatientsNearTurn(branchId, payload.currentSequence)
      .catch((err) => console.error('[Socket] notifyPatientsNearTurn error:', err.message));
  }
};

export const emitTokenSkipped = (branchId, payload) => {
  clearSkipTimer(branchId);
  getIO().to(branchRoom(branchId)).emit('queue:token_skipped', {
    branchId,
    ...payload,
  });
};

export const emitQueuePaused = (branchId) => {
  getIO().to(branchRoom(branchId)).emit('queue:paused', { branchId });
};

export const emitQueueResumed = (branchId) => {
  getIO().to(branchRoom(branchId)).emit('queue:resumed', { branchId });
};

export const emitTokenLeft = (branchId, tokenSequence) => {
  getIO().to(branchRoom(branchId)).emit('queue:token_left', {
    branchId,
    tokenSequence,
  });
};

export const emitTurnSoon = (patientId, branchId, tokenSequence, tokensAhead) => {
  getIO().to(`patient:${patientId}`).emit('token:turn_soon', {
    branchId,
    tokenSequence,
    tokensAhead,
  });
};

// ── THIS IS THE ONE YOU WERE MISSING — export keyword is required ─────────────
export const clearSkipTimer = (branchId) => {
  const key = String(branchId);
  if (skipTimers.has(key)) {
    clearTimeout(skipTimers.get(key));
    skipTimers.delete(key);
  }
};

// ── Auto-skip (private — not exported) ───────────────────────────────────────
const autoSkipToken = async (branchId, tokenId, tokenSequence) => {
  try {
    const token = await Token.findById(tokenId);

    if (!token || token.status !== TOKEN_STATUS.CALLED) return;

    token.status     = TOKEN_STATUS.SKIPPED;
    token.skipReason = SKIP_REASON.TIMEOUT;
    token.skippedAt  = new Date();
    await token.save();

    await QueueState.findOneAndUpdate(
      { branch: branchId },
      { currentToken: null }
    );

    await updateAnalyticsOnSkip({
      branchId,
      hospitalId: token.hospital,
      today:      getTodayIST(),
      isManual:   false,
    });

    getIO().to(branchRoom(branchId)).emit('queue:token_auto_skipped', {
      branchId,
      tokenSequence,
      tokenId,
    });

    console.log(`[Socket] Auto-skipped token #${tokenSequence} for branch ${branchId}`);
  } catch (err) {
    console.error('[Socket] autoSkipToken error:', err.message);
  }
};