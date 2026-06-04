import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, History, ShieldAlert, Award, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import ThemeToggle from '../ui/ThemeToggle';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuthStore();

  const menuItems = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Transactions Ledger', path: '/admin/transactions', icon: History },
    { label: 'Fraud Detection', path: '/admin/fraud', icon: ShieldAlert },
    { label: 'Campaign Manager', path: '/admin/cashbacks', icon: Award },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[280px] bg-[#071428] border-r border-red-500/10 p-6 justify-between z-40">
      <div className="flex flex-col gap-8">
        {/* Brand Header */}
        <div 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          id="admin-brand-header"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-sora font-bold text-white text-xl shadow-lg">
            ★
          </div>
          <div>
            <h1 className="font-sora font-extrabold text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">
              Poisha<span className="text-amber-400">HQ</span>
            </h1>
            <p className="text-[9px] font-mono tracking-wider text-rose-300 uppercase">
              Control Panel
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
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
                    ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
                id={`admin-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 mt-auto border-t border-slate-800 pt-4">
        {/* Active Administrator credentials */}
        {admin && (
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center gap-2.5 mb-1.5">
              <ShieldCheck size={16} className="text-amber-400 shrink-0" />
              <span className="font-sora font-semibold text-xs text-slate-200 truncate">
                {admin.username}
              </span>
            </div>
            {/* Admin Role badge */}
            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/10">
              {admin.role}
            </span>
          </div>
        )}

        {/* Global theme controls & action controls bar */}
        <div className="flex items-center justify-between gap-2 px-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all outline-none"
            id="admin-btn-logout"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
