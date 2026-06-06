import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Lock, LayoutDashboard, Users, History, ShieldAlert, Award, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenuItems = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Transactions History', path: '/admin/transactions', icon: History },
    { label: 'Fraud Alerts', path: '/admin/fraud', icon: ShieldAlert },
    { label: 'Rewards & Cashbacks', path: '/admin/occasions', icon: Award },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex">
      {/* Sidebar - Desktop */}
      <AdminSidebar />

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="PoishaHQ Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="font-sora font-bold text-base tracking-tight text-[var(--text-primary)]">
            Poisha<span className="text-amber-400">HQ</span>
          </span>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Slide-out menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Menu Panel */}
          <div className="relative w-[280px] bg-[var(--bg-secondary)] h-full p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="PoishaHQ Logo" className="w-8 h-8 object-contain rounded-lg" />
                  <span className="font-sora font-bold text-[var(--text-primary)]">PoishaHQ</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                    >
                      <Icon size={18} className="text-amber-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
              {admin && (
                <div className="p-3 bg-[var(--bg-card)] rounded-lg">
                  <p className="font-bold text-xs text-[var(--text-primary)] pb-1">{admin.username}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider bg-rose-500/10 text-rose-400">
                    {admin.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10"
              >
                <Lock size={16} />
                <span>Log Out HQ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen pt-16 md:pt-0 md:pl-[280px] flex flex-col transition-all duration-300">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
