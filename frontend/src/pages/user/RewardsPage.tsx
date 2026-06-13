import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import api from '../../utils/api';
import { formatBDT } from '../../utils/format';
import { useToastStore } from '../../hooks/useToast';
import { TierBadge } from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  ArrowLeft, 
  Trophy, 
  History, 
  TrendingUp, 
  Gift, 
  Users, 
  Award, 
  CheckCircle,
  Clock,
  ChevronRight,
  Coins,
  ArrowRightLeft,
  Zap,
  Lock
} from 'lucide-react';

export const RewardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserPoints, updateUserBalance, fetchUserProfile } = useAuthStore();
  const { rewardOptions, fetchRewardOptions, pointsRedeemedHistory, convertPointsToCash } = useWalletStore();

  const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard' | 'history'>('rewards');

  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertPoints, setConvertPoints] = useState('1000');

  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [rewardTiers, setRewardTiers] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/api/rewards/leaderboard')
      .then(data => setLeaderboardUsers(data))
      .catch(err => useToastStore.getState().showToast(err.message || 'Failed to fetch options', 'error'));

    api.get<any[]>('/api/rewards/tiers')
      .then(data => setRewardTiers(data))
      .catch(err => useToastStore.getState().showToast(err.message || 'Failed to fetch history', 'error'));

    fetchRewardOptions();
  }, []);

  const handleRedeemPointsSubmit = async (optionId: number) => {
    setRedeemSuccess('');
    setRedeemError('');

    if (!user) return;
    
    const option = rewardOptions.find(o => o.id === optionId);
    if (!option) return;

    setIsSubmitting(true);
    setSelectedOptionId(optionId);

    try {
      const data = await api.post<any>('/api/rewards/redeem', {
          option_id: optionId
      });

      // Fetch user profile again to update points and balance from DB
      await fetchUserProfile();
      
      // Also refetch history to show new transaction
      const { fetchRewardsHistory } = useWalletStore.getState();
      if (fetchRewardsHistory) await fetchRewardsHistory();

      setRedeemSuccess(`Successfully claimed '${option.title}'! ৳${option.value_bdt} added to balance.`);
    } catch (e: any) {
      useToastStore.getState().showToast(e.message || 'Failed to redeem points', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickConvert = async () => {
    const pts = parseInt(convertPoints);
    if (isNaN(pts) || pts < 100) return;
    
    setIsSubmitting(true);
    await convertPointsToCash(pts);
    await fetchUserProfile();
    setIsSubmitting(false);
  };

  const getTierRate = () => {
    if (user?.tier === 'platinum') return 0.175;
    if (user?.tier === 'gold') return 0.15;
    if (user?.tier === 'silver') return 0.125;
    return 0.10;
  };

  const isEligible = (user?.current_points || 0) >= 100;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Page Heading Headers */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3 select-none">
          <button
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
              Rewards Center
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Unlock loyalty cashback incentives and benefits
            </p>
          </div>
        </div>

        {/* User overall Points counter */}
        <div className="text-right select-none">
          <span className="text-[10px] text-[var(--text-secondary)] font-mono font-bold block uppercase leading-none">Your purse</span>
          <span className="font-sora text-[#00C9A7] font-extrabold text-lg mt-1 block">
            {user?.current_points} PTS
          </span>
        </div>
      </div>

      {/* THREE INTEGRATIVE MAIN TABS */}
      <div className="flex border-b border-[var(--border)] p-1 bg-[var(--bg-secondary)] rounded-xl select-none">
        {(['rewards', 'leaderboard', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setRedeemError('');
              setRedeemSuccess('');
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all capitalize outline-none ${
              activeTab === tab
                ? 'bg-[var(--bg-card)] text-[#00C9A7] border-b-2 border-[#00C9A7] shadow-sm font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab === 'rewards' && 'Redeem Cashback'}
            {tab === 'leaderboard' && 'Citizens Leaderboard'}
            {tab === 'history' && 'Redemption History'}
          </button>
        ))}
      </div>

      {/* SCREEN VIEW INGRESS */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* ENHANCED QUICK CONVERSION WIDGET */}
          <Card className="bg-gradient-to-br from-[#00C9A7]/15 via-[var(--bg-card)] to-transparent border-[#00C9A7]/30 p-6 overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#00C9A7]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#00C9A7]/20 rounded-lg text-[#00C9A7]">
                      <ArrowRightLeft size={16} />
                    </div>
                    <h2 className="font-sora font-extrabold text-[var(--text-primary)]">Convert Points to Cash</h2>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">
                    Instant Wallet Credit • {user?.tier} Rate Enabled
                  </p>
                </div>
                <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/20 px-3 py-1 rounded-full">
                   <span className="text-[10px] font-bold text-[#00C9A7]">৳{(getTierRate() * 100).toFixed(2)} / 100 PTS</span>
                </div>
              </div>

              {!isEligible ? (
                <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border)] border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                   <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                      <Lock size={20} />
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-[var(--text-primary)]">Conversion Not Eligible</h4>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">You need a minimum of 100 points to start converting to cash.</p>
                   </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                    {/* Input Control Area */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-primary)] px-1">
                        <span className="opacity-70 uppercase tracking-tight">Select Point Volume</span>
                        <div className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
                           <span>Wallet Balance: {user?.current_points} PTS</span>
                        </div>
                      </div>
                      
                      <div className="relative group px-1">
                        <input 
                          type="range" 
                          min="100" 
                          max={Math.max(100, user?.current_points || 0)} 
                          step="10"
                          value={convertPoints}
                          onChange={(e) => setConvertPoints(e.target.value)}
                          className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[#00C9A7] transition-all hover:h-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setConvertPoints('100')} 
                          className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold transition-all border ${
                            convertPoints === '100' 
                              ? 'bg-[#00C9A7] text-white border-[#00C9A7]' 
                              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#00C9A7]/50'
                          }`}
                        >
                          MIN (100)
                        </button>
                        <button 
                          onClick={() => setConvertPoints(String(Math.floor((user?.current_points || 0)/10)*10))} 
                          className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold transition-all border ${
                            parseInt(convertPoints) >= Math.floor((user?.current_points || 0)/10)*10
                              ? 'bg-[#00C9A7] text-white border-[#00C9A7]' 
                              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#00C9A7]/50'
                          }`}
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Results Visual Area */}
                    <div className="lg:col-span-2 flex items-center justify-center gap-4 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)] border-dashed">
                      <div className="text-center">
                        <div className="text-lg font-sora font-extrabold text-[var(--text-primary)] leading-none">{convertPoints}</div>
                        <div className="text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-1">Points</div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-[#00C9A7] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,201,167,0.4)] shrink-0">
                        <ChevronRight size={20} />
                      </div>

                      <div className="text-center">
                        <div className="text-lg font-sora font-extrabold text-[#00C9A7] leading-none">৳{(parseInt(convertPoints) * getTierRate() || 0).toFixed(2)}</div>
                        <div className="text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-1">Balance</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        value={convertPoints}
                        onChange={(e) => setConvertPoints(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-mono text-[var(--text-primary)] focus:border-[#00C9A7] outline-none transition-all"
                        placeholder="1000"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-secondary)] tracking-widest">PTS</span>
                    </div>
                    <Button 
                      onClick={handleQuickConvert}
                      disabled={isSubmitting || (user?.current_points || 0) < parseInt(convertPoints) || parseInt(convertPoints) < 100 || isNaN(parseInt(convertPoints))}
                      className="sm:w-48 h-12 text-xs font-bold shadow-lg"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Conversion'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Feedback Messages */}
          {(redeemError || redeemSuccess) && (
            <div className="flex flex-col gap-3">
              {redeemError && (
                <p className="text-xs text-rose-400 font-semibold text-center select-none bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  {redeemError}
                </p>
              )}
              {redeemSuccess && (
                <div className="text-xs text-[#00C9A7] font-semibold text-center select-none bg-[#00C9A7]/10 p-3 rounded-xl flex items-start justify-center gap-2 border border-[#00C9A7]/20">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{redeemSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* Points Redemption Grid */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pl-1 select-none">
                <Gift size={18} className="text-[#00C9A7]" />
                <h2 className="font-sora font-bold text-sm text-[var(--text-primary)]">
                  Available Offers & Bonuses
                </h2>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewardOptions.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-[var(--text-secondary)] font-semibold border border-dashed border-[var(--border)] rounded-2xl">
                  No active reward redemptions available at this moment.
                </div>
              )}
              {rewardOptions.map((option) => (
                <Card key={option.id} className="relative overflow-hidden group hover:border-[#00C9A7]/30 transition-all border-[var(--border)]">
                  <div className="absolute top-0 right-0 p-3">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      option.category === 'cashback' ? 'bg-emerald-500/10 text-emerald-500' :
                      option.category === 'voucher' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {option.category}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-sora font-bold text-[var(--text-primary)] group-hover:text-[#00C9A7] transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono">
                        Redeem for <span className="font-bold text-amber-400">{option.points_required} PTS</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-sora font-extrabold text-[#00C9A7]">
                        {formatBDT(option.value_bdt)}
                      </span>
                      <Button
                        onClick={() => handleRedeemPointsSubmit(option.id)}
                        disabled={isSubmitting}
                        className="text-[10px] h-8 px-3"
                      >
                        {isSubmitting && selectedOptionId === option.id ? 'Redeeming...' : 'Redeem Now'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 4 METALLIC TIERS SUMMARY DETAILS */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1 select-none">
              Loyalty metallic benefit Tiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
              {rewardTiers.map(tier => (
                <div key={tier.id} className={`bg-gradient-to-br ${tier.bgClass} to-transparent border ${tier.borderClass} p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden`}>
                  {tier.id === 'gold' && (
                    <div className="absolute right-1 top-1 w-10 h-10 bg-yellow-500/5 rounded-full blur-md" />
                  )}
                  <span className={`font-sora font-semibold text-xs text-${tier.colorStyle}-500 flex items-center gap-1`}>
                    <span>{tier.name}</span>
                    {tier.id === 'gold' && (
                      <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1 rounded">Active</span>
                    )}
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] leading-normal">
                    Threshold: <strong>{tier.threshold}</strong>. {tier.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN VIEW CITIZENS LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <Card className="flex flex-col gap-4 animate-in fade-in duration-200 select-none">
          <div className="flex items-center gap-2 pl-1 mb-2">
            <Users size={18} className="text-amber-400" />
            <h2 className="font-sora font-bold text-sm text-[var(--text-primary)]">
              Rankings of high-performing Citizens
            </h2>
          </div>

          <div className="flex flex-col gap-1.5 divide-y divide-[var(--border)]">
            {leaderboardUsers.map((leader) => (
              <div key={leader.name} className="py-3 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-3.5">
                  {/* Medal or number rank */}
                  <span className="w-6 text-center text-sm font-mono text-[var(--text-secondary)]">
                    {leader.medal || leader.rank}
                  </span>
                  
                  {/* Name details */}
                  <span className={`text-xs ${leader.name.includes('(You)') ? 'text-[#00C9A7] font-bold' : 'text-[var(--text-primary)]'}`}>
                    {leader.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                    leader.tier === 'platinum' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    leader.tier === 'gold' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    leader.tier === 'silver' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                    'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }`}>
                    {leader.tier}
                  </span>
                  
                  {/* Ledger points */}
                  <span className="font-mono text-[var(--text-primary)] text-right w-20">
                    {leader.points} PTS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SCREEN VIEW REDEMPTION RECORDS HISTORY */}
      {activeTab === 'history' && (
        <Card className="flex flex-col gap-4 animate-in fade-in duration-200 select-none">
          <div className="flex items-center gap-2.5 pl-1 mb-2">
            <History size={18} className="text-[#00C9A7]" />
            <h2 className="font-sora font-bold text-sm text-[var(--text-primary)]">
              Cash redemptions history logging
            </h2>
          </div>

          {pointsRedeemedHistory.length === 0 ? (
            <p className="text-center text-xs text-[var(--text-secondary)] font-semibold py-8 leading-relaxed">
              No points redemptions logs recorded. Convert some points above!
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {pointsRedeemedHistory.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between font-semibold text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/15">
                      <Award size={14} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">
                        Redeemed {item.points} Points
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        Exchanged for real-time wallet cashback BDT
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[#00C9A7] font-sora font-extrabold block text-sm">
                      +{formatBDT(item.bdt)}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      
    </div>
  );
};

export default RewardsPage;
