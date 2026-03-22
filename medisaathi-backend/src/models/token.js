import mongoose from 'mongoose';

export const TOKEN_STATUS = {
  WAITING:   'waiting',
  CALLED:    'called',
  SERVING:   'serving',
  COMPLETED: 'completed',
  SKIPPED:   'skipped',
  LEFT:      'left',
};

export const SKIP_REASON = {
  TIMEOUT: 'timeout', // missed 25s window → can rejoin if attemptNumber < 2
  MANUAL:  'manual',  // staff skipped → cannot rejoin
};

export const PROBLEM_TYPES = {
  EYE:     'eye',
  ENT:     'ent',
  GENERAL: 'general',
  ORTHO:   'ortho',
  DENTAL:  'dental',
  OTHER:   'other',
};

export const ACTIVE_STATUSES = [
  TOKEN_STATUS.WAITING,
  TOKEN_STATUS.CALLED,
  TOKEN_STATUS.SERVING,
];

const tokenSchema = new mongoose.Schema(
  {
    branch: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Branch',
      required: true,
    },
    // Denormalised — avoids join in analytics queries
    hospital: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Hospital',
      required: true,
    },
    patient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    // Display number shown to patient: 1, 2, 3 … resets each day per branch
    tokenSequence: {
      type:     Number,
      required: true,
      min:      1,
    },
    problemType: {
      type:     String,
      enum:     Object.values(PROBLEM_TYPES),
      required: true,
    },
    // Only set when problemType === 'other'
    problemNote: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: [300, 'Problem note cannot exceed 300 characters'],
    },
    status: {
      type:    String,
      enum:    Object.values(TOKEN_STATUS),
      default: TOKEN_STATUS.WAITING,
    },
    // YYYY-MM-DD IST — scopes token to one queue day
    queueDate: {
      type:     String,
      required: true,
    },
    // Set only when status === 'skipped'
    skipReason: {
      type:    String,
      enum:    Object.values(SKIP_REASON),
      default: null,
    },
    // 1 = first join today at this branch
    // 2 = rejoin after timeout-skip (max allowed)
    attemptNumber: {
      type:     Number,
      enum:     [1, 2],
      required: true,
      default:  1,
    },
    // Status timestamps
    calledAt:    { type: Date, default: null },
    servingAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
    skippedAt:   { type: Date, default: null },
    leftAt:      { type: Date, default: null },
  },
  { timestamps: true } // createdAt = joinedAt
);

// ── Virtuals ──────────────────────────────────────────────────────────────────

tokenSchema.virtual('joinedAt').get(function () {
  return this.createdAt;
});

// ── Indexes ───────────────────────────────────────────────────────────────────

// Primary queue fetch — all waiting tokens for a branch today
tokenSchema.index({ branch: 1, queueDate: 1, status: 1 });

// Patient's active token lookup on every page load
tokenSchema.index({ patient: 1, status: 1, queueDate: 1 });

// Join eligibility check — how many tokens today at this branch
tokenSchema.index({ patient: 1, branch: 1, queueDate: 1 });

// Race condition guard — no duplicate sequences per branch per day
tokenSchema.index(
  { branch: 1, queueDate: 1, tokenSequence: 1 },
  { unique: true }
);

// Hospital-level analytics rollup
tokenSchema.index({ hospital: 1, queueDate: 1 });

export const Token = mongoose.model('Token', tokenSchema);