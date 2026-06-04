import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: localStorage.getItem('theme') !== 'light',
  toggle: () => set((state) => {
    const newDark = !state.isDark;
    const html = document.documentElement;
    if (newDark) {
      html.classList.remove('light');
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');  
      html.classList.add('light');
    }
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    return { isDark: newDark };
  }),
  init: () => {
    const saved = localStorage.getItem('theme') || 'dark';
    const html = document.documentElement;
    if (saved === 'dark') {
      html.classList.remove('light');
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
  }
}));
