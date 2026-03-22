import cron from 'node-cron';
import { QueueState }      from '../models/queueState.js';
import { Token }           from '../models/token.js';
import { getTodayIST }     from './dateUtil.js';
import { finaliseDayAnalytics } from '../services/analyticsService.js';

/**
 * Midnight IST = 18:30 UTC (IST = UTC+5:30)
 * Cron expression: '30 18 * * *'
 *
 * Steps:
 * 1. Finalise yesterday's analytics (peakHour calculation)
 * 2. Mark all leftover active tokens as timeout-skipped
 * 3. Reset all QueueState docs for the new day
 */
export const startQueueResetCron = () => {
  cron.schedule('30 18 * * *', async () => {
    const today     = getTodayIST();
    const yesterday = getYesterdayIST();

    console.log(`[CRON] Midnight IST — closing ${yesterday}, opening ${today}`);

    try {
      // Step 1 — finalise yesterday's analytics
      await finaliseDayAnalytics(yesterday);

      // Step 2 — find stale queue states
      const staleStates = await QueueState.find({ queueDate: { $ne: today } });

      if (staleStates.length === 0) {
        console.log('[CRON] All queues already current.');
        return;
      }

      const branchIds = staleStates.map((s) => s.branch);

      // Mark leftover active tokens as timeout-skipped
      const abandoned = await Token.updateMany(
        {
          branch: { $in: branchIds },
          status: { $in: ['waiting', 'called', 'serving'] },
        },
        {
          $set: {
            status:     'skipped',
            skipReason: 'timeout',
            skippedAt:  new Date(),
          },
        }
      );

      console.log(`[CRON] Auto-skipped ${abandoned.modifiedCount} stale tokens`);

      // Step 3 — reset QueueState for each stale branch
      await QueueState.updateMany(
        { branch: { $in: branchIds } },
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
        }
      );

      console.log(`[CRON] Reset ${staleStates.length} branch queue(s) for ${today}`);
    } catch (err) {
      console.error('[CRON] Midnight reset failed:', err.message);
    }
  });

  console.log('[CRON] Queue reset job scheduled — fires at 00:00 IST (18:30 UTC)');
};

/**
 * Returns yesterday's date string YYYY-MM-DD in IST.
 */
const getYesterdayIST = () => {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istDate   = new Date(now.getTime() + istOffset - 24 * 60 * 60 * 1000);
  return istDate.toISOString().slice(0, 10);
};