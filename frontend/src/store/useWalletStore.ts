// frontend/src/store/useWalletStore.ts
import { create } from 'zustand';
import api from '../utils/api';
import { useToastStore } from '../hooks/useToast';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface WalletTransaction {
  txn_id: number;
  sender_wallet_id: string;
  sender_name: string;
  receiver_wallet_id: string;
  receiver_name: string;
  amount: number;
  txn_type: 'transfer' | 'cashin' | 'cashout' | 'bill';
  status: 'success' | 'failed' | 'pending' | 'flagged';
  fee: number;
  reference_no: string;
  txn_at: string;
  company_name?: string;
}

export interface UserAccount {
  user_id: number;
  full_name: string;
  phone: string;
  email: string;
  user_type: 'personal' | 'agent';
  is_verified: boolean;
  wallet_number: string;
  balance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  current_points: number;
  status: 'active' | 'blocked';
}

export interface FraudFlag {
  flag_id: number;
  txn_id: number;
  flagged_user: string;
  phone: string;
  reference_no: string;
  amount: number;
  txn_type: string;
  rule_triggered: string;
  risk_score: number;
  flagged_at: string;
  reviewed_by_name: string | null;
}

export interface CashbackCampaign {
  id: number;
  name: string;
  type: string;
  percent: number;
  max_limit: number;
  min_txn_amount: number;
  is_active: boolean;
  end_date: string;
  created_at: string;
}

export interface AppNotification {
  id: number;
  message: string;
  notif_type: 'sms' | 'email' | 'in_app';
  is_read: boolean;
  created_at: string;
}

export interface RewardRedeemOption {
  id: number;
  title: string;
  points_required: number;
  value_bdt: number;
  category: 'cashback' | 'voucher' | 'offer';
}

// ── State interface ───────────────────────────────────────────────────────────

interface WalletState {
  // ── Real API data (no more mock) ──
  users: UserAccount[];
  transactions: WalletTransaction[];
  adminTransactions: WalletTransaction[];
  fraudFlags: FraudFlag[];
  campaigns: CashbackCampaign[];
  notifications: AppNotification[];
  rewardOptions: RewardRedeemOption[];
  billCategories: any[];
  pointsRedeemedHistory: Array<{
    id: number;
    points: number;
    bdt: number;
    date: string;
  }>;

  // ── Loading states ──
  isLoadingTransactions: boolean;
  isLoadingUsers: boolean;
  isLoadingFraud: boolean;
  isLoadingCampaigns: boolean;
  isLoadingNotifications: boolean;

  // ── Error states ──
  transactionError: string | null;
  usersError: string | null;
  fraudError: string | null;

  // ── Notification actions ──
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: number) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // ── Fetch actions ──
  fetchTransactions: () => Promise<void>;
  fetchAdminTransactions: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchRewardOptions: () => Promise<void>;
  fetchBillCategories: () => Promise<void>;
  fetchRewardsHistory: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchFraudFlags: () => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  convertPointsToCash: (points: number) => Promise<void>;

  // ── Admin actions ──
  toggleCitizenStatus: (userId: number, currentStatus: string) => Promise<void>;
  toggleCampaignStatus: (id: number) => Promise<void>;
  createCampaign: (payload: Omit<CashbackCampaign, 'id' | 'created_at'>) => Promise<void>;
  deleteCampaign: (id: number) => Promise<void>;
  resolveFraudFlag: (id: number) => Promise<void>;
  addRewardOption: (option: Omit<RewardRedeemOption, 'id'>) => Promise<void>;
  deleteRewardOption: (id: number) => Promise<void>;
  addBillCategory: (category: any) => Promise<void>;
  broadcastNotification: (message: string) => Promise<void>;
  deleteBillCategory: (id: string) => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useWalletStore = create<WalletState>((set, get) => ({

  // ── Initial state ─────────────────────────────────────────────────────────
  users: [],
  transactions: [],
  adminTransactions: [],
  fraudFlags: [],
  campaigns: [],
  notifications: [],
  rewardOptions: [],
  billCategories: [],
  pointsRedeemedHistory: [],

  isLoadingTransactions: false,
  isLoadingUsers: false,
  isLoadingFraud: false,
  isLoadingCampaigns: false,
  isLoadingNotifications: false,

  transactionError: null,
  usersError: null,
  fraudError: null,

  // ── Notification actions ──────────────────────────────────────────────────
  markAsRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
    try {
      await api.put(`/api/notifications/${id}/read`, {});
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Fallback
      await get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    }));
    try {
      await api.put('/api/notifications/read-all', {});
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      await get().fetchNotifications();
    }
  },

  clearNotification: async (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.error('Failed to clear notification:', err);
      await get().fetchNotifications();
    }
  },

  clearAllNotifications: async () => {
    set({ notifications: [] });
    try {
      await api.delete('/api/notifications');
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      await get().fetchNotifications();
    }
  },

  // ── Fetch: User transactions ──────────────────────────────────────────────
  fetchTransactions: async () => {
    set({ isLoadingTransactions: true, transactionError: null });
    try {
      const data = await api.get<WalletTransaction[]>('/api/transactions');
      set({ transactions: data });
    } catch (err: any) {
      set({ transactionError: err.message || 'Failed to load transactions' });
    } finally {
      set({ isLoadingTransactions: false });
    }
  },

  // ── Fetch: Admin transactions ─────────────────────────────────────────────
  fetchAdminTransactions: async () => {
    set({ isLoadingTransactions: true, transactionError: null });
    try {
      const data = await api.get<WalletTransaction[]>('/api/admin/transactions');
      set({ adminTransactions: data });
    } catch (err: any) {
      set({ transactionError: err.message || 'Failed to load admin transactions' });
    } finally {
      set({ isLoadingTransactions: false });
    }
  },

  // ── Fetch: Notifications ──────────────────────────────────────────────────
  fetchNotifications: async () => {
    set({ isLoadingNotifications: true });
    try {
      const data = await api.get<AppNotification[]>('/api/notifications');
      set({ notifications: data });
    } catch {
      // Notifications failing silently is acceptable
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  // ── Fetch: Reward options ─────────────────────────────────────────────────
  fetchRewardOptions: async () => {
    try {
      const data = await api.get<RewardRedeemOption[]>('/api/rewards/options');
      set({ rewardOptions: data });
    } catch (err: any) {
      console.error('Failed to fetch reward options:', err.message);
    }
  },

  // ── Fetch: Bill categories ────────────────────────────────────────────────
  fetchBillCategories: async () => {
    try {
      const data = await api.get<any[]>('/api/bill/categories');
      set({ billCategories: data });
    } catch (err: any) {
      console.error('Failed to fetch bill categories:', err.message);
    }
  },

  // ── Fetch: Rewards history ────────────────────────────────────────────────
  fetchRewardsHistory: async () => {
    try {
      const data = await api.get<any[]>('/api/rewards/history');
      set({ pointsRedeemedHistory: data });
    } catch (err: any) {
      console.error('Failed to fetch rewards history:', err.message);
    }
  },

  // ── Fetch: All users (admin) ──────────────────────────────────────────────
  fetchUsers: async () => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const data = await api.get<UserAccount[]>('/api/users');
      set({ users: data });
    } catch (err: any) {
      set({ usersError: err.message || 'Failed to load users' });
    } finally {
      set({ isLoadingUsers: false });
    }
  },

  // ── Fetch: Fraud flags ────────────────────────────────────────────────────
  fetchFraudFlags: async () => {
    set({ isLoadingFraud: true, fraudError: null });
    try {
      const data = await api.get<FraudFlag[]>('/api/fraud-flags');
      set({ fraudFlags: data });
    } catch (err: any) {
      set({ fraudError: err.message || 'Failed to load fraud flags' });
    } finally {
      set({ isLoadingFraud: false });
    }
  },

  // ── Fetch: Campaigns ──────────────────────────────────────────────────────
  fetchCampaigns: async () => {
    set({ isLoadingCampaigns: true });
    try {
      const data = await api.get<CashbackCampaign[]>('/api/campaigns');
      set({ campaigns: data });
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err.message);
    } finally {
      set({ isLoadingCampaigns: false });
    }
  },

  // ── Admin: Toggle user status ─────────────────────────────────────────────
  toggleCitizenStatus: async (userId, currentStatus) => {
    try {
      await api.post(`/api/users/${userId}/toggle-status`, {});
      // Optimistic update
      set((state) => ({
        users: state.users.map((u) =>
          u.user_id === userId
            ? { ...u, status: currentStatus === 'active' ? 'blocked' : 'active' }
            : u
        ),
      }));
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to toggle user status', 'error');
    }
  },

  // ── Admin: Toggle campaign status ─────────────────────────────────────────
  toggleCampaignStatus: async (id) => {
    // Optimistic update
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, is_active: !c.is_active } : c
      ),
    }));
    try {
      await api.post(`/api/campaigns/${id}/toggle`, {});
      await get().fetchCampaigns();
    } catch (err: any) {
      // Revert optimistic update on failure
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === id ? { ...c, is_active: !c.is_active } : c
        ),
      }));
      useToastStore.getState().showToast(err.message || 'Failed to toggle campaign', 'error');
    }
  },

  // ── Admin: Create campaign ────────────────────────────────────────────────
  createCampaign: async (payload) => {
    try {
      await api.post('/api/campaigns', payload);
      await get().fetchCampaigns();
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to create campaign', 'error');
    }
  },

  // ── Admin: Delete campaign ────────────────────────────────────────────────
  deleteCampaign: async (id) => {
    try {
      await api.delete(`/api/campaigns/${id}`);
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
      }));
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to delete campaign', 'error');
    }
  },

  // ── Admin: Resolve fraud flag ─────────────────────────────────────────────
  resolveFraudFlag: async (id) => {
    try {
      await api.post(`/api/fraud-flags/${id}/resolve`, {});
      await get().fetchFraudFlags();
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to resolve fraud flag', 'error');
    }
  },

  // ── Admin: Reward options ─────────────────────────────────────────────────
  addRewardOption: async (option) => {
    try {
      await api.post('/api/admin/rewards/options', option);
      await get().fetchRewardOptions();
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to add reward option', 'error');
    }
  },

  deleteRewardOption: async (id) => {
    try {
      await api.delete(`/api/admin/rewards/options/${id}`);
      set((state) => ({
        rewardOptions: state.rewardOptions.filter((r) => r.id !== id),
      }));
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to delete reward option', 'error');
    }
  },

  // ── Admin: Bill categories ────────────────────────────────────────────────
  addBillCategory: async (category) => {
    try {
      await api.post('/api/admin/bill/categories', category);
      await get().fetchBillCategories();
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to add bill category', 'error');
    }
  },

  deleteBillCategory: async (id) => {
    try {
      await api.delete(`/api/admin/bill/categories/${id}`);
      set((state) => ({
        billCategories: state.billCategories.filter((b) => b.id !== id),
      }));
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to delete bill category', 'error');
    }
  },

  broadcastNotification: async (message) => {
    try {
      await api.post('/api/broadcast-notification', { message });
      useToastStore.getState().showToast('Broadcast sent successfully', 'success');
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Failed to send broadcast', 'error');
    }
  },

  convertPointsToCash: async (points) => {
    try {
      await api.post('/api/rewards/convert', { points });
      useToastStore.getState().showToast('Points converted successfully!', 'success');
    } catch (err: any) {
      useToastStore.getState().showToast(err.message || 'Conversion failed', 'error');
    }
  },
}));
