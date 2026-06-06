import { create } from 'zustand';
import { useWalletStore } from './useWalletStore';
import { API_BASE_URL } from '../utils/api';


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
  
  // 🚀 FIXED SIGNATURE: Now correctly handles asynchronous network tasks
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
  isAdmin: false,
  token: localStorage.getItem('token') || null,

  loginUser: async (phone, pin) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
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

  registerUser: async (name, phone, email, userType, pin, nidNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          phone: phone,
          email: email,
          pin: pin,
          user_type: userType,
          nid_number: nidNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.detail || "Account created successfully!" };
      } else {
        return { success: false, message: data.detail || "Registration failed." };
      }
    } catch (e) {
      console.error("Network Error during registration:", e);
      return { success: false, message: "Could not connect to the backend server." };
    }
  },
  
  fetchUserProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        set({ user, isLoggedIn: true, isAdmin: false, admin: null });
        
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

  updateUserProfile: async (fullName, email) => {
    const { token } = get();
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName, email: email || null }),
      });
      if (!response.ok) return false;
      const updated = await response.json();
      set({ user: updated, isLoggedIn: true });
      return true;
    } catch (e) {
      console.error('Failed to update profile:', e);
      return false;
    }
  },

  // 🚀 FIXED: Hits your live /api/verify-otp backend endpoint over port 8080
  verifyUserOTP: async (email, code, purpose) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, purpose })
      });

      const data = await response.json();

      if (response.ok) {
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
      } else {
        return { success: false, message: data.detail || "Invalid validation code." };
      }
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network structural communication break." };
    }
  },

  // 🚀 FIXED: Connects your user interface "Resend" actions directly to the active mail engine
  resendUserOTP: async (email, purpose) => {
    try {
      const body: any = { email };
      if (purpose) body.purpose = purpose;
      const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.detail || "Verification mail dispatched!" };
      } else {
        return { success: false, message: data.detail || "Failed to issue new code instance." };
      }
    } catch (e) {
      console.error(e);
      return { success: false, message: "Server connection failure." };
    }
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

  updateUserPIN: async (oldPin, newPin) => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/change-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ old_pin: oldPin, new_pin: newPin }),
      });

      if (!response.ok) {
        return false;
      }

      await get().fetchUserProfile();
      return true;
    } catch (e) {
      console.error('Failed to update PIN:', e);
      return false;
    }
  },

  adminLogin: async (username, passcode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
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
        return true;
      }
    } catch (e) {
      console.error('Admin login failed:', e);
    }
    return false;
  },
}));