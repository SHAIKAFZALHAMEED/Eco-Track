import React, { useState, useEffect } from 'react';
import {
  Sliders,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  Layers,
  Info,
  RefreshCw,
  Power
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../api/apiClient';

export default function FactorsPage({ showToast }) {
  const [factors, setFactors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add factor state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newFactorName, setNewFactorName] = useState('');
  const [newActivityUnit, setNewActivityUnit] = useState('kWh');
  const [newFactorValue, setNewFactorValue] = useState('');
  const [newEmissionUnit, setNewEmissionUnit] = useState('kg CO2e');
  const [newSourceName, setNewSourceName] = useState('');

  // Edit factor state
  const [editingFactor, setEditingFactor] = useState(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Deletion states
  const [deletingFactor, setDeletingFactor] = useState(null);
  const [blockedFactor, setBlockedFactor] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, catRes] = await Promise.all([
        api.getFactors(),
        api.getCategories()
      ]);
      setFactors(facRes.data || []);
      setCategories(catRes.data || []);
      if (catRes.data && catRes.data.length > 0 && !newCategoryId) {
        setNewCategoryId(catRes.data[0].category_id);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Load Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(newFactorValue);
    if (isNaN(val) || val <= 0) {
      showToast({ type: 'error', message: 'Emission factor value must be a positive number greater than 0.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.createFactor({
        category_id: newCategoryId,
        factor_name: newFactorName.trim(),
        activity_unit: newActivityUnit.trim(),
        factor_value: val,
        emission_unit: newEmissionUnit.trim() || 'kg CO2e',
        source_name: newSourceName.trim() || 'Custom factor entry'
      });

      showToast({ type: 'success', message: `Factor "${newFactorName.trim()}" added successfully.` });
      setNewFactorName('');
      setNewFactorValue('');
      setNewSourceName('');
      setAddModalOpen(false);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Add Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (factor) => {
    setEditingFactor(factor);
    setEditName(factor.factor_name);
    setEditValue(factor.factor_value);
    setEditUnit(factor.activity_unit);
    setEditSource(factor.source_name);
    setEditActive(factor.is_active);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(editValue);
    if (isNaN(val) || val <= 0) {
      showToast({ type: 'error', message: 'Factor value must be a positive number greater than 0.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.updateFactor(editingFactor.factor_id, {
        factor_name: editName.trim(),
        factor_value: val,
        activity_unit: editUnit.trim(),
        source_name: editSource.trim(),
        is_active: editActive
      });

      showToast({ type: 'success', message: 'Emission factor updated.' });
      setEditingFactor(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (factor) => {
    const newStatus = !factor.is_active;
    try {
      await api.toggleFactorStatus(factor.factor_id, newStatus);
      showToast({
        type: 'info',
        message: `Factor "${factor.factor_name}" is now ${newStatus ? 'active' : 'deactivated'}.`
      });
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Status Toggle Failed', message: err.message });
    }
  };

  const promptDeleteFactor = (factor) => {
    if (factor.linked_records_count > 0) {
      setBlockedFactor(factor);
    } else {
      setDeletingFactor(factor);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFactor) return;
    setSubmitting(true);
    try {
      await api.deleteFactor(deletingFactor.factor_id);
      showToast({ type: 'success', message: `Factor "${deletingFactor.factor_name}" removed.` });
      setDeletingFactor(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold">Prototype Factor Notice:</strong> Current database values are project prototype coefficients provided for educational and baseline testing. They must not be cited as verified government or IPCC factors without formal utility tariff reconciliation.
        </div>
      </div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900">Emission Factor Registry</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {factors.length} Defined Factors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Activity conversion factors stored in MySQL table <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">emission_factors</code>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Refresh factors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Factor</span>
          </button>
        </div>
      </div>

      {/* Factors Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4">Factor Name</th>
                <th className="py-3 px-4">Scope / Category</th>
                <th className="py-3 px-4">Activity Unit</th>
                <th className="py-3 px-4 text-right">Factor Value</th>
                <th className="py-3 px-4">Emission Unit</th>
                <th className="py-3 px-4">Source Citation</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Linked Records</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {factors.map((f) => (
                <tr key={f.factor_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {f.factor_name}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        f.category_code === 'ELECTRICITY'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : f.category_code === 'FUEL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {f.category_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                    {f.activity_unit}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800 text-sm">
                    {f.factor_value.toFixed(6)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {f.emission_unit}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={f.source_name}>
                    {f.source_name}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(f)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        f.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={f.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <Power className="w-3 h-3" />
                      <span>{f.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {f.linked_records_count} records
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => openEditModal(f)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit Factor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDeleteFactor(f)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        f.linked_records_count > 0
                          ? 'text-slate-300 hover:text-slate-500'
                          : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                      title={f.linked_records_count > 0 ? 'Referenced factor cannot be deleted; deactivation is recommended' : 'Delete Factor'}
                    >
                      {f.linked_records_count > 0 ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Factor Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Define New Emission Factor">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Scope *
            </label>
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name} ({c.category_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Factor Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Rooftop Solar Displaced Grid, CNG Fleet"
              value={newFactorName}
              onChange={(e) => setNewFactorName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Activity Unit *
              </label>
              <input
                type="text"
                placeholder="kWh, litre, kg"
                value={newActivityUnit}
                onChange={(e) => setNewActivityUnit(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Factor Value *
              </label>
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                placeholder="0.000000"
                value={newFactorValue}
                onChange={(e) => setNewFactorValue(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Source / Citation
            </label>
            <input
              type="text"
              placeholder="e.g., Regional Electricity Board 2026 GHG Table"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
            >
              {submitting ? 'Adding...' : 'Save Factor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Factor Modal */}
      <Modal isOpen={Boolean(editingFactor)} onClose={() => setEditingFactor(null)} title="Edit Emission Factor">
        {editingFactor && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Factor Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Factor Value
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Activity Unit
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Source Citation
              </label>
              <input
                type="text"
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Active factor (available for new emission logs)</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingFactor(null)}
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

      {/* Blocked Deletion Explanation Modal */}
      <Modal
        isOpen={Boolean(blockedFactor)}
        onClose={() => setBlockedFactor(null)}
        title="Factor Deletion Blocked"
        maxWidth="max-w-md"
      >
        {blockedFactor && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Cannot Delete Referenced Factor
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Factor <strong>"{blockedFactor.factor_name}"</strong> is referenced by <strong>{blockedFactor.linked_records_count} historical emission record(s)</strong> in MySQL table <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">emission_records</code>.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Deleting a referenced factor would compromise past audit snapshots and break foreign key integrity (<code className="font-mono text-[11px]">fk_record_factor</code>). Instead, click the <strong>Active</strong> toggle to deactivate it so it is hidden from future entries while preserving historical logs.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setBlockedFactor(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingFactor)}
        onClose={() => setDeletingFactor(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Emission Factor"
        message={`Are you sure you want to permanently delete factor "${deletingFactor?.factor_name}"? Since it has 0 linked records, it can safely be removed.`}
        isLoading={submitting}
      />
    </div>
  );
}

