import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  Hospital, Building2, TrendingUp,
  CheckCircle, ArrowRight, Users,
} from 'lucide-react';
import { superAdminService } from '../../services/superadminService.js';
import { useToast }          from '../../context/toastContext.jsx';
import DashboardLayout       from '../../components/layout/dashboardLayout.jsx';
import StatsCard             from '../../components/cards/statsCard.jsx';
import Card                  from '../../components/ui/card.jsx';
import Badge                 from '../../components/ui/badge.jsx';
import Spinner               from '../../components/ui/spinner.jsx';
import Button                from '../../components/ui/button.jsx';
import { formatWaitTime }    from '../../utils/formatters.js';

const SuperAdminDashboard = () => {
  const { error }         = useToast();
  const navigate          = useNavigate();
  const [data, setData]   = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [aRes, hRes] = await Promise.all([
          superAdminService.getPlatformAnalytics(),
          superAdminService.getHospitals({ limit: 5 }),
        ]);
        setData(aRes.data);
        setHospitals(hRes.data.hospitals);
      } catch {
        error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <DashboardLayout title="Super Admin">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  const { summary, topBranches, platform } = data || {};

  return (
    <DashboardLayout title="Platform Dashboard" subtitle="MediSaathi overview">

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Hospitals"      value={platform?.activeHospitals ?? 0} icon={<Hospital    className="w-5 h-5" />} color="brand"  />
        <StatsCard label="Branches"       value={platform?.activeBranches  ?? 0} icon={<Building2   className="w-5 h-5" />} color="purple" />
        <StatsCard label="Tokens Today"   value={summary?.totalTokens      ?? 0} icon={<TrendingUp  className="w-5 h-5" />} color="yellow" />
        <StatsCard label="Completed"      value={summary?.completed        ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="green"  />
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Manage Hospitals', path: '/superadmin/hospitals', icon: <Hospital   className="w-5 h-5" />, color: 'bg-brand-50  text-brand-600'  },
          { label: 'Platform Stats',   path: '/superadmin/analytics', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-50  text-green-600'  },
          { label: 'All Hospitals',    path: '/superadmin/hospitals', icon: <Building2  className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
        ].map((item) => (
          <Card
            key={item.label}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent hospitals */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Recent Hospitals</h2>
            <Button size="sm" variant="secondary" onClick={() => navigate('/superadmin/hospitals')}>
              View all
            </Button>
          </div>
          <div className="divide-y divide-gray-50">
            {hospitals.map((h) => (
              <div key={h._id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{h.city}, {h.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={h.isActive ? 'green' : 'gray'} dot size="sm">
                    {h.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top branches */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-700">Busiest Branches Today</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(topBranches || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet today</p>
            ) : (
              topBranches.map((b, i) => (
                <div key={b._id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{b.branchName}</p>
                      <p className="text-xs text-gray-400 capitalize">{b.branchCity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-600">{b.totalTokens} tokens</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;