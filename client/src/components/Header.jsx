import React from 'react';
import { Menu, Database, ShieldCheck, Calendar, Sparkles } from 'lucide-react';

export default function Header({ activeTab, setMobileOpen, healthData }) {
  const isConnected = healthData?.database?.connected;
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getPageTitle = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Sustainability Dashboard', subtitle: 'Real-time campus greenhouse gas emissions and analytics' };
      case 'electricity':
        return { title: 'Electricity Consumption Module', subtitle: 'Log and monitor Scope 2 grid electricity consumption' };
      case 'fuel':
        return { title: 'Fuel & Fleet Transport Module', subtitle: 'Log Scope 1 petrol and diesel fuel combustion' };
      case 'waste':
        return { title: 'Waste Management Module', subtitle: 'Track Scope 3 composting diversion and landfill disposal' };
      case 'records':
        return { title: 'Emission Records Registry', subtitle: 'Master ledger with search, filtering, and factor snapshot preservation' };
      case 'reports':
        return { title: 'Reports & Comprehensive Analytics', subtitle: 'Timeframe breakdowns, aggregations, and exportable disclosures' };
      case 'buildings':
        return { title: 'Campus Building Management', subtitle: 'Manage campus infrastructure with linked record protection' };
      case 'factors':
        return { title: 'Emission Factors Registry', subtitle: 'Maintain prototype conversion factors and GHG activity units' };
      case 'info':
        return { title: 'Database & Project Architecture', subtitle: 'EER schema, formulas, scope classifications, and system documentation' };
      default:
        return { title: 'EcoTrack Campus', subtitle: 'Campus Carbon Monitoring System' };
    }
  };

  const { title, subtitle } = getPageTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Date badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayStr}</span>
        </div>

        {/* Database Health Pill */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
          title={isConnected ? `Connected to MySQL: ${healthData?.database?.database}` : 'MySQL Offline'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="hidden sm:inline">{isConnected ? 'MySQL Connected' : 'DB Disconnected'}</span>
        </div>

        {/* Prototype badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden lg:inline">Academic Prototype</span>
        </div>
      </div>
    </header>
  );
}

