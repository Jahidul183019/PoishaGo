import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '../../hooks/useToast';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-emerald-400 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-400 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow-400 shrink-0" />,
  info:    <Info       size={18} className="text-blue-400 shrink-0" />,
};

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error:   'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info:    'border-blue-500/30 bg-blue-500/10',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 p-4 rounded-xl border shadow-lg
            backdrop-blur-sm animate-in slide-in-from-top-2 duration-300
            ${styles[toast.type]}
          `}
        >
          {icons[toast.type]}
          <p className="text-sm text-[var(--text-primary)] flex-1 leading-snug">
            {toast.message}
          </p>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss toast"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
