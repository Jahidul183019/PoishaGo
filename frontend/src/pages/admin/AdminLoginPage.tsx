import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Shield, Lock, User, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';

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
      <main className="flex-grow flex justify-center pt-24 pb-12 px-4 md:px-12 w-full">
        <div className="w-full max-w-[1400px] flex flex-col md:flex-row gap-8 lg:gap-16 items-center justify-center my-auto">
          
          {/* Hero Side (Desktop) */}
          <div className="hidden md:flex flex-col space-y-3 flex-grow self-start mt-0 xl:-mt-6 max-w-[700px]">
            <h1 className="font-sora text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              System operations<br/>
              <span className="text-cyan-500">command center.</span>
            </h1>
            <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Authorized administrative personnel only. Comprehensive oversight and management of the PoishaGo financial network.
            </p>
            <div className="relative w-[90%] max-w-[580px] aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] mt-2">
              <img 
                className="w-full h-full object-cover" 
                alt="Admin Dashboard Analytics" 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              />
              <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-[2px] bg-slate-300 dark:bg-slate-700 rounded-full h-[400px] lg:h-[480px] flex-shrink-0 opacity-70 mx-2"></div>

          {/* Auth Form Container */}
          <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
            <div className="w-full md:w-[440px] bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl border border-[var(--border)] relative overflow-hidden transition-all duration-300">
              
              <div className="space-y-6">
                
                {/* Navigation back to standard logins */}
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-cyan-500 transition-colors outline-none"
                  id="btn-admin-login-back"
                >
                  <ArrowLeft size={14} />
                  <span>Sovereign Citizen Portal</span>
                </button>

                {/* Branding header */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center mb-1">
                    <Shield size={24} />
                  </div>
                  <h2 className="font-sora text-2xl font-bold text-[var(--text-primary)]">Admin Console</h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Secure access for system administrators.
                  </p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-5 pt-2">
                  
                  {/* Username/Phone */}
                  <div className="space-y-1.5">
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
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Passcode key */}
                  <div className="space-y-1.5">
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
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-xs text-rose-500 font-semibold bg-rose-500/10 p-2.5 rounded-xl flex items-start gap-2 border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 mt-2 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none h-12"
                    id="btn-admin-login-submit"
                  >
                    <span>Unlock operations Panel</span>
                    <ArrowRight size={18} />
                  </Button>

                </form>

                {/* Fallback references */}
                <div className="border-t border-[var(--border)] pt-5 text-center mt-4">
                  <p className="text-[11px] text-[var(--text-secondary)] tracking-wide font-mono">
                    Demo admin ID is <strong className="text-cyan-500 font-bold">admin</strong> & passcode is <strong className="text-cyan-500 font-bold">admin123</strong>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="py-6 border-t border-[var(--border)] mt-auto bg-[var(--bg-card)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6">
            <a href="#" className="text-[var(--text-secondary)] text-xs hover:text-cyan-500 transition-colors">Privacy Policy</a>
            <a href="#" className="text-[var(--text-secondary)] text-xs hover:text-cyan-500 transition-colors">Terms of Service</a>
            <a href="#" className="text-[var(--text-secondary)] text-xs hover:text-cyan-500 transition-colors">Security</a>
          </div>
          <p className="text-[var(--text-secondary)] text-xs">© 2024 PoishaGo Financial Systems. Licensed by Bangladesh Bank.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLoginPage;
