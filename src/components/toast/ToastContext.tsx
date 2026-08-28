import { createContext } from 'react';

export type ToastKind =
  | 'success'
  | 'error'
  | 'info'
  | 'xp';

export type ToastOptions = {
  showToast: (
    message: string,
    kind?: ToastKind,
    options?: { duration?: number }
  ) => void;
};

export const ToastContext =
  createContext<ToastOptions | null>(
    null
  );
