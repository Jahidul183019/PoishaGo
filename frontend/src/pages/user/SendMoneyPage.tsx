import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import { API_BASE_URL } from '../../utils/api';
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
  ChevronRight,
  UserPlus,
  X
} from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserBalance, token, fetchUserProfile } = useAuthStore();
  const { addTransaction, addNotification } = useWalletStore();

  const [suggestedContacts, setSuggestedContacts] = useState<{contact_id?: number, name: string, phone: string, initials: string}[]>([]);

  const fetchContacts = () => {
    if (token) {
      fetch(API_BASE_URL + '/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSuggestedContacts(data);
      })
      .catch(console.error);
    }
  };

  React.useEffect(() => {
    fetchContacts();
  }, [token]);

  // Add contact modal state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactNickname, setNewContactNickname] = useState('');
  const [addContactError, setAddContactError] = useState('');
  const [addContactLoading, setAddContactLoading] = useState(false);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddContactError('');
    if (newContactPhone.length < 11) {
      setAddContactError('Please enter a valid 11-digit phone number.');
      return;
    }
    setAddContactLoading(true);
    try {
      const res = await fetch(API_BASE_URL + '/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone: newContactPhone, nickname: newContactNickname })
      });
      const data = await res.json();
      if (!res.ok) {
        setAddContactError(data.detail || 'Failed to add contact.');
      } else {
        setIsAddContactOpen(false);
        setNewContactPhone('');
        setNewContactNickname('');
        fetchContacts(); // Refresh the list
      }
    } catch {
      setAddContactError('Network error. Please try again.');
    } finally {
      setAddContactLoading(false);
    }
  };

  const handleRemoveContact = async (contactId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchContacts();
    } catch (e) {
      console.error(e);
    }
  };


  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [errorText, setErrorText] = useState('');

  // OTP modal triggers
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  const [transferPin, setTransferPin] = useState('');
  const [transferOtp, setTransferOtp] = useState('');

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

    // Try to send transfer OTP to user's email first
    (async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/send-transfer-otp', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorText(data.detail || 'Failed to send transfer OTP.');
          return;
        }
        setIsOTPModalOpen(true);
      } catch (err) {
        console.error(err);
        setErrorText('Network error sending OTP.');
      }
    })();
  };

  const handleConfirmTransfer = async () => {
    setIsOTPModalOpen(false);
    setCurrentStep('processing');

    try {
      const transferAmt = parseFloat(amount);
      const response = await fetch(API_BASE_URL + '/api/transactions/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_phone: recipientPhone,
          amount: transferAmt,
          pin: transferPin,
          otp: transferOtp,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        setErrorText(err.detail || 'Transaction failed');
        setCurrentStep('input');
        return;
      }

      const data = await response.json();
      
      // Update local balance
      await fetchUserProfile();
      
      const resolvedName = recipientName || `Wallet (${recipientPhone})`;

      // Record Ledger transaction inside Wallet Store for UI history
      addTransaction({
        sender_wallet_id: user?.wallet_number || '',
        sender_name: user?.full_name || '',
        receiver_wallet_id: 'PG-WAL-' + recipientPhone.slice(-5),
        receiver_name: resolvedName,
        amount: transferAmt,
        txn_type: 'send_money',
        status: 'completed',
        fee: 0,
        reference_no: data.transaction_id
      });

      // Trigger in-app alerts
      addNotification(
        `Sent ${formatBDT(transferAmt)} to ${resolvedName}`,
        `Successfully debited ${formatBDT(transferAmt)} from your wallet. Reference: ${data.transaction_id}.`,
        'debit'
      );

      setGeneratedReceipt({
        ref: data.transaction_id,
        amount: transferAmt,
        receiver: resolvedName,
        phone: recipientPhone,
        date: new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })
      });

      setCurrentStep('success');
    } catch (e) {
      console.error(e);
      setErrorText('Network error processing transaction');
      setCurrentStep('input');
    }
  };

  return (
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
                onClick={() => { setIsAddContactOpen(true); setAddContactError(''); }}
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
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {suggestedContacts.map((contact) => (
                  <div
                    key={contact.phone}
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
                maxLength={6}
                value={transferPin}
                onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0,6))}
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
              <Button onClick={handleConfirmTransfer} className="w-full">Confirm Transfer</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ADD CONTACT MODAL */}
      <Modal
        isOpen={isAddContactOpen}
        onClose={() => { setIsAddContactOpen(false); setNewContactPhone(''); setNewContactNickname(''); setAddContactError(''); }}
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
          {addContactError && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
              <AlertCircle size={13} />
              {addContactError}
            </div>
          )}
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
  );
};

export default SendMoneyPage;
