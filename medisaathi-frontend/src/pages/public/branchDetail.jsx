import { useState, useEffect }    from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowLeft, Users, Timer } from 'lucide-react';
import { branchService }    from '../../services/branchService.js';
import { useAuth }          from '../../context/authContext.jsx';
import PageWrapper          from '../../components/layout/pageWrapper.jsx';
import Button               from '../../components/ui/button.jsx';
import Badge                from '../../components/ui/badge.jsx';
import Spinner              from '../../components/ui/spinner.jsx';
import { formatWaitTime }   from '../../utils/formatters.js';
import { ROLES }            from '../../utils/constants.js';

const BranchDetail = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [branch, setBranch]       = useState(null);
  const [queueStatus, setQueue]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [bRes, qRes] = await Promise.all([
          branchService.getById(id),
          branchService.getQueueStatus(id),
        ]);
        setBranch(bRes.data.branch);
        setQueue(qRes.data);
      } catch {
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleJoin = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/branches/${id}` } } });
      return;
    }
    navigate(`/join/${id}`);
  };

  if (loading) return (
    <PageWrapper>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </PageWrapper>
  );

  if (!branch) return null;

  const canJoin = isAuthenticated && user?.role === ROLES.PATIENT;

  return (
    <PageWrapper>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Branch info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {branch.images?.[0]?.url && (
              <div className="h-52 overflow-hidden">
                <img src={branch.images[0].url} alt={branch.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{branch.name}</h1>
                  {branch.hospital?.name && (
                    <p className="text-sm text-gray-400">{branch.hospital.name}</p>
                  )}
                </div>
                <Badge
                  variant={branch.queueEnabled ? 'green' : 'gray'}
                  dot
                  size="md"
                >
                  {branch.queueEnabled ? 'Queue Open' : 'Queue Closed'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="capitalize">{branch.address || `${branch.city}, ${branch.state}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Open {branch.openTime} – {branch.closeTime}</span>
                </div>
                {branch.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{branch.contactPhone}</span>
                  </div>
                )}
              </div>

              {/* Problem categories */}
              {branch.problemCategories?.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available departments</p>
                  <div className="flex flex-wrap gap-2">
                    {branch.problemCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium capitalize"
                      >
                        {cat === 'ent' ? 'ENT' : cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Queue status + join */}
        <div className="space-y-4">
          {/* Live queue stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Live Queue Status</h2>

            {!queueStatus?.queueEnabled ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">Queue is not active today</p>
              </div>
            ) : queueStatus?.isPaused ? (
              <div className="text-center py-4">
                <Badge variant="yellow" size="md">Queue Paused</Badge>
                <p className="text-gray-400 text-xs mt-2">Please wait for queue to resume</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Now serving</span>
                  </div>
                  <span className="text-lg font-bold text-brand-600">
                    #{queueStatus?.currentSequence || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Waiting</span>
                  </div>
                  <span className="text-lg font-bold text-gray-700">
                    {queueStatus?.waitingCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Timer className="w-4 h-4" />
                    <span>Est. wait</span>
                  </div>
                  <span className="text-sm font-semibold text-accent">
                    {formatWaitTime(queueStatus?.estimatedWaitMin)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Join button */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {!branch.queueEnabled ? (
              <p className="text-sm text-gray-400 text-center">Queue is currently unavailable</p>
            ) : !isAuthenticated ? (
              <>
                <p className="text-sm text-gray-500 mb-3 text-center">Login to join the queue</p>
                <Button size="full" onClick={handleJoin}>Login & Join Queue</Button>
              </>
            ) : canJoin ? (
              <Button size="full" onClick={handleJoin}>
                Join Queue
              </Button>
            ) : (
              <p className="text-sm text-gray-400 text-center">Only patients can join the queue</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default BranchDetail;