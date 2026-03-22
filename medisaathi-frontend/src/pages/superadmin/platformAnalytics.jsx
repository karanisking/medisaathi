import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';
import { superAdminService } from '../../services/superadminService.js';
import { useToast }          from '../../context/toastContext.jsx';
import DashboardLayout       from '../../components/layout/dashboardLayout.jsx';
import StatsCard             from '../../components/cards/statsCard.jsx';
import Card                  from '../../components/ui/card.jsx';
import Spinner               from '../../components/ui/spinner.jsx';
import { TrendingUp, CheckCircle, Clock, Hospital } from 'lucide-react';
import { formatWaitTime }    from '../../utils/formatters.js';
import { getTodayIST }       from '../../utils/dateUtil.js';

// Get date N days ago
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

const PlatformAnalytics = () => {
  const { error }         = useToast();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]   = useState(daysAgo(7));
  const [to, setTo]       = useState(getTodayIST());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await superAdminService.getPlatformAnalytics({ from, to });
        setData(res.data);
      } catch {
        error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [from, to]);

  if (loading) return (
    <DashboardLayout title="Platform Analytics">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  const { summary, topBranches, platform } = data || {};

  return (
    <DashboardLayout title="Platform Analytics" subtitle="Across all hospitals and branches">

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={getTodayIST()}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Active Hospitals" value={platform?.activeHospitals ?? 0} icon={<Hospital    className="w-5 h-5" />} color="brand"  />
        <StatsCard label="Total Tokens"     value={summary?.totalTokens      ?? 0} icon={<TrendingUp  className="w-5 h-5" />} color="yellow" />
        <StatsCard label="Completed"        value={summary?.completed        ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="green"  />
        <StatsCard label="Avg Wait"         value={formatWaitTime(summary?.avgWaitMin ?? 0)} icon={<Clock className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Token outcomes */}
        <Card>
          <h3 className="font-semibold text-gray-700 mb-4">Token Outcomes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[{
                name:      'Tokens',
                Completed: summary?.completed     ?? 0,
                AutoSkip:  summary?.skippedAuto   ?? 0,
                ManualSkip:summary?.skippedManual ?? 0,
                Left:      summary?.leftQueue     ?? 0,
              }]}
              barSize={28}
            >
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Completed"  fill="#5DB83A" radius={[4,4,0,0]} />
              <Bar dataKey="AutoSkip"   fill="#EF9F27" radius={[4,4,0,0]} />
              <Bar dataKey="ManualSkip" fill="#E24B4A" radius={[4,4,0,0]} />
              <Bar dataKey="Left"       fill="#888780" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 5 branches */}
        <Card>
          <h3 className="font-semibold text-gray-700 mb-4">Top 5 Busiest Branches</h3>
          {!topBranches?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topBranches.map((b) => ({
                  name:   b.branchName?.split(' ')[0] ?? 'Branch',
                  tokens: b.totalTokens,
                }))}
                layout="vertical"
                barSize={16}
              >
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="tokens" name="Tokens" fill="#1A56A0" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Outcome summary cards */}
      <Card>
        <h3 className="font-semibold text-gray-700 mb-4">Platform Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Active Branches', value: platform?.activeBranches  ?? 0, color: 'text-brand-600'  },
            { label: 'Total Tokens',    value: summary?.totalTokens      ?? 0, color: 'text-yellow-600' },
            { label: 'Completed',       value: summary?.completed        ?? 0, color: 'text-green-600'  },
            { label: 'Left Queue',      value: summary?.leftQueue        ?? 0, color: 'text-red-500'    },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl py-5">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default PlatformAnalytics;
