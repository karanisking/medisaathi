import { useState, useEffect, useCallback } from 'react';
import { useNavigate }     from 'react-router-dom';
import {
  Clock, MapPin, LogOut, Bell,
  CheckCircle, Hash, ChevronRight,
  History, Ticket, AlertCircle,
  RefreshCw, Building2,
} from 'lucide-react';
import { tokenService }    from '../../services/tokenService.js';
import { useToast }        from '../../context/toastContext.jsx';
import { useAuth }         from '../../context/authContext.jsx';
import PageWrapper         from '../../components/layout/pageWrapper.jsx';
import Button              from '../../components/ui/button.jsx';
import Badge               from '../../components/ui/badge.jsx';
import Spinner             from '../../components/ui/spinner.jsx';
import Card                from '../../components/ui/card.jsx';
import useSocket           from '../../hooks/useSocket.js';
import usePatientSocket    from '../../hooks/usePatientSocket.js';
import {
  formatWaitTime,
  formatTokenNumber,
  formatDate,
  formatTime,
} from '../../utils/formatters.js';
import {
  TOKEN_STATUS,
  TOKEN_STATUS_LABELS,
  TOKEN_STATUS_COLORS,
} from '../../utils/constants.js';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  waiting: {
    label:   'Waiting',
    badge:   'blue',
    icon:    <Clock className="w-4 h-4" />,
    bg:      'bg-blue-50 border-blue-200',
    text:    'text-blue-700',
  },
  called: {
    label:   'Your Turn!',
    badge:   'green',
    icon:    <Bell className="w-4 h-4" />,
    bg:      'bg-green-50 border-green-300',
    text:    'text-green-700',
  },
  serving: {
    label:   'At Counter',
    badge:   'purple',
    icon:    <CheckCircle className="w-4 h-4" />,
    bg:      'bg-purple-50 border-purple-200',
    text:    'text-purple-700',
  },
  completed: {
    label:   'Served',
    badge:   'green',
    icon:    <CheckCircle className="w-4 h-4" />,
    bg:      'bg-green-50 border-green-200',
    text:    'text-green-700',
  },
  skipped: {
    label:   'Expired',
    badge:   'yellow',
    icon:    <AlertCircle className="w-4 h-4" />,
    bg:      'bg-yellow-50 border-yellow-200',
    text:    'text-yellow-700',
  },
  left: {
    label:   'Left Queue',
    badge:   'gray',
    icon:    <LogOut className="w-4 h-4" />,
    bg:      'bg-gray-50 border-gray-200',
    text:    'text-gray-600',
  },
};

const ACTIVE_STATUSES = ['waiting', 'called', 'serving'];

// ── Active token tracker ──────────────────────────────────────────────────────

const ActiveTokenCard = ({ token, queueInfo, onLeave, leaving, onRefresh }) => {
  const cfg      = STATUS_CONFIG[token.status] || STATUS_CONFIG.waiting;
  const isCalled = token.status === TOKEN_STATUS.CALLED;

  const tokensAhead = queueInfo
    ? Math.max(0, token.tokenSequence - (queueInfo.currentSequence ?? 0) - 1)
    : 0;

  const requestNotification = () => {
    if ('Notification' in window) Notification.requestPermission();
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${cfg.bg}`}>

      {/* Pulsing banner for called */}
      {isCalled && (
        <div className="bg-green-500 text-white text-center py-2 px-4 text-sm font-semibold animate-pulse">
          It's your turn — please go to the counter now!
        </div>
      )}

      {/* Token number hero */}
      <div className={`
        flex flex-col items-center justify-center py-8 px-4
        ${isCalled
          ? 'bg-linear-to-br from-green-500 to-green-600'
          : 'bg-linear-to-br from-brand-600 to-brand-700'
        }
        text-white
      `}>
        <p className="text-sm opacity-75 mb-1 uppercase tracking-wider">Your token</p>
        <p className="text-8xl font-black leading-none">
          {formatTokenNumber(token.tokenSequence)}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
            {cfg.label}
          </span>
          {token.attemptNumber === 2 && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
              Rejoined
            </span>
          )}
        </div>
      </div>

      {/* Queue info */}
      <div className="p-5 space-y-3">

        {/* Branch info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="font-medium">{token.branch?.name}</span>
        </div>

        {token.branch?.hospital?.name && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{token.branch.hospital.name}</span>
          </div>
        )}

        {/* Problem type */}
        <div>
          <span className="inline-flex items-center px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium capitalize">
            {token.problemType === 'ent' ? 'ENT' : token.problemType}
          </span>
        </div>

        {/* Paused notice */}
        {queueInfo?.isPaused && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Queue is paused — please wait
          </div>
        )}

        {/* Live stats — only for active non-completed */}
        {ACTIVE_STATUSES.includes(token.status) && queueInfo && !queueInfo.isPaused && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Now serving</p>
              <p className="text-lg font-black text-brand-600">
                {formatTokenNumber(queueInfo.currentSequence ?? 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Ahead of you</p>
              <p className="text-lg font-black text-gray-700">{tokensAhead}</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Est. wait</p>
              <p className="text-sm font-bold text-accent">
                {formatWaitTime(queueInfo.estimatedWaitMin)}
              </p>
            </div>
          </div>
        )}

        {/* Joined time */}
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Joined at {formatTime(token.createdAt)}
        </p>

        {/* Notification prompt */}
        {'Notification' in window && Notification.permission === 'default' && (
          <button
            onClick={requestNotification}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Bell className="w-4 h-4 shrink-0" />
            Enable notifications for turn alerts
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          {[TOKEN_STATUS.WAITING, TOKEN_STATUS.CALLED].includes(token.status) && (
            <Button
              variant="danger"
              size="sm"
              loading={leaving}
              onClick={onLeave}
              icon={<LogOut className="w-3.5 h-3.5" />}
              className="flex-1"
            >
              Leave Queue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── History token row ─────────────────────────────────────────────────────────

const HistoryRow = ({ token, onTrack }) => {
  const cfg      = STATUS_CONFIG[token.status] || STATUS_CONFIG.left;
  const isActive = ACTIVE_STATUSES.includes(token.status);

  return (
    <div
      className={`
        flex items-center justify-between px-4 py-4
        border-b border-gray-50 last:border-0
        ${isActive ? 'bg-blue-50/50 cursor-pointer hover:bg-blue-50' : ''}
        transition-colors
      `}
      onClick={isActive ? onTrack : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Token number */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg
          ${isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}
        `}>
          {token.tokenSequence}
        </div>

        <div>
          {/* Hospital + Branch */}
          <p className="text-sm font-medium text-gray-800">
            {token.branch?.hospital?.name || 'Hospital'}
          </p>
          <p className="text-xs text-gray-400">
            {token.branch?.name} · {token.problemType === 'ent' ? 'ENT' : token.problemType}
          </p>
          {/* Date + time */}
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(token.createdAt)} at {formatTime(token.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={cfg.badge} size="sm">
          {cfg.label}
        </Badge>
        {isActive && (
          <ChevronRight className="w-4 h-4 text-brand-400" />
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'active',    label: 'Active',    icon: <Ticket    className="w-4 h-4" /> },
  { key: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
  { key: 'expired',   label: 'Expired',   icon: <AlertCircle className="w-4 h-4" /> },
  { key: 'left',      label: 'Left',      icon: <LogOut    className="w-4 h-4" /> },
  { key: 'all',       label: 'All',       icon: <History   className="w-4 h-4" /> },
];

const MyToken = () => {
  const navigate              = useNavigate();
  const { user }              = useAuth();
  const { success, error, info } = useToast();

  const [activeToken, setActiveToken]   = useState(null);
  const [queueInfo, setQueueInfo]       = useState(null);
  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [leaving, setLeaving]           = useState(false);
  const [tab, setTab]                   = useState('active');
  const [trackedToken, setTrackedToken] = useState(null); // token user clicked to track

  // Active token's branch for socket
  const branchId = activeToken?.branch?._id || activeToken?.branch;

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchActiveToken = useCallback(async () => {
    try {
      const res = await tokenService.getMine();
      if (res.data?.token) {
        setActiveToken(res.data.token);
        setQueueInfo(res.data.queueInfo);
      } else {
        setActiveToken(null);
        setQueueInfo(null);
      }
    } catch {
      setActiveToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await tokenService.getHistory();
      setHistory(res.data?.tokens || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveToken();
    fetchHistory();
  }, [fetchActiveToken, fetchHistory]);

  // ── WebSocket — live queue updates for active token ─────────────────────────

  useSocket(branchId, {
    'queue:token_called': (payload) => {
      setQueueInfo((prev) => prev
        ? { ...prev, currentSequence: payload.tokenSequence }
        : prev
      );
      // If this is our token being called
      if (activeToken && payload.tokenSequence === activeToken.tokenSequence) {
        setActiveToken((prev) => prev ? { ...prev, status: 'called' } : prev);
      }
    },
    'queue:token_completed': (payload) => {
      setQueueInfo((prev) => {
        if (!prev) return prev;
        const newAhead = Math.max(0,
          (activeToken?.tokenSequence ?? 0) -
          (payload.currentSequence ?? prev.currentSequence) - 1
        );
        return {
          ...prev,
          currentSequence:  payload.currentSequence ?? prev.currentSequence,
          estimatedWaitMin: newAhead * (payload.avgWaitMin ?? prev.avgServiceTimeMin ?? 10),
        };
      });
    },
    'queue:token_auto_skipped': (payload) => {
      if (activeToken && payload.tokenSequence === activeToken.tokenSequence) {
        setActiveToken((prev) => prev ? { ...prev, status: 'skipped' } : prev);
        info('Your token was auto-skipped due to timeout. You can rejoin if eligible.');
        fetchHistory();
      }
    },
    'queue:paused':  () => setQueueInfo((p) => p ? { ...p, isPaused: true  } : p),
    'queue:resumed': () => setQueueInfo((p) => p ? { ...p, isPaused: false } : p),
    'queue:token_left': () => {
      setQueueInfo((prev) => {
        if (!prev) return prev;
        const newAhead = Math.max(0, (prev.estimatedWaitMin / (prev.avgServiceTimeMin ?? 10)) - 1);
        return {
          ...prev,
          estimatedWaitMin: newAhead * (prev.avgServiceTimeMin ?? 10),
        };
      });
    },
  });

  // ── Personal socket — targeted notifications ────────────────────────────────

  usePatientSocket({
    'token:your_turn': () => {
      success("It's your turn! Please go to the counter now.");
      setActiveToken((prev) => prev ? { ...prev, status: 'called' } : prev);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('MediSaathi — Your Turn!', {
          body: `Token ${formatTokenNumber(activeToken?.tokenSequence)} — proceed to counter.`,
          icon: '/logo.png',
        });
      }
    },
    'token:turn_soon': ({ tokensAhead }) => {
      info(`Only ${tokensAhead} patient${tokensAhead !== 1 ? 's' : ''} ahead of you!`);
    },
  });

  // ── Leave queue ─────────────────────────────────────────────────────────────

  const handleLeave = async () => {
    if (!activeToken?._id && !activeToken?.id) return;
    setLeaving(true);
    try {
      await tokenService.leave(activeToken._id || activeToken.id);
      success('Left the queue');
      setActiveToken(null);
      setQueueInfo(null);
      fetchHistory();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to leave queue');
    } finally {
      setLeaving(false);
    }
  };

  // ── Filter history by tab ───────────────────────────────────────────────────

  const filteredHistory = history.filter((t) => {
    if (tab === 'all')       return true;
    if (tab === 'active')    return ACTIVE_STATUSES.includes(t.status);
    if (tab === 'completed') return t.status === 'completed';
    if (tab === 'expired')   return t.status === 'skipped';
    if (tab === 'left')      return t.status === 'left';
    return true;
  });

  // Count per tab for badges
  const counts = {
    active:    history.filter((t) => ACTIVE_STATUSES.includes(t.status)).length,
    completed: history.filter((t) => t.status === 'completed').length,
    expired:   history.filter((t) => t.status === 'skipped').length,
    left:      history.filter((t) => t.status === 'left').length,
    all:       history.length,
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <PageWrapper>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </PageWrapper>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Tokens</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your queue status and view history
          </p>
        </div>

        {/* ── Active token (always shown at top if exists) ── */}
        {activeToken && ACTIVE_STATUSES.includes(activeToken.status) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Active Queue
              </p>
            </div>
            <ActiveTokenCard
              token={activeToken}
              queueInfo={queueInfo}
              leaving={leaving}
              onLeave={handleLeave}
              onRefresh={() => { fetchActiveToken(); fetchHistory(); }}
            />
          </div>
        )}

        {/* ── No active token — show join CTA ── */}
        {!activeToken && (
          <div className="mb-6 bg-brand-50 border border-brand-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-brand-700">No active queue</p>
              <p className="text-sm text-brand-500 mt-0.5">
                Browse hospitals to join a queue
              </p>
            </div>
            <Button
              onClick={() => navigate('/hospitals')}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Browse Hospitals
            </Button>
          </div>
        )}

        {/* ── Token History ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            Token History
          </h2>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                  whitespace-nowrap transition-all shrink-0
                  ${tab === t.key
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {t.icon}
                {t.label}
                {counts[t.key] > 0 && (
                  <span className={`
                    ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                    ${tab === t.key
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* History list */}
          <Card padding={false}>
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <Ticket className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No tokens yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  {tab === 'active'
                    ? 'You have no active tokens right now'
                    : `No ${tab} tokens found`
                  }
                </p>
                {tab === 'active' && (
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('/hospitals')}
                  >
                    Join a Queue
                  </Button>
                )}
              </div>
            ) : (
              <div>
                {filteredHistory.map((token) => (
                  <HistoryRow
                    key={token._id}
                    token={token}
                    onTrack={() => {
                      setTrackedToken(token);
                      setTab('active');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Rejoin eligible notice ── */}
        {history.some(
          (t) =>
            t.status === 'skipped' &&
            t.skipReason === 'timeout' &&
            t.queueDate === new Date().toISOString().slice(0, 10)
        ) && !activeToken && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-700">
                You can rejoin today's queue
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Your token was auto-skipped. You have one more attempt today.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => navigate('/hospitals')}
              >
                Rejoin Queue
              </Button>
            </div>
          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default MyToken;