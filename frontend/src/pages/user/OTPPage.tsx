import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import OTPInput from '../../components/ui/OTPInput';
import { API_BASE_URL } from '../../utils/api';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { ShieldCheck, MessageSquare, RefreshCw, ArrowLeft } from 'lucide-react';

export const OTPPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Pull updated asynchronous API actions from Zustand store layer
  const { user, verifyUserOTP, resendUserOTP } = useAuthStore();

  const isPasswordReset = location.state?.isPasswordReset;
  const initialEmail = location.state?.email || (isPasswordReset ? '' : user?.email || '');

  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<'enter_email' | 'enter_otp' | 'reset_pin'>(
    initialEmail ? 'enter_otp' : 'enter_email'
  );

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [counter, setCounter] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Decrement counter clock
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (counter > 0 && step === 'enter_otp') {
      timer = setTimeout(() => setCounter(prev => prev - 1), 1000);
    } else if (counter === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [counter, step]);

  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      setErrorText('Please enter a valid email address.');
      return;
    }
    setIsVerifying(true);
    setErrorText('');

    try {
      // 🚀 FIXED: Native string method is .toLowerCase(), not .lowerCase()
      const purpose = isPasswordReset ? 'login' : undefined;
      const result = await resendUserOTP(email.trim().toLowerCase(), purpose);
      if (!result.success) {
        throw new Error(result.message);
      }

      setStep('enter_otp');
      setCounter(45);
      setCanResend(false);
    } catch (err: any) {
      setErrorText(err.message || 'Something went wrong while sending the email.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOTPComplete = async (code: string) => {
    if (!email) {
      setErrorText('User tracking context lost. Please return to registration.');
      return;
    }

    setIsVerifying(true);
    setErrorText('');

    try {
      // Execute database authentication pipeline over port 8080
      const purpose = isPasswordReset ? 'login' : undefined;
      const result = await verifyUserOTP(email.trim().toLowerCase(), code.trim(), purpose);

      if (!result.success) {
        throw new Error(result.message);
      }

      if (isPasswordReset) {
        setStep('reset_pin');
      } else {
        // Safe database tracking updated, route user into backend dashboard
        navigate('/home');
      }
    } catch (err: any) {
      setErrorText(err.message || 'Something went wrong. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      setErrorText('PIN must be exactly 6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorText('PINs do not match.');
      return;
    }
    (async () => {
      setIsVerifying(true);
      setErrorText('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Missing session token.');

        const res = await fetch(`${API_BASE_URL}/api/reset-pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ new_pin: newPin })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to update PIN');
        }
        // After successful reset, route to login
        navigate('/login');
      } catch (err: any) {
        setErrorText(err.message || 'Failed to reset PIN');
      } finally {
        setIsVerifying(false);
      }
    })();
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrorText("Target context identifier not available.");
      return;
    }

    setCounter(45);
    setCanResend(false);
    setErrorText('');
    setIsVerifying(true);

    try {
      const purpose = isPasswordReset ? 'login' : undefined;
      const result = await resendUserOTP(email.trim().toLowerCase(), purpose);
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setErrorText(err.message || 'Failed to dispatch code.');
      setCanResend(true);
    } finally {
      setIsVerifying(false);
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
        <div className="w-full max-w-[1400px] flex flex-col md:flex-row gap-10 lg:gap-20 items-center justify-center my-auto">

          {/* Hero Side (Desktop) */}
          <div className="hidden md:flex flex-col space-y-3 flex-grow self-start -mt-8 lg:-mt-16 max-w-[700px]">
            <h1 className="font-sora text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              Secure your account,<br />
              <span className="text-[#00C9A7]">verify your identity.</span>
            </h1>
            <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
              We employ military-grade encryption and two-factor authentication to ensure your funds and data remain completely secure.
            </p>
            <div className="relative w-[90%] max-w-[580px] aspect-[3/2] rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] mt-4">
              <img
                className="w-full h-full object-cover"
                alt="Security Interface"
                src="/otp_hero.png"
              />
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-[2px] bg-slate-300 dark:bg-slate-700 rounded-full h-[400px] lg:h-[480px] flex-shrink-0 opacity-70"></div>

          {/* Auth Form Container */}
          <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
            <div className="w-full md:w-[440px] flex flex-col gap-6 relative">

              {/* Navigation back option */}
              <button
                onClick={() => navigate('/login')}
                className="self-start flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[#2563EB] transition-colors outline-none mb-2"
                id="btn-otp-back"
              >
                <ArrowLeft size={16} />
                <span>Back to sign in</span>
              </button>

              {/* Header descriptions */}
              <div className="flex flex-col items-center gap-2 text-center select-none bg-[var(--bg-card)] p-6 pb-2 rounded-t-2xl border-x border-t border-[var(--border)] shadow-xl mb-[-24px] z-10 relative">
                <div className="w-12 h-12 rounded-full bg-[#00C9A7]/10 flex items-center justify-center text-[#00C9A7] shadow-[0_0_15px_rgba(0,201,167,0.15)] mb-2">
                  <ShieldCheck size={24} />
                </div>
                <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
                  {step === 'enter_email' ? 'Reset Password' : step === 'reset_pin' ? 'Create New PIN' : 'Authorization Code'}
                </h1>
                <div className="text-xs text-[var(--text-secondary)] px-4 leading-relaxed pb-4">
                  {step === 'enter_email'
                    ? 'Enter your registered email address below to receive a password reset OTP code.'
                    : step === 'reset_pin'
                      ? 'Your identity has been verified. Please enter a new 6-digit security PIN for your wallet.'
                      : 'We sent a 6-digit confirmation code to your registered email address:'}
                  {step === 'enter_otp' && email && (
                    <span className="block font-bold text-[var(--text-primary)] font-mono mt-1 text-sm break-all">
                      {email}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Verification Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-b-2xl p-6 shadow-xl flex flex-col gap-6 relative z-20">

                {step === 'reset_pin' ? (
                  <form onSubmit={handleResetPin} className="flex flex-col gap-4 py-2">
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setErrorText(''); }}
                      className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-mono tracking-widest text-[var(--text-primary)] transition-all text-center placeholder:tracking-normal"
                      placeholder="New 6-digit PIN"
                      required
                    />
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setErrorText(''); }}
                      className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-mono tracking-widest text-[var(--text-primary)] transition-all text-center placeholder:tracking-normal"
                      placeholder="Confirm New PIN"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full h-12 bg-[#2563EB] text-white font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center mt-2"
                    >
                      Update Security PIN
                    </button>
                  </form>
                ) : step === 'enter_email' ? (
                  <form onSubmit={handleSendEmailOTP} className="flex flex-col gap-4 py-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorText('');
                      }}
                      className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none font-medium text-[var(--text-primary)] transition-all"
                      placeholder="Email Address"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full h-12 bg-[#2563EB] text-white font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {isVerifying ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <div className="py-2">
                    <OTPInput length={6} onComplete={handleOTPComplete} />
                  </div>
                )}

                {/* Verification indicator */}
                {isVerifying && (
                  <div className="text-xs text-[#00C9A7] font-semibold text-center select-none flex items-center justify-center gap-2 animate-pulse">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Processing payload secure layer...</span>
                  </div>
                )}

                {/* Validation warnings */}
                {errorText && (
                  <p className="text-xs text-rose-400 font-semibold text-center leading-relaxed">
                    {errorText}
                  </p>
                )}

                {step === 'enter_otp' && (
                  <div className="border-t border-[var(--border)] pt-4 flex flex-col items-center justify-center gap-2 select-none">
                    {canResend ? (
                      <button
                        onClick={handleResendCode}
                        disabled={isVerifying}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#00C9A7] hover:underline outline-none disabled:opacity-50"
                        id="btn-otp-resend"
                      >
                        <MessageSquare size={14} />
                        <span>Resend Code</span>
                      </button>
                    ) : (
                      <div className="text-xs text-[var(--text-secondary)] font-semibold flex items-center gap-1.5">
                        <RefreshCw size={12} className="text-[var(--text-secondary)]" />
                        <span>Resend available in {counter}s</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OTPPage;
