import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ShieldAlert } from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';
import ThemeToggle from '../ui/ThemeToggle';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications } = useWalletStore();

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between px-6 z-50">
      {/* Brand logo details or back navigation */}
      <div 
        onClick={() => navigate(isAdminPath ? '/admin/dashboard' : '/home')}
        className="flex items-center gap-2.5 cursor-pointer"
        id="mobile-brand-container"
      >
        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
        <span className="font-sora font-bold text-base tracking-tight text-[var(--text-primary)]">
          {isAdminPath ? (
            <>Poisha<span className="text-amber-400">HQ</span></>
          ) : (
            <>Poisha<span className="text-[#00C9A7]">Go</span></>
          )}
        </span>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        {/* Redirection to notifications portal (or alerts on Admin path) */}
        {!isAdminPath ? (
          <button
            onClick={() => navigate('/notifications')}
            className="p-2.5 rounded-full hover:bg-[var(--bg-card)] text-[var(--text-secondary)] relative"
            id="mobile-alert-bell"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate('/admin/fraud')}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 relative"
            id="mobile-admin-alert"
          >
            <ShieldAlert size={18} className="text-amber-400" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
