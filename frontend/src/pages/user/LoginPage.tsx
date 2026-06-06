import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuthStore();

  const [phone, setPhone] = useState('01711000001'); // Preset demo citizen
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const handleForgotPassword = () => {
    // Navigate directly to OTP page for password reset flow
    navigate('/otp', { state: { isPasswordReset: true } });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) {
      setErrorMSG('Valid Bangladeshi mobile number required (11 digits)');
      return;
    }
    if (pin.length < 6) {
      setErrorMSG('6-digit security PIN is required');
      return;
    }

    const success = await loginUser(phone, pin);
    if (success) {
      // Because we now do OTP before login in this version of the flow? No wait.
      // Wait, the API /login returns a JWT, which implies they are logged in! 
      // Do they still need OTP for login?
      // In the mock, it transitioned to OTP page. I will just navigate to Dashboard if successful.
      navigate('/home');
    } else {
      setErrorMSG('Incorrect mobile number or password.');
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
              Your money,<br/>
              <span className="text-[#2563EB]">moving faster.</span>
            </h1>
            <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Experience the next generation of financial freedom in Bangladesh. Simple, secure, and lightning-fast transactions for the modern economy.
            </p>
            <div className="relative w-[90%] max-w-[580px] aspect-[16/9] rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] mt-2">
              <img 
                className="w-full h-full object-cover" 
                alt="PoishaGo App Interface" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5U6GwH_uXYRXyCDpHiKMbXVXp1wjZM6tBr9i-7bvvupD3e9bPGed_W12slxAwLBFf2dtfPC1qu6XUZVvj4U_9ECFklwb0WwcAGOlg2mw8ThSr1QJJm-X6_Ucgo1fZ7-QlojDXrcxR6NOBdRqMaehJC3WDVON76biFqbBMnKl4aZBvhuTar2Up-mjRl6oDXsTTCyqEWYxsH5a8y_7L96_N3JRx_QVhc88MqkgHMrBvWD750ZQna-tDJeA9EpYkU-b5AwvdQPity0Q"
              />
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-[2px] bg-slate-300 dark:bg-slate-700 rounded-full h-[400px] lg:h-[480px] flex-shrink-0 opacity-70 mx-2"></div>

          {/* Auth Form Container */}
          <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
            <div className="w-full md:w-[440px] bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl border border-[var(--border)] relative overflow-hidden transition-all duration-300">
              
              <div className="space-y-8">
                <div className="space-y-1">
                  <h2 className="font-sora text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Log in to your PoishaGo account</p>
                </div>
                
                <form className="space-y-5" onSubmit={handleLoginSubmit}>
                  
                  {/* Phone Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phone Number</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-medium text-[var(--text-secondary)]">+88</span>
                      <input 
                        type="tel" 
                        maxLength={11}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ''));
                          setErrorMSG('');
                        }}
                        className={`w-full pl-14 pr-4 py-3 bg-[var(--bg-secondary)] rounded-xl border ${errorMSG.includes('mobile') ? 'border-rose-400' : 'border-[var(--border)]'} focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-mono font-medium text-[var(--text-primary)] transition-all`} 
                        placeholder="01XXXXXXXXX" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Password/PIN Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Password</label>
                      <button 
                        type="button" 
                        onClick={handleForgotPassword}
                        disabled={isSendingOTP}
                        className="text-[#2563EB] text-xs font-medium hover:underline outline-none disabled:opacity-50"
                      >
                        {isSendingOTP ? 'Sending...' : 'Forgot?'}
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPin ? "text" : "password"} 
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, ''));
                          setErrorMSG('');
                        }}
                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-mono tracking-widest text-[var(--text-primary)] transition-all" 
                        placeholder="••••••" 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMSG && (
                    <p className="text-xs text-rose-500 font-medium">{errorMSG}</p>
                  )}

                  {/* CTA */}
                  <button 
                    type="submit" 
                    className="w-full h-12 bg-[#2563EB] text-white font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 outline-none"
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>

                </form>

                <div className="relative py-1 flex items-center">
                  <div className="flex-grow border-t border-[var(--border)]"></div>
                  <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-[var(--border)]"></div>
                </div>

                <button 
                  type="button"
                  className="w-full h-12 border border-[var(--border)] bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center gap-3 font-medium text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors active:scale-[0.98] outline-none"
                >
                  <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaVWBU7GSxRuiRhxYUb1hqC6fxo2LZOpmlQmq4bEUdVs4FausaaHRJnWJcUQAgTw2tcmrrNf3fpOy8VZSF2K2UfN-AUr_htx5L4mkRC80XKzeHyf4Tx5n42jgm3ZksdKbKnDmt95OnupY7yYApRBHwcIv_PqjvYmK-9dbgda0KfzB0npiJY1t9vjSYXSxlGyzT6k5g5_x1GmU8vqJ4motyKw6PnEtJFqbZLWC8nq5Q2tj83es-np27zS0IkCcOKr1qy1RFyG9xzEM" />
                  Continue with Google
                </button>

                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-center text-sm text-[var(--text-secondary)]">
                    Don't have an account? <button onClick={() => navigate('/register')} className="text-[#2563EB] font-bold hover:underline outline-none">Register</button>
                  </p>
                  <button 
                    onClick={() => navigate('/admin/login')}
                    className="text-xs text-rose-500 font-semibold hover:underline outline-none mt-2"
                  >
                    Access Administrator HQ Portal
                  </button>
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

export default LoginPage;
