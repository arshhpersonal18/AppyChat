import React from 'react';
import { ToastMessage } from '../types';
import { Icons } from '../services/icons';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-container"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-[#1A1A1A] border border-[#00A878]/40 text-[#FFFFFF] px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-150"
        >
          <div className="w-5 h-5 rounded-full bg-[#00A878]/20 text-[#00A878] flex items-center justify-center shrink-0">
            <Icons.check className="w-3.5 h-3.5" />
          </div>
          <p className="flex-1 font-medium">{t.text}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-[#A0A0A0] hover:text-[#FFFFFF] p-1"
          >
            <Icons.close className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
