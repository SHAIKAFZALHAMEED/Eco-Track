import React, { useState, useEffect } from 'react';
import {
  Fuel,
  PlusCircle,
  Building2,
  Trash2,
  Edit2,
  TrendingUp,
  AlertCircle,
  Calculator,
  Truck,
  Car
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
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../api/apiClient';

export default function FuelPage({ showToast }) {
  const [buildings, setBuildings] = useState([]);
  const [fuelFactors, setFuelFactors] = useState([]);
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
        api.getFactors({ category_id: 2, is_active: 1 }), // Fuel category
        api.getRecords({ category_code: 'FUEL', limit: 100 })
      ]);

      setBuildings(bldgRes.data || []);
      if (bldgRes.data && bldgRes.data.length > 0 && !buildingId) {
        setBuildingId(bldgRes.data[0].building_id);
      }

      const factors = factorRes.data || [];
      setFuelFactors(factors);
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

  const activeFactor = fuelFactors.find((f) => Number(f.factor_id) === Number(selectedFactorId));
  const parsedQty = parseFloat(quantity) || 0;
  const factorVal = activeFactor ? activeFactor.factor_value : 2.313000;
  const calculatedEmissions = Math.round(parsedQty * factorVal * 10000) / 10000;

  // Edit calculation
  const editActiveFactor = fuelFactors.find((f) => Number(f.factor_id) === Number(editFactorId));
  const editParsedQty = parseFloat(editQuantity) || 0;
  const editFactorToUse = editRecalculate && editActiveFactor
    ? editActiveFactor.factor_value
    : editingRecord?.factor_value_snapshot || (editActiveFactor ? editActiveFactor.factor_value : 2.313);
  const editCalculatedEmissions = Math.round(editParsedQty * editFactorToUse * 10000) / 10000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) {
      showToast({ type: 'error', message: 'Please select a campus building.' });
      return;
    }
    if (!selectedFactorId || !activeFactor) {
      showToast({ type: 'error', message: 'Please select a fuel type (Petrol or Diesel).' });
      return;
    }
    if (!activityName.trim()) {
      showToast({ type: 'error', message: 'Please describe the vehicle, generator, or transport activity.' });
      return;
    }
    if (parsedQty <= 0) {
      showToast({ type: 'error', message: 'Fuel quantity must be greater than 0 litres.' });
      return;
    }
    if (!recordDate) {
      showToast({ type: 'error', message: 'Please select a valid record date.' });
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
        title: 'Fuel Record Logged',
        message: `Successfully logged ${parsedQty.toLocaleString()} L of ${activeFactor.factor_name} (${calculatedEmissions.toLocaleString()} kg CO2e).`
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

      showToast({ type: 'success', message: 'Fuel record updated successfully.' });
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
      showToast({ type: 'success', message: 'Fuel record deleted.' });
      setDeletingId(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations for cards
  const petrolRecords = records.filter((r) => r.factor_name.toLowerCase().includes('petrol'));
  const dieselRecords = records.filter((r) => r.factor_name.toLowerCase().includes('diesel'));

  const petrolLitres = petrolRecords.reduce((sum, r) => sum + r.activity_quantity, 0);
  const dieselLitres = dieselRecords.reduce((sum, r) => sum + r.activity_quantity, 0);
  const totalLitres = petrolLitres + dieselLitres;

  const petrolKg = petrolRecords.reduce((sum, r) => sum + r.emissions_kg_co2e, 0);
  const dieselKg = dieselRecords.reduce((sum, r) => sum + r.emissions_kg_co2e, 0);
  const totalFuelKg = petrolKg + dieselKg;

  const fuelBreakdownChart = [
    { name: 'Petrol', litres: petrolLitres, emissions: petrolKg },
    { name: 'Diesel', litres: dieselLitres, emissions: dieselKg }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Fuel Consumed"
          value={totalLitres}
          unit="Litres"
          subtitle={`${records.length} logged entries`}
          icon={Fuel}
          variant="amber"
        />
        <StatCard
          title="Fuel Carbon Footprint"
          value={totalFuelKg}
          unit="kg CO2e"
          subtitle={`${(totalFuelKg / 1000).toFixed(3)} metric tonnes`}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Petrol (Gasoline)"
          value={petrolLitres}
          unit="L"
          subtitle={`${petrolKg.toLocaleString()} kg CO2e (2.313/L)`}
          icon={Car}
          variant="blue"
        />
        <StatCard
          title="Diesel"
          value={dieselLitres}
          unit="L"
          subtitle={`${dieselKg.toLocaleString()} kg CO2e (2.661/L)`}
          icon={Truck}
          variant="purple"
        />
      </div>

      {/* Main Grid: Form (5 cols) + Comparison Bar Chart (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Fuel & Fleet Combustion</h3>
              <p className="text-xs text-slate-500">Record Scope 1 stationary and mobile fuel use</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campus Building Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Building / Base *
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

            {/* Fuel Type Factor Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fuel Type *
              </label>
              <select
                value={selectedFactorId}
                onChange={(e) => setSelectedFactorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {fuelFactors.map((f) => (
                  <option key={f.factor_id} value={f.factor_id}>
                    {f.factor_name} ({f.factor_value} kg CO2e / {f.activity_unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Activity / Fleet Description *
              </label>
              <input
                type="text"
                placeholder="e.g., Campus Shuttle Bus #2, Emergency Generator Run"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fuel Volume (Litres) *
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
                  Litres
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
                placeholder="e.g., Diesel dispenser receipt #7821, generator monthly check"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Calculation Preview */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-700" />
                  Calculation Preview
                </span>
                <span className="font-mono text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Scope 1 (Direct)
                </span>
              </div>

              <div className="text-xs font-mono text-slate-600 flex items-center justify-between pt-1">
                <span>{parsedQty.toLocaleString()} L × {factorVal} kg/L</span>
                <span className="text-sm font-bold text-amber-900 font-mono">
                  = {calculatedEmissions.toLocaleString(undefined, { minimumFractionDigits: 2 })} kg CO2e
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Saving to MySQL...' : 'Log Fuel Record'}</span>
            </button>
          </form>
        </div>

        {/* Petrol vs Diesel Breakdown Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Fuel Breakdown (Petrol vs Diesel)</h3>
                <p className="text-xs text-slate-500">Volume and GHG emissions comparison</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Scope 1 Direct
              </span>
            </div>

            {totalLitres === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <EmptyState
                  icon={Fuel}
                  title="No fuel records yet"
                  description="Log petrol or diesel records on the left to see the fleet fuel comparison."
                />
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelBreakdownChart} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#d97706" tick={{ fontSize: 11 }} unit=" L" />
                    <YAxis yAxisId="right" orientation="right" stroke="#059669" tick={{ fontSize: 11 }} unit=" kg" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="litres" fill="#d97706" radius={[6, 6, 0, 0]} name="Litres Consumed" />
                    <Bar yAxisId="right" dataKey="emissions" fill="#059669" radius={[6, 6, 0, 0]} name="Emissions (kg CO2e)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <p>
              Diesel fuel possesses a higher carbon intensity (<strong>2.661 kg CO2e/L</strong>) than petrol (<strong>2.313 kg CO2e/L</strong>). Replacing campus diesel transit vans with electric shuttles provides the largest single-route mitigation opportunity.
            </p>
          </div>
        </div>
      </div>

      {/* Fuel Records Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Fuel & Fleet Record Ledger</h3>
            <p className="text-xs text-slate-500">Historical fleet fuel records logged into MySQL</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {records.length} Records
          </span>
        </div>

        {records.length === 0 ? (
          <EmptyState
            title="No fuel records found"
            description="All fleet and generator fuel entries will appear in this ledger."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Building / Base</th>
                  <th className="py-3 px-3">Fuel Type</th>
                  <th className="py-3 px-3">Fleet Description</th>
                  <th className="py-3 px-3 text-right">Volume</th>
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
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {r.factor_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{r.activity_name}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {r.activity_quantity.toLocaleString()} L
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {r.factor_value_snapshot.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-900">
                      {r.emissions_kg_co2e.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{r.notes || '—'}</td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
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
        title={`Edit Fuel Record #${editingRecord?.record_id}`}
      >
        {editingRecord && (
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Building / Base
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
                Fuel Type
              </label>
              <select
                value={editFactorId}
                onChange={(e) => setEditFactorId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {fuelFactors.map((f) => (
                  <option key={f.factor_id} value={f.factor_id}>
                    {f.factor_name} ({f.factor_value} kg CO2e / {f.activity_unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fleet Description
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
                Fuel Volume (Litres)
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
                <span className="font-mono font-bold">{editingRecord.factor_value_snapshot} kg CO2e/L</span>.
              </p>
              <label className="flex items-center space-x-2 cursor-pointer pt-1 text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={editRecalculate}
                  onChange={(e) => setEditRecalculate(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Recalculate with current active factor ({editActiveFactor?.factor_value} kg/L)</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs font-mono flex items-center justify-between">
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
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
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
        title="Delete Fuel Record"
        message="Are you sure you want to permanently delete this fuel emission record? This action cannot be undone."
        isLoading={submitting}
      />
    </div>
  );
}

