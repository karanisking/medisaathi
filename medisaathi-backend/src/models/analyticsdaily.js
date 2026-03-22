import mongoose from 'mongoose';

const analyticsDailySchema = new mongoose.Schema(
  {
    branch: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Branch',
      required: true,
    },
    hospital: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Hospital',
      required: true,
    },
    // YYYY-MM-DD IST
    date: {
      type:     String,
      required: true,
    },
    totalTokens:   { type: Number, default: 0 },
    completed:     { type: Number, default: 0 },
    skippedManual: { type: Number, default: 0 }, // staff manually skipped
    skippedAuto:   { type: Number, default: 0 }, // timeout auto-skipped
    leftQueue:     { type: Number, default: 0 },
    rejoinCount:   { type: Number, default: 0 }, // attemptNumber === 2 tokens
    // Avg time from joinedAt → calledAt (minutes)
    avgWaitMin:    { type: Number, default: 0 },
    // Avg time from calledAt → completedAt (minutes)
    avgServiceMin: { type: Number, default: 0 },
    peakHour:      { type: Number, default: null },
    // { "eye": 5, "ent": 2, "general": 10 ... }
    departmentBreakdown: {
      type:    Map,
      of:      Number,
      default: {},
    },
    // { "9": 12, "10": 8, "11": 15 ... } — hour key is IST
    hourlyTokens: {
      type:    Map,
      of:      Number,
      default: {},
    },
  },
  { timestamps: true }
);

analyticsDailySchema.index({ branch: 1, date: 1 }, { unique: true });
analyticsDailySchema.index({ hospital: 1, date: 1 });
analyticsDailySchema.index({ date: 1 });

export const AnalyticsDaily = mongoose.model('AnalyticsDaily', analyticsDailySchema);