import { create } from 'zustand';

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
  redeemPoints: (points: number, bdt: number) => boolean;

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
}

export const useWalletStore = create<WalletState>((set, get) => ({
  users: [
    { user_id: 1, full_name: 'Ahmed Hassan', phone: '01711000001', email: 'ahmed@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00001', balance: 100000.00, tier: 'gold', current_points: 2450, status: 'active' },
    { user_id: 2, full_name: 'Fatema Begum', phone: '01711000002', email: 'fatema@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00002', balance: 42000.50, tier: 'silver', current_points: 2800, status: 'active' },
    { user_id: 3, full_name: 'Rafiq Ahmed', phone: '01711000003', email: 'rafiq@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00003', balance: 85000.00, tier: 'bronze', current_points: 850, status: 'active' },
    { user_id: 4, full_name: 'Kamrul Islam', phone: '01711000004', email: 'kamrul@email.com', user_type: 'personal', is_verified: false, wallet_number: 'PG-WAL-00004', balance: 15300.20, tier: 'bronze', current_points: 120, status: 'active' },
    { user_id: 5, full_name: 'Nusrat Jahan', phone: '01811000005', email: 'nusrat@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00005', balance: 67300.00, tier: 'platinum', current_points: 5400, status: 'active' },
    { user_id: 6, full_name: 'Siddikur Rahman', phone: '01911000006', email: 'siddikur@email.com', user_type: 'agent', is_verified: true, wallet_number: 'PG-WAL-00006', balance: 250000.00, tier: 'gold', current_points: 1900, status: 'active' },
    { user_id: 7, full_name: 'Mizanur Agent', phone: '01911000007', email: 'mizan@email.com', user_type: 'agent', is_verified: true, wallet_number: 'PG-WAL-00007', balance: 180000.00, tier: 'silver', current_points: 800, status: 'active' }
  ],
  mockCitizens: [
    { user_id: 1, full_name: 'Ahmed Hassan', phone: '01711000001', email: 'ahmed@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00001', balance: 100000.00, tier: 'gold', current_points: 2450, status: 'active' },
    { user_id: 2, full_name: 'Fatema Begum', phone: '01711000002', email: 'fatema@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00002', balance: 42000.50, tier: 'silver', current_points: 2800, status: 'active' },
    { user_id: 3, full_name: 'Rafiq Ahmed', phone: '01711000003', email: 'rafiq@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00003', balance: 85000.00, tier: 'bronze', current_points: 850, status: 'active' },
    { user_id: 4, full_name: 'Kamrul Islam', phone: '01711000004', email: 'kamrul@email.com', user_type: 'personal', is_verified: false, wallet_number: 'PG-WAL-00004', balance: 15300.20, tier: 'bronze', current_points: 120, status: 'active' },
    { user_id: 5, full_name: 'Nusrat Jahan', phone: '01811000005', email: 'nusrat@email.com', user_type: 'personal', is_verified: true, wallet_number: 'PG-WAL-00005', balance: 67300.00, tier: 'platinum', current_points: 5400, status: 'active' },
    { user_id: 6, full_name: 'Siddikur Rahman', phone: '01911000006', email: 'siddikur@email.com', user_type: 'agent', is_verified: true, wallet_number: 'PG-WAL-00006', balance: 250000.00, tier: 'gold', current_points: 1900, status: 'active' },
    { user_id: 7, full_name: 'Mizanur Agent', phone: '01911000007', email: 'mizan@email.com', user_type: 'agent', is_verified: true, wallet_number: 'PG-WAL-00007', balance: 180000.00, tier: 'silver', current_points: 800, status: 'active' }
  ],
  transactions: [
    { txn_id: 43, sender_wallet_id: 'PG-WAL-00004', sender_name: 'Kamrul Islam', receiver_wallet_id: 'PG-WAL-00001', receiver_name: 'Ahmed Hassan', amount: 48000.00, txn_type: 'send_money', status: 'completed', fee: 0, reference_no: 'TXN85938104', txn_at: '2026-06-03T14:32:00Z' },
    { txn_id: 42, sender_wallet_id: 'PG-WAL-00005', sender_name: 'Nusrat Jahan', receiver_wallet_id: 'PG-WAL-00002', receiver_name: 'Fatema Begum', amount: 12000.00, txn_type: 'send_money', status: 'completed', fee: 0, reference_no: 'TXN85938102', txn_at: '2026-06-03T09:12:00Z' },
    { txn_id: 41, sender_wallet_id: 'PG-WAL-00006', sender_name: 'Siddikur Rahman', receiver_wallet_id: 'PG-WAL-00001', receiver_name: 'Ahmed Hassan', amount: 50000.00, txn_type: 'cash_in', status: 'completed', fee: 0, reference_no: 'TXN85938099', txn_at: '2026-06-02T16:45:00Z' },
    { txn_id: 40, sender_wallet_id: 'PG-WAL-00001', sender_name: 'Ahmed Hassan', receiver_wallet_id: 'PG-WAL-00007', receiver_name: 'Mizanur Agent', amount: 20000.00, txn_type: 'cash_out', status: 'completed', fee: 300, reference_no: 'TXN85938088', txn_at: '2026-06-02T11:22:00Z' },
    { txn_id: 39, sender_wallet_id: 'PG-WAL-00001', sender_name: 'Ahmed Hassan', receiver_wallet_id: 'PG-WAL-BILL', receiver_name: 'DESCO (Electricity)', amount: 3500.00, txn_type: 'bill_pay', status: 'completed', fee: 0, reference_no: 'TXN85938077', txn_at: '2026-06-01T19:10:00Z', company_name: 'DESCO Bill Pay' },
    { txn_id: 38, sender_wallet_id: 'PG-WAL-00002', sender_name: 'Fatema Begum', receiver_wallet_id: 'PG-WAL-BILL', receiver_name: 'WASA (Water)', amount: 1500.00, txn_type: 'bill_pay', status: 'completed', fee: 0, reference_no: 'TXN85938066', txn_at: '2026-06-01T15:05:00Z', company_name: 'WASA water' },
    { txn_id: 37, sender_wallet_id: 'PG-WAL-00003', sender_name: 'Rafiq Ahmed', receiver_wallet_id: 'PG-WAL-00001', receiver_name: 'Ahmed Hassan', amount: 15000.00, txn_type: 'send_money', status: 'completed', fee: 0, reference_no: 'TXN85938055', txn_at: '2026-05-30T10:45:00Z' }
  ],
  fraudFlags: [
    { flag_id: 1, txn_id: 43, user_name: 'Kamrul Islam', phone: '01711000004', rule_triggered: 'Large Transaction Amount (> ৳40,000)', risk_score: 85, reviewed: false, flagged_at: '2026-06-03T14:32:00Z' },
    { flag_id: 2, txn_id: 41, user_name: 'Siddikur Rahman', phone: '01911000006', rule_triggered: 'Rapid Multi-source Deposit', risk_score: 92, reviewed: false, flagged_at: '2026-06-02T16:45:00Z' },
    { flag_id: 3, txn_id: 40, user_name: 'Ahmed Hassan', phone: '01711000001', rule_triggered: 'Night Cash Out Profile', risk_score: 42, reviewed: true, flagged_at: '2026-06-02T11:22:00Z' }
  ],
  cashbacks: [
    { id: 1, name: 'Eid-ul-Adha Cashback Double', type: 'Send Money', percent: 1.5, max_limit: 500, min_txn_amount: 1000, is_active: true, end_date: '2026-06-25', created_at: '2026-06-01' },
    { id: 2, name: 'Monsoon Utility Relief Promo', type: 'Bill Pay', percent: 5.0, max_limit: 200, min_txn_amount: 1500, is_active: true, end_date: '2026-06-15', created_at: '2026-06-02' },
    { id: 3, name: 'Pohela Boishakh Centenary Gift', type: 'Cash In', percent: 2.0, max_limit: 1000, min_txn_amount: 5000, is_active: false, end_date: '2026-04-14', created_at: '2026-04-01' },
    { id: 4, name: 'Agent Network Cashout Booster', type: 'Cash Out', percent: 0.5, max_limit: 300, min_txn_amount: 8000, is_active: false, end_date: '2026-03-31', created_at: '2026-03-10' }
  ],
  campaigns: [
    { id: 1, name: 'Eid-ul-Adha Cashback Double', type: 'Send Money', percent: 1.5, max_limit: 500, min_txn_amount: 1000, is_active: true, end_date: '2026-06-25', created_at: '2026-06-01' },
    { id: 2, name: 'Monsoon Utility Relief Promo', type: 'Bill Pay', percent: 5.0, max_limit: 200, min_txn_amount: 1500, is_active: true, end_date: '2026-06-15', created_at: '2026-06-02' },
    { id: 3, name: 'Pohela Boishakh Centenary Gift', type: 'Cash In', percent: 2.0, max_limit: 1000, min_txn_amount: 5000, is_active: false, end_date: '2026-04-14', created_at: '2026-04-01' },
    { id: 4, name: 'Agent Network Cashout Booster', type: 'Cash Out', percent: 0.5, max_limit: 300, min_txn_amount: 8000, is_active: false, end_date: '2026-03-31', created_at: '2026-03-10' }
  ],
  notifications: [
    { id: 1, title: '⭐ Level Up: Gold Tier achieved!', message: 'Congratulations Ahmed! Your activity has unlocked Gold Tier. Enjoy lower transaction fees on utilities.', notif_type: 'reward', is_read: false, created_at: '2026-06-03T10:00:00Z' },
    { id: 2, title: 'Received ৳48,000.00', message: 'You have received ৳48,000.00 from Kamrul Islam (01711000004). Ref: TXN85938104', notif_type: 'credit', is_read: false, created_at: '2026-06-03T14:32:00Z' },
    { id: 3, title: 'Utility Bill Successful', message: 'Bill of ৳3,500.00 paid to DESCO. Ref: TXN85938077. Thank you for using PoishaGo.', notif_type: 'debit', is_read: true, created_at: '2026-06-01T19:10:00Z' },
    { id: 4, title: 'System Security Alert', message: 'Your login credentials were verified from a new browser session. If this wasn\'t you, update your PIN immediately.', notif_type: 'system', is_read: true, created_at: '2026-05-28T08:15:00Z' }
  ],
  rewardOptions: [
    { id: 1, title: '৳100 Direct Wallet Cashback', pointsRequired: 1000, valueBDT: 100, category: 'cashback' },
    { id: 2, title: '৳500 Mega Wallet Cashback', pointsRequired: 4500, valueBDT: 500, category: 'cashback' },
    { id: 3, title: '৳1000 Super Premium Cashback', pointsRequired: 8500, valueBDT: 1000, category: 'cashback' },
    { id: 4, title: 'Daraz Gift Voucher ৳200', pointsRequired: 1800, valueBDT: 200, category: 'voucher' },
    { id: 5, title: 'Chaldal Grocery Voucher ৳300', pointsRequired: 2700, valueBDT: 300, category: 'voucher' }
  ],
  pointsRedeemedHistory: [
    { id: 1, points: 1000, bdt: 100, date: '2026-05-20' },
    { id: 2, points: 1800, bdt: 180, date: '2026-05-10' }
  ],

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

  redeemPoints: (pointsToRedeem, bdtValue) => {
    // Deduct from current user points, add BDT to balance
    // This is modeled on Ahmed Hassan
    const success = true; // simulation bypass
    set((state) => {
      const nextId = state.pointsRedeemedHistory.length > 0 ? Math.max(...state.pointsRedeemedHistory.map(r => r.id)) + 1 : 1;
      return {
        pointsRedeemedHistory: [
          {
            id: nextId,
            points: pointsToRedeem,
            bdt: bdtValue,
            date: new Date().toISOString().split('T')[0]
          },
          ...state.pointsRedeemedHistory
        ]
      };
    });
    return success;
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

  adjustCitizenBalance: (walletNumber, amount, type) => {
    set((state) => {
      const nextUsers = state.users.map(u => {
        if (u.wallet_number === walletNumber) {
          const newBal = type === 'credit' ? u.balance + amount : u.balance - amount;
          return { ...u, balance: Math.max(0, newBal) };
        }
        return u;
      });
      return {
        users: nextUsers,
        mockCitizens: nextUsers
      };
    });
    return true;
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
  }
}));
