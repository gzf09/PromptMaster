import React, { useEffect } from 'react';
import { ToastMessage, ToastType } from '../types';
import { Icons } from './Icon';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgColors: Record<ToastType, string> = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-fade-in-up`}>
      {toast.type === 'success' && <Icons.Check size={18} />}
      {toast.type === 'error' && <Icons.Close size={18} />}
      {toast.type === 'info' && <Icons.Sparkles size={18} />}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-auto hover:opacity-80">
        <Icons.Close size={14} />
      </button>
    </div>
  );
};
