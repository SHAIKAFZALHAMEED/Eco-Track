import React, { useState, useEffect } from 'react';
import {
  Zap,
  PlusCircle,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  TrendingUp,
  AlertCircle,
  Calculator,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../api/apiClient';

export default function ElectricityPage({ showToast }) {
  const [buildings, setBuildings] = useState([]);
  const [electricityFactor, setElectricityFactor] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [buildingId, setBuildingId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Edit modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editBuildingId, setEditBuildingId] = useState('');
  const [editActivityName, setEditActivityName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editRecordDate, setEditRecordDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRecalculate, setEditRecalculate] = useState(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bldgRes, factorRes, recRes] = await Promise.all([
        api.getBuildings(),
        api.getFactors({ category_id: 1, is_active: 1 }), // Electricity category
        api.getRecords({ category_code: 'ELECTRICITY', limit: 100 })
      ]);

      setBuildings(bldgRes.data || []);
      if (bldgRes.data && bldgRes.data.length > 0 && !buildingId) {
        setBuildingId(bldgRes.data[0].building_id);
      }

      const activeFactor = factorRes.data?.find((f) => f.factor_name.includes('Grid')) || factorRes.data?.[0];
      setElectricityFactor(activeFactor || null);
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

  // Live calculation preview
  const parsedQty = parseFloat(quantity) || 0;
  const factorVal = electricityFactor ? electricityFactor.factor_value : 0.710000;
  const calculatedEmissions = Math.round(parsedQty * factorVal * 10000) / 10000;

  // Edit live calculation preview
  const editParsedQty = parseFloat(editQuantity) || 0;
  const editFactorToUse = editRecalculate && electricityFactor
    ? electricityFactor.factor_value
    : editingRecord?.factor_value_snapshot || factorVal;
  const editCalculatedEmissions = Math.round(editParsedQty * editFactorToUse * 10000) / 10000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) {
      showToast({ type: 'error', message: 'Please select a campus building.' });
      return;
    }
    if (!activityName.trim()) {
      showToast({ type: 'error', message: 'Please provide an activity name (e.g. Sub-meter #3 reading).' });
      return;
    }
    if (parsedQty <= 0) {
      showToast({ type: 'error', message: 'Electricity consumption must be greater than 0 kWh.' });
      return;
    }
    if (!recordDate) {
      showToast({ type: 'error', message: 'Please provide a valid date.' });
      return;
    }
    if (!electricityFactor) {
      showToast({ type: 'error', message: 'No active electricity emission factor found in database.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.createRecord({
        building_id: buildingId,
        category_id: electricityFactor.category_id,
        factor_id: electricityFactor.factor_id,
        activity_name: activityName.trim(),
        activity_quantity: parsedQty,
        record_date: recordDate,
        notes: notes.trim() || null
      });

      showToast({
        type: 'success',
        title: 'Record Saved',
        message: `Successfully logged ${parsedQty.toLocaleString()} kWh (${calculatedEmissions.toLocaleString()} kg CO2e).`
      });

      // Reset form fields
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
        activity_name: editActivityName.trim(),
        activity_quantity: editParsedQty,
        record_date: editRecordDate,
        notes: editNotes.trim() || null,
        recalculate_factor: editRecalculate
      });

      showToast({ type: 'success', message: 'Record updated successfully.' });
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
      showToast({ type: 'success', message: 'Electricity record deleted.' });
      setDeletingId(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalConsumptionKwh = records.reduce((sum, r) => sum + r.activity_quantity, 0);
  const totalEmissionsKg = records.reduce((sum, r) => sum + r.emissions_kg_co2e, 0);

  // Chronological trend data
  const trendData = [...records]
    .sort((a, b) => new Date(a.record_date) - new Date(b.record_date))
    .map((r) => ({
      date: r.record_date,
      kwh: r.activity_quantity,
      emissions: r.emissions_kg_co2e,
      building: r.building_name
    }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Electricity Consumption"
          value={totalConsumptionKwh}
          unit="kWh"
          subtitle={`${(totalConsumptionKwh / 1000).toFixed(2)} MWh`}
          icon={Zap}
          variant="blue"
        />
        <StatCard
          title="Electricity Carbon Footprint"
          value={totalEmissionsKg}
          unit="kg CO2e"
          subtitle={`${(totalEmissionsKg / 1000).toFixed(3)} metric tonnes`}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Active Factor Benchmark"
          value={electricityFactor ? electricityFactor.factor_value : 0.710000}
          unit="kg CO2e / kWh"
          subtitle={electricityFactor ? electricityFactor.factor_name : 'Grid Electricity'}
          icon={Calculator}
          variant="purple"
        />
      </div>

      {/* Main Grid: Form (left) + Trend Chart (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Electricity Consumption</h3>
              <p className="text-xs text-slate-500">Record metered building grid electricity</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campus Building Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Building *
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              >
                {buildings.map((b) => (
                  <option key={b.building_id} value={b.building_id}>
                    {b.building_name} ({b.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Activity / Sub-meter Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Main HVAC & Lighting Panel, Physics Lab"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Consumption Quantity (kWh) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Consumption (kWh) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  kWh
                </span>
              </div>
            </div>

            {/* Record Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Record Date *
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Audit Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Monthly utility bill ref #EB-1049"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Real-time Calculation Preview Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  Calculation Preview
                </span>
                <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Scope 2 (Indirect)
                </span>
              </div>

              <div className="text-xs font-mono text-slate-600 flex items-center justify-between pt-1">
                <span>{parsedQty.toLocaleString()} kWh × {factorVal} kg/kWh</span>
                <span className="text-sm font-bold text-emerald-900 font-mono">
                  = {calculatedEmissions.toLocaleString(undefined, { minimumFractionDigits: 2 })} kg CO2e
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Saving to MySQL...' : 'Log Electricity Record'}</span>
            </button>
          </form>
        </div>

        {/* Electricity Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Electricity Trend</h3>
                <p className="text-xs text-slate-500">Chronological consumption pattern (kWh)</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Grid Electricity (0.710)
              </span>
            </div>

            {trendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <EmptyState
                  icon={Zap}
                  title="No electricity records yet"
                  description="Use the form on the left to log your first meter reading."
                />
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="elecColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" kWh" />
                    <Tooltip
                      formatter={(val) => [`${Number(val).toLocaleString()} kWh`, 'Consumption']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Area type="monotone" dataKey="kwh" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#elecColor)" name="kWh" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <p>
              Under the GHG Protocol Corporate Standard, grid electricity emissions are classified as <strong>Scope 2</strong> (indirect emissions from purchased electricity). Calculations use the stored grid emission factor snapshot.
            </p>
          </div>
        </div>
      </div>

      {/* Electricity Records History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Electricity Record Ledger</h3>
            <p className="text-xs text-slate-500">Historical electricity logs stored in MySQL</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {records.length} Records
          </span>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No electricity records found"
            description="All electricity records logged will be displayed in this ledger with factor snapshot values."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Building</th>
                  <th className="py-3 px-3">Activity / Meter</th>
                  <th className="py-3 px-3 text-right">Consumption</th>
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
                    <td className="py-3 px-3 text-slate-700">{r.activity_name}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {r.activity_quantity.toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {r.factor_value_snapshot.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {r.emissions_kg_co2e.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{r.notes || '—'}</td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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
        title={`Edit Electricity Record #${editingRecord?.record_id}`}
      >
        {editingRecord && (
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Building
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
                Activity / Sub-meter Name
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
                Electricity Consumption (kWh)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
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

            {/* Historical Snapshot preservation info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p>
                <strong>Historical Snapshot Preservation:</strong> This record was saved with factor snapshot{' '}
                <span className="font-mono font-bold">{editingRecord.factor_value_snapshot} kg/kWh</span>.
              </p>
              <label className="flex items-center space-x-2 cursor-pointer pt-1 text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={editRecalculate}
                  onChange={(e) => setEditRecalculate(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Recalculate with current active factor ({electricityFactor?.factor_value} kg/kWh)</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-mono flex items-center justify-between">
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
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
              >
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Electricity Record"
        message="Are you sure you want to permanently delete this electricity emission record? This action cannot be undone."
        isLoading={submitting}
      />
    </div>
  );
}

