import { Clock, MapPin, Hash } from 'lucide-react';
import Badge  from '../ui/badge.jsx';
import { formatTokenNumber, formatWaitTime, formatTime } from '../../utils/formatters.js';
import { TOKEN_STATUS_COLORS, TOKEN_STATUS_LABELS } from '../../utils/constants.js';

const STATUS_BADGE_VARIANT = {
  waiting:   'blue',
  called:    'green',
  serving:   'purple',
  completed: 'green',
  skipped:   'red',
  left:      'gray',
};

const TokenCard = ({ token, queueInfo, compact = false }) => {
  if (!token) return null;

  const tokensAhead = queueInfo
    ? Math.max(0, token.tokenSequence - (queueInfo.currentSequence ?? 0) - 1)
    : null;

  return (
    <div className={`
      bg-white rounded-2xl border shadow-sm overflow-hidden
      ${token.status === 'called' ? 'border-green-300' : 'border-gray-100'}
    `}>
      {/* Header strip */}
      <div className={`
        px-5 py-3 flex items-center justify-between
        ${token.status === 'called'
          ? 'bg-linear-to-r from-green-500 to-green-600'
          : 'bg-linear-to-r from-brand-600 to-brand-700'
        }
        text-white
      `}>
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 opacity-70" />
          <span className="text-2xl font-black">
            {formatTokenNumber(token.tokenSequence)}
          </span>
        </div>
        <Badge
          variant={STATUS_BADGE_VARIANT[token.status] || 'gray'}
          size="sm"
          className="bg-white/20 text-white border-0"
        >
          {TOKEN_STATUS_LABELS[token.status] || token.status}
        </Badge>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-2.5">
        {/* Branch */}
        {token.branch?.name && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
            <span>{token.branch.name}</span>
          </div>
        )}

        {/* Problem type */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full capitalize">
            {token.problemType === 'ent' ? 'ENT' : token.problemType}
          </span>
          {token.attemptNumber === 2 && (
            <span className="text-xs font-medium px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full">
              Rejoined
            </span>
          )}
        </div>

        {/* Wait info — only for active tokens */}
        {['waiting', 'called', 'serving'].includes(token.status) && queueInfo && !compact && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-400">Tokens ahead</p>
              <p className="text-lg font-bold text-gray-700">{tokensAhead}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Est. wait</p>
              <p className="text-sm font-semibold text-accent">
                {formatWaitTime(queueInfo.estimatedWaitMin)}
              </p>
            </div>
          </div>
        )}

        {/* Joined time */}
        <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Joined at {formatTime(token.joinedAt || token.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;