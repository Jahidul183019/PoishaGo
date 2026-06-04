import { create } from 'zustand';
import { useWalletStore } from './useWalletStore';

export interface UserProfile {
  user_id: number;
  full_name: string;
  phone: string;
  email?: string;
  user_type: 'personal' | 'agent';
  is_verified: boolean;
  wallet_number: string;
  balance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  current_points: number;
}

export interface AdminProfile {
  username: string;
  role: 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT' | 'RISK_MANAGER';
}

interface AuthState {
  user: UserProfile | null;
  admin: AdminProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  token: string | null;
  
  // Async API Actions
  loginUser: (phone: string, pin: string) => Promise<boolean>;
  fetchUserProfile: () => Promise<void>;
  
  // Keep some sync for now
  registerUser: (name: string, phone: string, email: string, userType: 'personal' | 'agent', pin?: string) => void;
  verifyUserOTP: (code: string) => boolean;
  loginAdmin: (username: string, r: 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT' | 'RISK_MANAGER') => void;
  logout: () => void;
  logoutUser: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateUserPoints: (newPoints: number) => void;
  updateUserPIN: (oldPin: string, newPin: string) => boolean;
  adminLogin: (username: string, passcode: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  admin: null,
  isLoggedIn: false,
  isAdmin: false,
  token: localStorage.getItem('token') || null,

  loginUser: async (phone, pin) => {
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token });
        await get().fetchUserProfile();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  
  fetchUserProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        set({ user, isLoggedIn: true, isAdmin: false, admin: null });
        
        // Also hydrate wallet store tables
        await useWalletStore.getState().fetchTransactions();
        await useWalletStore.getState().fetchNotifications();
        await useWalletStore.getState().fetchRewardOptions();
        await useWalletStore.getState().fetchRewardsHistory();
      } else {
        get().logoutUser();
      }
    } catch (e) {
      console.error(e);
    }
  },

  registerUser: (name, phone, email, userType, pin) => {
    set({
      user: {
        user_id: 3,
        full_name: name,
        phone: phone,
        email: email,
        user_type: userType,
        is_verified: false,
        wallet_number: 'PG-WAL-' + Math.floor(10000 + Math.random() * 90000),
        balance: 500.00,
        tier: 'bronze',
        current_points: 100
      },
      isLoggedIn: true,
      isAdmin: false
    });
  },

  verifyUserOTP: (code) => {
    set((state) => {
      if (state.user) {
        return {
          user: { ...state.user, is_verified: true },
          isLoggedIn: true
        };
      }
      return {};
    });
    return true;
  },

  loginAdmin: (username, role) => {
    set({
      user: null,
      admin: { username, role },
      isLoggedIn: true,
      isAdmin: true
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, admin: null, isLoggedIn: false, isAdmin: false, token: null });
  },

  logoutUser: () => {
    localStorage.removeItem('token');
    set({ user: null, admin: null, isLoggedIn: false, isAdmin: false, token: null });
  },

  updateUserBalance: (newBalance) => {
    set((state) => {
      if (state.user) {
        return { user: { ...state.user, balance: newBalance } };
      }
      return {};
    });
  },

  updateUserPoints: (newPoints) => {
    set((state) => {
      if (state.user) {
        return { user: { ...state.user, current_points: newPoints } };
      }
      return {};
    });
  },

  updateUserPIN: (oldPin, newPin) => {
    return true;
  },

  adminLogin: async (username, passcode) => {
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode })
      });
      if (response.ok) {
        const data = await response.json();
        set({
          token: data.access_token,
          isAdmin: true,
          isLoggedIn: true,
          admin: { username, role: data.role },
          user: null
        });
        // Also fetch admin details like mock data if needed, but this is enough
        return true;
      }
    } catch (e) {
      console.error('Admin login failed:', e);
    }
    return false;
  },
}));
