import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Info,
  Layers,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Loader2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function VehicleRegistry() {
  const { user, token } = useAuth();
  const isManager = user?.role === 'fleet_manager';

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form states
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Van');
  const [maxLoad, setMaxLoad] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [status, setStatus] = useState('Available');

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch vehicles');
      setVehicles(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openAddModal = () => {
    if (!isManager) return;
    setIsEditMode(false);
    setSelectedId(null);
    setRegNumber('');
    setName('');
    setType('Van');
    setMaxLoad('');
    setOdometer('');
    setAcquisitionCost('');
    setStatus('Available');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    if (!isManager) return;
    setIsEditMode(true);
    setSelectedId(vehicle.id);
    setRegNumber(vehicle.regNumber);
    setName(vehicle.name);
    setType(vehicle.type);
    setMaxLoad(vehicle.maxLoad.toString());
    setOdometer(vehicle.odometer.toString());
    setAcquisitionCost(vehicle.acquisitionCost.toString());
    setStatus(vehicle.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!regNumber.trim() || !name.trim() || !type || !maxLoad || !odometer || !acquisitionCost) {
      setFormError('Please fill in all fields.');
      return;
    }

    const payload = {
      regNumber: regNumber.trim().toUpperCase(),
      name: name.trim(),
      type,
      maxLoad: parseFloat(maxLoad),
      odometer: parseFloat(odometer),
      acquisitionCost: parseFloat(acquisitionCost),
      status
    };

    if (payload.maxLoad <= 0 || payload.odometer < 0 || payload.acquisitionCost < 0) {
      setFormError('Max load capacity, odometer, and acquisition cost must be positive numbers.');
      return;
    }

    try {
      const url = isEditMode ? `${API_URL}/vehicles/${selectedId}` : `${API_URL}/vehicles`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save vehicle');
      }

      showSuccess(`Vehicle "${payload.regNumber}" has been successfully ${isEditMode ? 'updated' : 'registered'}!`);
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!isManager) return;
    if (!window.confirm('Are you sure you want to delete this vehicle from the registry?')) return;

    try {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete vehicle');

      showSuccess('Vehicle was successfully deleted from registry.');
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter lists
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate quick stats
  const totalCount = vehicles.length;
  const availableCount = vehicles.filter((v) => v.status === 'Available').length;
  const onTripCount = vehicles.filter((v) => v.status === 'On Trip').length;
  const inShopCount = vehicles.filter((v) => v.status === 'In Shop').length;

  const getStatusStyle = (vStatus) => {
    switch (vStatus) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 glow-emerald';
      case 'On Trip':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25 glow-blue';
      case 'In Shop':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25 glow-amber';
      case 'Retired':
        return 'bg-rose-500/10 text-rose-450 border border-rose-500/25';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900/60 via-slate-900/20 to-transparent p-6 rounded-3xl border border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Vehicle Registry</h1>
          <p className="text-sm text-slate-400 mt-1">Register and monitor active, retired, or in-maintenance fleet vehicles.</p>
        </div>
        
        {isManager ? (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Register New Vehicle
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.05] text-xs text-slate-400 font-bold tracking-wide uppercase select-none">
            <Info className="w-4 h-4 text-indigo-400" />
            View-Only Mode
          </div>
        )}
      </div>

      {/* Toast Alert popups */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade glow-emerald">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm font-medium animate-fade">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Fleet */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.05] flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition" />
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Total Fleet</span>
            <span className="text-3xl font-black text-white mt-2 block tracking-tight">{totalCount}</span>
          </div>
          <div className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-indigo-400 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Available */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.05] flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Available</span>
            <span className="text-3xl font-black text-emerald-400 mt-2 block tracking-tight">{availableCount}</span>
          </div>
          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-450 shadow-inner">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: On Trip */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.05] flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition" />
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">On Route</span>
            <span className="text-3xl font-black text-blue-400 mt-2 block tracking-tight">{onTripCount}</span>
          </div>
          <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-blue-450 shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Maintenance */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.05] flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
          <div>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">In Shop</span>
            <span className="text-3xl font-black text-amber-400 mt-2 block tracking-tight">{inShopCount}</span>
          </div>
          <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-amber-450 shadow-inner">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/[0.05] shadow-lg flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by registration number or model name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-[#030712]/30 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/80 transition-all font-medium"
          />
        </div>

        {/* Multi-Filters Grid */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-450 text-xs font-bold uppercase tracking-wider select-none">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-450">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-450">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="All">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Presentation Section */}
      {loading ? (
        <div className="text-center py-16 text-slate-450 text-sm font-medium animate-pulse flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span>Syncing operations with Neon database...</span>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-dashed border-slate-800 bg-white/[0.01] text-slate-500 font-medium">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <span>No vehicles matched your search filter parameters.</span>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/[0.05] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] text-xs font-bold text-slate-450 uppercase bg-white/[0.01] select-none">
                  <th className="px-6 py-4.5 tracking-wider">Reg. Number</th>
                  <th className="px-6 py-4.5 tracking-wider">Vehicle Details</th>
                  <th className="px-6 py-4.5 tracking-wider">Type</th>
                  <th className="px-6 py-4.5 tracking-wider text-right">Max Load</th>
                  <th className="px-6 py-4.5 tracking-wider text-right">Odometer</th>
                  <th className="px-6 py-4.5 tracking-wider text-right">Acquisition</th>
                  <th className="px-6 py-4.5 tracking-wider text-center">Status</th>
                  {isManager && <th className="px-6 py-4.5 tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-sm text-slate-350 font-medium">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                    <td className="px-6 py-4.5 font-mono font-extrabold text-white text-base">
                      <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-indigo-400">
                        {vehicle.regNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-slate-100 font-bold block leading-snug">{vehicle.name}</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block mt-1">ID Ref: {vehicle.id}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 border border-white/[0.03] text-slate-400">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right text-slate-200">
                      <div className="font-bold flex items-center justify-end gap-1">
                        <span>{vehicle.maxLoad}</span>
                        <span className="text-xs text-slate-500 font-medium">kg</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right text-slate-250">
                      <div className="font-bold flex items-center justify-end gap-1">
                        <span>{vehicle.odometer.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-medium">km</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right font-bold text-slate-100">
                      ${vehicle.acquisitionCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    {isManager && (
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(vehicle)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all"
                            title="Edit Vehicle details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
                            title="Delete Vehicle registry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register / Modify Vehicle Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md animate-fade">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.06] bg-[#0b0f19] shadow-2xl overflow-hidden animate-zoom relative">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/[0.04] flex justify-between items-center bg-[#070b13]/55">
              <h3 className="text-base font-bold text-white tracking-tight">
                {isEditMode ? 'Modify Vehicle Registry' : 'Register New Fleet Asset'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-fade">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Reg. Number (Unique)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VAN-05"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Vehicle Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm"
                    >
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="Car">Car</option>
                      <option value="SUV">SUV</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Vehicle Model Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mercedes-Benz Sprinter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Max Load (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={maxLoad}
                      onChange={(e) => setMaxLoad(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Odometer (km)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={acquisitionCost}
                      onChange={(e) => setAcquisitionCost(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                {isEditMode && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all font-medium text-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Modal Buttons Footer */}
              <div className="px-6 py-4.5 border-t border-white/[0.04] bg-[#070b13]/55 flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0b0f19] text-slate-400 hover:text-slate-200 hover:bg-[#070b13] text-sm font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/10 active:scale-[0.98]"
                >
                  {isEditMode ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
