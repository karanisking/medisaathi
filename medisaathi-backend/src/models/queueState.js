import mongoose from 'mongoose';

const queueStateSchema = new mongoose.Schema(
  {
    branch: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Branch',
      required: true,
      unique:   true,
    },
    hospital: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Hospital',
      required: true,
    },
    isPaused: {
      type:    Boolean,
      default: false,
    },
    // Token doc currently called/serving — null when queue is idle
    currentToken: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Token',
      default: null,
    },
    // Sequence number of currentToken — sent to clients directly
    // so they don't need to populate currentToken
    currentSequence: {
      type:    Number,
      default: 0, // 0 = no token called yet today
    },
    // Highest sequence issued today — next token = lastSequence + 1
    lastSequence: {
      type:    Number,
      default: 0,
    },
    // Rolling average service time in minutes
    // Formula: newAvg = ((oldAvg × completed) + newDurationMin) / (completed + 1)
    // Only completed tokens count — skipped tokens had no service time
    avgServiceTimeMin: {
      type:    Number,
      default: 10,
      min:     1,
    },
    // Denominator for rolling average
    totalCompletedToday: {
      type:    Number,
      default: 0,
    },
    // YYYY-MM-DD IST — cron resets queue when this !== today
    queueDate: {
      type:     String,
      required: true,
    },
    lastResetAt: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


queueStateSchema.index({ hospital: 1 });
queueStateSchema.index({ queueDate: 1 });

export const QueueState = mongoose.model('QueueState', queueStateSchema);