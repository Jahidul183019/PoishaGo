import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { formatBDT } from '../../utils/format';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { OTPInput } from '../../components/ui/OTPInput';
import { 
  ArrowLeft, 
  Zap, 
  Droplet, 
  Flame, 
  Globe, 
  BookOpen, 
  Tv, 
  ChevronRight, 
  User, 
  Receipt, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export const BillPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserBalance } = useAuthStore();
  const { addTransaction, addNotification } = useWalletStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [customerID, setCustomerID] = useState('');
  const [billPeriod, setBillPeriod] = useState('June 2026');
  const [amount, setAmount] = useState('');
  const [errorText, setErrorText] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  const categories = [
    { id: 'electricity', label: 'Electricity', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'water', label: 'Water WASA', icon: Droplet, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { id: 'gas', label: 'Gas Titas', icon: Flame, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { id: 'internet', label: 'Internet', icon: Globe, color: 'text-[#00C9A7] bg-[#00C9A7]/10 border-[#00C9A7]/20' },
    { id: 'education', label: 'Education', icon: BookOpen, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'tv', label: 'DTH / Cable TV', icon: Tv, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  ];

  const categoryCompanies: Record<string, string[]> = {
    electricity: ['DESCO (Dhaka Electricity Supply)', 'DPDC (Dhaka Power)', 'NESCO (Northern Electricity)'],
    water: ['Dhaka WASA', 'Chittagong WASA', 'Khulna WASA'],
    gas: ['Titas Gas Transmission', 'Jalalabad Gas Co.', 'Bakhrabad Gas'],
    internet: ['Link3 Broadband', 'Carnival Internet', 'Amber IT'],
    education: ['Dhaka University (DU)', 'BUET', 'North South University (NSU)'],
    tv: ['Akash DTH Bangladesh', 'Bengal Digital Cable TV'],
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentStep(2);
  };

  const handleSelectCompany = (comp: string) => {
    setSelectedCompany(comp);
    setCurrentStep(3);
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (customerID.trim().length < 5) {
      setErrorText('Please enter a valid Customer / Account ID (minimum 5 characters)');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorText('Please enter a valid amount greater than 0');
      return;
    }

    if (user && user.balance < amt) {
      setErrorText(`Insufficient balance. Your current purse represents ${formatBDT(user.balance)}`);
      return;
    }

    setCurrentStep(4); // Trigger PIN input OTP view
  };

  const handleOTPComplete = (code: string) => {
    // Progress directly to success
    if (user) {
      const payAmount = parseFloat(amount);
      const refNo = 'TXN_BILL_' + Math.floor(10000000 + Math.random() * 90000000);

      // Mutate User Balance inside Auth store
      const newBal = user.balance - payAmount;
      updateUserBalance(newBal);

      // Logs transaction under Wallet Ledger
      addTransaction({
        sender_wallet_id: user.wallet_number,
        sender_name: user.full_name,
        receiver_wallet_id: 'PG-WAL-BILL-CLEAR',
        receiver_name: selectedCompany,
        amount: payAmount,
        txn_type: 'bill_pay',
        status: 'completed',
        fee: 0,
        reference_no: refNo,
        company_name: selectedCompany
      });

      // Inbox notification trigger
      addNotification(
        `Utility bill paid to ${selectedCompany}`,
        `Payment of ${formatBDT(payAmount)} to bill account: ${customerID} settled successfully. Reference: ${refNo}. Current balance: ${formatBDT(newBal)}`,
        'debit'
      );

      setReceipt({
        ref: refNo,
        amount: payAmount,
        company: selectedCompany,
        customer: customerID,
        period: billPeriod,
        date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });

      setCurrentStep(5);
    }
  };

  const handleBackNavigation = () => {
    if (currentStep === 5) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-in fade-in duration-300">
      
      {/* Universal Heading Row */}
      <div className="flex items-center gap-3 select-none">
        {currentStep !== 5 && (
          <button
            onClick={handleBackNavigation}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
            Utility Bill Payments
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {currentStep === 1 && 'Step 1 of 5: Select a bill category'}
            {currentStep === 2 && 'Step 2 of 5: Select service provider company'}
            {currentStep === 3 && 'Step 3 of 5: Configure billing details'}
            {currentStep === 4 && 'Step 4 of 5: Finalize PIN security checks'}
            {currentStep === 5 && 'Payment Receipt: Settled successfully'}
          </p>
        </div>
      </div>

      {/* STEP 1: CATEGORY GRID SPLITS */}
      {currentStep === 1 && (
        <div className="grid grid-cols-2 gap-4 select-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-cyan-400/25 p-5 rounded-2xl flex flex-col gap-4 text-left transition-all hover:-translate-y-0.5 group outline-none"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-200 ${cat.color}`}>
                  <Icon size={18} />
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
          })}
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
                <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-white transition-colors" />
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

            {errorText && (
              <p className="text-xs text-rose-400 font-semibold py-1.5 px-3 bg-rose-500/10 rounded-lg text-center">
                {errorText}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              id="btn-bill-pay-initiate"
            >
              <Receipt size={16} />
              <span>Validate Invoice details</span>
            </Button>

          </form>
        </Card>
      )}

      {/* STEP 4: OTP DRAWER AUTHENTICATION PIN */}
      {currentStep === 4 && (
        <Card className="flex flex-col gap-5 text-center p-6 select-none">
          <h3 className="font-sora font-bold text-lg text-[var(--text-primary)]">
            Authorization Invoice
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-4">
            Verify transaction of <strong>{amount ? formatBDT(parseFloat(amount)) : '0.00'}</strong> to <strong>{selectedCompany}</strong>. Enter your 6-digit wallet security PIN code:
          </p>
          
          <div className="py-4">
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold hover:underline border-t border-[var(--border)] pt-4 mt-2 outline-none"
          >
            <ArrowLeft size={12} />
            <span>Amend Billing Parameters</span>
          </button>
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
            <h2 className="font-sora font-extrabold text-3xl text-white">
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
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-white text-center py-2 transition-colors outline-none"
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
  );
};

export default BillPaymentPage;
