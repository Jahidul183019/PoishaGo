import { create } from 'zustand';

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
  loginUser: (phone: string, pin: string) => boolean;
  registerUser: (name: string, phone: string, email: string, userType: 'personal' | 'agent') => void;
  verifyUserOTP: (code: string) => boolean;
  loginAdmin: (username: string, r: 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT' | 'RISK_MANAGER') => void;
  logout: () => void;
  logoutUser: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateUserPoints: (newPoints: number) => void;
  updateUserPIN: (oldPin: string, newPin: string) => boolean;
  adminLogin: (username: string, passcode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Default logged in user for immediate experience: Ahmed Hassan as requested
  user: {
    user_id: 1,
    full_name: 'Ahmed Hassan',
    phone: '01711000001',
    email: 'ahmed@email.com',
    user_type: 'personal',
    is_verified: true,
    wallet_number: 'PG-WAL-00001',
    balance: 100000.00,
    tier: 'gold',
    current_points: 2450
  },
  admin: null,
  isLoggedIn: true,
  isAdmin: false,

  loginUser: (phone, pin) => {
    // Basic verification logic matching mock
    if (phone && pin === '123456') {
      set({
        user: {
          user_id: 1,
          full_name: phone === '01711000001' ? 'Ahmed Hassan' : 'New User',
          phone: phone,
          email: 'user@poishago.com',
          user_type: 'personal',
          is_verified: true,
          wallet_number: 'PG-WAL-00001',
          balance: 100000.00,
          tier: 'gold',
          current_points: 2450
        },
        isLoggedIn: true,
        isAdmin: false,
        admin: null
      });
      return true;
    }
    // Fail safe, also allow custom pin logins
    if (phone) {
      set({
        user: {
          user_id: 2,
          full_name: 'Demo Bangladeshi User',
          phone: phone,
          email: 'demo@poishago.com',
          user_type: 'personal',
          is_verified: true,
          wallet_number: 'PG-WAL-00002',
          balance: 32000.50,
          tier: 'bronze',
          current_points: 450
        },
        isLoggedIn: true,
        isAdmin: false,
        admin: null
      });
      return true;
    }
    return false;
  },

  registerUser: (name, phone, email, userType) => {
    set({
      user: {
        user_id: 3,
        full_name: name,
        phone: phone,
        email: email,
        user_type: userType,
        is_verified: false,
        wallet_number: 'PG-WAL-' + Math.floor(10000 + Math.random() * 90000),
        balance: 500.00, // starting balance
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
      isLoggedIn: false,
      isAdmin: true
    });
  },

  logout: () => {
    set({ user: null, admin: null, isLoggedIn: false, isAdmin: false });
  },

  logoutUser: () => {
    set({ user: null, admin: null, isLoggedIn: false, isAdmin: false });
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
    // Basic verification/update simulation
    return true;
  },

  adminLogin: (username, passcode) => {
    if (username === 'admin' && passcode === 'admin123') {
      set({
        user: null,
        admin: { username, role: 'SUPER_ADMIN' },
        isLoggedIn: false,
        isAdmin: true
      });
      return true;
    }
    return false;
  }
}));
