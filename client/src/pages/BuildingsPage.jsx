import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  AlertTriangle,
  Lock,
  Layers,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../api/apiClient';

export default function BuildingsPage({ showToast }) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newLocation, setNewLocation] = useState('Campus');

  // Edit modal state
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Delete state
  const [deletingBuilding, setDeletingBuilding] = useState(null);
  const [blockedDeleteBuilding, setBlockedDeleteBuilding] = useState(null);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await api.getBuildings();
      setBuildings(res.data || []);
    } catch (err) {
      showToast({ type: 'error', title: 'Load Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newBuildingName.trim()) {
      showToast({ type: 'error', message: 'Building name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.createBuilding({
        building_name: newBuildingName.trim(),
        location: newLocation.trim() || 'Campus'
      });

      showToast({ type: 'success', message: `Building "${newBuildingName.trim()}" added to MySQL.` });
      setNewBuildingName('');
      setNewLocation('Campus');
      setAddModalOpen(false);
      fetchBuildings();
    } catch (err) {
      showToast({ type: 'error', title: 'Add Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (bldg) => {
    setEditingBuilding(bldg);
    setEditName(bldg.building_name);
    setEditLocation(bldg.location);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast({ type: 'error', message: 'Building name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.updateBuilding(editingBuilding.building_id, {
        building_name: editName.trim(),
        location: editLocation.trim() || 'Campus'
      });

      showToast({ type: 'success', message: 'Building updated successfully.' });
      setEditingBuilding(null);
      fetchBuildings();
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const promptDeleteBuilding = (bldg) => {
    if (bldg.linked_records_count > 0) {
      setBlockedDeleteBuilding(bldg);
    } else {
      setDeletingBuilding(bldg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBuilding) return;

    setSubmitting(true);
    try {
      await api.deleteBuilding(deletingBuilding.building_id);
      showToast({ type: 'success', message: `Building "${deletingBuilding.building_name}" deleted.` });
      setDeletingBuilding(null);
      fetchBuildings();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900">Campus Buildings Directory</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {buildings.length} Active Facilities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real buildings stored in MySQL table <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">buildings</code> with linked record constraints.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchBuildings}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Refresh buildings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Building</span>
          </button>
        </div>
      </div>

      {/* Buildings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {buildings.map((bldg) => {
          const hasLinked = bldg.linked_records_count > 0;
          return (
            <div
              key={bldg.building_id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    ID #{bldg.building_id}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-4 tracking-tight">
                  {bldg.building_name}
                </h4>

                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{bldg.location}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Linked Records:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md ${
                        hasLinked
                          ? 'bg-emerald-50 text-emerald-800 font-mono'
                          : 'bg-slate-100 text-slate-600 font-mono'
                      }`}
                    >
                      {bldg.linked_records_count} records
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Emissions:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {bldg.total_emissions_kg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created:
                    </span>
                    <span>{bldg.created_at ? new Date(bldg.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(bldg)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 py-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => promptDeleteBuilding(bldg)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold py-1 transition-colors ${
                    hasLinked
                      ? 'text-slate-400 hover:text-slate-600 cursor-help'
                      : 'text-rose-600 hover:text-rose-800'
                  }`}
                  title={hasLinked ? 'Building has linked records and cannot be deleted' : 'Delete Building'}
                >
                  {hasLinked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{hasLinked ? 'Locked' : 'Delete'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Building Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Campus Building">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Building Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Department of Computer Science"
              value={newBuildingName}
              onChange={(e) => setNewBuildingName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Location / Campus Zone *
            </label>
            <input
              type="text"
              placeholder="e.g., North Campus, Sector 4"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
              {submitting ? 'Adding...' : 'Save Building'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Building Modal */}
      <Modal isOpen={Boolean(editingBuilding)} onClose={() => setEditingBuilding(null)} title="Edit Building Details">
        {editingBuilding && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Building Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Location *
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingBuilding(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
              >
                {submitting ? 'Saving...' : 'Update Building'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Blocked Deletion Explanation Modal */}
      <Modal
        isOpen={Boolean(blockedDeleteBuilding)}
        onClose={() => setBlockedDeleteBuilding(null)}
        title="Building Deletion Blocked"
        maxWidth="max-w-md"
      >
        {blockedDeleteBuilding && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Cannot Delete "{blockedDeleteBuilding.building_name}"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This campus building has <strong>{blockedDeleteBuilding.linked_records_count} linked emission record(s)</strong> in MySQL table <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">emission_records</code>.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  To safeguard historical audit integrity and prevent orphaned foreign keys (<code className="font-mono text-[11px]">fk_record_building</code>), facilities with active emission data cannot be deleted. If needed, edit the facility name or reassign its records first.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setBlockedDeleteBuilding(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingBuilding)}
        onClose={() => setDeletingBuilding(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Campus Facility"
        message={`Are you sure you want to delete "${deletingBuilding?.building_name}"? Since it has 0 linked records, it can safely be removed from MySQL.`}
        isLoading={submitting}
      />
    </div>
  );
}

