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
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Lock 
} from 'lucide-react';

export const CashInPage: React.FC = () => {
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
  const [cashInPin, setCashInPin] = useState('');
  const [cashInOtp, setCashInOtp] = useState('');

  const selectedAgent = agentsList.find(a => a.id === selectedAgentId) || agentsList[0];

  const { execute: sendOtp, isLoading: isSendingOtp } = useApiCall({
    successMessage: 'OTP sent to agent successfully',
    showToast,
    onSuccess: () => {
      setIsOTPModalOpen(true);
      setCashInPin('');
      setCashInOtp('');
    }
  });

  const { execute: confirmCashIn, isLoading: isConfirming } = useApiCall({
    successMessage: 'Cash in completed!',
    showToast,
    onSuccess: async (data) => {
      await fetchUserProfile();
      setReceipt({
        ref: data.transaction_id,
        amount: parseFloat(amount),
        agent: selectedAgent.name,
        location: selectedAgent.location,
        date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });
      setCurrentStep('success');
    }
  });

  const handleInitiateCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 100) {
      showToast('Minimum Cash In threshold is ৳100.00', 'error');
      return;
    }
    
    sendOtp(() => api.post('/api/transactions/cashin/send-otp', {
      agent_phone: selectedAgent.phone
    }));
  };

  const handleConfirmCashIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashInPin || !cashInOtp) {
      showToast('Please enter both PIN and OTP', 'error');
      return;
    }
    
    setIsOTPModalOpen(false);
    setCurrentStep('processing');
    
    confirmCashIn(async () => {
      const res = await api.post<any>('/api/transactions/cashin', {
        agent_phone: selectedAgent.phone,
        amount: parseFloat(amount),
        pin: cashInPin,
        otp: cashInOtp
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
      
      {/* Header */}
      <div className="flex items-center gap-3 select-none">
        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
            Agent Cash In
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Deposit cash into your mobile wallet
          </p>
        </div>
      </div>

      {currentStep === 'input' && (
        <>
          {/* SELECT AGENT CAROUSEL LIST */}
          <div className="flex flex-col gap-3 select-none">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
              Select Nearby Authenticated Agent
            </h3>
            
            <div className="flex flex-col gap-3">
              {agentsList.map((agent) => (
                <label
                  key={agent.id}
                  className={`flex items-center justify-between p-4 bg-[var(--bg-card)] border rounded-xl cursor-pointer transition-all duration-200 hover:border-cyan-400/25 ${
                    selectedAgentId === agent.id 
                      ? 'border-[#00C9A7] bg-[#00C9A7]/5' 
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="agentRadio"
                      checked={selectedAgentId === agent.id}
                      onChange={() => setSelectedAgentId(agent.id)}
                      className="mt-1 accent-[#00C9A7] cursor-pointer"
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-[var(--text-primary)]">
                        {agent.name}
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-[var(--accent-teal)]" />
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

          {/* MAIN CASH IN FORM PANEL */}
          <Card className="flex flex-col gap-5">
            <form onSubmit={handleInitiateCashIn} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Amount in BDT (৳)
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
                    className="font-sora tracking-wide text-xl font-extrabold w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-9 pr-4 text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] pl-0.5">
                  Deposit fee: <strong className="text-[#00C9A7]">৳0.00 (Zero Commission Fee)</strong>
                </p>
              </div>



              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                id="btn-cash-in-submit"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  <>
                    <Wallet size={16} />
                    <span>Confirm Deposit Payload</span>
                  </>
                )}
              </Button>

            </form>
          </Card>
        </>
      )}

      {currentStep === 'processing' && (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 select-none min-h-[300px]">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-[#00C9A7] animate-spin mb-2" />
          <h3 className="font-sora font-semibold text-base text-[var(--text-primary)]">
            Contacting Selected Agent
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
            Please present this deposit challenge to your physical agent to verify the cash notes and sign off the transaction.
          </p>
        </Card>
      )}

      {currentStep === 'success' && receipt && (
        <Card className="border border-[#00C9A7]/20 p-6 flex flex-col gap-6 shadow-xl select-none relative overflow-hidden animate-[scaleUp_0.3s_ease_out]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C9A7]/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="text-center flex flex-col items-center gap-2">
            <CheckCircle size={48} className="text-[#00C9A7] drop-shadow-[0_0_10px_rgba(0,201,167,0.3)]" />
            <h3 className="font-sora font-extrabold text-xl text-[#00C9A7]">
              Deposit Successful !
            </h3>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Amount added to your wallet
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center flex flex-col gap-1.5 shadow-inner">
            <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
              Total Cashed In
            </span>
            <h2 className="font-sora font-extrabold text-3xl text-[var(--text-primary)]">
              {formatBDT(receipt.amount)}
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs font-semibold text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Agent Partner:</span>
              <span className="text-[var(--text-primary)] font-sora text-right">{receipt.agent}</span>
            </div>
            <div className="flex justify-between">
              <span>Agent Outlet:</span>
              <span className="text-[var(--text-primary)] text-right">{receipt.location}</span>
            </div>
            <div className="flex justify-between">
              <span>Commission Surcharge:</span>
              <span className="text-[#00C9A7]">৳ 0.00 (Free)</span>
            </div>
            <div className="flex justify-between">
              <span>Settled Date:</span>
              <span className="text-[var(--text-primary)]">{receipt.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction ID:</span>
              <span className="text-[var(--text-primary)] font-mono">{receipt.ref}</span>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2.5">
            <Button
              onClick={() => navigate('/home')}
              variant="primary"
              className="w-full"
              id="success-deposit-done"
            >
              Back to Home Dashboard
            </Button>
            <button
              onClick={() => {
                setCurrentStep('input');
                setAmount('');
              }}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center py-2 transition-colors outline-none"
              id="success-deposit-again"
            >
              Make Another Deposit
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
        <form onSubmit={handleConfirmCashIn} className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-2">
            Enter your <strong>6-digit wallet PIN</strong> and ask the agent for the <strong>OTP</strong> sent to their email.
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
              value={cashInPin}
              onChange={(e) => setCashInPin(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-2 px-3 text-center text-xl font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              required
            />
          </div>

          {/* OTP Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              6-Digit OTP (Agent's Email)
            </label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={cashInOtp}
              onChange={(e) => setCashInOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-2 px-3 text-center text-xl font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              required
            />
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
            Security Tip: Never share your PIN or OTP with anyone.
          </p>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isConfirming || cashInPin.length < 6 || cashInOtp.length < 6}
          >
            {isConfirming ? 'Processing...' : 'Confirm Payment'}
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

export default CashInPage;
