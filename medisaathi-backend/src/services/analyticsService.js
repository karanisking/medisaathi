import { AnalyticsDaily } from '../models/analyticsdaily.js';
import { getCurrentHourIST } from '../utils/dateUtil.js';

/**
 * Called when a patient joins the queue.
 * Increments totalTokens, departmentBreakdown, hourlyTokens.
 * Uses upsert so the doc is created on first token of the day.
 */
export const updateAnalyticsOnJoin = async ({
  branchId,
  hospitalId,
  problemType,
  today,
  isRejoin = false,
}) => {
  try {
    const hour    = getCurrentHourIST();
    const hourKey = `hourlyTokens.${hour}`;
    const deptKey = `departmentBreakdown.${problemType}`;

    await AnalyticsDaily.findOneAndUpdate(
      { branch: branchId, date: today },
      {
        $setOnInsert: { hospital: hospitalId, branch: branchId, date: today },
        $inc: {
          totalTokens:    1,
          rejoinCount:    isRejoin ? 1 : 0,
          [hourKey]:      1,
          [deptKey]:      1,
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Analytics failures must never break the main queue flow
    console.error('[Analytics] updateAnalyticsOnJoin error:', err.message);
  }
};

/**
 * Called when staff marks a token as completed.
 * Updates completed count, avgWaitMin, avgServiceMin.
 * Uses a rolling average update via aggregation pipeline update.
 */
export const updateAnalyticsOnComplete = async ({
  branchId,
  hospitalId,
  today,
  waitMin,    // time from joinedAt → calledAt
  serviceMin, // time from calledAt → completedAt
}) => {
  try {
    // First get current doc so we can recalculate rolling averages
    const current = await AnalyticsDaily.findOne({
      branch: branchId,
      date:   today,
    });

    const prevCompleted  = current?.completed   ?? 0;
    const prevAvgWait    = current?.avgWaitMin   ?? 0;
    const prevAvgService = current?.avgServiceMin ?? 0;

    // Rolling average formula:
    // newAvg = ((prevAvg * prevCount) + newValue) / (prevCount + 1)
    const newAvgWait    = ((prevAvgWait    * prevCompleted) + waitMin)    / (prevCompleted + 1);
    const newAvgService = ((prevAvgService * prevCompleted) + serviceMin) / (prevCompleted + 1);

    await AnalyticsDaily.findOneAndUpdate(
      { branch: branchId, date: today },
      {
        $setOnInsert: { hospital: hospitalId, branch: branchId, date: today },
        $inc: { completed: 1 },
        $set: {
          avgWaitMin:    Math.round(newAvgWait    * 10) / 10,
          avgServiceMin: Math.round(newAvgService * 10) / 10,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[Analytics] updateAnalyticsOnComplete error:', err.message);
  }
};

/**
 * Called when a token is skipped — either manually by staff or auto by timeout.
 */
export const updateAnalyticsOnSkip = async ({
  branchId,
  hospitalId,
  today,
  isManual = false,
}) => {
  try {
    const field = isManual ? 'skippedManual' : 'skippedAuto';

    await AnalyticsDaily.findOneAndUpdate(
      { branch: branchId, date: today },
      {
        $setOnInsert: { hospital: hospitalId, branch: branchId, date: today },
        $inc: { [field]: 1 },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[Analytics] updateAnalyticsOnSkip error:', err.message);
  }
};

/**
 * Called when a patient leaves the queue voluntarily.
 */
export const updateAnalyticsOnLeave = async ({ branchId, hospitalId, today }) => {
  try {
    await AnalyticsDaily.findOneAndUpdate(
      { branch: branchId, date: today },
      {
        $setOnInsert: { hospital: hospitalId, branch: branchId, date: today },
        $inc: { leftQueue: 1 },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[Analytics] updateAnalyticsOnLeave error:', err.message);
  }
};

/**
 * Called by the midnight cron to finalise the day's analytics.
 * Calculates and writes the peakHour for each branch.
 */
export const finaliseDayAnalytics = async (today) => {
  try {
    const docs = await AnalyticsDaily.find({ date: today });

    for (const doc of docs) {
      if (!doc.hourlyTokens || doc.hourlyTokens.size === 0) continue;

      let peakHour  = null;
      let peakCount = 0;

      for (const [hour, count] of doc.hourlyTokens.entries()) {
        if (count > peakCount) {
          peakCount = count;
          peakHour  = parseInt(hour);
        }
      }

      doc.peakHour = peakHour;
      await doc.save();
    }

    console.log(`[Analytics] Finalised analytics for ${today}`);
  } catch (err) {
    console.error('[Analytics] finaliseDayAnalytics error:', err.message);
  }
};