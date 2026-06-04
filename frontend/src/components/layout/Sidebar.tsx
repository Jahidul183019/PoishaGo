import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Send, Wallet, Activity, Trophy, Bell, User, LogOut, Receipt } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import ThemeToggle from '../ui/ThemeToggle';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { label: 'Home Dashboard', path: '/home', icon: Home },
    { label: 'Send Money', path: '/send', icon: Send },
    { label: 'Cash In', path: '/cashin', icon: Wallet },
    { label: 'Cash Out', path: '/cashout', icon: LogOut },
    { label: 'Bill Payments', path: '/bills', icon: Receipt },
    { label: 'Transaction History', path: '/history', icon: Activity },
    { label: 'Rewards Portal', path: '/rewards', icon: Trophy },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'My profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[280px] bg-[var(--bg-secondary)] border-r border-[var(--border)] p-6 justify-between z-40">
      <div className="flex flex-col gap-8">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="desktop-brand-header"
        >
          <img src="/logo.png" alt="PoishaGo Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-500/10" />
          <div>
            <h1 className="font-sora font-extrabold text-xl tracking-tight text-[var(--text-primary)] transition-all duration-300">
              Poisha<span className="text-[#00C9A7]">Go</span>
            </h1>
            <p className="text-[9px] font-mono tracking-wider text-[var(--text-secondary)] uppercase">
              Bangladesh Wallet
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-teal-500/10 text-[#00C9A7] border-l-2 border-[#00C9A7]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
                id={`sidebar-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon size={18} className={isActive ? 'text-[#00C9A7]' : 'text-[var(--text-secondary)]'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 mt-auto border-t border-[var(--border)] pt-4">
        {/* User profile compact card */}
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center font-sora font-semibold text-white text-sm shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-xs text-[var(--text-primary)] truncate font-sora">
                {user.full_name}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] truncate font-mono">
                {user.phone}
              </p>
            </div>
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-2 px-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all outline-none"
            id="sidebar-btn-logout"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
