import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { formatBDT } from '../../utils/format';
import { TierBadge } from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Modal from '../../components/ui/Modal';
import OTPInput from '../../components/ui/OTPInput';
import { 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Edit, 
  CheckCircle,
  Eye,
  KeyRound
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserPIN, updateUserProfile } = useAuthStore();

  // Dialog triggers
  const [isPINModalOpen, setIsPINModalOpen] = useState(false);
  const [oldPIN, setOldPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Editable fields simulation
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email || '');
    }
  }, [user]);
  const [language, setLanguage] = useState<'English'>('English');
  const [editSuccess, setEditSuccess] = useState('');

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess('');
    const success = await updateUserProfile(fullName, email);
    if (success) {
      setEditSuccess('Profile saved successfully.');
      setTimeout(() => setEditSuccess(''), 3000);
    } else {
      setEditSuccess('Failed to save profile.');
      setTimeout(() => setEditSuccess(''), 3000);
    }
  };

  const handlePINReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (oldPIN.length < 6 || newPIN.length < 6 || confirmPIN.length < 6) {
      setPinError('Security PINs must represent exactly 6 numerical digits.');
      return;
    }

    if (newPIN !== confirmPIN) {
      setPinError('New PIN inputs and confirmation PIN inputs do not match.');
      return;
    }

    // Attempt Reset
    const success = await updateUserPIN(oldPIN, newPIN);
    if (success) {
      setPinSuccess('Your wallet security PIN was successfully changed.');
      setOldPIN('');
      setNewPIN('');
      setConfirmPIN('');
      setTimeout(() => {
        setIsPINModalOpen(false);
        setPinSuccess('');
      }, 2000);
    } else {
      setPinError('Validation failed. The old PIN input is incorrect.');
    }
  };

  const handleLogoutClick = () => {
    if (confirm('Are you sure you want to log out of PoishaGo?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 select-none">
      
      {/* Title Header */}
      <div>
        <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
          Citizen Profile & Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Verify and modify your National ID KYC attributes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Avatar & Quick Stats */}
        <div className="flex flex-col gap-6">
          
          <Card className="flex flex-col items-center text-center p-6 bg-gradient-to-tr from-[var(--bg-card)] to-[var(--accent-blue)]/10">
            <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center font-sora text-2xl font-extrabold text-white uppercase drop-shadow-[0_0_12px_rgba(37,99,235,0.25)] ring-2 ring-[var(--border)]">
              {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            
            <h3 className="font-sora font-extrabold text-[#00C9A7] mt-4 text-base">
              {fullName}
            </h3>
            
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
              Wallet ID: <span className="text-[var(--text-primary)] font-bold">{user?.wallet_number || 'N/A'}</span>
            </p>

            <div className="mt-3">
              <TierBadge tier={user?.tier || 'gold'} />
            </div>

            {/* Micro details panel */}
            <div className="w-full border-t border-[var(--border)] mt-5 pt-4 flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              <div className="flex justify-between items-center">
                <span>Account Status:</span>
                <span className="text-[#00C9A7] font-bold">✓ SECURED KYC</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Registration Mode:</span>
                <span className="text-[var(--text-primary)] capitalize">{user?.user_type || 'personal'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Available Purse Balance:</span>
                <span className="text-[var(--text-primary)] font-bold">{formatBDT(user?.balance ?? 0)}</span>
              </div>
            </div>
          </Card>

          {/* Quick Settings Panel Card with Theme Toggle */}
          <Card className="flex flex-col gap-4.5">
            <h4 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-wider pl-0.5">
              Device Styling Configuration
            </h4>

            {/* Custom Theme toggle row */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--text-primary)]">Interface Theme Mode</span>
                <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">Toggle between dark and light modes</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Language profile */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--text-primary)]">Interface Language</span>
                <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">System-wide UI translation dialect</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg py-1 px-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] cursor-pointer"
              >
                <option value="English">English</option>
              </select>
            </div>
          </Card>

        </div>

        {/* Right Columns: Edit details & Security options */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Main User Profile Editor Details Card */}
          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 pl-0.5">
              <Edit size={16} className="text-[#00C9A7]" />
              <h3 className="font-sora font-extrabold text-sm text-[var(--text-primary)]">
                KYC Registered Citizen Attributes
              </h3>
            </div>

            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Full Name (Compliance matches NID)
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Mobile Phone Link
                  </label>
                  <div className="relative opacity-65">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      type="tel"
                      value={user?.phone || ''}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-[var(--text-secondary)] outline-none cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                    />
                  </div>
                </div>

                {/* Address removed: not persisted in backend */}

              </div>

              {editSuccess && (
                <p className="text-xs text-[#00C9A7] font-semibold text-center py-2 bg-emerald-500/10 rounded-lg">
                  {editSuccess}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                className="self-end px-6 text-xs"
                id="btn-profile-save"
              >
                Save Profile Adjustments
              </Button>
            </form>
          </Card>

          {/* Security PIN Change panel & Danger Logout triggers */}
          <Card className="flex flex-col gap-5 border border-red-500/10 bg-red-950/5">
            <div className="flex items-center gap-2.5 pl-0.5">
              <KeyRound size={16} className="text-rose-400" />
              <h3 className="font-sora font-semibold text-sm text-[var(--text-primary)]">
                Key Security & System Options
              </h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
              
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Reset your 6-digit transaction PIN routinely to guard yourself from emerging digital cash phishing scripts.
                </p>
                <div className="mt-3.5 flex gap-3">
                  <button
                    onClick={() => {
                      setPinError('');
                      setPinSuccess('');
                      setIsPINModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#00C9A7] hover:underline outline-none"
                    id="btn-trigger-pin-reset-modal"
                  >
                    <Lock size={13} />
                    <span>Change transaction PIN code</span>
                  </button>
                </div>
              </div>

              <div className="md:w-px bg-[var(--border)] shrink-0" />

              <div className="flex-1 flex flex-col justify-between">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Terminate current terminal descriptors and exit your desktop browser portal securely.
                </p>
                <div className="mt-3.5">
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-red-500 transition-colors outline-none cursor-pointer"
                    id="btn-citizen-logout-trigger"
                  >
                    <LogOut size={13} />
                    <span>Disconnect Wallet (Logout)</span>
                  </button>
                </div>
              </div>

            </div>
          </Card>

        </div>
      </div>

      {/* SECURITY PIN RESET DRAW MODAL POPUP */}
      <Modal
        isOpen={isPINModalOpen}
        onClose={() => setIsPINModalOpen(false)}
        title="Change Wallet Security PIN"
      >
        <form onSubmit={handlePINReset} className="flex flex-col gap-4 select-none">
          
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed text-center px-4">
            Protect your assets. Enter your active old PIN followed by your new 6-digit security sequence twice.
          </p>

          {/* Old PIN Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Enter Old PIN Code
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="••••••"
              value={oldPIN}
              onChange={(e) => setOldPIN(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest font-mono bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 px-4 outline-none focus:border-[#00C9A7] text-[var(--text-primary)] text-base font-extrabold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* New PIN */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Enter New PIN
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={newPIN}
                onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest font-mono bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 px-4 outline-none focus:border-[#00C9A7] text-[var(--text-primary)] text-base font-extrabold"
                required
              />
            </div>

            {/* Confirm PIN */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Confirm New PIN
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={confirmPIN}
                onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest font-mono bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 px-4 outline-none focus:border-[#00C9A7] text-[var(--text-primary)] text-base font-extrabold"
                required
              />
            </div>
          </div>

          {pinError && (
            <p className="text-xs text-rose-400 font-semibold text-center bg-rose-500/10 p-2 rounded-lg">
              {pinError}
            </p>
          )}

          {pinSuccess && (
            <p className="text-xs text-[#00C9A7] font-semibold text-center bg-emerald-500/10 p-2 rounded-lg">
              {pinSuccess}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            id="btn-pin-reset-submit"
          >
            <span>Update Security PIN</span>
          </Button>

        </form>
      </Modal>

    </div>
  );
};

export default ProfilePage;
