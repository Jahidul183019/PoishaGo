import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  init: () => void;
}

/**
 * Determines the default theme when no user preference is saved.
 * Priority:
 *   1. OS/browser prefers-color-scheme
 *   2. Time of day fallback (6 AM – 7 PM = light, otherwise dark)
 */
function getSystemDefault(): boolean {
  // Respect OS/browser dark mode setting if available
  if (window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  // Fallback: time-based (light 6am–7pm, dark otherwise)
  const hour = new Date().getHours();
  return hour < 6 || hour >= 19;
}

function applyTheme(isDark: boolean) {
  const html = document.documentElement;
  if (isDark) {
    html.classList.remove('light');
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true, // temporary default, overridden by init()

  toggle: () => set((state) => {
    const newDark = !state.isDark;
    applyTheme(newDark);
    // Save user's explicit choice
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    return { isDark: newDark };
  }),

  init: () => {
    const saved = localStorage.getItem('theme');
    // If user has explicitly chosen a theme, respect it
    // Otherwise use system/time default
    const isDark = saved ? saved === 'dark' : getSystemDefault();
    applyTheme(isDark);
    set({ isDark });

    // Also listen for OS theme changes (when no user preference saved)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          applyTheme(e.matches);
          set({ isDark: e.matches });
        }
      });
    }
  },
}));
