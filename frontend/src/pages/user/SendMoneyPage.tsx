import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import api from '../../utils/api';
import { formatBDT } from '../../utils/format';
import Button from '../../components/ui/Button';
import TapAndHoldButton from '../../components/ui/TapAndHoldButton';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import OTPInput from '../../components/ui/OTPInput';
import { useToast, useToastStore } from '../../hooks/useToast';
import { useApiCall } from '../../hooks/useApiCall';
import { 
  ArrowLeft, 
  UserCheck, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  History, 
  Copy, 
  ChevronRight,
  UserPlus,
  X
} from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, fetchUserProfile } = useAuthStore();
  const { toasts, showToast, dismissToast } = useToast();

  const [suggestedContacts, setSuggestedContacts] = useState<{contact_id?: number, name: string, phone: string, initials: string}[]>([]);

  const { execute: loadContacts } = useApiCall({
    showToast,
    onSuccess: (data) => {
      if (Array.isArray(data)) setSuggestedContacts(data);
    }
  });

  const fetchContacts = () => {
    loadContacts(() => api.get<any[]>('/api/contacts'));
  };

  React.useEffect(() => {
    fetchContacts();
  }, []);

  // Add contact modal state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactNickname, setNewContactNickname] = useState('');

  const { execute: addContact, isLoading: addContactLoading } = useApiCall({
    successMessage: 'Contact added successfully',
    showToast,
    onSuccess: () => {
      setIsAddContactOpen(false);
      setNewContactPhone('');
      setNewContactNickname('');
      fetchContacts();
    }
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactPhone.length < 11) {
      showToast('Please enter a valid 11-digit phone number.', 'error');
      return;
    }
    addContact(() => api.post<any>('/api/contacts', { phone: newContactPhone, nickname: newContactNickname }));
  };

  const { execute: removeContact } = useApiCall({
    successMessage: 'Contact removed',
    showToast,
    onSuccess: () => {
      fetchContacts();
    }
  });

  const handleRemoveContact = (contactId: number) => {
    removeContact(() => api.delete(`/api/contacts/${contactId}`));
  };


  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  // OTP modal triggers
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  const [transferPin, setTransferPin] = useState('');
  const [transferOtp, setTransferOtp] = useState('');

  const isFavoriteContact = suggestedContacts.some(c => c.phone === recipientPhone);
  const amtParsed = parseFloat(amount);
  const isValidAmount = !isNaN(amtParsed) && amtParsed > 0;
  const computedFee = isValidAmount ? (isFavoriteContact ? 0.00 : 5.00) : 0.00;
  const computedTotalDebit = isValidAmount ? amtParsed + computedFee : 0.00;

  const selectSuggestedContact = (name: string, phone: string) => {
    setRecipientPhone(phone);
    setRecipientName(name);
  };

  const { execute: sendTransferOtp, isLoading: isSendingOtp } = useApiCall({
    successMessage: 'Transfer OTP sent to your email',
    showToast,
    onSuccess: () => {
      setIsOTPModalOpen(true);
    }
  });

  const { execute: confirmTransfer, isLoading: isConfirming } = useApiCall({
    successMessage: 'Money sent successfully!',
    showToast,
    onSuccess: async (data) => {
      await fetchUserProfile();
      
      const resolvedName = recipientName || `Wallet (${recipientPhone})`;

      setGeneratedReceipt({
        ref: data.transaction_id,
        amount: parseFloat(amount),
        fee: computedFee,
        receiver: resolvedName,
        phone: recipientPhone,
        date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });

      setCurrentStep('success');
    }
  });

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientPhone.length < 11) {
      showToast('Please enter a valid 11-digit Bangladeshi mobile number.', 'error');
      return;
    }
    
    if (!isValidAmount) {
      showToast('Please enter a valid transfer amount greater than 0.', 'error');
      return;
    }

    if (user && user.balance < computedTotalDebit) {
      showToast(`Insufficient balance. Your current balance is ${formatBDT(user.balance)}`, 'error');
      return;
    }

    sendTransferOtp(() => api.post('/api/send-transfer-otp', {}));
  };

  const handleConfirmTransfer = () => {
    setIsOTPModalOpen(false);
    setCurrentStep('processing');

    confirmTransfer(async () => {
      const res = await api.post<any>('/api/transactions/send', {
        receiver_phone: recipientPhone,
        amount: parseFloat(amount),
        pin: transferPin,
        otp: transferOtp,
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
      
      {/* Header back navigation details */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors outline-none"
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
            <div className="flex items-center justify-between pl-1 pr-1">
              <h3 className="text-xs font-bold font-sora text-[var(--text-secondary)] uppercase tracking-widest">
                Favourite Contacts
              </h3>
              <button
                onClick={() => { setIsAddContactOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#00C9A7] hover:text-[#00C9A7]/80 transition-colors outline-none"
                id="btn-add-contact"
              >
                <UserPlus size={13} />
                Add Contact
              </button>
            </div>
            {suggestedContacts.length === 0 ? (
              <div className="text-xs text-[var(--text-secondary)] pl-1 py-1">No contacts yet. Click "Add Contact" to save someone!</div>
            ) : (
              <div className="flex flex-wrap gap-3 pb-2">
                {suggestedContacts.map((contact) => (
                  <div
                    key={contact.contact_id || contact.phone}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shrink-0 hover:border-[#00C9A7]/40 transition-all relative group"
                  >
                    <button
                      onClick={() => selectSuggestedContact(contact.name, contact.phone)}
                      className="flex items-center gap-2.5 outline-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#00C9A7] flex items-center justify-center font-sora text-xs font-bold text-white uppercase">
                        {contact.initials}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-[var(--text-primary)] leading-none truncate max-w-[90px]">
                          {contact.name}
                        </h4>
                        <p className="text-[9px] text-[var(--text-secondary)] font-mono mt-1 leading-none">
                          {contact.phone}
                        </p>
                      </div>
                    </button>
                    {contact.contact_id && (
                      <button
                        onClick={() => handleRemoveContact(contact.contact_id!)}
                        className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all outline-none"
                        title="Remove contact"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                      const val = e.target.value.replace(/\\D/g, '').slice(0, 11);
                      setRecipientPhone(val);
                      const f = suggestedContacts.find(c => c.phone === val);
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
                  {computedFee === 0 ? (
                    <span className="text-[#00C9A7]">৳ 0.00 (Free)</span>
                  ) : (
                    <span className="text-rose-400">৳ {computedFee.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-[var(--border)] pt-2.5 flex justify-between text-sm font-bold text-[var(--text-primary)]">
                  <span>Total Debit Amount:</span>
                  <span className="font-sora text-[#00C9A7] font-extrabold">
                    {formatBDT(computedTotalDebit)}
                  </span>
                </div>
              </div>



              {/* Initiate Transfer */}
              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                id="btn-initiate-transfer"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Validate & Transfer</span>
                  </>
                )}
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
            <h2 className="font-sora font-extrabold text-3xl text-[var(--text-primary)]">
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
              {generatedReceipt.fee === 0 ? (
                <span className="text-[#00C9A7]">৳ 0.00 (Free)</span>
              ) : (
                <span className="text-rose-400">৳ {generatedReceipt.fee.toFixed(2)}</span>
              )}
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
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center py-2 transition-colors outline-none"
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
            Enter both your 6-digit wallet PIN and the 6-digit OTP sent to your email.
          </p>

          <div className="py-2 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Wallet PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="next"
                autoFocus
                autoComplete="current-password"
                maxLength={6}
                value={transferPin}
               onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0,6))}
               onKeyDown={(e) => { if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); setTransferPin(''); } }}
              className="mx-auto w-48 text-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)] transition-colors"
              placeholder="••••••"
             />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">OTP</label>
              <div className="py-2">
                <OTPInput length={6} onComplete={(code) => setTransferOtp(code)} />
              </div>
            </div>

            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
              Safety tip: Never disclose your PIN or OTP.
            </p>

            <div className="pt-2">
              <TapAndHoldButton 
                onComplete={handleConfirmTransfer} 
                className="w-full" 
                id="btn-confirm-transfer" 
                disabled={isConfirming || transferPin.length < 6 || transferOtp.length < 6}
              >
                {isConfirming ? 'Processing...' : `Confirm Transfer of ${amount ? formatBDT(computedTotalDebit) : '৳ 0.00'}`}
              </TapAndHoldButton>
            </div>
          </div>
        </div>
      </Modal>

      {/* ADD CONTACT MODAL */}
      <Modal
        isOpen={isAddContactOpen}
        onClose={() => { setIsAddContactOpen(false); setNewContactPhone(''); setNewContactNickname(''); }}
        title="Add Favourite Contact"
      >
        <form onSubmit={handleAddContact} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Phone Number *
            </label>
            <input
              type="tel"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#00C9A7]/60 transition-colors"
              placeholder="01XXXXXXXXX"
              maxLength={11}
              id="input-new-contact-phone"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Nickname <span className="normal-case font-normal text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={newContactNickname}
              onChange={(e) => setNewContactNickname(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#00C9A7]/60 transition-colors"
              placeholder="e.g. Mum, Office Bhai..."
              id="input-new-contact-nickname"
            />
          </div>

          <Button type="submit" className="w-full mt-1" disabled={addContactLoading}>
            {addContactLoading ? 'Saving...' : 'Save Contact'}
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

export default SendMoneyPage;
