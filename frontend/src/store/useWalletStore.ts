import { create } from 'zustand';
import { API_BASE_URL } from '../utils/api';

export interface WalletTransaction {
  txn_id: number;
  sender_wallet_id: string;
  sender_name: string;
  receiver_wallet_id: string;
  receiver_name: string;
  amount: number;
  txn_type: 'send_money' | 'cash_in' | 'cash_out' | 'bill_pay' | 'cashback';
  status: 'completed' | 'failed' | 'pending';
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

export type CitizenAccount = UserAccount;

export interface FraudFlag {
  flag_id: number;
  txn_id: number;
  user_name: string;
  phone: string;
  rule_triggered: string;
  risk_score: number;
  reviewed: boolean;
  flagged_at: string;
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
  title: string;
  message: string;
  notif_type: 'credit' | 'debit' | 'reward' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface RewardRedeemOption {
  id: number;
  title: string;
  pointsRequired: number;
  valueBDT: number;
  category: 'cashback' | 'voucher' | 'offer';
}

interface WalletState {
  users: UserAccount[];
  mockCitizens: CitizenAccount[];
  transactions: WalletTransaction[];
  adminTransactions: WalletTransaction[];
  fraudFlags: FraudFlag[];
  cashbacks: CashbackCampaign[];
  campaigns: CashbackCampaign[];
  notifications: AppNotification[];
  rewardOptions: RewardRedeemOption[];
  pointsRedeemedHistory: Array<{id: number, points: number, bdt: number, date: string}>;
  
  // Actions
  addTransaction: (txn: Omit<WalletTransaction, 'txn_id' | 'txn_at'>) => WalletTransaction;
  addNotification: (title: string, message: string, type: AppNotification['notif_type']) => void;
  markAllNotificationsRead: () => void;
  reviewFraudFlag: (flagId: number) => void;
  toggleCampaignActive: (id: number) => void;
  addNewCampaign: (campaign: Omit<CashbackCampaign, 'id' | 'created_at'>) => void;

  // Extra Actions
  toggleCitizenStatus: (walletNumber: string) => void;
  adjustCitizenBalance: (walletNumber: string, amount: number, type: 'credit' | 'debit') => boolean;
  toggleCampaignStatus: (id: number) => void;
  createCampaign: (title: string, percentageBack: number, maxLimitBDT: number, validUntil: string) => void;
  deleteCampaign: (id: number) => void;
  toggleFraudFlagStatus: (id: number) => void;
  toggleUserStatus?: (walletNumber: string) => void;

  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotification: (id: number) => void;
  clearAllNotifications: () => void;
  
  // New Network Fetch Actions
  fetchTransactions: () => Promise<void>;
  fetchAdminTransactions: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchRewardOptions: () => Promise<void>;
  fetchBillCategories: () => Promise<void>;
  fetchRewardsHistory: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchFraudFlags: () => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  
  // Admin Config Actions
  addRewardOption: (option: any) => Promise<void>;
  addBillCategory: (category: any) => Promise<void>;
  deleteRewardOption: (id: number) => Promise<void>;
  deleteBillCategory: (id: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  users: [],
  mockCitizens: [],
  transactions: [],
  adminTransactions: [],
  fraudFlags: [],
  cashbacks: [],
  campaigns: [],
  notifications: [],
  rewardOptions: [],
  billCategories: [],
  pointsRedeemedHistory: [],

  addTransaction: (txn) => {
    const nextTxnId = get().transactions.length > 0 ? Math.max(...get().transactions.map(t => t.txn_id)) + 1 : 1;
    const fullTxn: WalletTransaction = {
      ...txn,
      txn_id: nextTxnId,
      txn_at: new Date().toISOString()
    };

    set((state) => ({
      transactions: [fullTxn, ...state.transactions],
      // Adjust standard users' mock balance (simulation helper)
      users: state.users.map(u => {
        if (u.wallet_number === txn.sender_wallet_id) {
          // Send/Cashout/Bill -> deducting
          return { ...u, balance: u.balance - txn.amount - txn.fee };
        }
        if (u.wallet_number === txn.receiver_wallet_id) {
          // Cash In/receive -> receiving
          return { ...u, balance: u.balance + txn.amount };
        }
        return u;
      })
    }));

    // If transaction exceeds ৳40,000, auto flag as high risk fraud indicator matching mock criteria
    if (txn.amount >= 40000) {
      const nextFlagId = get().fraudFlags.length > 0 ? Math.max(...get().fraudFlags.map(f => f.flag_id)) + 1 : 1;
      set((state) => ({
        fraudFlags: [
          {
            flag_id: nextFlagId,
            txn_id: fullTxn.txn_id,
            user_name: txn.sender_name,
            phone: '01711000001', // simulating Ahmed Hassan for demo convenience
            rule_triggered: 'Large Swift Transaction Flag (>= ৳40,000)',
            risk_score: Math.floor(75 + Math.random() * 21),
            reviewed: false,
            flagged_at: new Date().toISOString()
          },
          ...state.fraudFlags
        ]
      }));
    }

    return fullTxn;
  },

  addNotification: (title, message, type) => {
    const nextId = get().notifications.length > 0 ? Math.max(...get().notifications.map(n => n.id)) + 1 : 1;
    set((state) => ({
      notifications: [
        {
          id: nextId,
          title,
          message,
          notif_type: type,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...state.notifications
      ]
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true }))
    }));
  },

  reviewFraudFlag: (flagId) => {
    set((state) => ({
      fraudFlags: state.fraudFlags.map(f => f.flag_id === flagId ? { ...f, reviewed: true } : f)
    }));
  },

  toggleCampaignActive: (id) => {
    set((state) => ({
      cashbacks: state.cashbacks.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)
    }));
  },

  addNewCampaign: (campaign) => {
    const nextId = get().cashbacks.length > 0 ? Math.max(...get().cashbacks.map(c => c.id)) + 1 : 1;
    set((state) => ({
      cashbacks: [
        {
          ...campaign,
          id: nextId,
          created_at: new Date().toISOString().split('T')[0]
        },
        ...state.cashbacks
      ]
    }));
  },



  toggleCitizenStatus: (walletNumber) => {
    set((state) => {
      const nextUsers: UserAccount[] = state.users.map(u => u.wallet_number === walletNumber ? { ...u, status: (u.status === 'blocked' ? 'active' : 'blocked') as 'active' | 'blocked' } : u);
      return {
        users: nextUsers,
        mockCitizens: nextUsers
      };
    });
  },

  adjustCitizenBalance: async (walletNumber, amount, type) => {
    const token = localStorage.getItem('token');
    // Find user_id from walletNumber in current citizens list
    const citizen = get().mockCitizens.find(c => c.wallet_number === walletNumber);
    if (!citizen || !token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${citizen.user_id}/adjust-balance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount, type })
      });
      if (response.ok) {
        await get().fetchUsers(); // Refresh list to get new DB balance
        return true;
      }
    } catch (e) {
      console.error('Failed to adjust balance:', e);
    }
    return false;
  },

  toggleCampaignStatus: (id) => {
    set((state) => {
      const nextCashbacks = state.cashbacks.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c);
      return {
        cashbacks: nextCashbacks,
        campaigns: nextCashbacks
      };
    });
  },

  createCampaign: (title, percentageBack, maxLimitBDT, validUntil) => {
    const nextCampaign: CashbackCampaign = {
      id: get().cashbacks.length > 0 ? Math.max(...get().cashbacks.map(c => c.id)) + 1 : 1,
      name: title,
      type: 'Cashback',
      percent: percentageBack,
      max_limit: maxLimitBDT,
      min_txn_amount: 100,
      is_active: true,
      end_date: validUntil,
      created_at: new Date().toISOString().split('T')[0]
    };
    set((state) => ({
      cashbacks: [nextCampaign, ...state.cashbacks],
      campaigns: [nextCampaign, ...state.campaigns]
    }));
  },

  deleteCampaign: (id) => {
    set((state) => ({
      cashbacks: state.cashbacks.filter(c => c.id !== id),
      campaigns: state.campaigns.filter(c => c.id !== id)
    }));
  },

  toggleFraudFlagStatus: (id) => {
    set((state) => ({
      fraudFlags: state.fraudFlags.map(f => f.flag_id === id ? { ...f, reviewed: !f.reviewed } : f)
    }));
  },

  toggleUserStatus: (walletNumber) => {
    set((state) => {
      const nextUsers: UserAccount[] = state.users.map(u => u.wallet_number === walletNumber ? { ...u, status: (u.status === 'blocked' ? 'active' : 'blocked') as 'active' | 'blocked' } : u);
      return {
        users: nextUsers,
        mockCitizens: nextUsers
      };
    });
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true }))
    }));
  },

  clearNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

    fetchAdminTransactions: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/admin/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        set({ adminTransactions: data });
      }
    } catch (e) {
      console.error('Failed to fetch admin transactions', e);
    }
  },

  fetchTransactions: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        set({ transactions: data });
      }
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    }
  },

  fetchNotifications: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        set({ notifications: data });
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  },

    fetchBillCategories: async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/bill/categories');
      if (response.ok) {
        const data = await response.json();
        set({ billCategories: data });
      }
    } catch (e) {
      console.error('Failed to fetch bill categories', e);
    }
  },

  fetchRewardOptions: async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/rewards/options');
      if (response.ok) {
        const data = await response.json();
        set({ rewardOptions: data });
      }
    } catch (e) {
      console.error('Failed to fetch reward options', e);
    }
  },

  fetchRewardsHistory: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/rewards/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        set({ pointsRedeemedHistory: data });
      }
    } catch (e) {
      console.error('Failed to fetch rewards history', e);
    }
  },

  fetchUsers: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        set({ mockCitizens: data });
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  },

  fetchFraudFlags: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/fraud-flags', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        set({ fraudFlags: data });
      }
    } catch (e) {
      console.error('Failed to fetch fraud flags', e);
    }
  },

  fetchCampaigns: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/campaigns', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        set({ campaigns: data, cashbacks: data }); // Set both for backwards compatibility
      }
    } catch (e) {
      console.error('Failed to fetch campaigns', e);
    }
  },

  addRewardOption: async (option: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/admin/rewards/options', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(option)
      });
      if (response.ok) {
        get().fetchRewardOptions(); // Refresh the list
      }
    } catch (e) {
      console.error('Failed to add reward option', e);
    }
  },

  
  deleteRewardOption: async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rewards/options/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) get().fetchRewardOptions();
    } catch (e) {
      console.error('Failed to delete reward option', e);
    }
  },

  deleteBillCategory: async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bill/categories/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) get().fetchBillCategories();
    } catch (e) {
      console.error('Failed to delete bill category', e);
    }
  },

  addBillCategory: async (category: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(API_BASE_URL + '/api/admin/bill/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` },
        body: JSON.stringify(category)
      });
      if (response.ok) {
        // Typically we would fetch bill categories here, but we don't have a fetch action for it yet in the store.
        // For now, it will apply on reload or we can add fetchBillCategories later if needed.
        get().fetchBillCategories(); // Refresh the list
      }
    } catch (e) {
      console.error('Failed to add bill category', e);
    }
  }

}));
