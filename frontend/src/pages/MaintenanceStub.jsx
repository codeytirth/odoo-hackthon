import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  Truck,
  ArrowRight
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function MaintenanceLog() {
  const { user, token } = useAuth();
  const isManager = user?.role === 'fleet_manager';

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [logStatus, setLogStatus] = useState('Open');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/maintenance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch maintenance logs');
      setLogs(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setVehiclesLoading(true);
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setVehicles(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openAddModal = () => {
    if (!isManager) return;
    setVehicleId('');
    setDescription('');
    setCost('');
    setLogStatus('Open');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!vehicleId || !description.trim() || cost === '') {
      setFormError('Please fill in all fields.');
      return;
    }

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setFormError('Cost must be a positive number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: parseInt(vehicleId),
          description: description.trim(),
          cost: parsedCost,
          status: logStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create maintenance log');

      showSuccess('Maintenance log registered successfully!');
      setIsModalOpen(false);
      fetchLogs();
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseLog = async (id) => {
    if (!isManager) return;
    if (!window.confirm('Are you sure you want to close this maintenance log? This will set the vehicle back to Available.')) return;

    try {
      const res = await fetch(`${API_URL}/maintenance/${id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close maintenance log');

      showSuccess('Maintenance log closed successfully!');
      fetchLogs();
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.vehicle?.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      log.vehicle?.name.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeLogsCount = logs.filter((l) => l.status === 'Open').length;
  const totalMaintenanceCost = logs.reduce((sum, l) => sum + l.cost, 0);

  const getStatusBadgeClass = (status) => {
    return status === 'Open'
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Maintenance Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track vehicle repairs, service costs, and shop status transitions.</p>
        </div>

        {isManager ? (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.03]"
          >
            <Plus className="w-4 h-4" />
            Log Maintenance
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium select-none shadow-inner">
            <Info className="w-4 h-4 text-slate-500" />
            View-Only Mode
          </div>
        )}
      </div>

      {/* Global alert notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm shadow-[0_4px_20px_rgba(239,68,68,0.1)]">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/80 transition-all duration-300 shadow-md">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Sessions</span>
            <span className="text-3xl font-extrabold text-white mt-1.5 block tracking-tight">{logs.length}</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-2xl text-slate-300 border border-slate-700/30">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/80 transition-all duration-300 shadow-md">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active In Shop</span>
            <span className="text-3xl font-extrabold text-amber-400 mt-1.5 block tracking-tight">{activeLogsCount}</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/80 transition-all duration-300 shadow-md">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Investment</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1.5 block tracking-tight">₹{totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-md flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by reg number, vehicle name or service details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-550" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-xs rounded-xl border border-slate-800 bg-[#0f172a] text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="All" className="bg-[#0f172a] text-slate-200">All Statuses</option>
            <option value="Open" className="bg-[#0f172a] text-slate-200">Active (Open)</option>
            <option value="Closed" className="bg-[#0f172a] text-slate-200">Completed (Closed)</option>
          </select>
        </div>
      </div>

      {/* Maintenance Logs List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 border-r-2" />
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Fetching repairs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-24 rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 text-slate-500 flex flex-col items-center justify-center gap-2.5">
          <Wrench className="w-8 h-8 text-slate-600 animate-pulse" />
          <span className="text-sm font-medium">No maintenance records found</span>
          <span className="text-xs text-slate-600 max-w-xs">Try adjusting your filters or record a new session to get started.</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900/60">
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Opened Date</th>
                <th className="px-6 py-4">Closed Date</th>
                {isManager && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-white block tracking-wider">{log.vehicle?.regNumber}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">{log.vehicle?.name || `Vehicle ID: ${log.vehicleId}`}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200 max-w-xs truncate" title={log.description}>
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono">
                    ₹{log.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadgeClass(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium">{formatDate(log.openedAt)}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium">{formatDate(log.closedAt)}</td>
                  {isManager && (
                    <td className="px-6 py-4 text-right">
                      {log.status === 'Open' ? (
                        <button
                          onClick={() => handleCloseLog(log.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-450 hover:text-white border border-emerald-500/20 hover:border-transparent text-xs font-bold transition-all duration-200 hover:scale-[1.02]"
                        >
                          Close Log
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 font-bold select-none px-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Finished</span>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Add Maintenance Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Title */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                <span>Log Maintenance Record</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold p-1 transition"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs shadow-md">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Select Vehicle
                  </label>
                  {vehiclesLoading ? (
                    <div className="text-xs text-slate-500">Loading vehicles...</div>
                  ) : (
                    <select
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all font-medium"
                      required
                    >
                      <option value="" className="bg-[#0f172a] text-slate-200">-- Choose a Vehicle --</option>
                      {vehicles
                        .filter(v => v.status !== 'Retired')
                        .map((v) => (
                          <option key={v.id} value={v.id} className="bg-[#0f172a] text-slate-200">
                            {v.regNumber} - {v.name} ({v.status})
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Service/Repair Description
                  </label>
                  <textarea
                    placeholder="Describe the issues, parts replaced, or service details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Cost (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Log Status
                    </label>
                    <select
                      value={logStatus}
                      onChange={(e) => setLogStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all font-medium"
                    >
                      <option value="Open" className="bg-[#0f172a] text-slate-200">Active (Sets vehicle to In Shop)</option>
                      <option value="Closed" className="bg-[#0f172a] text-slate-200">Immediate Complete (Saves closed)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 text-xs text-indigo-400 shadow-sm leading-relaxed">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Saving this log as **Active** will automatically transition the vehicle status to **In Shop**, which removes it from dispatch lists immediately.
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-semibold transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-750 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 hover:scale-[1.02]"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Register Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
