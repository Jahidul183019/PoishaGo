import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { formatBDT } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import OTPInput from '../../components/ui/OTPInput';
import {
  ArrowLeft,
  Smartphone,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

const OPERATORS = [
  { id: 'gp', name: 'Grameenphone', color: 'from-green-600 to-green-800', prefix: 'GP', textColor: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { id: 'robi', name: 'Robi', color: 'from-red-600 to-red-800', prefix: 'R', textColor: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { id: 'airtel', name: 'Airtel', color: 'from-rose-500 to-red-700', prefix: 'A', textColor: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { id: 'banglalink', name: 'Banglalink', color: 'from-orange-500 to-amber-700', prefix: 'BL', textColor: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'teletalk', name: 'Teletalk', color: 'from-blue-600 to-blue-800', prefix: 'TT', textColor: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
];

const QUICK_AMOUNTS = [20, 50, 100, 150, 200, 500];

export const MobileRechargePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, fetchUserProfile } = useAuthStore();

  const [selectedOperator, setSelectedOperator] = useState(OPERATORS[0]);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [errorText, setErrorText] = useState('');

  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [receiptRef, setReceiptRef] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    if (phone.length < 11) {
      setErrorText('Please enter a valid 11-digit mobile number.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 10) {
      setErrorText('Minimum recharge amount is ৳10.');
      return;
    }
    if (amt > 1000) {
      setErrorText('Maximum single recharge is ৳1,000.');
      return;
    }
    if (user && user.balance < amt) {
      setErrorText(`Insufficient balance. Your current balance is ${formatBDT(user.balance)}`);
      return;
    }
    setIsOTPModalOpen(true);
  };

  const handleOTPComplete = async (pin: string) => {
    setIsOTPModalOpen(false);
    setCurrentStep('processing');

    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone,
          operator: selectedOperator.id,
          amount: parseFloat(amount),
          pin
        })
      });

      if (!response.ok) {
        const err = await response.json();
        setErrorText(err.detail || 'Recharge failed. Please try again.');
        setCurrentStep('input');
        return;
      }

      const data = await response.json();
      await fetchUserProfile();
      setReceiptRef(data.transaction_id);
      setCurrentStep('success');
    } catch {
      setErrorText('Network error. Please try again.');
      setCurrentStep('input');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
            Mobile Recharge
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Instant top-up for any BD operator
          </p>
        </div>
      </div>

      {/* Success State */}
      {currentStep === 'success' && (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-xl text-[var(--text-primary)]">Recharge Successful!</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {formatBDT(parseFloat(amount))} topped up to <span className="font-semibold text-[var(--text-primary)]">{phone}</span>
            </p>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-2">
              {selectedOperator.name} • Ref: {receiptRef}
            </p>
          </div>
          <Button className="mt-2" onClick={() => { setCurrentStep('input'); setPhone(''); setAmount(''); }}>
            New Recharge
          </Button>
        </Card>
      )}

      {/* Processing State */}
      {currentStep === 'processing' && (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/15 flex items-center justify-center animate-pulse">
            <Smartphone size={32} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-lg text-[var(--text-primary)]">Processing Recharge...</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Please wait a moment</p>
          </div>
        </Card>
      )}

      {/* Input Form */}
      {currentStep === 'input' && (
        <>
          {/* Operator Selector */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
              Select Operator
            </h3>
            <div className="flex gap-2 flex-wrap">
              {OPERATORS.map(op => (
                <button
                  key={op.id}
                  onClick={() => setSelectedOperator(op)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all outline-none ${
                    selectedOperator.id === op.id
                      ? `${op.bg} ${op.textColor} border-current`
                      : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/30'
                  }`}
                  id={`op-${op.id}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${op.color} flex items-center justify-center text-[9px] font-bold text-white`}>
                    {op.prefix}
                  </div>
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <Card className="flex flex-col gap-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Phone input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60 transition-colors"
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  id="input-recharge-phone"
                />
              </div>

              {/* Amount input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Recharge Amount (৳)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500/60 transition-colors"
                  placeholder="e.g. 100"
                  min="10"
                  max="1000"
                  id="input-recharge-amount"
                />
              </div>

              {/* Quick amount selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[var(--text-secondary)]">Quick amounts:</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all outline-none ${
                        amount === String(q)
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-500/20'
                      }`}
                      id={`quick-amt-${q}`}
                    >
                      ৳{q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error display */}
              {errorText && (
                <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                  <AlertCircle size={13} />
                  {errorText}
                </div>
              )}

              {/* Summary */}
              {phone.length === 11 && parseFloat(amount) >= 10 && (
                <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="text-[var(--text-secondary)]">
                    <span className={`font-bold ${selectedOperator.textColor}`}>{selectedOperator.name}</span> top-up to <span className="font-semibold text-[var(--text-primary)]">{phone}</span>
                  </div>
                  <div className="font-bold text-purple-400">{formatBDT(parseFloat(amount) || 0)}</div>
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500">
                <Smartphone size={15} className="mr-2" />
                Recharge Now
              </Button>
            </form>
          </Card>
        </>
      )}

      {/* OTP Modal */}
      <Modal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        title="Confirm Recharge"
      >
        <div className="flex flex-col gap-4 text-center">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-2">
            Enter your <strong>6-digit wallet PIN</strong> to confirm the{' '}
            <strong>{formatBDT(parseFloat(amount) || 0)}</strong> recharge to <strong>{phone}</strong>.
          </p>
          <div className="py-4">
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
            Safety tip: Never disclose your authorization PIN.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default MobileRechargePage;
