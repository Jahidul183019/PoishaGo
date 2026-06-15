
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // ── Prevent body scroll when modal is open ────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // FIX: Use items-end always on mobile so modal anchors to bottom above keyboard
    // Use justify-end on mobile so it slides up from bottom sheet style
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 pb-[72px] md:p-4">

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/*
        FIX 1: max-h changed from 85vh to 90dvh
          - dvh = dynamic viewport height, shrinks when keyboard opens
          - This means the modal STAYS visible and scrollable above the keyboard
        FIX 2: Added pb-safe for iPhone home bar
        FIX 3: overflow-y-auto on inner content not outer wrapper
        FIX 4: w-full on mobile, max-w-md on desktop
      */}
      <div
        className="
          relative w-full md:max-w-md
          bg-[var(--bg-card)]
          border-t md:border border-[var(--border)]
          rounded-t-3xl md:rounded-2xl
          shadow-2xl z-10
          flex flex-col
          max-h-[90dvh] md:max-h-[85vh]
          animate-in slide-in-from-bottom md:zoom-in-95 duration-200
        "
      >
        {/* Header — sticky so it doesn't scroll away */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]
                       hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/*
          FIX: Content scrolls independently
          pb-8 ensures submit button is never clipped by home bar on iPhone
        */}
        <div className="overflow-y-auto flex-1 p-6 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

