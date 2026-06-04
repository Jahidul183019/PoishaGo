import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Shield, Lock, User, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuthStore();

  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Call store mutation
    const success = adminLogin(username, passcode);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMsg('Unauthorized credentials. Check administrative security clearances.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 select-none">
        
        {/* Navigation back to standard logins */}
        <button
          onClick={() => navigate('/login')}
          className="self-start flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          id="btn-admin-login-back"
        >
          <ArrowLeft size={14} />
          <span>Sovereign Citizen Portal</span>
        </button>

        {/* Branding header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-1">
            <Shield size={24} />
          </div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            PoishaGo Admin Console
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-normal px-6">
            Authorized administrative personnel only. System operations are monitored.
          </p>
        </div>

        {/* Login credentials box */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-4">
            
            {/* Username/Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Console Username / ID
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="e.g. root_admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400 transition-colors font-mono"
                  required
                />
              </div>
            </div>

            {/* Passcode key */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Administrative Security key
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400 transition-colors font-mono"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-xl flex items-start gap-2 border border-rose-500/15">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 mt-2 hover:from-cyan-500 hover:to-blue-500 text-xs text-semibold"
              id="btn-admin-login-submit"
            >
              <span>Unlock operations Panel</span>
              <ArrowRight size={16} />
            </Button>

          </form>

          {/* Fallback references */}
          <div className="border-t border-[var(--border)] pt-4 select-none text-center">
            <p className="text-[10px] text-[var(--text-secondary)] tracking-wider font-mono">
              Demo admin ID is <strong className="text-cyan-400">admin</strong> & passcode is <strong className="text-cyan-400">admin123</strong>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginPage;
