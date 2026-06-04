import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { formatBDT } from '../../utils/format';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import OTPInput from '../../components/ui/OTPInput';
import { 
  ArrowLeft, 
  UserCheck, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  History, 
  Copy, 
  ChevronRight 
} from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserBalance } = useAuthStore();
  const { addTransaction, addNotification } = useWalletStore();

  // Receivers suggestions
  const suggestedContacts = [
    { name: 'Fatema Begum', phone: '01711000002', initials: 'FB' },
    { name: 'Rafiq Ahmed', phone: '01711000003', initials: 'RA' },
    { name: 'Kamrul Islam', phone: '01711000004', initials: 'KI' },
    { name: 'Nusrat Jahan', phone: '01811000005', initials: 'NJ' },
  ];

  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [errorText, setErrorText] = useState('');
  
  // OTP modal triggers
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const selectSuggestedContact = (name: string, phone: string) => {
    setRecipientPhone(phone);
    setRecipientName(name);
    setErrorText('');
  };

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (recipientPhone.length < 11) {
      setErrorText('Please enter a valid 11-digit Bangladeshi mobile number.');
      return;
    }
    
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorText('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (user && user.balance < amt) {
      setErrorText(`Insufficient balance. Your current balance is ${formatBDT(user.balance)}`);
      return;
    }

    // All good, open verification drawer
    setIsOTPModalOpen(true);
  };

  const handleOTPCompleteComp = (otpCode: string) => {
    setIsOTPModalOpen(false);
    setCurrentStep('processing');

    setTimeout(() => {
      if (user) {
        const transferAmt = parseFloat(amount);
        const resolvedName = recipientName || `Wallet (${recipientPhone})`;
        const refNo = 'TXN' + Math.floor(10000000 + Math.random() * 90000000);

        // Deduct sender balance inside Auth Store
        const newBal = user.balance - transferAmt;
        updateUserBalance(newBal);

        // Record Ledger transaction inside Wallet Store
        const ledgerTxn = addTransaction({
          sender_wallet_id: user.wallet_number,
          sender_name: user.full_name,
          receiver_wallet_id: 'PG-WAL-' + recipientPhone.slice(-5),
          receiver_name: resolvedName,
          amount: transferAmt,
          txn_type: 'send_money',
          status: 'completed',
          fee: 0,
          reference_no: refNo
        });

        // Trigger in-app alerts
        addNotification(
          `Sent ${formatBDT(transferAmt)} to ${resolvedName}`,
          `Successfully debited ${formatBDT(transferAmt)} from your wallet. Reference: ${refNo}. Current balance: ${formatBDT(newBal)}`,
          'debit'
        );

        setGeneratedReceipt({
          ref: refNo,
          amount: transferAmt,
          receiver: resolvedName,
          phone: recipientPhone,
          date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
        });

        setCurrentStep('success');
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-in fade-in duration-300">
      
      {/* Header back navigation details */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors outline-none"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-sora font-extrabold text-xl text-[var(--text-primary)]">
            Send Money
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Peer-to-peer instant cash transfer
          </p>
        </div>
      </div>

      {currentStep === 'input' && (
        <>
          {/* HORIZONTAL SCROLL CONTACT SUGGESTIONS */}
          <div className="flex flex-col gap-2.5 select-none">
            <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest pl-1">
              Favorite Citizens
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {suggestedContacts.map((contact) => (
                <button
                  key={contact.phone}
                  onClick={() => selectSuggestedContact(contact.name, contact.phone)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shrink-0 hover:border-[#00C9A7]/40 text-left transition-all outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center font-sora text-xs font-bold text-white uppercase">
                    {contact.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--text-primary)] leading-none truncate max-w-[100px]">
                      {contact.name}
                    </h4>
                    <p className="text-[9px] text-[var(--text-secondary)] font-mono mt-1 leading-none">
                      {contact.phone}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM SCHEMATICS */}
          <Card className="flex flex-col gap-5">
            
            <form onSubmit={handleInitiateSend} className="flex flex-col gap-4">
              
              {/* Recipient Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Recipient Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-semibold font-mono">
                    +88
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. 01711000002"
                    maxLength={11}
                    value={recipientPhone}
                    onChange={(e) => {
                      setRecipientPhone(e.target.value);
                      const f = suggestedContacts.find(c => c.phone === e.target.value);
                      if (f) setRecipientName(f.name);
                      else setRecipientName('');
                    }}
                    className="font-mono w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-14 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                    required
                  />
                </div>
                {recipientName && (
                  <p className="text-[11px] text-[#00C9A7] font-semibold pl-1">
                    ✓ Verified Citizen: {recipientName}
                  </p>
                )}
              </div>

              {/* Amount input */}
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
                    className="font-sora font-extrabold text-xl w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 pl-9 pr-4 text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Short Personal note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eid Salami, Gift"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
                />
              </div>

              {/* Fee computations card summary */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)] select-none">
                <div className="flex justify-between">
                  <span>Transfer Commission Fee:</span>
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
                <p className="text-xs text-rose-400 font-semibold text-center py-1 bg-rose-500/10 rounded-lg">
                  {errorText}
                </p>
              )}

              {/* Initiate Transfer */}
              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                id="btn-initiate-transfer"
              >
                <Send size={16} />
                <span>Validate & Transfer</span>
              </Button>

            </form>
          </Card>
        </>
      )}

      {/* STEP LOADING PROGRESS OVERLAY */}
      {currentStep === 'processing' && (
        <Card className="p-8 text-center flex flex-col items-center gap-4 select-none justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-[#00C9A7] animate-spin mb-2" />
          <h3 className="font-sora font-semibold text-base text-[var(--text-primary)]">
            Securing Transfer Protocols
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
            Please wait while the transaction payload is verified and signed securely with the central clearing house.
          </p>
        </Card>
      )}

      {/* SUCCESS DISPLAY RECEIPT */}
      {currentStep === 'success' && generatedReceipt && (
        <Card className="border border-[#00C9A7]/20 p-6 flex flex-col gap-6 shadow-xl select-none relative overflow-hidden animate-[scaleUp_0.3s_ease_out]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C9A7]/5 rounded-full blur-xl pointer-events-none" />
          
          {/* Top visual check */}
          <div className="text-center flex flex-col items-center gap-2">
            <CheckCircle size={48} className="text-[#00C9A7] drop-shadow-[0_0_10px_rgba(0,201,167,0.3)]" />
            <h3 className="font-sora font-extrabold text-xl text-[#00C9A7]">
              Success Transfer !
            </h3>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Money has been sent successfully
            </p>
          </div>

          {/* Amount Box */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center flex flex-col gap-1.5 shadow-inner">
            <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
              Amount Transferred
            </span>
            <h2 className="font-sora font-extrabold text-3xl text-white">
              {formatBDT(generatedReceipt.amount)}
            </h2>
          </div>

          {/* Audit parameters table */}
          <div className="flex flex-col gap-3 text-xs font-semibold text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Recipient Mobile:</span>
              <span className="text-[var(--text-primary)] font-mono">{generatedReceipt.phone}</span>
            </div>
            <div className="flex justify-between">
              <span>Recipient Name:</span>
              <span className="text-[var(--text-primary)] font-sora text-right">{generatedReceipt.receiver}</span>
            </div>
            <div className="flex justify-between">
              <span>Commission Fee:</span>
              <span className="text-[#00C9A7]">৳ 0.00 (Free)</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction ID:</span>
              <span className="text-[var(--text-primary)] font-mono">{generatedReceipt.ref}</span>
            </div>
            <div className="flex justify-between">
              <span>Settled Time:</span>
              <span className="text-[var(--text-primary)]">{generatedReceipt.date}</span>
            </div>
          </div>

          {/* Options row */}
          <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2.5">
            <Button
              onClick={() => navigate('/home')}
              variant="primary"
              className="w-full"
              id="success-receipt-done"
            >
              Back to Home Dashboard
            </Button>
            <button
              onClick={() => {
                setCurrentStep('input');
                setRecipientPhone('');
                setRecipientName('');
                setAmount('');
                setMessage('');
              }}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-white text-center py-2 transition-colors outline-none"
              id="success-receipt-send-again"
            >
              Transfer to Another Contact
            </button>
          </div>
        </Card>
      )}

      {/* OTP DRAWER PIN PROMPTS OVERLAY */}
      <Modal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        title="Secured Authorization"
      >
        <div className="flex flex-col gap-4 text-center">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-2">
            Please enter your <strong>6-digit wallet security code PIN</strong> to finalize this transaction securely.
          </p>
          
          <div className="py-4">
            <OTPInput length={6} onComplete={handleOTPCompleteComp} />
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
            Safety tip: Never disclose your authorization PIN.
          </p>
        </div>
      </Modal>

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1.0); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default SendMoneyPage;
