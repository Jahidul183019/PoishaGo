import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { API_BASE_URL } from '../../utils/api';
import { formatBDT } from '../../utils/format';
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
  const { user, updateUserPoints, updateUserBalance, token, fetchUserProfile } = useAuthStore();
  const { pointsRedeemedHistory } = useWalletStore();

  const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard' | 'history'>('rewards');

  const [pointsRedeemValue, setPointsRedeemValue] = useState(1000); // starts at 1,000 pts
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');

  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [rewardTiers, setRewardTiers] = useState<any[]>([]);
  const [rewardConfig, setRewardConfig] = useState<any>({ conversion_rate: 0.10, slider_min: 100, slider_max: 5000, slider_step: 100 });

  // Live calculation: cashback = points * conversion_rate
  const convertedCashbackBDT = pointsRedeemValue * rewardConfig.conversion_rate;

  useEffect(() => {
    fetch(API_BASE_URL + '/api/rewards/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboardUsers(data))
      .catch(err => console.error(err));

    fetch(API_BASE_URL + '/api/rewards/tiers')
      .then(res => res.json())
      .then(data => setRewardTiers(data))
      .catch(err => console.error(err));

    fetch(API_BASE_URL + '/api/rewards/config')
      .then(res => res.json())
      .then(data => {
        setRewardConfig(data);
        if (pointsRedeemValue < data.slider_min) setPointsRedeemValue(data.slider_min);
      })
      .catch(err => console.error(err));
  }, []);

  const handleRedeemPointsSubmit = async () => {
    setRedeemSuccess('');
    setRedeemError('');

    if (!user) return;

    if (user.current_points < pointsRedeemValue) {
      setRedeemError(`Insufficient points. You only have ${user.current_points} points.`);
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + '/api/rewards/redeem', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          points: pointsRedeemValue,
          bdt_value: convertedCashbackBDT
        })
      });

      if (!response.ok) {
        const err = await response.json();
        setRedeemError(err.detail || 'Redemption failed');
        return;
      }

      // Fetch user profile again to update points and balance from DB
      await fetchUserProfile();
      
      // Also refetch history to show new transaction
      const { fetchRewardsHistory } = useWalletStore.getState();
      if (fetchRewardsHistory) await fetchRewardsHistory();

      setRedeemSuccess(`Successfully redeemed ${pointsRedeemValue} points for ${formatBDT(convertedCashbackBDT)} BDT direct wallet cashback!`);
    } catch (e) {
      console.error(e);
      setRedeemError('An error occurred during redemption processing. Try again.');
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
          
          {/* Points Redemption Slider Block */}
          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 pl-1 select-none">
              <Gift size={18} className="text-[#00C9A7]" />
              <h2 className="font-sora font-bold text-sm text-[var(--text-primary)]">
                Redeem points for Wallet Balance
              </h2>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 text-center flex flex-col gap-3 shadow-inner relative overflow-hidden select-none">
              <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
              
              <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
                Selected points to convert
              </span>
              <h1 className="font-sora font-extrabold text-3xl text-amber-400">
                {pointsRedeemValue} <span className="text-xs font-semibold text-[var(--text-secondary)] font-dm">pts</span>
              </h1>
              <span className="text-xs text-[var(--text-secondary)]">Converting equivalent value of:</span>
              <h2 className="font-sora font-extrabold text-2xl text-[#00C9A7]">
                {formatBDT(convertedCashbackBDT)} BDT CASH
              </h2>
            </div>

            {/* Slider control input */}
            <div className="flex flex-col gap-1.5 select-none">
              <input
                type="range"
                min={rewardConfig.slider_min}
                max={rewardConfig.slider_max}
                step={rewardConfig.slider_step}
                value={pointsRedeemValue}
                onChange={(e) => setPointsRedeemValue(parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[#00C9A7]"
              />
              <div className="flex justify-between text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                <span>{rewardConfig.slider_min} PTS (৳{rewardConfig.slider_min * rewardConfig.conversion_rate})</span>
                <span>{rewardConfig.slider_max / 2} PTS (৳{rewardConfig.slider_max / 2 * rewardConfig.conversion_rate})</span>
                <span>{rewardConfig.slider_max} PTS (৳{rewardConfig.slider_max * rewardConfig.conversion_rate})</span>
              </div>
            </div>

            {redeemError && (
              <p className="text-xs text-rose-400 font-semibold text-center select-none bg-rose-500/10 p-2.5 rounded-lg">
                {redeemError}
              </p>
            )}

            {redeemSuccess && (
              <div className="text-xs text-[#00C9A7] font-semibold text-center select-none bg-[#00C9A7]/10 p-3 rounded-xl flex items-start justify-center gap-2 border border-[#00C9A7]/10">
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <span>{redeemSuccess}</span>
              </div>
            )}

            <Button
              onClick={handleRedeemPointsSubmit}
              variant="primary"
              className="w-full mt-2"
              id="btn-redeem-points-conversion"
            >
              <span>Convert Points to Cash now</span>
            </Button>
          </Card>

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
