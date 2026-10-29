import React from 'react';
import { PlusCircle, Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no records logged for this view yet.',
  actionLabel = null,
  onAction = null
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-slate-100">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

