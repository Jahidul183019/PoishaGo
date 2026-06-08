import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, type = 'error') => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const toasts = useToastStore((s) => s.toasts);
  const showToast = useToastStore((s) => s.showToast);
  const dismissToast = useToastStore((s) => s.dismissToast);
  return { toasts, showToast, dismissToast };
}
