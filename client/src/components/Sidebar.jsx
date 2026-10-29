import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Fuel,
  Trash2,
  TableProperties,
  BarChart3,
  Building2,
  Sliders,
  Database,
  X,
  Leaf
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'electricity', label: 'Electricity', icon: Zap },
  { id: 'fuel', label: 'Fuel & Transport', icon: Fuel },
  { id: 'waste', label: 'Waste Management', icon: Trash2 },
  { id: 'records', label: 'Emission Records', icon: TableProperties },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'buildings', label: 'Buildings', icon: Building2 },
  { id: 'factors', label: 'Emission Factors', icon: Sliders },
  { id: 'info', label: 'Database & Project Info', icon: Database },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, healthData }) {
  const isConnected = healthData?.database?.connected;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white border-r border-emerald-900/40 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-emerald-800/40">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-900/50">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                EcoTrack <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">Campus</span>
              </h1>
              <p className="text-xs text-emerald-300/70">Carbon Monitoring & Analytics</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
            Navigation Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-950 font-semibold'
                    : 'text-slate-300 hover:bg-emerald-900/30 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-400/70'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Database status widget in sidebar footer */}
        <div className="p-4 m-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">MySQL 8.0</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="text-slate-400 space-y-0.5 text-[11px]">
            <p>Database: <span className="font-mono text-emerald-300">ecotrack_campus</span></p>
            {isConnected && healthData?.database?.latencyMs !== undefined && (
              <p>Ping: <span className="font-mono text-slate-300">{healthData.database.latencyMs} ms</span></p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

