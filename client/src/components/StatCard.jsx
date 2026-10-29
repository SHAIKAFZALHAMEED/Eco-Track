import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  unit = '',
  subtitle = null,
  delta = null,
  icon: Icon,
  variant = 'emerald', // emerald, blue, amber, purple, slate
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'text-emerald-700'
        };
      case 'blue':
        return {
          iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
          accent: 'text-sky-700'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          accent: 'text-amber-700'
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
          accent: 'text-purple-700'
        };
      default:
        return {
          iconBg: 'bg-slate-50 text-slate-700 border-slate-200',
          accent: 'text-slate-700'
        };
    }
  };

  const { iconBg } = getVariantStyles();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline space-x-1.5">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
            </h3>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || delta !== null) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {delta !== null && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                delta > 0
                  ? 'text-rose-600'
                  : delta < 0
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              {delta > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : delta < 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {Math.abs(delta)}% vs prior
            </span>
          )}
        </div>
      )}
    </div>
  );
}

