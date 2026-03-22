import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  Building2, Users, BarChart3,
  TrendingUp, Clock, CheckCircle,
  ArrowRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { adminService }    from '../../services/adminService.js';
import { useAuth }         from '../../context/authContext.jsx';
import { useToast }        from '../../context/toastContext.jsx';
import DashboardLayout     from '../../components/layout/dashboardLayout.jsx';
import StatsCard           from '../../components/cards/statsCard.jsx';
import Card                from '../../components/ui/card.jsx';
import Badge               from '../../components/ui/badge.jsx';
import Button              from '../../components/ui/button.jsx';
import Spinner             from '../../components/ui/spinner.jsx';
import { ROLES }           from '../../utils/constants.js';
import { formatWaitTime }  from '../../utils/formatters.js';

const AdminDashboard = () => {
  const { user }           = useAuth();
  const { success, error } = useToast();
  const navigate           = useNavigate();

  const [branches, setBranches]   = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [liveStates, setLive]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [bRes, aRes] = await Promise.all([
          adminService.getBranches(),
          adminService.getAnalytics(),
        ]);
        setBranches(bRes.data.branches);
        setAnalytics(aRes.data.analytics);
        setLive(aRes.data.liveStates || []);
      } catch {
        error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleToggle = async (branchId) => {
    setToggling(branchId);
    try {
      const res = await adminService.toggleQueue(branchId);
      setBranches((prev) =>
        prev.map((b) =>
          b._id === branchId
            ? { ...b, queueEnabled: res.data.queueEnabled }
            : b
        )
      );
      success(res.data.queueEnabled ? 'Queue enabled' : 'Queue disabled');
    } catch {
      error('Failed to toggle queue');
    } finally {
      setToggling(null);
    }
  };

  // Aggregate today's totals from analytics
  const todayTotal = analytics.reduce((a, b) => ({
    totalTokens:  (a.totalTokens  || 0) + (b.totalTokens  || 0),
    completed:    (a.completed    || 0) + (b.completed    || 0),
    avgWaitMin:   (a.avgWaitMin   || 0) + (b.avgWaitMin   || 0),
  }), {});

  const avgWait = analytics.length
    ? todayTotal.avgWaitMin / analytics.length
    : 0;

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={user?.role === ROLES.OVERALL_ADMIN ? 'All branches' : 'Your branch'}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Branches"
          value={branches.length}
          color="brand"
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatsCard
          label="Tokens Today"
          value={todayTotal.totalTokens || 0}
          color="yellow"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatsCard
          label="Completed"
          value={todayTotal.completed || 0}
          color="green"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatsCard
          label="Avg Wait"
          value={formatWaitTime(avgWait)}
          color="purple"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Manage Branches', path: '/admin/branches', icon: <Building2 className="w-5 h-5" />, color: 'bg-brand-50 text-brand-600' },
          { label: 'Manage Staff',    path: '/admin/staff',    icon: <Users      className="w-5 h-5" />, color: 'bg-green-50  text-green-600'  },
          { label: 'View Analytics',  path: '/admin/analytics',icon: <BarChart3  className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
        ].map((item) => (
          <Card
            key={item.path}
            hover
            onClick={() => navigate(item.path)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="font-medium text-gray-700">{item.label}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Card>
        ))}
      </div>

      {/* Branch list with live toggle */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Branch Queue Status</h2>
          {user?.role === ROLES.OVERALL_ADMIN && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/admin/branches')}
            >
              Manage
            </Button>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {branches.map((branch) => {
            const live = liveStates.find(
              (s) => s.branch?._id === branch._id || s.branch === branch._id
            );
            return (
              <div key={branch._id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-700 text-sm">{branch.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">
                    {branch.city}, {branch.state}
                  </p>
                  {live && (
                    <p className="text-xs text-brand-500 mt-0.5">
                      Token #{live.currentSequence ?? 0} · {live.totalCompletedToday ?? 0} served today
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={branch.queueEnabled ? 'green' : 'gray'}
                    dot
                    size="sm"
                  >
                    {branch.queueEnabled ? 'Open' : 'Closed'}
                  </Badge>
                  <button
                    onClick={() => handleToggle(branch._id)}
                    disabled={toggling === branch._id}
                    className="text-gray-400 hover:text-brand-600 transition-colors disabled:opacity-50"
                    title={branch.queueEnabled ? 'Disable queue' : 'Enable queue'}
                  >
                    {toggling === branch._id ? (
                      <Spinner size="sm" />
                    ) : branch.queueEnabled ? (
                      <ToggleRight className="w-7 h-7 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;