import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Send, Clock, Award, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Send', path: '/send', icon: Send },
    { label: 'History', path: '/history', icon: Clock },
    { label: 'Rewards', path: '/rewards', icon: Award },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[var(--bg-card)] border-t border-[var(--border)] flex items-center justify-around px-4 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 relative w-12 h-12 outline-none`}
            id={`nav-tab-${item.label.toLowerCase()}`}
          >
            {/* Pulsing indicator under active item */}
            {isActive && (
              <span className="absolute -top-1.5 w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
            )}
            
            <Icon 
              size={20} 
              className={`transition-all duration-300 ${
                isActive 
                  ? 'text-[#00C9A7] scale-110 drop-shadow-[0_0_10px_rgba(0,201,167,0.4)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            />
            <span 
              className={`text-[10px] font-sora transition-all duration-300 ${
                isActive ? 'text-[#00C9A7] font-semibold' : 'text-[var(--text-secondary)]'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
