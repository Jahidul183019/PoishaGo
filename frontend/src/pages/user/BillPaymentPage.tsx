import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import api from '../../utils/api';
import { formatBDT } from '../../utils/format';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import OTPInput from '../../components/ui/OTPInput';
import { useToast } from '../../hooks/useToast';
import { useApiCall } from '../../hooks/useApiCall';
import { ToastContainer } from '../../components/ui/Toast';
import { 
  ArrowLeft, 
  Zap, 
  Droplet, 
  Flame, 
  Globe, 
  BookOpen, 
  Tv, 
  ChevronRight,
  Tag,
  User, 
  Receipt, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

// Map icon_id strings to actual Lucide components
const iconMap: Record<string, any> = {
  'Zap': Zap,
  'Droplet': Droplet,
  'Flame': Flame,
  'Globe': Globe,
  'BookOpen': BookOpen,
  'Tv': Tv,
  'Tag': Tag
};

const categoryCompanies: Record<string, string[]> = {
  electricity: ['DESCO (Dhaka Electricity Supply)', 'DPDC (Dhaka Power)', 'NESCO (Northern Electricity)'],
  water: ['Dhaka WASA', 'Chittagong WASA', 'Khulna WASA'],
  gas: ['Titas Gas Transmission', 'Jalalabad Gas Co.', 'Bakhrabad Gas'],
  internet: ['Link3 Broadband', 'Carnival Internet', 'Amber IT'],
  education: ['Dhaka University (DU)', 'BUET', 'North South University (NSU)'],
  tv: ['Akash DTH Bangladesh', 'Bengal Digital Cable TV'],
};

export const BillPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, fetchUserProfile } = useAuthStore();
  const { billCategories, fetchBillCategories } = useWalletStore();
  const { toasts, showToast, dismissToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [customerID, setCustomerID] = useState('');
  const [billPeriod, setBillPeriod] = useState('June 2026');
  const [amount, setAmount] = useState('');
  const [billPin, setBillPin] = useState('');
  const [billOtp, setBillOtp] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    if (billCategories.length === 0) {
      fetchBillCategories();
    }
  }, [billCategories, fetchBillCategories]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentStep(2);
  };

  const handleSelectCompany = (comp: string) => {
    setSelectedCompany(comp);
    setCurrentStep(3);
  };

  const { execute: sendOtp, isLoading: isSendingOtp } = useApiCall({
    successMessage: 'OTP sent to your email successfully',
    showToast,
    onSuccess: () => {
      setCurrentStep(4);
    }
  });

  const { execute: confirmPayment, isLoading: isConfirming } = useApiCall({
    successMessage: 'Bill paid successfully!',
    showToast,
    onSuccess: async (data) => {
      await fetchUserProfile();
      
      setReceipt({
        ref: data.transaction_id,
        amount: parseFloat(amount),
        company: selectedCompany,
        customer: customerID,
        period: billPeriod,
        date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });

      setCurrentStep(5);
    }
  });

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (customerID.trim().length < 5) {
      showToast('Please enter a valid Customer / Account ID (minimum 5 characters)', 'error');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (user && user.balance < amt) {
      showToast(`Insufficient balance. Your current purse represents ${formatBDT(user.balance)}`, 'error');
      return;
    }

    sendOtp(() => api.post('/api/transactions/bill/send-otp', {}));
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billPin || billOtp.length < 6) return;
    
    confirmPayment(async () => {
      const payAmount = parseFloat(amount);
      const res = await api.post<any>('/api/transactions/bill', {
        biller_name: selectedCompany,
        account_number: customerID,
        amount: payAmount,
        pin: billPin,
        otp: billOtp
      });
      return res;
    }).then(res => {
      if (!res) {
        setCurrentStep(3);
      }
    });
  };

  const handleBackNavigation = () => {
    if (isSendingOtp || isConfirming) return;
    if (currentStep === 5) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      navigate('/home');
    }
  };

  return (
    <>
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-in fade-in duration-300">
      
      {/* Universal Heading Row */}
      <div className="flex items-center gap-3 select-none">
        {currentStep !== 5 && (
          <button
            onClick={handleBackNavigation}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
            Utility Bill Payments
          </h1>
        </div>
      </div>

      {/* STEP 1: CATEGORY GRID SPLITS */}
      {currentStep === 1 && (
        <div className="grid grid-cols-2 gap-4 select-none">
          {Array.isArray(billCategories) && billCategories.length > 0 ? billCategories.map((cat) => {
            const IconComp = iconMap[cat.icon_id];
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-cyan-400/25 p-5 rounded-2xl flex flex-col gap-4 text-left transition-all hover:-translate-y-0.5 group outline-none"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-200 ${cat.color}`}>
                  {IconComp && <IconComp size={18} />}
                </div>
                <div>
                  <h4 className="font-sora font-bold text-sm text-[var(--text-primary)]">
                    {cat.label}
                  </h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    No payment fees
                  </p>
                </div>
              </button>
            );
          }) : (
            <div className="col-span-2 py-12 text-center text-xs text-[var(--text-secondary)] font-semibold">
              Loading biller registries from central bank clearing house...
            </div>
          )}
        </div>
      )}

      {/* STEP 2: COMPANY LIST PROVIDER SELECTORS */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-3 select-none">
          <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
            Choose Bill Organization Provider
          </h3>
          <div className="flex flex-col gap-2.5">
            {categoryCompanies[selectedCategory]?.map((company) => (
              <button
                key={company}
                onClick={() => handleSelectCompany(company)}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[#00C9A7]/45 rounded-xl p-4 text-left flex items-center justify-between text-sm font-semibold transition-all group outline-none"
              >
                <span className="text-[var(--text-primary)]">{company}</span>
                <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: TRANSACTION DETAILS CONFIGURE FORM */}
      {currentStep === 3 && (
        <Card className="flex flex-col gap-5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/15 rounded-xl text-xs font-semibold text-[var(--text-primary)]">
            Provider: <strong className="text-[#00C9A7] font-sora">{selectedCompany}</strong>
          </div>

          <form onSubmit={handleInitiatePayment} className="flex flex-col gap-4">
            
            {/* Customer Account ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Customer account ID
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="e.g. DU-953810 or DES-50931"
                  value={customerID}
                  onChange={(e) => setCustomerID(e.target.value)}
                  className="font-mono w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Bill Period */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Billing Month / Period
              </label>
              <select
                value={billPeriod}
                onChange={(e) => setBillPeriod(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              >
                <option value="June 2026">June 2026</option>
                <option value="May 2026">May 2026</option>
                <option value="April 2026">April 2026</option>
                <option value="Full Year 2026">Full Year 2026</option>
              </select>
            </div>

            {/* Amount entry */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Bill Amount (৳)
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
                  className="font-sora font-extrabold text-xl w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-9 pr-4 text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Charges box */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)] select-none">
              <div className="flex justify-between">
                <span>Commission Processing Fee:</span>
                <span className="text-[#00C9A7]">৳ 0.00 (Free)</span>
              </div>
              <div className="border-t border-[var(--border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--text-primary)]">
                <span>Total Debit Amount:</span>
                <span className="font-sora text-[#00C9A7] font-extrabold">
                  {amount ? formatBDT(parseFloat(amount)) : '৳ 0.00'}
                </span>
              </div>
            </div>



            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              id="btn-bill-pay-initiate"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                <>
                  <Receipt size={16} />
                  <span>Validate Invoice details</span>
                </>
              )}
            </Button>

          </form>
        </Card>
      )}

      {/* STEP 4: OTP DRAWER AUTHENTICATION PIN */}
      {currentStep === 4 && (
        <Card className="flex flex-col gap-5 text-center p-6 select-none">
          <form onSubmit={handleConfirmPayment} className="flex flex-col gap-4">
            <h3 className="font-sora font-bold text-lg text-[var(--text-primary)]">
              Authorization Invoice
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-4">
              Authorize <strong>{formatBDT(parseFloat(amount))}</strong> payment to <strong>{selectedCompany}</strong>.
            </p>
            


            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase text-left">Wallet Security PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={billPin}
                  onChange={(e) => setBillPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-center text-xl font-bold tracking-widest text-[var(--text-primary)] outline-none focus:border-[#00C9A7]"
                  placeholder="••••••"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase text-left">OTP from Email</label>
                <div className="py-2">
                  <OTPInput length={6} onComplete={(code) => setBillOtp(code)} />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={isConfirming || billOtp.length < 6}
            >
              {isConfirming ? 'Processing...' : 'Confirm Payment'}
            </Button>

            {!isConfirming && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold hover:underline border-t border-[var(--border)] pt-4 mt-2 outline-none"
              >
                <ArrowLeft size={12} />
                <span>Amend Billing Parameters</span>
              </button>
            )}
          </form>
        </Card>
      )}

      {/* STEP 5: SUCCESS DIGITAL INVOICE RECEIPT */}
      {currentStep === 5 && receipt && (
        <Card className="border border-[#00C9A7]/20 p-6 flex flex-col gap-6 shadow-xl select-none relative overflow-hidden animate-[scaleUp_0.3s_ease_out]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C9A7]/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="text-center flex flex-col items-center gap-2">
            <CheckCircle size={48} className="text-[#00C9A7] drop-shadow-[0_0_10px_rgba(0,201,167,0.3)]" />
            <h3 className="font-sora font-extrabold text-xl text-[#00C9A7]">
              Bill Paid Settled !
            </h3>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Digital invoice dispatched to your email
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center flex flex-col gap-1.5 shadow-inner">
            <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
              Paid Amount (BDT)
            </span>
            <h2 className="font-sora font-extrabold text-3xl text-[var(--text-primary)]">
              {formatBDT(receipt.amount)}
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-xs font-semibold text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Billed Company:</span>
              <span className="text-[var(--text-primary)] font-sora text-right">{receipt.company}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer ID / Ref:</span>
              <span className="text-[var(--text-primary)] font-mono text-right">{receipt.customer}</span>
            </div>
            <div className="flex justify-between">
              <span>Billing period:</span>
              <span className="text-[var(--text-primary)] text-right">{receipt.period}</span>
            </div>
            <div className="flex justify-between">
              <span>Commission Processing Cost:</span>
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
              id="success-billpay-done"
            >
              Back to Home Dashboard
            </Button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setCustomerID('');
                setAmount('');
              }}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center py-2 transition-colors outline-none"
              id="success-billpay-again"
            >
              Settle Another Utility Invoice
            </button>
          </div>
        </Card>
      )}

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

export default BillPaymentPage;
