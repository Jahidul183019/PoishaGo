import { create } from 'zustand';
import { useWalletStore } from './useWalletStore';
import { useToastStore } from '../hooks/useToast';
import api from '../utils/api';


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
  permissions: string[];
}

interface AuthState {
  user: UserProfile | null;
  admin: AdminProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  token: string | null;

  loginUser: (phone: string, pin: string) => Promise<boolean>;
  registerUser: (
    name: string,
    phone: string,
    email: string,
    userType: 'personal' | 'agent',
    pin: string,
    nidNumber: string
  ) => Promise<{ success: boolean; message: string }>;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (fullName: string, email?: string) => Promise<boolean>;

  // FIXED SIGNATURE: Now correctly handles asynchronous network tasks
  verifyUserOTP: (email: string, code: string, purpose?: string) => Promise<{ success: boolean; message: string }>;
  resendUserOTP: (email: string, purpose?: string) => Promise<{ success: boolean; message: string }>;

  loginAdmin: (username: string, r: 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT' | 'RISK_MANAGER') => void;
  logout: () => void;
  logoutUser: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateUserPoints: (newPoints: number) => void;
  updateUserPIN: (oldPin: string, newPin: string) => Promise<boolean>;
  adminLogin: (username: string, passcode: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  admin: null,
  isLoggedIn: false,
  isAdmin: localStorage.getItem('isAdminMode') === 'true',
  token: localStorage.getItem('token') || null,

  loginUser: async (phone, pin) => {
    try {
      const data = await api.post<any>('/api/login', { phone, pin });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('isAdminMode', 'false');
      set({ token: data.access_token, isAdmin: false });
      await get().fetchUserProfile();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  registerUser: async (name, phone, email, userType, pin, nidNumber) => {
    try {
      const data = await api.post<any>('/api/register', {
        full_name: name,
        phone: phone,
        email: email,
        pin: pin,
        user_type: userType,
        nid_number: nidNumber
      });
      return { success: true, message: data.detail || "Account created successfully!" };
    } catch (e: any) {
      console.error("Network Error during registration:", e);
      return { success: false, message: e.message || "Registration failed." };
    }
  },

  fetchUserProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const profile = await api.get<any>('/api/me');

      const storedMode = localStorage.getItem('isAdminMode');
      const activeIsAdmin = profile.is_admin && (storedMode !== null ? storedMode === 'true' : profile.is_admin);

      set({
        user: profile,
        isLoggedIn: true,
        isAdmin: activeIsAdmin,
        admin: profile.is_admin ? {
          username: profile.full_name,
          role: profile.admin_role,
          permissions: profile.permissions || []
        } : null
      });

      await useWalletStore.getState().fetchTransactions();
      await useWalletStore.getState().fetchNotifications();
      await useWalletStore.getState().fetchRewardOptions();
      await useWalletStore.getState().fetchRewardsHistory();
      await useWalletStore.getState().fetchBillCategories();
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('403')) {
        useToastStore.getState().showToast("Access Denied: You do not have the required administrative clearance to view this data.", 'error');
        get().logout();
      } else {
        get().logoutUser();
      }
    }
  },

  updateUserProfile: async (fullName, email) => {
    const { token } = get();
    if (!token) return false;
    try {
      const updated = await api.patch<any>('/api/me', { full_name: fullName, email: email || null });
      set({ user: updated, isLoggedIn: true });
      return true;
    } catch (e) {
      console.error('Failed to update profile:', e);
      return false;
    }
  },

  // FIXED: Hits your live /api/verify-otp backend endpoint over port 8080
  verifyUserOTP: async (email, code, purpose) => {
    try {
      const data = await api.post<any>('/api/verify-otp', { email, otp: code, purpose });

      // If server returned an access token (login-purpose OTP), persist it and hydrate profile
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token });
        await get().fetchUserProfile();
      } else {
        set((state) => {
          if (state.user) {
            return { user: { ...state.user, is_verified: true }, isLoggedIn: true };
          }
          return { isLoggedIn: true };
        });
      }
      return { success: true, message: data.detail || "Verification successful!" };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Invalid validation code." };
    }
  },

  // FIXED: Connects your user interface "Resend" actions directly to the active mail engine
  resendUserOTP: async (email, purpose) => {
    try {
      const body: any = { email };
      if (purpose) body.purpose = purpose;
      const data = await api.post<any>('/api/send-otp', body);
      return { success: true, message: data.detail || "Verification mail dispatched!" };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Failed to issue new code instance." };
    }
  },

  loginAdmin: (username, role) => {
    localStorage.setItem('isAdminMode', 'true');
    set({
      user: null,
      admin: { username, role, permissions: [] },
      isLoggedIn: true,
      isAdmin: true
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdminMode');
    set({ user: null, admin: null, isLoggedIn: false, isAdmin: false, token: null });
  },

  logoutUser: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdminMode');
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

  updateUserPIN: async (oldPin, newPin) => {
    const { token } = get();
    if (!token) return false;

    try {
      await api.post<any>('/api/change-pin', { old_pin: oldPin, new_pin: newPin });
      await get().fetchUserProfile();
      return true;
    } catch (e) {
      console.error('Failed to update PIN:', e);
      return false;
    }
  },

  adminLogin: async (username, passcode) => {
    try {
      const data = await api.post<any>('/api/admin/login', { admin_id: parseInt(username), pin: passcode });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('isAdminMode', 'true');
      set({
        token: data.access_token,
        isAdmin: true,
        isLoggedIn: true,
        admin: {
          username,
          role: data.role,
          permissions: data.permissions || []
        },
        user: null
      });
      return true;
    } catch (e) {
      console.error('Admin login failed:', e);
    }
    return false;
  },
}));
