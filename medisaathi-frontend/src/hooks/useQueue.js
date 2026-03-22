import { useState, useEffect, useCallback } from 'react';
import { branchService } from '../services/branchService.js';
import useSocket         from './useSocket.js';

/**
 * useQueue(branchId)
 *
 * Fetches initial queue status for a branch and keeps it
 * live via WebSocket events.
 *
 * Returns { queueStatus, loading, refetch }
 *
 * Usage:
 *   const { queueStatus, loading } = useQueue(branchId);
 */
const useQueue = (branchId) => {
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading]         = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await branchService.getQueueStatus(branchId);
      setQueueStatus(res.data);
    } catch {
      setQueueStatus(null);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  
  useSocket(branchId, {
    'queue:token_called': (payload) => {
      setQueueStatus((prev) => prev ? {
        ...prev,
        currentSequence: payload.tokenSequence,
      } : prev);
    },

    'queue:token_completed': (payload) => {
      setQueueStatus((prev) => {
        if (!prev) return prev;
        const newWaiting = Math.max(0, (prev.waitingCount ?? 0) - 1);
        return {
          ...prev,
          currentSequence:  payload.currentSequence ?? prev.currentSequence,
          waitingCount:     newWaiting,
          estimatedWaitMin: newWaiting * (prev.avgServiceTimeMin ?? 10),
          avgServiceTimeMin: payload.avgWaitMin ?? prev.avgServiceTimeMin,
        };
      });
    },

    'queue:token_skipped': () => {
      setQueueStatus((prev) => {
        if (!prev) return prev;
        const newWaiting = Math.max(0, (prev.waitingCount ?? 0) - 1);
        return {
          ...prev,
          waitingCount:     newWaiting,
          estimatedWaitMin: newWaiting * (prev.avgServiceTimeMin ?? 10),
        };
      });
    },

    'queue:token_auto_skipped': () => {
      setQueueStatus((prev) => {
        if (!prev) return prev;
        return { ...prev, currentSequence: prev.currentSequence };
      });
    },

    'queue:token_left': () => {
      setQueueStatus((prev) => {
        if (!prev) return prev;
        const newWaiting = Math.max(0, (prev.waitingCount ?? 0) - 1);
        return {
          ...prev,
          waitingCount:     newWaiting,
          estimatedWaitMin: newWaiting * (prev.avgServiceTimeMin ?? 10),
        };
      });
    },

    'queue:paused':  () => setQueueStatus((p) => p ? { ...p, isPaused: true  } : p),
    'queue:resumed': () => setQueueStatus((p) => p ? { ...p, isPaused: false } : p),
  });

  return { queueStatus, loading, refetch: fetchStatus };
};

export default useQueue;