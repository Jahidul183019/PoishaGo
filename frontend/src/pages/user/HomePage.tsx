import React, { useState } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { formatBDT } from '../../utils/format';
import { TierBadge, StatusBadge } from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { 
  Eye, 
  EyeOff, 
  X, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Clock, 
  Trophy, 
  Bell, 
  ArrowUpRight, 
  ShieldAlert,
  Download,
  Smartphone
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNav();
  const { user } = useAuthStore();
  const { transactions } = useWalletStore();

  const [showBalance, setShowBalance] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Quick navigate helper
  const handleQuickAction = (route: string) => {
    navigate(route);
  };

  // List only the latest 4 transactions for a beautiful dashboard feeling
  const recentTxns = transactions.slice(0, 4);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Top Banner Greetings Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            As-salamu Alaykum,
          </h1>
          <p className="text-sm font-semibold text-[#00C9A7] font-sora mt-0.5">
            {user?.full_name || 'Valued Customer'}
          </p>
        </div>

        {/* Reward Tier Indicator */}
        <div className="flex items-center gap-2">
          <TierBadge tier={user?.tier || 'gold'} />
        </div>
      </div>

      {/* DISMISSIBLE CAMPAIGN BONUS ACCENT */}
      {showBanner && (
        <div className="relative bg-gradient-to-r from-blue-600/90 to-emerald-600/90 border border-emerald-400/20 rounded-2xl p-4 flex items-center justify-between shadow-lg overflow-hidden shrink-0 animate-in slide-in-from-top-4 duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex-1 pr-6">
            <h4 className="font-sora font-bold text-sm text-white flex items-center gap-1.5 leading-tight">
              🌙 Eid-Ul-Adha Special Cashback Promo!
            </h4>
            <p className="text-[11px] text-slate-200 mt-1 pl-0.5 leading-relaxed">
              Send <strong>৳1,000+</strong> today & stand a chance of earning an instant <strong>৳500 double cashback</strong> in your wallet!
            </p>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="p-1 rounded-full hover:bg-white/15 text-white/85 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* CORE GRAND BALANCE & REWARDS BENTO WIDGET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Main balance details */}
        <Card className="md:col-span-2 relative flex flex-col justify-between overflow-hidden group min-h-[160px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Total Account Balance
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all outline-none"
              id="btn-toggle-balance"
              title={showBalance ? "Hide Balance" : "Display Balance"}
            >
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="my-3 flex flex-col gap-1 select-none">
            {showBalance ? (
              <h2 className="font-sora font-extrabold text-3xl text-[var(--text-primary)] tracking-tight leading-none">
                {user?.balance != null ? formatBDT(user.balance) : '৳ --'}
              </h2>
            ) : (
              <h2 className="font-sora font-extrabold text-3xl text-[var(--text-primary)] tracking-widest leading-none">
                ৳ ••••••••
              </h2>
            )}
            <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-wide mt-1">
              Wallet Account ID: <span className="text-[var(--text-primary)]">{user?.wallet_number || '—'}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#00C9A7] font-semibold border-t border-[var(--border)] pt-3">
            <TrendingUp size={13} className="text-[#00C9A7]" />
            <span>Bangladeshi bank deposits are fully secured</span>
          </div>
        </Card>

        {/* Mini rewards dashboard details */}
        <Card className="flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-400/10 rounded-full blur-lg pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Poisha Points
            </span>
            <Trophy size={16} className="text-amber-400" />
          </div>

          <div className="my-3">
            <h3 className="font-sora font-extrabold text-2xl text-amber-400">
              {user?.current_points ?? 2450} <span className="text-xs font-semibold text-[var(--text-secondary)] font-dm">pts</span>
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-semibold leading-tight">
              Equivalent to roughly <strong>{formatBDT((user?.current_points ?? 2450) * 0.10)}</strong> of real-time cash
            </p>
          </div>

          <button
            onClick={() => handleQuickAction('/rewards')}
            className="flex items-center justify-center gap-1 py-1.5 w-full bg-amber-500/10 border border-amber-500/15 hover:border-amber-400/40 hover:bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-xl transition-all outline-none"
            id="btn-goto-points"
          >
            <span>Convert Points to Cash</span>
            <ArrowUpRight size={13} />
          </button>
        </Card>
      </div>

      {/* QUICK ACTIONS UTILITY GRID */}
      <div className="flex flex-col gap-3 select-none">
        <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
          Quick Wallet Services
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <button
            onClick={() => handleQuickAction('/send')}
            className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[#00C9A7]/40 rounded-2xl p-5 flex flex-col gap-3 items-start text-left transition-all duration-200 outline-none hover:-translate-y-0.5 group"
            id="action-send-money"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-500/15 transition-transform duration-200">
              <Send size={18} />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-[var(--text-primary)]">Send Money</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Free instant transfers</p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction('/cashin')}
            className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col gap-3 items-start text-left transition-all duration-200 outline-none hover:-translate-y-0.5 group"
            id="action-cash-in"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00C9A7]/10 text-[#00C9A7] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#00C9A7]/15 transition-transform duration-200">
              <TrendingUp size={18} />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-[var(--text-primary)]">Cash In</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Deposit funds cheaply</p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction('/cashout')}
            className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-red-500/40 rounded-2xl p-5 flex flex-col gap-3 items-start text-left transition-all duration-200 outline-none hover:-translate-y-0.5 group"
            id="action-cash-out"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-rose-500/15 transition-transform duration-200">
              <TrendingDown size={18} />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-[var(--text-primary)]">Cash Out</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Withdraw at any agent</p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction('/bills')}
            className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-amber-500/40 rounded-2xl p-5 flex flex-col gap-3 items-start text-left transition-all duration-200 outline-none hover:-translate-y-0.5 group"
            id="action-bill-pay"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500/15 transition-transform duration-200">
              <Receipt size={18} />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-[var(--text-primary)]">Pay Bills</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Electricity, Water & Gas</p>
            </div>
          </button>

          <button
            onClick={() => handleQuickAction('/recharge')}
            className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-purple-500/40 rounded-2xl p-5 flex flex-col gap-3 items-start text-left transition-all duration-200 outline-none hover:-translate-y-0.5 group"
            id="action-mobile-recharge"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-500/15 transition-transform duration-200">
              <Smartphone size={18} />
            </div>
            <div>
              <h4 className="font-sora font-bold text-sm text-[var(--text-primary)]">Recharge</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Mobile top-up instantly</p>
            </div>
          </button>

        </div>
      </div>

      {/* RECENT TRANSACTIONS CARDS BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-1">
        
        {/* Ledger logs */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between pl-1">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest">
              Recent Transactions Logs
            </h3>
            <button
              onClick={() => handleQuickAction('/history')}
              className="text-xs font-semibold text-[#00C9A7] hover:underline"
              id="home-link-full-history"
            >
              See Full Ledger
            </button>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden shadow-lg select-none">
            {recentTxns.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)] text-xs">
                No recent transactions on this account.
              </div>
            ) : (
              recentTxns.map((txn, index) => (
                <div 
                  key={txn.txn_id} 
                  className={`p-4 flex items-center justify-between border-[var(--border)] ${
                    index < recentTxns.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      txn.txn_type === 'send_money' || txn.txn_type === 'cash_out' || txn.txn_type === 'bill_pay'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {txn.txn_type === 'send_money' && <Send size={16} />}
                      {txn.txn_type === 'cash_in' && <TrendingUp size={16} />}
                      {txn.txn_type === 'cash_out' && <TrendingDown size={16} />}
                      {txn.txn_type === 'bill_pay' && <Receipt size={16} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {txn.txn_type === 'bill_pay' ? txn.company_name || 'Utility Bill Provider' : txn.receiver_name}
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate uppercase tracking-wide">
                        {txn.txn_type.replace('_', ' ')} • Ref Code: {txn.reference_no}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <h5 className={`font-sora font-extrabold text-xs ${
                      txn.txn_type === 'send_money' || txn.txn_type === 'cash_out' || txn.txn_type === 'bill_pay'
                        ? 'text-rose-400'
                        : 'text-[#00C9A7]'
                    }`}>
                      {txn.txn_type === 'send_money' || txn.txn_type === 'cash_out' || txn.txn_type === 'bill_pay' ? '-' : '+'}
                      {formatBDT(txn.amount)}
                    </h5>
                    <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">
                      {new Date(txn.txn_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Promo tips right panel */}
        <div className="flex flex-col gap-3 w-full">
          <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
            Compliance Tips
          </h3>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4 shadow-lg select-none">
            <div className="flex items-start gap-3">
              <ShieldAlert size={16} className="text-[#00C9A7] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs text-[var(--text-primary)]">Kybernetic Fraud Controls</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Avoid clicking insecure links or loading balance deposits from unvetted agents to limit your vulnerability.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 flex items-start gap-3">
              <Clock size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs text-[var(--text-primary)]">Keep your PIN private</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Our system will never ask for your 6-digit PIN in any messaging channel.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default HomePage;
