import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

// LAYOUTS
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

// PAGES (USER)
import SplashScreen from './pages/user/SplashScreen';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import OTPPage from './pages/user/OTPPage';
import HomePage from './pages/user/HomePage';
import SendMoneyPage from './pages/user/SendMoneyPage';
import CashInPage from './pages/user/CashInPage';
import CashOutPage from './pages/user/CashOutPage';
import BillPaymentPage from './pages/user/BillPaymentPage';
import TransactionHistoryPage from './pages/user/TransactionHistoryPage';
import RewardsPage from './pages/user/RewardsPage';
import NotificationsPage from './pages/user/NotificationsPage';
import ProfilePage from './pages/user/ProfilePage';
import MobileRechargePage from './pages/user/MobileRechargePage';

// PAGES (ADMIN)
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserTxnMgmtPage from './pages/admin/AdminUserTxnMgmtPage';
import AdminFraudDetectionPage from './pages/admin/AdminFraudDetectionPage';
import AdminOccasionsPage from './pages/admin/AdminOccasionsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import { AdminConfigPage } from './pages/admin/AdminConfigPage';

// SECURITY GUARD: Authenticated customers/admins only
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isLoggedIn, isAdmin } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// SECURITY GUARD: Guests/Unauthenticated visitors only
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuthStore();

  if (isLoggedIn) {
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { token, fetchUserProfile } = useAuthStore();

  useEffect(() => {
    useThemeStore.getState().init();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Splash Landing entry point */}
        <Route path="/" element={<SplashScreen />} />

        {/* Guest Authentication Access gateways */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/otp" element={<GuestRoute><OTPPage /></GuestRoute>} />
        <Route path="/admin/login" element={<GuestRoute><AdminLoginPage /></GuestRoute>} />

        {/* Private Citizens Client routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute requireAdmin={false}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<HomePage />} />
          <Route path="send" element={<SendMoneyPage />} />
          <Route path="cashin" element={<CashInPage />} />
          <Route path="cashout" element={<CashOutPage />} />
          <Route path="bills" element={<BillPaymentPage />} />
          <Route path="history" element={<TransactionHistoryPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="recharge" element={<MobileRechargePage />} />
        </Route>

        {/* Private Admin operations terminal routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Index rerouts to Dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUserTxnMgmtPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
          <Route path="fraud" element={<AdminFraudDetectionPage />} />
          <Route path="occasions" element={<AdminOccasionsPage />} />
          <Route path="config" element={<AdminConfigPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
