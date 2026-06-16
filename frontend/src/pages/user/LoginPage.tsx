import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../utils/validators';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuthStore();

  const [showPin, setShowPin] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', pin: '' },
  });

  const handleForgotPassword = () => {
    // Navigate directly to OTP page for password reset flow
    navigate('/otp', { state: { isPasswordReset: true } });
  };

  const onSubmit = async (data: LoginFormData) => {
    setErrorMSG('');
    const success = await loginUser(data.phone, data.pin);
    if (success) {
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
                
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  
                  {/* Phone Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phone Number</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-medium text-[var(--text-secondary)]">+88</span>
                      <input 
                        type="tel" 
                        maxLength={11}
                        {...register('phone')}
                        className={`w-full pl-14 pr-4 py-3 bg-[var(--bg-secondary)] rounded-xl border ${errors.phone || errorMSG.includes('mobile') ? 'border-rose-400' : 'border-[var(--border)]'} focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-mono font-medium text-[var(--text-primary)] transition-all`} 
                        placeholder="01XXXXXXXXX" 
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Password/PIN Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Wallet Pin</label>
                      <button 
                        type="button" 
                        onClick={handleForgotPassword}
                        className="text-[#2563EB] text-xs font-medium hover:underline outline-none disabled:opacity-50"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPin ? "text" : "password"} 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        {...register('pin')}
                        onKeyDown={(e) => { if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); setValue('pin', ''); } }}
                        className={`w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl border ${errors.pin ? 'border-rose-400' : 'border-[var(--border)]'} focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-mono tracking-widest text-[var(--text-primary)] transition-all`} 
                        placeholder="••••••" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
                        aria-label={showPin ? "Hide password" : "Show password"}
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.pin && (
                      <p className="text-red-400 text-xs mt-1">{errors.pin.message}</p>
                    )}
                  </div>

                  {/* Error Message */}
                  {errorMSG && (
                    <p className="text-xs text-rose-500 font-medium">{errorMSG}</p>
                  )}

                  {/* CTA */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#2563EB] text-white font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Logging in...' : 'Continue'}
                    {!isSubmitting && <ArrowRight size={18} />}
                  </button>

                </form>

 

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
