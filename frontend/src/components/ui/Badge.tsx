import React from 'react';

// Status badge component
interface StatusBadgeProps {
  status: 'completed' | 'success' | 'failed' | 'pending' | 'flagged' | 'unreviewed' | 'reviewed';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();
  
  if (norm === 'completed' || norm === 'success' || norm === 'reviewed') {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20 ${className}`}>
        ● Success
      </span>
    );
  }
  
  if (norm === 'failed') {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 ${className}`}>
        ✕ Failed
      </span>
    );
  }
  
  if (norm === 'pending') {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 ${className}`}>
        ○ Pending
      </span>
    );
  }
  
  if (norm === 'flagged' || norm === 'unreviewed') {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 animate-pulse pulse-border-flagged ${className}`}>
        ⚠ Flagged
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 ${className}`}>
      {status}
    </span>
  );
};

// Tier badge component
interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '' }) => {
  const t = tier.toLowerCase();
  
  if (t === 'silver') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-gradient-to-r from-slate-400 to-slate-200 text-slate-800 shadow-sm ${className}`}>
        🥈 Silver Tier
      </span>
    );
  }
  if (t === 'gold') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-gradient-to-r from-yellow-500 to-amber-300 text-yellow-950 shadow-sm ${className}`}>
        🥇 Gold Tier
      </span>
    );
  }
  if (t === 'platinum') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-gradient-to-r from-[#2563EB] to-cyan-300 text-white shadow-sm ${className}`}>
        💎 Platinum Tier
      </span>
    );
  }
  
  // bronze default
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm ${className}`}>
      🥉 Bronze Tier
    </span>
  );
};

export default StatusBadge;
