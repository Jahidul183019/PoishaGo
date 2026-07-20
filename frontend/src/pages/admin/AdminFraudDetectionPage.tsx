import React, { useEffect } from 'react';
import { useWalletStore, FraudFlag } from '../../store/useWalletStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserX, 
  RefreshCw, 
  Activity, 
  Clock, 
  CheckCircle 
} from 'lucide-react';

export const AdminFraudDetectionPage: React.FC = () => {
  const { fraudFlags, resolveFraudFlag, toggleCitizenStatus, fetchFraudFlags, users, fetchUsers } = useWalletStore();

  useEffect(() => {
    fetchFraudFlags();
    fetchUsers();
  }, [fetchFraudFlags, fetchUsers]);

  // Compute stats
  const activeCount = fraudFlags.filter(f => f.reviewed_by_name === null).length;
  const resolvedCount = fraudFlags.filter(f => f.reviewed_by_name !== null).length;
  const criticalCount = fraudFlags.filter(f => f.reviewed_by_name === null && f.risk_score >= 80).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 select-none">
      
      {/* Page headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            Algorithmic Threat Telemetry
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Realtime compliance, money laundering and multiple device session auditing
          </p>
        </div>

        {/* Global risk status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Risk Status:</span>
          <span className="py-1 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs rounded-lg flex items-center gap-1">
            <Activity size={12} className="animate-pulse" />
            <span>CRITICAL AUDITING ACTIVE</span>
          </span>
        </div>
      </div>

      {/* THREE RISK KPI HEADS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <Card className="flex items-center gap-4 py-4 border border-rose-500/15">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">Active Threats</span>
            <h3 className="font-sora font-extrabold text-lg text-[var(--text-primary)] mt-0.5">{activeCount} Cases</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4 border border-blue-500/15">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">Critical (Risk &gt; 80%)</span>
            <h3 className="font-sora font-extrabold text-lg text-[var(--text-primary)] mt-0.5">{criticalCount} Flagged</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4 border border-emerald-500/15">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-[#00C9A7]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-secondary)]">Resolved Cases</span>
            <h3 className="font-sora font-extrabold text-lg text-[var(--text-primary)] mt-0.5">{resolvedCount} Settled</h3>
          </div>
        </Card>

      </div>

      {/* REAL-TIME THREAT LOGS INDEX */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
          Suspicious Activity Ledger Warning Entries
        </h3>

        <div className="flex flex-col gap-4">
          {fraudFlags.length === 0 ? (
            <p className="p-8 text-center text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
              Zero algorithmic threat alerts generated. Platform integrity pristine.
            </p>
          ) : (
            fraudFlags.map((flag) => {
              const isHighRisk = flag.risk_score >= 80;
              const isActive = flag.reviewed_by_name === null;

              return (
                <div
                  key={flag.flag_id}
                  className={`bg-[var(--bg-card)] border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none transition-all ${
                    isActive 
                      ? isHighRisk 
                        ? 'border-rose-500 bg-rose-500/5 shadow-rose-950/20 shadow-md' 
                        : 'border-amber-500/50 bg-amber-500/5'
                      : 'border-[var(--border)] opacity-65'
                  }`}
                >
                  {/* Identity and risk scores info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isActive 
                        ? isHighRisk 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <ShieldAlert size={18} className={isActive && isHighRisk ? 'animate-pulse' : ''} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-sora font-extrabold text-sm text-[var(--text-primary)]">
                          {flag.flagged_user}
                        </h4>
                        <span className="font-mono text-[10px] text-[var(--text-secondary)] mt-0.5">
                          ({flag.phone})
                        </span>
                        
                        <span className={`text-[10px] py-0.5 px-2 font-mono font-bold rounded-lg ${
                          isActive 
                            ? isHighRisk 
                              ? 'bg-rose-600 text-white shadow-sm' 
                              : 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          Risk Score: {flag.risk_score}%
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-primary)] mt-2 font-semibold">
                        Alert: <span className="text-[var(--text-secondary)] font-normal">{flag.rule_triggered}</span>
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-mono">
                        Trigger Timestamp: {new Date(flag.flagged_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    
                    {/* Investigate/Resolve toggles */}
                    {isActive ? (
                      <button
                        onClick={() => resolveFraudFlag(flag.flag_id)}
                        className="py-2 px-3.5 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/15 text-blue-400 text-xs font-bold rounded-xl transition-all outline-none cursor-pointer"
                      >
                        Settle Alert (Resolve)
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/15 rounded-lg select-none">
                        <ShieldCheck size={14} />
                        <span>Resolved Entry</span>
                      </span>
                    )}

                    {/* Suspend Wallet buttons */}
                    {isActive && (
                      <button
                        onClick={() => {
                          toggleCitizenStatus(flag.user_id, 'active');
                          fetchFraudFlags();
                        }}
                        className="py-2 px-3.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/15 hover:border-rose-500/40 text-rose-400 text-xs font-bold rounded-xl transition-all outline-none flex items-center gap-1 cursor-pointer"
                        title="Block citizen device access"
                      >
                        <UserX size={14} />
                        <span>Block client access</span>
                      </button>
                    )}

                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminFraudDetectionPage;
