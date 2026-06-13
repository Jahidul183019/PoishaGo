import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ShieldAlert, MoreVertical, X, Home, Send, Wallet, Activity, Trophy, User, LogOut, Receipt, HelpCircle, Menu } from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';
import { useAuthStore } from '../../store/useAuthStore';
import ThemeToggle from '../ui/ThemeToggle';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications } = useWalletStore();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const isAdminPath = location.pathname.startsWith('/admin');

  const menuItems = [
    { label: 'Home Dashboard', path: '/home', icon: Home },
    { label: 'Send Money', path: '/send', icon: Send },
    { label: 'Cash In', path: '/cashin', icon: Wallet },
    { label: 'Cash Out', path: '/cashout', icon: LogOut },
    { label: 'Bill Payments', path: '/bills', icon: Receipt },
    { label: 'Transaction History', path: '/history', icon: Activity },
    { label: 'Rewards Portal', path: '/rewards', icon: Trophy },
    { label: 'Help Center', path: '/help-center', icon: HelpCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
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
          <>
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
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <Menu size={24} />
            </button>
          </>
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

      {/* Mobile Drawer Slide-out menu (User only) */}
      {!isAdminPath && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Menu Panel */}
          <div className="relative w-[280px] bg-[var(--bg-secondary)] h-full p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 ml-auto overflow-y-auto">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <span className="font-sora font-bold text-base tracking-tight text-[var(--text-primary)]">
                  Poisha<span className="text-[#00C9A7]">Go</span>
                </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 outline-none ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/10 to-teal-500/10 text-[#00C9A7] border-l-2 border-[#00C9A7]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-[#00C9A7]' : 'text-[var(--text-secondary)]'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4 mt-8">
              {user && (
                <div className="flex items-center gap-3 px-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center font-sora font-semibold text-white text-sm shrink-0">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h2 className="font-semibold text-xs text-[var(--text-primary)] truncate font-sora">
                      {user.full_name}
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate font-mono">
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all outline-none"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
