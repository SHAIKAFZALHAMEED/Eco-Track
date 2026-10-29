import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-lg border transition-all transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-900 text-white border-emerald-700'
                : isError
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex items-start space-x-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />}
              {isInfo && <Info className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />}
              <div>
                {toast.title && <h5 className="text-sm font-bold">{toast.title}</h5>}
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded ml-2 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

