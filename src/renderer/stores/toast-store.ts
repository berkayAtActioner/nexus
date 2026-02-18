import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = `toast-${++nextId}`;
    set(state => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));

export function useToast() {
  const addToast = useToastStore(s => s.addToast);
  return {
    info: (msg: string) => addToast(msg, 'info'),
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };
}
