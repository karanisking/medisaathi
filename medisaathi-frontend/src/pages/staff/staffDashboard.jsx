import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, SkipForward, Play, Pause, ChevronRight, Users } from 'lucide-react';
import { staffService }   from '../../services/staffService.js';
import { useAuth }        from '../../context/authContext.jsx';
import { useToast }       from '../../context/toastContext.jsx';
import PageWrapper        from '../../components/layout/pageWrapper.jsx';
import Button             from '../../components/ui/button.jsx';
import Badge              from '../../components/ui/badge.jsx';
import StatsCard          from '../../components/cards/statsCard.jsx';
import Spinner            from '../../components/ui/spinner.jsx';
import EmptyState         from '../../components/cards/emptyCard.jsx';
import useSocket          from '../../hooks/useSocket.js';
import { formatTokenNumber, formatTime } from '../../utils/formatters.js';
import { TOKEN_STATUS }   from '../../utils/constants.js';

const PROBLEM_LABELS = {
  eye: 'Eye', ent: 'ENT', general: 'General',
  ortho: 'Ortho', dental: 'Dental', other: 'Other',
};

const StaffDashboard = () => {
  const { user }          = useAuth();
  const { success, error } = useToast();

  const [queue, setQueue]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null); // loading state per button

  const branchId = user?.branch?.toString();

  const fetchQueue = useCallback(async () => {
    try {
      const res = await staffService.getLiveQueue();
      setQueue(res.data);
    } catch {
      setQueue(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Live updates
  useSocket(branchId, {
    'queue:token_called':       fetchQueue,
    'queue:token_completed':    fetchQueue,
    'queue:token_skipped':      fetchQueue,
    'queue:token_auto_skipped': fetchQueue,
    'queue:paused':             fetchQueue,
    'queue:resumed':            fetchQueue,
    'queue:token_left':         fetchQueue,
  });

  const handle = async (action, id = null) => {
    setActionId(id || action);
    try {
      switch (action) {
        case 'next':     await staffService.callNext();         break;
        case 'skip':     await staffService.skipToken(id);      break;
        case 'complete': await staffService.completeToken(id);  break;
        case 'pause':    await staffService.pauseQueue();        break;
        case 'resume':   await staffService.resumeQueue();       break;
      }
      success({
        next: 'Next token called',
        skip: 'Token skipped',
        complete: 'Token completed',
        pause: 'Queue paused',
        resume: 'Queue resumed',
      }[action]);
      await fetchQueue();
    } catch (err) {
      error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return (
    <PageWrapper>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </PageWrapper>
  );

  const { queueState, tokens = [] } = queue || {};
  const calledToken    = tokens.find((t) => t.status === TOKEN_STATUS.CALLED);
  const waitingTokens  = tokens.filter((t) => t.status === TOKEN_STATUS.WAITING);

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
          <p className="text-sm text-gray-400">Manage your branch queue</p>
        </div>

        {/* Pause / Resume */}
        <Button
          variant={queueState?.isPaused ? 'success' : 'secondary'}
          icon={queueState?.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          loading={actionId === (queueState?.isPaused ? 'resume' : 'pause')}
          onClick={() => handle(queueState?.isPaused ? 'resume' : 'pause')}
        >
          {queueState?.isPaused ? 'Resume Queue' : 'Pause Queue'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Now Serving"  value={formatTokenNumber(queueState?.currentSequence)} color="brand"  icon={<ChevronRight className="w-5 h-5" />} />
        <StatsCard label="Waiting"      value={waitingTokens.length}                           color="yellow" icon={<Users className="w-5 h-5" />} />
        <StatsCard label="Completed"    value={queueState?.totalCompleted ?? 0}                color="green"  icon={<CheckCircle className="w-5 h-5" />} />
        <StatsCard label="Avg Service"  value={`${queueState?.avgServiceTimeMin ?? 10}m`}      color="purple" icon={<Play className="w-5 h-5" />} />
      </div>

      {/* Paused banner */}
      {queueState?.isPaused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-center">
          <p className="text-yellow-700 font-medium">Queue is currently paused</p>
        </div>
      )}

      {/* Call next */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 mb-0.5">Currently Called</p>
            <p className="text-4xl font-black text-brand-600">
              {formatTokenNumber(queueState?.currentSequence)}
            </p>
          </div>
          <div className="flex gap-3">
            {calledToken && (
              <>
                <Button
                  variant="success"
                  icon={<CheckCircle className="w-4 h-4" />}
                  loading={actionId === 'complete'}
                  onClick={() => handle('complete', calledToken._id)}
                >
                  Complete
                </Button>
                <Button
                  variant="secondary"
                  icon={<SkipForward className="w-4 h-4" />}
                  loading={actionId === calledToken._id}
                  onClick={() => handle('skip', calledToken._id)}
                >
                  Skip
                </Button>
              </>
            )}
            <Button
              loading={actionId === 'next'}
              onClick={() => handle('next')}
              disabled={queueState?.isPaused || waitingTokens.length === 0}
            >
              Call Next
            </Button>
          </div>
        </div>
      </div>

      {/* Queue list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            Waiting Queue ({waitingTokens.length})
          </h2>
        </div>

        {waitingTokens.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No one waiting"
            description="Queue is empty. Call next when patients arrive."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {tokens.map((token) => (
              <div key={token._id} className={`flex items-center justify-between px-5 py-4 ${
                token.status === TOKEN_STATUS.CALLED ? 'bg-green-50' : ''
              }`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-brand-600 w-14">
                    {token.tokenSequence}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {token.patient?.name || 'Patient'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 capitalize">
                        {PROBLEM_LABELS[token.problemType] || token.problemType}
                      </span>
                      {token.attemptNumber === 2 && (
                        <Badge variant="yellow" size="sm">Rejoin</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatTime(token.createdAt)}
                  </span>
                  {token.status === TOKEN_STATUS.CALLED ? (
                    <Badge variant="green" dot size="sm">Called</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={actionId === token._id}
                      onClick={() => handle('skip', token._id)}
                    >
                      Skip
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default StaffDashboard;