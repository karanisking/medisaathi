import { Token, TOKEN_STATUS, SKIP_REASON, ACTIVE_STATUSES } from '../models/Token.js';
import { QueueState }  from '../models/QueueState.js';
import { Branch }      from '../models/Branch.js';
import { getTodayIST } from '../utils/dateUtil.js';
import { emitTurnSoon } from '../socket/queueEvent.js';

// How many tokens ahead triggers the "your turn soon" notification
const TURN_SOON_THRESHOLD = 3;

/**
 * Get or initialise a QueueState for a branch for today.
 * Safe to call multiple times — upserts on first call of the day.
 */
export const getOrCreateQueueState = async (branchId, hospitalId) => {
  const today = getTodayIST();

  const state = await QueueState.findOneAndUpdate(
    { branch: branchId },
    {
      $setOnInsert: {
        branch:              branchId,
        hospital:            hospitalId,
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

  // If doc exists but is stale (yesterday's date) — reset it
  if (state.queueDate !== today) {
    return QueueState.findOneAndUpdate(
      { branch: branchId },
      {
        $set: {
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
      { new: true }
    );
  }

  return state;
};

/**
 * Atomically get the next sequence number for a branch.
 * Uses findOneAndUpdate with $inc to prevent race conditions
 * when two patients join at the exact same time.
 */
export const getNextSequence = async (branchId) => {
  const updated = await QueueState.findOneAndUpdate(
    { branch: branchId },
    { $inc: { lastSequence: 1 } },
    { new: true }
  );
  return updated.lastSequence;
};

/**
 * Calculate estimated wait time for a given token.
 * tokensAhead = tokenSequence - currentSequence - 1
 * estimatedWait = tokensAhead × avgServiceTimeMin
 */
export const calculateWaitTime = (tokenSequence, state) => {
  if (!state) return { tokensAhead: 0, estimatedWaitMin: 0 };

  const tokensAhead = Math.max(0, tokenSequence - state.currentSequence - 1);
  const estimatedWaitMin = tokensAhead * state.avgServiceTimeMin;

  return { tokensAhead, estimatedWaitMin };
};

/**
 * Check patient join eligibility.
 * Returns { eligible: bool, reason: string | null }
 *
 * Rules:
 * 1. No active token at any branch right now
 * 2. Max 2 tokens per branch per day
 * 3. Second attempt only allowed after timeout-skip
 * 4. Queue must be enabled and not paused
 */
export const checkJoinEligibility = async (patientId, branchId) => {
  const today = getTodayIST();

  // Rule 1 — no active token anywhere
  const activeToken = await Token.findOne({
    patient: patientId,
    status:  { $in: ACTIVE_STATUSES },
  });

  if (activeToken) {
    return {
      eligible: false,
      reason: 'You already have an active token. Leave your current queue first.',
    };
  }

  // Rule 2 — daily attempt limit
  const todayTokens = await Token.find({
    patient:   patientId,
    branch:    branchId,
    queueDate: today,
  }).sort({ createdAt: 1 });

  if (todayTokens.length >= 2) {
    return {
      eligible: false,
      reason: 'You have reached the maximum of 2 tokens per day for this branch.',
    };
  }

  // Rule 3 — second attempt conditions
  if (todayTokens.length === 1) {
    const prev = todayTokens[0];

    if (
      prev.status !== TOKEN_STATUS.SKIPPED ||
      prev.skipReason !== SKIP_REASON.TIMEOUT
    ) {
      return {
        eligible: false,
        reason: 'You can only rejoin if your previous token was auto-skipped due to no-show.',
      };
    }

    // Also check queue has moved past them
    const state = await QueueState.findOne({ branch: branchId });
    if (state && prev.tokenSequence >= state.currentSequence) {
      return {
        eligible: false,
        reason: 'The queue has not moved past your token yet. Please wait.',
      };
    }
  }

  return { eligible: true, reason: null };
};

/**
 * After any queue movement (token called, completed, skipped),
 * check if any WAITING patient is now within TURN_SOON_THRESHOLD.
 * If yes, emit a targeted "your turn soon" socket event to them.
 */
export const notifyPatientsNearTurn = async (branchId, currentSequence) => {
  try {
    const today = getTodayIST();

    // Find patients whose token is within the threshold
    const nearTokens = await Token.find({
      branch:        branchId,
      queueDate:     today,
      status:        TOKEN_STATUS.WAITING,
      tokenSequence: {
        $gt:  currentSequence,
        $lte: currentSequence + TURN_SOON_THRESHOLD,
      },
    }).select('patient tokenSequence');

    for (const token of nearTokens) {
      const tokensAhead = token.tokenSequence - currentSequence - 1;
      emitTurnSoon(
        token.patient.toString(),
        branchId,
        token.tokenSequence,
        tokensAhead
      );
    }
  } catch (err) {
    console.error('[Queue] notifyPatientsNearTurn error:', err.message);
  }
};

/**
 * Update the rolling average service time after a completed token.
 * Called from staff.controller.js after a COMPLETED status update.
 */
export const updateRollingAverage = async (branchId, newDurationMin) => {
  const state = await QueueState.findOne({ branch: branchId });
  if (!state) return;

  const prevCompleted = state.totalCompletedToday;
  const prevAvg       = state.avgServiceTimeMin;

  const newAvg = prevCompleted === 0
    ? newDurationMin
    : ((prevAvg * prevCompleted) + newDurationMin) / (prevCompleted + 1);

  await QueueState.findOneAndUpdate(
    { branch: branchId },
    {
      avgServiceTimeMin:   Math.max(1, Math.round(newAvg * 10) / 10),
      $inc: { totalCompletedToday: 1 },
    }
  );
};