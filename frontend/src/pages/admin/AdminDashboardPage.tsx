import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatBDT } from '../../utils/format';
import { useToastStore } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  ShieldAlert, 
  TrendingUp,
  Cpu,
} from 'lucide-react';
import api from '../../utils/api';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminTransactions, fraudFlags, users, fetchUsers, fetchFraudFlags, fetchAdminTransactions } = useWalletStore();
  const { admin } = useAuthStore();

  useEffect(() => {
    fetchUsers();
    fetchAdminTransactions();
    fetchFraudFlags();
  }, [fetchUsers, fetchFraudFlags, fetchAdminTransactions]);

  // Aggregate stats
  const totalUsers = users.length;
  const totalVolume = adminTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalFees = adminTransactions.reduce((acc, t) => acc + Number(t.fee || 0), 0);
  const activeFlagsCount = fraudFlags.filter(f => f.reviewed_by_name === null).length;

  // Recharts Data Compilation 1: Categories Bar Chart
  const categoryData = [
    { name: 'Transfers', value: adminTransactions.filter(t => t.txn_type === 'send_money').reduce((acc, t) => acc + Number(t.amount || 0), 0) },
    { name: 'Cashing In', value: adminTransactions.filter(t => t.txn_type === 'cash_in').reduce((acc, t) => acc + Number(t.amount || 0), 0) },
    { name: 'Withdrawals', value: adminTransactions.filter(t => t.txn_type === 'cash_out').reduce((acc, t) => acc + Number(t.amount || 0), 0) },
    { name: 'Bill Pay', value: adminTransactions.filter(t => ['bill_pay', 'mobile_recharge'].includes(t.txn_type)).reduce((acc, t) => acc + Number(t.amount || 0), 0) },
  ];

  const [revenueTrendData, setRevenueTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Calculate all-time revenue distribution by day-of-week directly from transactions
    // This ensures the graph perfectly matches the Surcharge Revenue total
    const trendMap: Record<string, number> = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };
    
    adminTransactions.forEach(t => {
      if (t.fee && Number(t.fee) > 0) {
        const d = new Date(t.txn_at);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (trendMap[dayStr] !== undefined) {
          trendMap[dayStr] += Number(t.fee);
        }
      }
    });

    const orderedTrend = [
      { day: 'Mon', revenue: trendMap['Mon'] },
      { day: 'Tue', revenue: trendMap['Tue'] },
      { day: 'Wed', revenue: trendMap['Wed'] },
      { day: 'Thu', revenue: trendMap['Thu'] },
      { day: 'Fri', revenue: trendMap['Fri'] },
      { day: 'Sat', revenue: trendMap['Sat'] },
      { day: 'Sun', revenue: trendMap['Sun'] }
    ];
    
    setRevenueTrendData(orderedTrend);
  }, [adminTransactions]);

  const recentFrds = fraudFlags.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 select-none">
      
      {/* Title greeting row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            Command Center
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Realtime audit logs & security telemetry of national digital currency
          </p>
        </div>
        
        {/* Core system status line */}
        <div className="bg-emerald-500/10 border border-emerald-500/15 py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-[11px] text-[#00C9A7] font-semibold">
          <Cpu size={12} className="animate-pulse" />
          <span>Platform Status: ONLINE & SECURED CIVIL CORE</span>
        </div>
      </div>

      {/* 4 STUNNING KPI STATS PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Users */}
        <Card className="flex items-center gap-4 py-4.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)] block truncate">Registered Citizens</span>
            <h3 className="font-sora font-extrabold text-base lg:text-lg text-[var(--text-primary)] mt-0.5 truncate">{totalUsers} Users</h3>
          </div>
        </Card>

        {/* Volume */}
        <Card className="flex items-center gap-4 py-4.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#00C9A7]/10 text-[#00C9A7] flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)] block truncate">Transacted Volume</span>
            <h3 className="font-sora font-extrabold text-base lg:text-lg text-[var(--text-primary)] mt-0.5 truncate">{formatBDT(totalVolume)}</h3>
          </div>
        </Card>

        {/* Surcharges Fees */}
        <Card className="flex items-center gap-4 py-4.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)] block truncate">Surcharge Revenue</span>
            <h3 className="font-sora font-extrabold text-base lg:text-lg text-[var(--text-primary)] mt-0.5 truncate">{formatBDT(totalFees)}</h3>
          </div>
        </Card>

        {/* Critical flags */}
        <Card className={`flex items-center gap-4 py-4.5 min-w-0 border ${activeFlagsCount > 0 ? 'border-rose-500/25 bg-rose-500/5' : ''}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            activeFlagsCount > 0 ? 'bg-rose-500/15 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}>
            <ShieldAlert size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)] block truncate">Critical Risk Flags</span>
            <h3 className="font-sora font-extrabold text-base lg:text-lg text-[var(--text-primary)] mt-0.5 truncate">{activeFlagsCount} Active</h3>
          </div>
        </Card>

      </div>

      {/* METRIC CHARTS DUAL COLUMNS USING RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category breakdown bar chart */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center pl-1">
            <span className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-wider">
              Asset Category distribution (Volume counts)
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono">Real-time stats</span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Earnings Days Area Chart */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center pl-1">
            <span className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-wider">
              Fee Revenue Earnings Trend (Surcharge)
            </span>
            <span className="text-[10px] text-[var(--accent-teal)] font-mono">Increasing trend</span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00C9A7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#00C9A7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* LOWER GRID: FRAUD ALERTS & QUICK DIRECT ACCESS MENU */}
      <div className="grid grid-cols-1 gap-6 items-start">
        
        {/* Fraud flags lists */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center pl-1">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest">
              Critical Risk Telemetry Warnings
            </h3>
            <button
              onClick={() => navigate('/admin/fraud')}
              className="text-xs font-bold text-rose-400 hover:underline"
            >
              Examine full ledger
            </button>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col divide-y divide-[var(--border)] overflow-hidden shadow-lg">
            {recentFrds.length === 0 ? (
              <p className="p-8 text-center text-xs text-[var(--text-secondary)]">Zero risk warnings.</p>
            ) : (
              recentFrds.map((fName) => (
                <div key={fName.flag_id} className="p-4 flex items-center justify-between font-semibold text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                      <ShieldAlert size={14} className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-[var(--text-primary)]">
                        {fName.flagged_user} • Risk: {fName.risk_score}%
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        Trigger reason: {fName.rule_triggered}
                      </p>
                    </div>
                  </div>

                  <span className={`py-0.5 px-2 rounded-lg text-[9px] uppercase font-mono border ${
                    fName.reviewed_by_name === null 
                      ? 'bg-rose-500/15 border-rose-500/20 text-rose-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {fName.reviewed_by_name === null ? 'active' : 'resolved'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
