import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminService }   from '../../services/adminService.js';
import { useToast }       from '../../context/toastContext.jsx';
import DashboardLayout    from '../../components/layout/dashboardLayout.jsx';
import StatsCard          from '../../components/cards/statsCard.jsx';
import Card               from '../../components/ui/card.jsx';
import Spinner            from '../../components/ui/spinner.jsx';
import {
  TrendingUp, CheckCircle, Clock, SkipForward,
} from 'lucide-react';
import { formatWaitTime } from '../../utils/formatters.js';
import {getTodayIST}      from '../../utils/dateUtil.js';

const COLORS = ['#1A56A0','#5DB83A','#EF9F27','#E24B4A','#7F77DD','#888780'];

const DEPT_LABELS = {
  eye: 'Eye', ent: 'ENT', general: 'General',
  ortho: 'Ortho', dental: 'Dental', other: 'Other',
};

const Analytics = () => {
  const { error }         = useToast();
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]   = useState(getTodayIST());
  const [to, setTo]       = useState(getTodayIST());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await adminService.getAnalytics({ from, to });
        setData(res.data.analytics);
      } catch {
        error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [from, to]);

  // Aggregate across all branches in range
  const totals = data.reduce((acc, d) => ({
    totalTokens:   (acc.totalTokens   || 0) + (d.totalTokens   || 0),
    completed:     (acc.completed     || 0) + (d.completed     || 0),
    skippedManual: (acc.skippedManual || 0) + (d.skippedManual || 0),
    skippedAuto:   (acc.skippedAuto   || 0) + (d.skippedAuto   || 0),
    leftQueue:     (acc.leftQueue     || 0) + (d.leftQueue     || 0),
    avgWaitMin:    (acc.avgWaitMin    || 0) + (d.avgWaitMin    || 0),
  }), {});

  const avgWait = data.length ? totals.avgWaitMin / data.length : 0;

  // Department breakdown — merge across all docs
  const deptMap = {};
  data.forEach((d) => {
    if (d.departmentBreakdown) {
      Object.entries(d.departmentBreakdown).forEach(([k, v]) => {
        deptMap[k] = (deptMap[k] || 0) + v;
      });
    }
  });
  const deptData = Object.entries(deptMap).map(([k, v]) => ({
    name:  DEPT_LABELS[k] || k,
    value: v,
  }));

  // Daily token trend
  const trendData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date:      d.date.slice(5),     // MM-DD
      tokens:    d.totalTokens || 0,
      completed: d.completed   || 0,
    }));

  if (loading) return (
    <DashboardLayout title="Analytics">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Analytics" subtitle="Queue performance insights">

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from}
            max={getTodayIST()}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Tokens"  value={totals.totalTokens || 0}   icon={<TrendingUp className="w-5 h-5"   />} color="brand"  />
        <StatsCard label="Completed"     value={totals.completed   || 0}   icon={<CheckCircle className="w-5 h-5"  />} color="green"  />
        <StatsCard label="Avg Wait"      value={formatWaitTime(avgWait)}    icon={<Clock className="w-5 h-5"        />} color="purple" />
        <StatsCard label="Skipped"       value={(totals.skippedManual || 0) + (totals.skippedAuto || 0)} icon={<SkipForward className="w-5 h-5" />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Token trend */}
        <Card>
          <h3 className="font-semibold text-gray-700 mb-4">Daily Token Trend</h3>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data for selected range</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barSize={20}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="tokens"    name="Total"     fill="#1A56A0" radius={[4,4,0,0]} />
                <Bar dataKey="completed" name="Completed" fill="#5DB83A" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Department breakdown */}
        <Card>
          <h3 className="font-semibold text-gray-700 mb-4">Department Breakdown</h3>
          {deptData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data for selected range</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Skip breakdown */}
      <Card>
        <h3 className="font-semibold text-gray-700 mb-4">Token Outcomes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {[
            { label: 'Completed',      value: totals.completed     || 0, color: 'text-green-600'  },
            { label: 'Auto-skipped',   value: totals.skippedAuto   || 0, color: 'text-yellow-600' },
            { label: 'Manual skipped', value: totals.skippedManual || 0, color: 'text-orange-600' },
            { label: 'Left queue',     value: totals.leftQueue     || 0, color: 'text-red-500'    },
            { label: 'Rejoined',       value: data.reduce((a, b) => a + (b.rejoinCount || 0), 0), color: 'text-brand-600' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl py-4 px-2">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default Analytics;