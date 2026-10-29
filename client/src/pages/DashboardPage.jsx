import React, { useState, useEffect } from 'react';
import {
  Zap,
  Fuel,
  Trash2,
  Calendar,
  Building2,
  BarChart2,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { api } from '../api/apiClient';

export default function DashboardPage({ setActiveTab, showToast }) {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRangeActive, setCustomRangeActive] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = customRangeActive && startDate && endDate
        ? { startDate, endDate }
        : { period };
      const response = await api.getDashboard(params);
      setData(response.data);
    } catch (err) {
      showToast({ type: 'error', title: 'Dashboard Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period, customRangeActive]);

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showToast({ type: 'error', message: 'Please select both start and end dates.' });
      return;
    }
    setCustomRangeActive(true);
    fetchDashboard();
  };

  const handleResetDate = (newPeriod) => {
    setCustomRangeActive(false);
    setStartDate('');
    setEndDate('');
    setPeriod(newPeriod);
  };

  const summary = data?.summary || {
    total_emissions_kg: 0,
    total_records: 0,
    electricity_emissions_kg: 0,
    fuel_emissions_kg: 0,
    waste_emissions_kg: 0,
    highest_building: null,
    highest_category: null
  };

  const delta = data?.previous_period_comparison?.delta_percentage;
  const categoryBreakdown = data?.category_breakdown || [];
  const buildingComparison = data?.building_comparison || [];
  const trends = data?.trends || [];
  const recentRecords = data?.recent_records || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Prototype Disclaimer */}
      <div className="flex items-start justify-between p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-800 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-emerald-800/80 text-emerald-300 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Prototype Emission Factors Active</h4>
            <p className="text-xs text-emerald-200/80 mt-0.5 max-w-3xl leading-relaxed">
              Emission values use baseline prototype conversion factors (Grid electricity: 0.710 kg CO2e/kWh, Petrol: 2.313 kg/L, Diesel: 2.661 kg/L, Composting: 0.320 kg/kg, Landfill: 1.290 kg/kg). Official institutional carbon disclosures require regional grid verification.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('factors')}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-emerald-100 transition-colors shrink-0"
        >
          <span>View Factors</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'weekly', label: 'Last 7 Days' },
            { id: 'monthly', label: 'Last 30 Days' },
            { id: 'yearly', label: 'Last 365 Days' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleResetDate(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !customRangeActive && period === tab.id
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        <form onSubmit={handleApplyCustomDate} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-emerald-600"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-emerald-600"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={fetchDashboard}
            title="Refresh analytics"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Emissions"
          value={summary.total_emissions_kg}
          unit="kg CO2e"
          subtitle={`${(summary.total_emissions_kg / 1000).toFixed(3)} metric tonnes`}
          delta={delta}
          icon={TrendingUp}
          variant="emerald"
        />

        <StatCard
          title="Electricity (Scope 2)"
          value={summary.electricity_emissions_kg}
          unit="kg CO2e"
          subtitle="Grid Consumption"
          icon={Zap}
          variant="blue"
        />

        <StatCard
          title="Fuel (Scope 1)"
          value={summary.fuel_emissions_kg}
          unit="kg CO2e"
          subtitle="Petrol & Diesel"
          icon={Fuel}
          variant="amber"
        />

        <StatCard
          title="Waste (Scope 3)"
          value={summary.waste_emissions_kg}
          unit="kg CO2e"
          subtitle="Compost & Landfill"
          icon={Trash2}
          variant="purple"
        />

        <StatCard
          title="Total Records"
          value={summary.total_records}
          unit="entries"
          subtitle="Logged Activities"
          icon={FileSpreadsheet}
          variant="slate"
        />

        <StatCard
          title="Top Emitter"
          value={summary.highest_building ? summary.highest_building.building_name : 'N/A'}
          unit={summary.highest_building ? `${summary.highest_building.percentage}%` : ''}
          subtitle={summary.highest_building ? `${summary.highest_building.emissions_kg.toLocaleString()} kg CO2e` : 'No emissions logged'}
          icon={Building2}
          variant="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Emissions by Category</h3>
              <p className="text-xs text-slate-500">Electricity vs Fuel & Transport vs Waste</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Scope 1, 2, 3</span>
            </div>
          </div>

          {categoryBreakdown.every((c) => c.emissions_kg === 0) ? (
            <div className="h-64 flex items-center justify-center">
              <EmptyState
                icon={BarChart2}
                title="No category emission data"
                description="Start logging electricity, fuel, or waste records to visualize the category breakdown."
              />
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category_name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()} kg CO2e`, 'Emissions']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="emissions_kg" fill="#059669" radius={[6, 6, 0, 0]} name="Emissions (kg CO2e)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Building-wise Comparison */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Building-wise Emissions</h3>
              <p className="text-xs text-slate-500">Facility emissions distribution across campus</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Campus Facilities</span>
            </div>
          </div>

          {buildingComparison.every((b) => b.emissions_kg === 0) ? (
            <div className="h-64 flex items-center justify-center">
              <EmptyState
                icon={Building2}
                title="No building emission data"
                description="Facility emission comparisons will appear here once records are logged for each building."
              />
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingComparison} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" kg" />
                  <YAxis type="category" dataKey="building_name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()} kg CO2e`, 'Emissions']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="emissions_kg" fill="#0f766e" radius={[0, 6, 6, 0]} name="Emissions (kg CO2e)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Emission Trends Over Time Area Chart */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Emissions Trend Over Time</h3>
            <p className="text-xs text-slate-500">Temporal emissions trajectory across activity types</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {trends.length} Data Points
          </span>
        </div>

        {trends.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <EmptyState
              icon={TrendingUp}
              title="No chronological emission data"
              description="Chronological timeline charts will populate automatically as multiple dates are recorded."
            />
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorElectricity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="record_date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()} kg CO2e`]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="total_kg" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total CO2e" />
                <Area type="monotone" dataKey="electricity_kg" stroke="#0284c7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorElectricity)" name="Electricity" />
                <Area type="monotone" dataKey="fuel_kg" stroke="#d97706" strokeWidth={1.5} fillOpacity={0} name="Fuel" />
                <Area type="monotone" dataKey="waste_kg" stroke="#9333ea" strokeWidth={1.5} fillOpacity={0} name="Waste" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Practical Reduction Recommendations & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations Column (1 col) */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-900/50 shadow-md">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reduction Insights</h3>
              <p className="text-xs text-emerald-300/80">Data-driven mitigation priorities</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                  {rec.title}
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Records Table (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Emission Records</h3>
              <p className="text-xs text-slate-500">Latest activity entries logged into MySQL</p>
            </div>
            <button
              onClick={() => setActiveTab('records')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRecords.length === 0 ? (
            <EmptyState
              title="No recent records logged"
              description="Choose a module (Electricity, Fuel, or Waste) to begin recording activity data."
              actionLabel="Log Electricity"
              onAction={() => setActiveTab('electricity')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Building</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Activity</th>
                    <th className="py-2.5 px-3 text-right">Emissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {recentRecords.map((r) => (
                    <tr key={r.record_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{r.record_date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{r.building_name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.category_code === 'ELECTRICITY'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : r.category_code === 'FUEL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {r.category_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{r.activity_name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {r.emissions_kg_co2e.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

