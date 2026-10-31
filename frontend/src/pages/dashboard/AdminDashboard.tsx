import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsData } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Repeat,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      if (res.success && res.analytics) {
        setData(res.analytics);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading intelligence metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-950/20 border border-red-800/40 rounded-2xl m-6">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-200">{error || 'Could not load dashboard data.'}</p>
      </div>
    );
  }

  const statusChartData = Object.entries(data.statusBreakdown).map(([status, count]) => ({
    name: status,
    count,
  }));

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: '#10b981',
    DRAFT: '#64748b',
    QUOTATION: '#8b5cf6',
    CONFIRMED: '#3b82f6',
    PAUSED: '#f59e0b',
    CLOSED: '#ef4444',
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & SLA Benchmark */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 p-6 rounded-2xl border border-purple-900/40 shadow-xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Brightloop Realtime Telemetry</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recurring Revenue & Operations Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Unified billing metrics, subscription churn prevention, and automated cash collection.
          </p>
        </div>

        {/* Performance requirement badge: PDF requires under 2 seconds */}
        <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <div className="text-xs font-semibold text-emerald-400">
              Query Latency: {data.responseTimeMs} ms
            </div>
            <div className="text-[10px] text-slate-400">Target: &lt; 2000 ms SLA</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Recurring (MRR)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{data.mrr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Normalized Across All Active Plans</span>
          </div>
        </div>

        {/* Total Revenue Received */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue Paid</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Reconciled via Razorpay & Bank Trans.
          </div>
        </div>

        {/* Outstanding Unpaid */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Invoices</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{data.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-amber-400/90 flex items-center gap-1">
            <span>Awaiting Customer Settlement</span>
          </div>
        </div>

        {/* Overdue Alert */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-red-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Deficits</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400 tracking-tight">
            ₹{data.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-red-400/90 font-medium">
            {data.overdueCount} Past Due Invoices Requires Action
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row: Active Subscriptions & Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Subscriptions</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{data.activeSubscriptionsCount} Live Contracts</h3>
              <p className="text-xs text-slate-400 mt-1">Currently billing continuously</p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('subscriptions')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Client Organizations</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">{data.totalCustomers} Accounts</h3>
              <p className="text-xs text-slate-400 mt-1">Enterprise & Small Business subscribers</p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1"
            >
              <span>View Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Charts Section: Revenue Trends & Subscription Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Revenue Collections Trend</h3>
              <p className="text-xs text-slate-400">Monthly realized cash flows (in INR)</p>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Payments Collected</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Status Breakdown Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Contract Status Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Breakdown of all subscriptions across lifecycles</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Contracts:</span>
            <span className="font-bold text-white">
              {Object.values(data.statusBreakdown).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
