import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import api from '../../utils/api';
import { formatBDT } from '../../utils/format';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import OTPInput from '../../components/ui/OTPInput';
import { useToast } from '../../hooks/useToast';
import { useApiCall } from '../../hooks/useApiCall';
import { 
  ArrowLeft, 
  MapPin, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Printer 
} from 'lucide-react';

export const CashOutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserBalance, fetchUserProfile } = useAuthStore();

  const [agentsList, setAgentsList] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/api/agents')
      .then(data => setAgentsList(data))
      .catch(err => console.error(err));
  }, []);

  const [selectedAgentId, setSelectedAgentId] = useState('1');
  const [amount, setAmount] = useState('');

  const { toasts, showToast, dismissToast } = useToast();

  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  // For PIN+OTP modal
  const [cashOutPin, setCashOutPin] = useState('');
  const [cashOutOtp, setCashOutOtp] = useState('');

  const selectedAgent = agentsList.find(a => a.id === selectedAgentId) || agentsList[0];

  // Dynamic fee calculation: fee = amount * 0.015, live update
  const getAmountValues = () => {
    const amt = parseFloat(amount) || 0;
    const fee = amt * 0.015;
    const totalDeduction = amt + fee;
    return { amt, fee, totalDeduction };
  };

  const { amt: cleanAmt, fee: cleanFee, totalDeduction: cleanTotal } = getAmountValues();

  const { execute: sendOtp, isLoading: isSendingOtp } = useApiCall({
    successMessage: 'OTP sent to your email successfully',
    showToast,
    onSuccess: () => {
      setIsOTPModalOpen(true);
      setCashOutPin('');
      setCashOutOtp('');
    }
  });

  const { execute: confirmCashOut, isLoading: isConfirming } = useApiCall({
    successMessage: 'Cash out completed!',
    showToast,
    onSuccess: async (data) => {
      await fetchUserProfile();
      
      const cashOutAmt = parseFloat(amount);
      const feeAmt = cashOutAmt * 0.015;
      const totalDebited = cashOutAmt + feeAmt;
      
      setReceipt({
        ref: data.transaction_id,
        amount: cashOutAmt,
        fee: feeAmt,
        total: totalDebited,
        agent: selectedAgent.name,
        location: selectedAgent.location,
        date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });
      setCurrentStep('success');
    }
  });

  const handleInitiateCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter a valid cash-out amount', 'error');
      return;
    }
    if (user && user.balance < cleanTotal) {
      showToast(`Insufficient funds. Total wallet deduction is ${formatBDT(cleanTotal)} but you only have ${formatBDT(user.balance)}`, 'error');
      return;
    }

    sendOtp(() => api.post('/api/transactions/cashout/send-otp', {
      agent_phone: selectedAgent.phone
    }));
  };

  const handleConfirmCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashOutPin || !cashOutOtp) {
      showToast('Please enter both PIN and OTP', 'error');
      return;
    }

    setIsOTPModalOpen(false);
    setCurrentStep('processing');

    confirmCashOut(async () => {
      const cashOutAmt = parseFloat(amount);
      const feeAmt = cashOutAmt * 0.015;
      const totalDebited = cashOutAmt + feeAmt;
      
      const res = await api.post<any>('/api/transactions/cashout', {
        agent_phone: selectedAgent.phone,
        amount: totalDebited,
        pin: cashOutPin,
        otp: cashOutOtp
      });
      return res;
    }).then(res => {
      if (!res) {
        setCurrentStep('input');
      }
    });
  };

  return (
    <>
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-in fade-in duration-300">
      
      {/* Navigation Headers */}
      <div className="flex items-center gap-3 select-none">
        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
            Agent Cash Out
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Withdraw crisp paper currency at verified outlets
          </p>
        </div>
      </div>

      {currentStep === 'input' && (
        <>
          {/* AGENT SELECT CLOCKS */}
          <div className="flex flex-col gap-3 select-none">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
              Select Cash Withdrawal Agent
            </h3>
            
            <div className="flex flex-col gap-3">
              {agentsList.map((agent) => (
                <label
                  key={agent.id}
                  className={`flex items-center justify-between p-4 bg-[var(--bg-card)] border rounded-xl cursor-pointer transition-all duration-200 hover:border-cyan-400/25 ${
                    selectedAgentId === agent.id 
                      ? 'border-rose-500 bg-rose-500/5' 
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="agentRadioCashOut"
                      checked={selectedAgentId === agent.id}
                      onChange={() => setSelectedAgentId(agent.id)}
                      className="mt-1 accent-rose-500 cursor-pointer"
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-[var(--text-primary)]">
                        {agent.name}
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-rose-400" />
                        <span>{agent.location}</span>
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-[var(--bg-secondary)] py-1 px-2.5 rounded-lg border border-[var(--border)]">
                    {agent.phone}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* CASH OUT INPUT CARD BLOCK */}
          <Card className="flex flex-col gap-5">
            <form onSubmit={handleInitiateCashOut} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Amount to Withdraw (৳)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--text-secondary)] font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-sora font-extrabold text-xl w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-9 pr-4 text-[var(--text-primary)] outline-none focus:border-rose-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* DYNAMIC WITHDRAW COMPUTE SUMMARY SHOWN EXPLICITLY */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)] select-none">
                <div className="flex justify-between">
                  <span>Physical Cash to Receive:</span>
                  <span className="text-[var(--text-primary)] font-bold font-mono">
                    {amount ? formatBDT(cleanAmt) : '৳ 0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Out Fee (1.5%):</span>
                  <span className="text-rose-400">
                    {amount ? formatBDT(cleanFee) : '৳ 0.00'}
                  </span>
                </div>
                <div className="border-t border-[var(--border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--text-primary)]">
                  <span>Total Wallet Deduction:</span>
                  <span className="font-sora text-rose-400 font-extrabold">
                    {amount ? formatBDT(cleanTotal) : '৳ 0.00'}
                  </span>
                </div>
              </div>



              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 bg-gradient-to-r from-rose-500 to-red-500"
                id="btn-cash-out-submit"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  <>
                    <TrendingDown size={16} />
                    <span>Validate & Withdraw Cash</span>
                  </>
                )}
              </Button>

            </form>
          </Card>
        </>
      )}

      {currentStep === 'processing' && (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 select-none min-h-[300px]">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-rose-500 animate-spin mb-2" />
          <h3 className="font-sora font-semibold text-base text-[var(--text-primary)]">
            Connecting Agent Portal
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
            Please ask the agent partner to dispatch cash paper currency. Processing handshake coordinates...
          </p>
        </Card>
      )}

      {currentStep === 'success' && receipt && (
        <Card className="border border-rose-500/20 p-6 flex flex-col gap-6 shadow-xl select-none relative overflow-hidden animate-[scaleUp_0.3s_ease_out]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="text-center flex flex-col items-center gap-2">
            <CheckCircle size={48} className="text-[#00C9A7]" />
            <h3 className="font-sora font-extrabold text-xl text-[#00C9A7]">
              Withdrawal Success !
            </h3>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Collect paper banknotes from the agent partner
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center flex flex-col gap-1.5 shadow-inner">
            <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
              Physical Cash Received
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5 block leading-none">
              You will receive:
            </span>
            <h2 className="font-sora font-extrabold text-3xl text-white">
              {formatBDT(receipt.amount)}
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs font-semibold text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Selected Agent:</span>
              <span className="text-[var(--text-primary)] font-sora text-right">{receipt.agent}</span>
            </div>
            <div className="flex justify-between">
              <span>Agent Location:</span>
              <span className="text-[var(--text-primary)] text-right">{receipt.location}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash Out Fee (1.5%):</span>
              <span className="text-rose-400">{formatBDT(receipt.fee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Wallet Cost:</span>
              <span className="text-[var(--text-primary)] font-mono">{formatBDT(receipt.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction Reference:</span>
              <span className="text-[var(--text-primary)] font-mono">{receipt.ref}</span>
            </div>
            <div className="flex justify-between">
              <span>Settled Date:</span>
              <span className="text-[var(--text-primary)]">{receipt.date}</span>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2.5">
            <Button
              onClick={() => navigate('/home')}
              variant="primary"
              className="w-full bg-gradient-to-r from-[#2563EB] to-[#00C9A7]"
              id="success-withdrawal-done"
            >
              Back to Home Dashboard
            </Button>
            <button
              onClick={() => {
                setCurrentStep('input');
                setAmount('');
              }}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-white text-center py-2 transition-colors outline-none"
              id="success-withdrawal-again"
            >
              Make Another Withdrawal
            </button>
          </div>
        </Card>
      )}

      {/* PIN + OTP Modal */}
      <Modal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        title="Secured Authorization"
      >
        <form onSubmit={handleConfirmCashOut} className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-2">
            Enter your <strong>6-digit wallet PIN</strong> and the <strong>OTP</strong> sent to your email to confirm this cash outflow of {formatBDT(cleanTotal)} including commission fees.
          </p>
          


          {/* PIN Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Your Wallet Security PIN
            </label>
            <input
              type="password"
              placeholder="••••••"
              maxLength={6}
              value={cashOutPin}
              onChange={(e) => setCashOutPin(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-2 px-3 text-center text-xl font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              required
            />
          </div>

          {/* OTP Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              6-Digit OTP (Check Email)
            </label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={cashOutOtp}
              onChange={(e) => setCashOutOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-2 px-3 text-center text-xl font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              required
            />
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
            Security Tip: Always count cash banknotes from active agents prior to validating OTP.
          </p>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isConfirming || cashOutPin.length < 6 || cashOutOtp.length < 6}
          >
            {isConfirming ? 'Processing...' : 'Confirm Withdrawal'}
          </Button>
        </form>
      </Modal>

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1.0); opacity: 1; }
        }
      `}</style>

    </div>
    </>
  );
};

export default CashOutPage;
