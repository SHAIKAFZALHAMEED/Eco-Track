import React, { useState, useEffect } from 'react';
import {
  TableProperties,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../api/apiClient';

export default function RecordsPage({ showToast }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown reference data
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allFactors, setAllFactors] = useState([]);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editBuildingId, setEditBuildingId] = useState('');
  const [editFactorId, setEditFactorId] = useState('');
  const [editActivityName, setEditActivityName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editRecordDate, setEditRecordDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRecalculate, setEditRecalculate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState(null);

  const fetchReferenceData = async () => {
    try {
      const [bldgs, cats, factors] = await Promise.all([
        api.getBuildings(),
        api.getCategories(),
        api.getFactors()
      ]);
      setBuildings(bldgs.data || []);
      setCategories(cats.data || []);
      setAllFactors(factors.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoryFilter) params.category_id = categoryFilter;
      if (buildingFilter) params.building_id = buildingFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getRecords(params);
      setRecords(res.records || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err) {
      showToast({ type: 'error', title: 'Load Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchRecords(1);
  }, [categoryFilter, buildingFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setBuildingFilter('');
    setStartDate('');
    setEndDate('');
    fetchRecords(1);
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

  // Factors matching the category of the edited record
  const currentCategoryFactors = allFactors.filter(
    (f) => Number(f.category_id) === Number(editingRecord?.category_id)
  );

  const editActiveFactor = allFactors.find((f) => Number(f.factor_id) === Number(editFactorId));
  const editParsedQty = parseFloat(editQuantity) || 0;
  const editFactorToUse = editRecalculate && editActiveFactor
    ? editActiveFactor.factor_value
    : editingRecord?.factor_value_snapshot || (editActiveFactor ? editActiveFactor.factor_value : 1);
  const editCalculatedEmissions = Math.round(editParsedQty * editFactorToUse * 10000) / 10000;

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

      showToast({ type: 'success', message: 'Record updated successfully.' });
      setEditingRecord(null);
      fetchRecords(pagination.page);
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
      showToast({ type: 'success', message: 'Record deleted successfully.' });
      setDeletingId(null);
      fetchRecords(pagination.page);
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const params = {};
    if (categoryFilter) params.category_id = categoryFilter;
    if (buildingFilter) params.building_id = buildingFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const url = api.getReportExportUrl(params);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by activity, building, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Search
            </button>
          </form>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Download CSV export"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => fetchRecords(pagination.page)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Building Filter */}
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Building:</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.building_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          {(searchTerm || categoryFilter || buildingFilter || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            Showing {records.length} of {pagination.total} total records
          </span>
          <span className="text-[11px] text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileSpreadsheet}
              title="No emission records match your query"
              description="Try adjusting your filters or search term, or log new activities in the module pages."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Activity Description</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Factor Snapshot</th>
                  <th className="py-3 px-4 text-right">Emissions (kg CO2e)</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {records.map((r) => (
                  <tr key={r.record_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">{r.record_date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{r.building_name}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
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
                    <td className="py-3.5 px-4 text-slate-800">
                      <p className="font-medium">{r.activity_name}</p>
                      <span className="text-[11px] text-slate-400">{r.factor_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium whitespace-nowrap">
                      {r.activity_quantity.toLocaleString()} {r.activity_unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap" title="Preserved snapshot value">
                      {r.factor_value_snapshot.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.emissions_kg_co2e.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={r.notes}>
                      {r.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => fetchRecords(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchRecords(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Record Modal */}
      <Modal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        title={`Edit Emission Record #${editingRecord?.record_id} (${editingRecord?.category_name})`}
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
                Factor Applied
              </label>
              <select
                value={editFactorId}
                onChange={(e) => setEditFactorId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {currentCategoryFactors.map((f) => (
                  <option key={f.factor_id} value={f.factor_id}>
                    {f.factor_name} ({f.factor_value} kg CO2e / {f.activity_unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Activity Description
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
                Activity Quantity ({editingRecord.activity_unit})
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
                Audit Notes
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
                <strong>Snapshot Integrity:</strong> This historical record is linked to a snapshot of{' '}
                <span className="font-mono font-bold">{editingRecord.factor_value_snapshot} kg CO2e / {editingRecord.activity_unit}</span>.
              </p>
              <label className="flex items-center space-x-2 cursor-pointer pt-1 text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={editRecalculate}
                  onChange={(e) => setEditRecalculate(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Recalculate with current active factor ({editActiveFactor?.factor_value} kg CO2e)</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-mono flex items-center justify-between">
              <span>Updated Total Emissions:</span>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Emission Record"
        message="Are you sure you want to permanently delete this emission record from MySQL? This action will immediately adjust overall campus carbon balances."
        isLoading={submitting}
      />
    </div>
  );
}

