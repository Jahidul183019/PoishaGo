import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className="p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-cyan-400/30 transition-all duration-200 shadow-sm outline-none"
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Sun size={18} className="text-[#00C9A7]" />
      ) : (
        <Moon size={18} className="text-[#2563EB]" />
      )}
    </button>
  );
};

export default ThemeToggle;
