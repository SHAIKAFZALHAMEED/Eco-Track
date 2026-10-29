import React, { useState, useEffect } from 'react';
import {
  Trash2,
  PlusCircle,
  Building2,
  Edit2,
  TrendingUp,
  AlertCircle,
  Calculator,
  Sparkles,
  Recycle,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../api/apiClient';

export default function WastePage({ showToast }) {
  const [buildings, setBuildings] = useState([]);
  const [wasteFactors, setWasteFactors] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [buildingId, setBuildingId] = useState('');
  const [selectedFactorId, setSelectedFactorId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Edit modal
  const [editingRecord, setEditingRecord] = useState(null);
  const [editBuildingId, setEditBuildingId] = useState('');
  const [editFactorId, setEditFactorId] = useState('');
  const [editActivityName, setEditActivityName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editRecordDate, setEditRecordDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRecalculate, setEditRecalculate] = useState(false);

  // Delete dialog
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bldgRes, factorRes, recRes] = await Promise.all([
        api.getBuildings(),
        api.getFactors({ category_id: 3, is_active: 1 }), // Waste category
        api.getRecords({ category_code: 'WASTE', limit: 100 })
      ]);

      setBuildings(bldgRes.data || []);
      if (bldgRes.data && bldgRes.data.length > 0 && !buildingId) {
        setBuildingId(bldgRes.data[0].building_id);
      }

      const factors = factorRes.data || [];
      setWasteFactors(factors);
      if (factors.length > 0 && !selectedFactorId) {
        setSelectedFactorId(factors[0].factor_id);
      }

      setRecords(recRes.records || []);
    } catch (err) {
      showToast({ type: 'error', title: 'Data Load Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeFactor = wasteFactors.find((f) => Number(f.factor_id) === Number(selectedFactorId));
  const parsedQty = parseFloat(quantity) || 0;
  const factorVal = activeFactor ? activeFactor.factor_value : 0.320000;
  const calculatedEmissions = Math.round(parsedQty * factorVal * 10000) / 10000;

  // Edit live calculation
  const editActiveFactor = wasteFactors.find((f) => Number(f.factor_id) === Number(editFactorId));
  const editParsedQty = parseFloat(editQuantity) || 0;
  const editFactorToUse = editRecalculate && editActiveFactor
    ? editActiveFactor.factor_value
    : editingRecord?.factor_value_snapshot || (editActiveFactor ? editActiveFactor.factor_value : 0.32);
  const editCalculatedEmissions = Math.round(editParsedQty * editFactorToUse * 10000) / 10000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) {
      showToast({ type: 'error', message: 'Please select a campus facility.' });
      return;
    }
    if (!selectedFactorId || !activeFactor) {
      showToast({ type: 'error', message: 'Please select a waste treatment type (Composting or Landfill).' });
      return;
    }
    if (!activityName.trim()) {
      showToast({ type: 'error', message: 'Please enter a waste stream description (e.g. Cafeteria Organic Food Scraps).' });
      return;
    }
    if (parsedQty <= 0) {
      showToast({ type: 'error', message: 'Waste quantity must be greater than 0 kg.' });
      return;
    }
    if (!recordDate) {
      showToast({ type: 'error', message: 'Please provide a valid record date.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.createRecord({
        building_id: buildingId,
        category_id: activeFactor.category_id,
        factor_id: activeFactor.factor_id,
        activity_name: activityName.trim(),
        activity_quantity: parsedQty,
        record_date: recordDate,
        notes: notes.trim() || null
      });

      showToast({
        type: 'success',
        title: 'Waste Record Saved',
        message: `Successfully logged ${parsedQty.toLocaleString()} kg via ${activeFactor.factor_name} (${calculatedEmissions.toLocaleString()} kg CO2e).`
      });

      setActivityName('');
      setQuantity('');
      setNotes('');
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setEditBuildingId(rec.building_id);
    setEditFactorId(rec.factor_id);
    setEditActivityName(rec.activity_name);
    setEditQuantity(rec.activity_quantity);
    setEditRecordDate(rec.record_date);
    setEditNotes(rec.notes || '');
    setEditRecalculate(false);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (editParsedQty <= 0) {
      showToast({ type: 'error', message: 'Quantity must be greater than 0.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.updateRecord(editingRecord.record_id, {
        building_id: editBuildingId,
        factor_id: editFactorId,
        activity_name: editActivityName.trim(),
        activity_quantity: editParsedQty,
        record_date: editRecordDate,
        notes: editNotes.trim() || null,
        recalculate_factor: editRecalculate
      });

      showToast({ type: 'success', message: 'Waste record updated successfully.' });
      setEditingRecord(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await api.deleteRecord(deletingId);
      showToast({ type: 'success', message: 'Waste record deleted.' });
      setDeletingId(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregations
  const compostRecords = records.filter((r) => r.factor_name.toLowerCase().includes('compost'));
  const landfillRecords = records.filter((r) => r.factor_name.toLowerCase().includes('landfill'));

  const compostKg = compostRecords.reduce((sum, r) => sum + r.activity_quantity, 0);
  const landfillKg = landfillRecords.reduce((sum, r) => sum + r.activity_quantity, 0);
  const totalWasteMass = compostKg + landfillKg;

  const compostEmissions = compostRecords.reduce((sum, r) => sum + r.emissions_kg_co2e, 0);
  const landfillEmissions = landfillRecords.reduce((sum, r) => sum + r.emissions_kg_co2e, 0);
  const totalWasteEmissions = compostEmissions + landfillEmissions;

  // Avoided emissions calculation:
  // If the composted waste had instead been sent to landfill (1.290 kg/kg instead of 0.320 kg/kg),
  // avoided emissions = compostKg * (1.290 - 0.320) = compostKg * 0.970 kg CO2e
  const avoidedEmissionsKg = Math.round(compostKg * (1.290000 - 0.320000) * 100) / 100;

  const wasteComparisonChart = [
    { treatment: 'Composting', mass: compostKg, emissions: compostEmissions },
    { treatment: 'Landfill', mass: landfillKg, emissions: landfillEmissions }
  ];

  const pieData = [
    { name: 'Composting', value: compostKg, color: '#10b981' },
    { name: 'Landfill', value: landfillKg, color: '#9333ea' }
  ].filter((p) => p.value > 0);

  return (
    <div className="space-y-6">
      {/* Avoided Emissions Highlight Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white border border-emerald-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-base font-bold text-white">Composting vs. Landfill Impact</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                  75.2% GHG Savings
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Composting generates only <strong>0.32 kg CO2e/kg</strong> compared to <strong>1.29 kg CO2e/kg</strong> for landfill disposal. Diverting organic waste to on-campus composting eliminates anaerobic methane generation.
              </p>
            </div>
          </div>
          <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-right shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">Avoided Carbon</span>
            <span className="text-2xl font-extrabold text-white font-mono">{avoidedEmissionsKg.toLocaleString()}</span>
            <span className="text-xs text-slate-300 ml-1">kg CO2e</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Waste Generated"
          value={totalWasteMass}
          unit="kg"
          subtitle={`${(totalWasteMass / 1000).toFixed(2)} metric tonnes`}
          icon={Trash2}
          variant="purple"
        />
        <StatCard
          title="Net Waste Footprint"
          value={totalWasteEmissions}
          unit="kg CO2e"
          subtitle={`${(totalWasteEmissions / 1000).toFixed(3)} metric tonnes`}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Composted Organic Waste"
          value={compostKg}
          unit="kg"
          subtitle={`${compostEmissions.toLocaleString()} kg CO2e (0.320/kg)`}
          icon={Recycle}
          variant="emerald"
        />
        <StatCard
          title="Landfill Disposal"
          value={landfillKg}
          unit="kg"
          subtitle={`${landfillEmissions.toLocaleString()} kg CO2e (1.290/kg)`}
          icon={AlertCircle}
          variant="slate"
        />
      </div>

      {/* Main Grid: Form + Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Waste Stream Entry</h3>
              <p className="text-xs text-slate-500">Record Scope 3 solid waste and composting data</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campus Building Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Facility / Origin *
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                {buildings.map((b) => (
                  <option key={b.building_id} value={b.building_id}>
                    {b.building_name} ({b.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Waste Treatment Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Waste Treatment Method *
              </label>
              <select
                value={selectedFactorId}
                onChange={(e) => setSelectedFactorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {wasteFactors.map((f) => (
                  <option key={f.factor_id} value={f.factor_id}>
                    {f.factor_name} ({f.factor_value} kg CO2e / {f.activity_unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Waste Stream Description *
              </label>
              <input
                type="text"
                placeholder="e.g., Cafeteria kitchen organic scraps, Hostel dry trash"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Quantity in kg */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Waste Mass (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  kg
                </span>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Record Date *
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Audit Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Municipal collection bin #4 weighbridge ticket"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Calculation Preview */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-purple-700" />
                  Calculation Preview
                </span>
                <span className="font-mono text-[11px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Scope 3 (Waste)
                </span>
              </div>

              <div className="text-xs font-mono text-slate-600 flex items-center justify-between pt-1">
                <span>{parsedQty.toLocaleString()} kg × {factorVal} kg/kg</span>
                <span className="text-sm font-bold text-purple-900 font-mono">
                  = {calculatedEmissions.toLocaleString(undefined, { minimumFractionDigits: 2 })} kg CO2e
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Saving to MySQL...' : 'Log Waste Record'}</span>
            </button>
          </form>
        </div>

        {/* Waste Treatment Comparison Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Treatment Comparison (Composting vs Landfill)</h3>
                <p className="text-xs text-slate-500">Mass diverted vs GHG emissions generated</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                Scope 3 Waste
              </span>
            </div>

            {totalWasteMass === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <EmptyState
                  icon={Trash2}
                  title="No waste records yet"
                  description="Log composting or landfill records on the left to see the diversion analytics."
                />
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wasteComparisonChart} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="treatment" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#9333ea" tick={{ fontSize: 11 }} unit=" kg" />
                    <YAxis yAxisId="right" orientation="right" stroke="#059669" tick={{ fontSize: 11 }} unit=" kg" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="mass" fill="#9333ea" radius={[6, 6, 0, 0]} name="Waste Mass (kg)" />
                    <Bar yAxisId="right" dataKey="emissions" fill="#059669" radius={[6, 6, 0, 0]} name="Emissions (kg CO2e)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <p>
              Municipal landfill disposal decomposes organic mass in anaerobic environments, releasing methane ($CH_4$). Aerobic composting generates biogenic $CO_2$ with much lower global warming potential.
            </p>
          </div>
        </div>
      </div>

      {/* Waste Ledger Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Waste Management Record Ledger</h3>
            <p className="text-xs text-slate-500">Historical composting and disposal logs stored in MySQL</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {records.length} Records
          </span>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No waste records logged"
            description="All waste treatment records logged will appear here with factor snapshots."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Facility</th>
                  <th className="py-3 px-3">Treatment</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Mass (kg)</th>
                  <th className="py-3 px-3 text-right">Factor Snapshot</th>
                  <th className="py-3 px-3 text-right">Emissions (kg CO2e)</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {records.map((r) => (
                  <tr key={r.record_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500">{r.record_date}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{r.building_name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.factor_name.toLowerCase().includes('compost')
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {r.factor_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{r.activity_name}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {r.activity_quantity.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {r.factor_value_snapshot.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-900">
                      {r.emissions_kg_co2e.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{r.notes || '—'}</td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(r.record_id)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        title={`Edit Waste Record #${editingRecord?.record_id}`}
      >
        {editingRecord && (
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Facility
              </label>
              <select
                value={editBuildingId}
                onChange={(e) => setEditBuildingId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                {buildings.map((b) => (
                  <option key={b.building_id} value={b.building_id}>
                    {b.building_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Waste Treatment
              </label>
              <select
                value={editFactorId}
                onChange={(e) => setEditFactorId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {wasteFactors.map((f) => (
                  <option key={f.factor_id} value={f.factor_id}>
                    {f.factor_name} ({f.factor_value} kg CO2e / {f.activity_unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stream Description
              </label>
              <input
                type="text"
                value={editActivityName}
                onChange={(e) => setEditActivityName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Waste Mass (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Record Date
              </label>
              <input
                type="date"
                value={editRecordDate}
                onChange={(e) => setEditRecordDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p>
                <strong>Snapshot Factor:</strong> Saved with snapshot{' '}
                <span className="font-mono font-bold">{editingRecord.factor_value_snapshot} kg CO2e/kg</span>.
              </p>
              <label className="flex items-center space-x-2 cursor-pointer pt-1 text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={editRecalculate}
                  onChange={(e) => setEditRecalculate(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Recalculate with current active factor ({editActiveFactor?.factor_value} kg/kg)</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 text-purple-900 text-xs font-mono flex items-center justify-between">
              <span>Recalculated Emissions:</span>
              <span className="font-bold text-sm">{editCalculatedEmissions.toLocaleString()} kg CO2e</span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
              >
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Waste Record"
        message="Are you sure you want to permanently delete this waste emission record? This action cannot be undone."
        isLoading={submitting}
      />
    </div>
  );
}

