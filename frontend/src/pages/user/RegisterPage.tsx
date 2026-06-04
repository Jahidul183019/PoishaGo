import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Phone, User, Mail, Upload, ArrowLeft, ArrowRight, CheckCircle, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [userType, setUserType] = useState<'personal' | 'agent'>('personal');
  const [nidUploaded, setNidUploaded] = useState(false);
  const [nidFileName, setNidFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNidUploaded(true);
      setNidFileName(file.name);
      setErrorMsg('');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length === 0) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!email) {
      setErrorMsg('Email Address is required to receive OTP');
      return;
    }
    if (!nidUploaded) {
      setErrorMsg('Official National ID (NID) document upload is required for KYC compliance');
      return;
    }
    if (pin.length !== 6) {
      setErrorMsg('Security PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('Security PINs do not match');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:8000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      // Call store mutation
      registerUser(fullName, phone, email, userType, pin);

      // Auto guide to verification code gateway
      navigate('/otp', { state: { email } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while sending the email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      {/* Top AppBar */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--bg-card)] shadow-sm border-b border-[var(--border)]">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 w-full">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PoishaGo Logo" className="w-8 h-8 object-contain" />
            <div className="font-sora text-2xl font-bold text-[var(--text-primary)]">
              Poisha<span className="text-[#00C9A7]">Go</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-10 px-4 md:px-12 w-full">
        <div className="w-full max-w-[1600px] flex flex-col md:flex-row gap-10 lg:gap-24 items-center justify-between">

          {/* Hero Side (Desktop) */}
          <div className="hidden md:flex flex-col space-y-4 flex-grow self-start mt-0 xl:-mt-6 max-w-[800px]">
            <h1 className="font-sora text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              Join the future of<br />
              <span className="text-[#00C9A7]">digital finance.</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-lg">
              Open your PoishaGo wallet in just 2 minutes. Secure, fast, and fully compliant with Bangladesh Bank.
            </p>
            <div className="relative w-[100%] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] mt-8">
              <img
                className="w-full h-full object-cover"
                alt="PoishaGo App Interface"
                src="https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              />
            </div>
          </div>

          {/* Auth Form Container */}
          <div className="flex-shrink-0 flex justify-center md:justify-end w-full md:w-auto">
            <div className="w-full md:w-[380px] bg-[var(--bg-card)] p-5 md:p-6 rounded-2xl shadow-xl border border-[var(--border)] relative overflow-hidden transition-all duration-300">

              <div className="space-y-4">

                {/* Header & Back Link */}
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[#2563EB] transition-colors outline-none"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to sign in</span>
                  </button>

                  <div>
                    <h2 className="font-sora text-2xl font-bold text-[var(--text-primary)]">Create Wallet Account</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Sign up in 2 minutes with NID Card verification</p>
                  </div>
                </div>

                {/* USER TYPE TOGGLE TABS */}
                <div className="flex bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setUserType('personal')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${userType === 'personal'
                      ? 'bg-[#00C9A7] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    Personal Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('agent')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all outline-none ${userType === 'agent'
                      ? 'bg-[#00C9A7] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    Merchant / Agent
                  </button>
                </div>

                <form className="space-y-3" onSubmit={handleRegisterSubmit}>

                  {/* Full name input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name (English)</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        placeholder="e.g. Rafiq Ahmed"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setErrorMsg('');
                        }}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[#00C9A7] focus:ring-1 focus:ring-[#00C9A7] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile entry */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        type="tel"
                        placeholder="e.g. 01711000003"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ''));
                          setErrorMsg('');
                        }}
                        className="font-mono w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[#00C9A7] focus:ring-1 focus:ring-[#00C9A7] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        type="email"
                        placeholder="e.g. rafiq@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[#00C9A7] focus:ring-1 focus:ring-[#00C9A7] transition-all"
                      />
                    </div>
                  </div>

                  {/* Security PIN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between items-center">
                      <span>Security PIN (6 Digits)</span>
                      <span className="text-[10px] text-[#00C9A7] font-mono">Required</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        type={showPin ? "text" : "password"}
                        placeholder="••••••"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, ''));
                          setErrorMsg('');
                        }}
                        className="font-mono w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-10 text-sm tracking-widest text-[var(--text-primary)] outline-none focus:border-[#00C9A7] focus:ring-1 focus:ring-[#00C9A7] transition-all"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm PIN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between items-center">
                      <span>Confirm PIN</span>
                      <span className="text-[10px] text-[#00C9A7] font-mono">Required</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        type={showConfirmPin ? "text" : "password"}
                        placeholder="••••••"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => {
                          setConfirmPin(e.target.value.replace(/\D/g, ''));
                          setErrorMsg('');
                        }}
                        className="font-mono w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-10 text-sm tracking-widest text-[var(--text-primary)] outline-none focus:border-[#00C9A7] focus:ring-1 focus:ring-[#00C9A7] transition-all"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
                      >
                        {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* NID DOCUMENT UPLOADER */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between items-center">
                      <span>National ID Card (NID)</span>
                      <span className="text-[10px] text-[#00C9A7] font-mono">Required</span>
                    </label>

                    <div className={`relative border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all duration-200 ${nidUploaded
                      ? 'border-[#00C9A7]/50 bg-[#00C9A7]/5'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#00C9A7]/50 hover:bg-[var(--bg-secondary)]/50'
                      }`}>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      {nidUploaded ? (
                        <div className="flex flex-col items-center gap-1.5 select-none">
                          <CheckCircle size={22} className="text-[#00C9A7]" />
                          <p className="text-sm text-[var(--text-primary)] font-bold truncate max-w-[200px]">
                            {nidFileName || 'NID Document Loaded'}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            Verified. Click to replace.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 select-none py-1">
                          <Upload size={20} className="text-[var(--text-secondary)]" />
                          <p className="text-xs font-bold text-[var(--text-primary)]">
                            Tap or drag NID card photo
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                            PNG, JPG, PDF (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance message */}
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3 flex items-start gap-2.5 mt-2">
                    <Shield size={16} className="text-[#00C9A7] shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      We handle information in full compliance with the Bangladesh Bank digital security standards.
                    </p>
                  </div>

                  {/* Error Message */}
                  {errorMsg && (
                    <p className="text-xs text-rose-500 font-medium text-center">{errorMsg}</p>
                  )}

                  {/* CTA */}
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full h-11 bg-[#2563EB] text-white font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-3 outline-none ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Sending OTP...' : 'Validate Bangladesh KYC'}
                    {!isLoading && <ArrowRight size={18} />}
                  </button>

                </form>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="py-6 border-t border-[var(--border)] mt-auto bg-[var(--bg-card)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6">
            <a href="#" className="text-[var(--text-secondary)] text-xs hover:text-[#2563EB] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[var(--text-secondary)] text-xs hover:text-[#2563EB] transition-colors">Terms of Service</a>
            <a href="#" className="text-[var(--text-secondary)] text-xs hover:text-[#2563EB] transition-colors">Security</a>
          </div>
          <p className="text-[var(--text-secondary)] text-xs">© 2024 PoishaGo Financial Systems. Licensed by Bangladesh Bank.</p>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;
