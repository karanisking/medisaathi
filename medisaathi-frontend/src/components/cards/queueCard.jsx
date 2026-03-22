import { Users, Timer, TrendingUp, Pause } from 'lucide-react';
import { formatWaitTime, formatTokenNumber } from '../../utils/formatters.js';

const QueueStatusBar = ({ queueStatus, compact = false }) => {
  if (!queueStatus) return null;

  if (!queueStatus.queueEnabled) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        Queue not available today
      </div>
    );
  }

  if (queueStatus.isPaused) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 rounded-xl border border-yellow-200 text-sm text-yellow-700">
        <Pause className="w-4 h-4" />
        Queue is currently paused
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 px-4 py-2.5 bg-brand-50 rounded-xl text-sm">
        <div className="flex items-center gap-1.5 text-brand-700">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-medium">Now: {formatTokenNumber(queueStatus.currentSequence)}</span>
        </div>
        <div className="text-gray-500">
          {queueStatus.waitingCount ?? 0} waiting
        </div>
        <div className="text-accent font-medium">
          {formatWaitTime(queueStatus.estimatedWaitMin)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Now serving
        </div>
        <p className="text-xl font-black text-brand-600">
          {formatTokenNumber(queueStatus.currentSequence)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-1">
          <Users className="w-3.5 h-3.5" />
          Waiting
        </div>
        <p className="text-xl font-black text-gray-700">
          {queueStatus.waitingCount ?? 0}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-1">
          <Timer className="w-3.5 h-3.5" />
          Est. wait
        </div>
        <p className="text-sm font-bold text-accent">
          {formatWaitTime(queueStatus.estimatedWaitMin)}
        </p>
      </div>
    </div>
  );
};

export default QueueStatusBar;