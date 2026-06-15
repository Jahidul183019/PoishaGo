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
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Top Header for Mobile */}
      <TopBar />

      {/*
        FIX: pb-[calc(6rem+env(safe-area-inset-bottom))]
          - 6rem (96px) covers the 72px BottomNav + extra breathing room
          - env(safe-area-inset-bottom) adds iPhone home bar space
          - This ensures the last element on any page is never hidden behind the nav bar
      */}
      <main
        className="pt-16 md:pt-6 md:pb-6 md:pl-[280px] min-h-screen flex flex-col transition-all duration-300"
        style={{
          paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex-1 px-4 py-6 md:px-8 max-w-7xl mx-auto w-full">
          {children || <Outlet />}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
};

export default UserLayout;
