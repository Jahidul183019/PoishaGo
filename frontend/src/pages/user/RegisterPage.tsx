import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Phone, User, Mail, Upload, ArrowLeft, ArrowRight, CheckCircle, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'personal' | 'agent'>('personal');
  const [nidUploaded, setNidUploaded] = useState(false);
  const [nidFileName, setNidFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNidUploaded(true);
      setNidFileName(file.name);
      setErrorMsg('');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fullName.trim().length === 0) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (phone.length < 11) {
      setErrorMsg('Valid 11-digit Bangladeshi Mobile Number required');
      return;
    }
    if (!nidUploaded) {
      setErrorMsg('Official National ID (NID) document upload is required for KYC compliance');
      return;
    }

    // Call store mutation
    registerUser(fullName, phone, email, userType);
    
    // Auto guide to verification code gateway
    navigate('/otp');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        
        {/* Navigation back option */}
        <button
          onClick={() => navigate('/login')}
          className="self-start flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          id="btn-back-to-login"
        >
          <ArrowLeft size={14} />
          <span>Back to sign in</span>
        </button>

        {/* Brand Header */}
        <div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            Create Wallet Account
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Sign up in 2 minutes with NID Card verification
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          
          {/* USER TYPE TOGGLE TABS */}
          <div className="flex bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setUserType('personal')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all outline-none ${
                userType === 'personal'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#00C9A7] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
              id="tab-register-personal"
            >
              Personal Wallet
            </button>
            <button
              type="button"
              onClick={() => setUserType('agent')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all outline-none ${
                userType === 'agent'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#00C9A7] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
              id="tab-register-agent"
            >
              Merchant / Agent
            </button>
          </div>

          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            
            {/* Full name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Full Name (English)
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="e.g. Rafiq Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Mobile entry */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="tel"
                  placeholder="e.g. 01711000003"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-slate-400">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  placeholder="e.g. rafiq@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                />
              </div>
            </div>

            {/* NID DOCUMENT UPLOADER CONTAINER */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between items-center">
                <span>National ID Card (NID)</span>
                <span className="text-[10px] text-[var(--accent-teal)] font-mono">Required</span>
              </label>
              
              <div className={`relative border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                nidUploaded 
                  ? 'border-[#00C9A7]/50 bg-[#00C9A7]/5' 
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-cyan-400/35'
              }`}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="nid-photo-input"
                />
                
                {nidUploaded ? (
                  <div className="flex flex-col items-center gap-1 select-none">
                    <CheckCircle size={24} className="text-[#00C9A7]" />
                    <p className="text-xs text-[var(--text-primary)] font-semibold truncate max-w-[200px]">
                      {nidFileName || 'NID Document Loaded'}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Compliance requirements verified. Click to replace file.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 select-none py-1">
                    <Upload size={22} className="text-[var(--text-secondary)]" />
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Tap or drag NID card photo
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      PNG, JPG, PDF (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance message */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2">
              <Shield size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                We handle information in full compliance with the Bangladesh Bank digital security standards.
              </p>
            </div>

            {/* Submission warnings */}
            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold text-center mt-1">
                {errorMsg}
              </p>
            )}

            {/* Click register */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              id="btn-register-submit"
            >
              <span>Validate Bangladesh KYC</span>
              <ArrowRight size={16} />
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
