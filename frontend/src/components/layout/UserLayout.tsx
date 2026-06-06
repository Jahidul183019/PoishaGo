import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface UserLayoutProps {
  children?: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar for Desktop menu */}
      <Sidebar />
      
      {/* Top Header for Mobile viewports */}
      <TopBar />

      {/* Main page canvas container */}
      <main className="pt-16 pb-24 md:pt-6 md:pb-6 md:pl-[280px] min-h-screen flex flex-col transition-all duration-300">
        <div className="flex-1 px-4 py-6 md:px-8 max-w-7xl mx-auto w-full">
          {children || <Outlet />}
        </div>
      </main>

      {/* Navigation bar for Mobile viewports */}
      <BottomNav />
    </div>
  );
};

export default UserLayout;
