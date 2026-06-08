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
  Clock
} from 'lucide-react';

export const RewardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserPoints, updateUserBalance, fetchUserProfile } = useAuthStore();
  const { rewardOptions, fetchRewardOptions, pointsRedeemedHistory } = useWalletStore();

  const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard' | 'history'>('rewards');

  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                : 'text-[var(--text-secondary)] hover:text-white'
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
                        {isSubmitting && selectedOptionId === option.id ? 'Claiming...' : 'Claim Now'}
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
                  <span className="font-mono text-white text-right w-20">
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
