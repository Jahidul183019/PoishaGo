import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import Button from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuthStore();

  const [phone, setPhone] = useState('01711000001'); // Preset demo citizen
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');

  const appendDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setErrorMSG('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) {
      setErrorMSG('Valid Bangladeshi mobile number required (11 digits)');
      return;
    }
    if (pin.length < 6) {
      setErrorMSG('6-digit security PIN is required');
      return;
    }

    const success = loginUser(phone, pin);
    if (success) {
      // Transition users to safety check OTP validation screen
      navigate('/otp');
    } else {
      setErrorMSG('Incorrect mobile number or security PIN.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center font-sora font-extrabold text-white text-3xl shadow-lg">
            ৳
          </div>
          <div>
            <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
              Welcome back to Poisha<span className="text-[#00C9A7]">Go</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Bangladeshi Secured Wallet Account Gateway
            </p>
          </div>
        </div>

        {/* Input Card Container */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            
            {/* Phone Entry Row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="tel"
                  placeholder="e.g. 01711000001"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors font-mono"
                />
              </div>
            </div>

            {/* Hidden PIN Indicator Row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
                <span>6-Digit Security PIN</span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 normal-case text-[10px]"
                >
                  {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showPin ? 'Hide' : 'Show'}</span>
                </button>
              </label>

              {/* Pin representation display */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 flex justify-center gap-3 h-12 items-center">
                {Array(6).fill(null).map((_, i) => (
                  <div
                    key={i}
                    className={`transition-all duration-150 rounded-full ${
                      pin.length > i
                        ? showPin 
                          ? 'text-sm font-bold text-[#00C9A7] font-mono' 
                          : 'w-3 h-3 bg-[#00C9A7] shadow-[0_0_8px_rgba(0,201,167,0.5)]'
                        : 'w-2.5 h-2.5 bg-slate-700'
                    }`}
                  >
                    {pin.length > i && showPin ? pin[i] : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* User prompt alert */}
            {errorMSG && (
              <p className="text-xs text-rose-400 font-semibold text-center mt-1">
                {errorMSG}
              </p>
            )}

            {/* Login button submission */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              id="btn-login-submit"
            >
              <span>Verify Mobile PIN</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* CUSTOM FINTECH DIGITAL PIN KEYPAD */}
          <div className="grid grid-cols-3 gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl mt-1 select-none">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => appendDigit(num)}
                className="py-3 font-sora font-semibold text-base text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)] rounded-lg transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 text-[10px] uppercase font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className="py-3 font-sora font-semibold text-base text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)] rounded-lg transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 text-[10px] uppercase font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card)] rounded-lg transition-all"
            >
              Del
            </button>
          </div>
        </div>

        {/* Dynamic redirection helpers */}
        <div className="flex flex-col gap-2.5 items-center justify-center">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-1.5 text-xs text-[#00C9A7] font-semibold hover:underline outline-none"
            id="link-register"
          >
            <UserPlus size={14} />
            <span>Don't have an account? Create Wallet</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold hover:underline mt-1 outline-none"
            id="link-admin"
          >
            <ShieldCheck size={14} />
            <span>Access Administrator HQ Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
