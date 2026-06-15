import React, { useState, useRef } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-advance to next field
    if (val !== '' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const combinedStr = newOtp.join('');
    if (combinedStr.length === length) {
      onComplete(combinedStr);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === length && !isNaN(Number(pastedData))) {
      const codeArray = pastedData.split('');
      setOtp(codeArray);
      onComplete(pastedData);
      inputsRef.current[length - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between items-center gap-2 max-w-sm mx-auto" onPaste={handlePaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"        // shows numpad on iOS & Android
          pattern="[0-9]*"           //  enforces numeric on some browsers
          autoComplete="one-time-code" // iOS SMS autofill
          enterKeyHint={i === length - 1 ? 'done' : 'next'} // keyboard action label
          maxLength={1}
          value={digit}
          ref={(el) => { inputsRef.current[i] = el; }}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="
            w-12 h-14 text-center text-xl font-bold font-mono
            rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]
            text-[var(--text-primary)]
            focus:border-[var(--accent-teal)] focus:ring-1 focus:ring-[var(--accent-teal)]
            outline-none transition-all duration-200
          "
        />
      ))}
    </div>
  );
};

export default OTPInput;

