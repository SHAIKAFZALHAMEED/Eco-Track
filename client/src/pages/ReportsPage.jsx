import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Building2,
  Layers,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { api } from '../api/apiClient';

export default function ReportsPage({ showToast }) {
  const [period, setPeriod] = useState('monthly');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customActive, setCustomActive] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = customActive && startDate && endDate
        ? { startDate, endDate }
        : { period };
      const res = await api.getReports(params);
      setReport(res.data);
    } catch (err) {
      showToast({ type: 'error', title: 'Report Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, customActive]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showToast({ type: 'error', message: 'Please select both start and end dates.' });
      return;
    }
    setCustomActive(true);
    fetchReport();
  };

  const handleResetPeriod = (p) => {
    setCustomActive(false);
    setStartDate('');
    setEndDate('');
    setPeriod(p);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const params = customActive && startDate && endDate
      ? { startDate, endDate }
      : { period };
    const url = api.getReportExportUrl(params);
    window.open(url, '_blank');
  };

  const summary = report?.summary || {
    total_records: 0,
    total_emissions_kg: 0,
    total_emissions_tonnes: 0,
    electricity_kg: 0,
    fuel_kg: 0,
    waste_kg: 0
  };

  const categories = report?.categories || [];
  const buildings = report?.buildings || [];
  const trends = report?.trends || [];
  const records = report?.records || [];

  // Top emitters
  const topCategory = categories.length > 0 && categories[0].emissions_kg > 0 ? categories[0] : null;
  const topBuilding = buildings.length > 0 && buildings[0].emissions_kg > 0 ? buildings[0] : null;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs no-print">
        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'weekly', label: 'Weekly Report' },
            { id: 'monthly', label: 'Monthly Report' },
            { id: 'yearly', label: 'Annual Report' },
            { id: 'all', label: 'All Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleResetPeriod(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !customActive && period === tab.id
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleCustomSubmit} className="flex items-center space-x-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              Filter
            </button>
          </form>

          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-print space-y-6">
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Official Carbon Assessment
              </span>
              <span className="text-xs text-slate-500">
                Generated: {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              EcoTrack Campus — Carbon Emission Assessment Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Timeframe:{' '}
              <strong className="text-slate-800">
                {report?.startDate || 'Earliest'} to {report?.endDate || 'Latest'}
              </strong>{' '}
              ({report?.period || 'custom'})
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Total Footprint</span>
            <span className="text-3xl font-black text-emerald-900 font-mono">
              {summary.total_emissions_kg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-slate-500 ml-1">kg CO2e</span>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              = {summary.total_emissions_tonnes} Metric Tonnes CO2e
            </p>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-500">Electricity (Scope 2)</span>
            <div className="text-xl font-extrabold text-sky-800 mt-1 font-mono">
              {summary.electricity_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.total_emissions_kg > 0 ? `${Math.round((summary.electricity_kg / summary.total_emissions_kg) * 100)}% of total` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-500">Fuel (Scope 1)</span>
            <div className="text-xl font-extrabold text-amber-800 mt-1 font-mono">
              {summary.fuel_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.total_emissions_kg > 0 ? `${Math.round((summary.fuel_kg / summary.total_emissions_kg) * 100)}% of total` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-500">Waste (Scope 3)</span>
            <div className="text-xl font-extrabold text-purple-800 mt-1 font-mono">
              {summary.waste_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {summary.total_emissions_kg > 0 ? `${Math.round((summary.waste_kg / summary.total_emissions_kg) * 100)}% of total` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-500">Total Audit Records</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
              {summary.total_records}
            </div>
            <span className="text-[11px] text-slate-400">Logged activities</span>
          </div>
        </div>

        {/* Highest Emitter Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
                Highest-Emitting Category
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {topCategory ? `${topCategory.category_name} (${topCategory.emissions_kg.toLocaleString()} kg CO2e, ${topCategory.percentage}%)` : 'N/A (No emissions recorded)'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-sky-800 tracking-wider">
                Highest-Emitting Building
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {topBuilding ? `${topBuilding.building_name} (${topBuilding.emissions_kg.toLocaleString()} kg CO2e, ${topBuilding.percentage}%)` : 'N/A (No emissions recorded)'}
              </p>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
            1. Scope & Category Distribution
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category Code</th>
                  <th className="py-2.5 px-3">Category Name</th>
                  <th className="py-2.5 px-3 text-right">Logged Entries</th>
                  <th className="py-2.5 px-3 text-right">Total Quantity</th>
                  <th className="py-2.5 px-3 text-right">Emissions (kg CO2e)</th>
                  <th className="py-2.5 px-3 text-right">Emission Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {categories.map((c) => (
                  <tr key={c.category_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.category_code}</td>
                    <td className="py-2.5 px-3 font-sans">{c.category_name}</td>
                    <td className="py-2.5 px-3 text-right">{c.record_count}</td>
                    <td className="py-2.5 px-3 text-right">{c.total_quantity.toLocaleString()} {c.activity_unit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{c.emissions_kg.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">{c.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Building Distribution Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
            2. Campus Facility Carbon Disclosures
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Building Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Activity Entries</th>
                  <th className="py-2.5 px-3 text-right">Emissions (kg CO2e)</th>
                  <th className="py-2.5 px-3 text-right">Metric Tonnes</th>
                  <th className="py-2.5 px-3 text-right">Share of Campus Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {buildings.map((b) => (
                  <tr key={b.building_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold font-sans text-slate-900">{b.building_name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">{b.location}</td>
                    <td className="py-2.5 px-3 text-right">{b.record_count}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{b.emissions_kg.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{(b.emissions_kg / 1000).toFixed(3)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">{b.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full Activity Records Appendix */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
            3. Activity Records Appendix ({records.length} Entries)
          </h3>
          {records.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No activity records available for this report period.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Building</th>
                    <th className="py-2 px-2.5">Category</th>
                    <th className="py-2 px-2.5">Activity</th>
                    <th className="py-2 px-2.5 text-right">Quantity</th>
                    <th className="py-2 px-2.5 text-right">Factor Snapshot</th>
                    <th className="py-2 px-2.5 text-right">Emissions (kg CO2e)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {records.map((r) => (
                    <tr key={r.record_id}>
                      <td className="py-1.5 px-2.5 font-mono text-slate-500">{r.record_date}</td>
                      <td className="py-1.5 px-2.5 font-medium">{r.building_name}</td>
                      <td className="py-1.5 px-2.5">{r.category_name}</td>
                      <td className="py-1.5 px-2.5 text-slate-600">{r.activity_name}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono">{r.activity_quantity} {r.activity_unit}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono">{r.factor_value_snapshot.toFixed(4)}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold">{r.emissions_kg_co2e.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 space-y-1">
          <p>
            * Certified Institutional Report Generated by EcoTrack Campus. Emission calculations use the snapshot pattern to preserve historical reporting validity.
          </p>
          <p>
            Notice: Prototype reference factors must be reconciled with local utility emissions coefficients before submission to academic rating agencies or governmental carbon bodies.
          </p>
        </div>
      </div>
    </div>
  );
}

