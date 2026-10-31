import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsData } from '../../types';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  FileText,
  CreditCard,
  Building,
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
  PieChart,
  Pie,
} from 'recharts';

export const FinancialReports: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success && res.analytics) {
        setData(res.analytics);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const pieData = Object.entries(data.statusBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#10b981', '#64748b', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Financial Intelligence & Revenue Telemetry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            MRR tracking, cash collection performance, and overdue invoice risk profiling.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          />
        </div>
      </div>

      {/* Finance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Monthly Recurring Revenue
          </span>
          <div className="text-2xl font-bold text-white">
            ₹{data.mrr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-purple-400 mt-1 block">Contracted Annualized Rate</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Cash Realized (Net Paid)
          </span>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Cleared via Gateways</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Open Receivables
          </span>
          <div className="text-2xl font-bold text-amber-400">
            ₹{data.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Issued & Unpaid</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Past-Due Risk Balance
          </span>
          <div className="text-2xl font-bold text-red-400">
            ₹{data.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-red-400/80 mt-1 block">{data.overdueCount} Overdue Accounts</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Velocity */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Collections Velocity</h3>
          <p className="text-xs text-slate-400 mb-6">Realized monthly cash receipts</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueTrends}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Lifecycle Distribution */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Subscription Lifecycle Proportions</h3>
            <p className="text-xs text-slate-400 mb-4">Volume breakdown of active vs paused vs closed contracts</p>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
