import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import OTPInput from '../../components/ui/OTPInput';
import Button from '../../components/ui/Button';
import { ShieldCheck, MessageSquare, RefreshCw, ArrowLeft } from 'lucide-react';

export const OTPPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, verifyUserOTP } = useAuthStore();

  const [counter, setCounter] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Decrement counter clock
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (counter > 0) {
      timer = setTimeout(() => setCounter(prev => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [counter]);

  const handleOTPComplete = (code: string) => {
    setIsVerifying(true);
    setErrorText('');

    // Simulate network delay for premium visual responsiveness
    setTimeout(() => {
      if (code === '112233' || code.length === 6) { // allow all 6 digits for testing ease
        verifyUserOTP(code);
        setIsVerifying(false);
        navigate('/home');
      } else {
        setIsVerifying(false);
        setErrorText('Invalid verification code. Please request a new code or try again.');
      }
    }, 1200);
  };

  const handleResendCode = () => {
    setCounter(45);
    setCanResend(false);
    setErrorText('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        
        {/* Navigation back option */}
        <button
          onClick={() => navigate('/login')}
          className="self-start flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          id="btn-otp-back"
        >
          <ArrowLeft size={14} />
          <span>Back to sign in</span>
        </button>

        {/* Header descriptions */}
        <div className="flex flex-col items-center gap-2 text-center select-none">
          <div className="w-12 h-12 rounded-full bg-[#00C9A7]/10 flex items-center justify-center text-[#00C9A7] shadow-[0_0_15px_rgba(0,201,167,0.15)] mb-2">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-sora font-extrabold text-2xl text-[var(--text-primary)]">
            Authorization Code
          </h1>
          <p className="text-xs text-[var(--text-secondary)] px-4 leading-relaxed">
            We sent a 6-digit confirmation SMS code to your registered mobile number:
            <span className="block font-bold text-[var(--text-primary)] font-mono mt-1 text-sm">
              {user?.phone || '01711***001'}
            </span>
          </p>
        </div>

        {/* Main Verification Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          
          {/* OTP Digit Inputs */}
          <div className="py-2">
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </div>

          {/* Verification indicator */}
          {isVerifying && (
            <p className="text-xs text-[var(--accent-teal)] font-semibold text-center select-none flex items-center justify-center gap-2 animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span>Checking security payload...</span>
            </p>
          )}

          {/* Validation warnings */}
          {errorText && (
            <p className="text-xs text-rose-400 font-semibold text-center leading-relaxed">
              {errorText}
            </p>
          )}

          {/* Counter widget footer */}
          <div className="border-t border-[var(--border)] pt-4 flex flex-col items-center justify-center gap-2 select-none">
            {canResend ? (
              <button
                onClick={handleResendCode}
                className="flex items-center gap-1.5 text-xs font-bold text-[#00C9A7] hover:underline"
                id="btn-otp-resend"
              >
                <MessageSquare size={14} />
                <span>Resend SMS Code</span>
              </button>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] font-semibold flex items-center gap-1.5">
                <RefreshCw size={12} className="text-[var(--text-secondary)]" />
                <span>Resend available in {counter}s</span>
              </p>
            )}
            
            <p className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase font-mono mt-1 text-center">
              Testing fallback code is <strong className="text-[#00C9A7]">any 6 digits</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
