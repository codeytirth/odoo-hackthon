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
  AlertCircle
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
      setFormError('Load, odometer, and acquisition cost must be positive numbers.');
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

      showSuccess(`Vehicle ${isEditMode ? 'updated' : 'registered'} successfully!`);
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!isManager) return;
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete vehicle');

      showSuccess('Vehicle deleted successfully.');
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

  const getStatusColor = (vStatus) => {
    switch (vStatus) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'On Trip':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'In Shop':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Retired':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicle Registry</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track fleet assets, registration details, and deployment statuses.</p>
        </div>
        
        {isManager ? (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Register Vehicle
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium select-none">
            <Info className="w-4 h-4 text-slate-500" />
            View-Only Mode
          </div>
        )}
      </div>

      {/* Global alert notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
            <span className="text-2xl font-bold text-white mt-1.5 block">{totalCount}</span>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Available</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1.5 block">{availableCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">On Route</span>
            <span className="text-2xl font-bold text-blue-400 mt-1.5 block">{onTripCount}</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">In Maintenance</span>
            <span className="text-2xl font-bold text-amber-400 mt-1.5 block">{inShopCount}</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by reg number or vehicle name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          <span className="text-xs font-medium text-slate-400">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid/Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-slate-500">
          No vehicles matched your search or filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-900/40">
                <th className="px-6 py-4">Reg. Number</th>
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Max Load</th>
                <th className="px-6 py-4 text-right">Odometer</th>
                <th className="px-6 py-4 text-right">Acquisition</th>
                <th className="px-6 py-4 text-center">Status</th>
                {isManager && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-800/10 transition">
                  <td className="px-6 py-4 font-mono font-bold text-white">{vehicle.regNumber}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-200 block">{vehicle.name}</span>
                    <span className="text-xs text-slate-500">ID: {vehicle.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
                      {vehicle.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{vehicle.maxLoad} kg</td>
                  <td className="px-6 py-4 text-right font-medium">{vehicle.odometer} km</td>
                  <td className="px-6 py-4 text-right font-medium">${vehicle.acquisitionCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                          title="Edit Vehicle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                          title="Delete Vehicle"
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
      )}

      {/* Modal - Add / Edit Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Title */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {isEditMode ? 'Modify Vehicle Registry' : 'Register New Vehicle'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-850 transition"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Reg. Number (Unique)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VAN-05"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Vehicle Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    >
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="Car">Car</option>
                      <option value="SUV">SUV</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Vehicle Model Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mercedes-Benz Sprinter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Max Load (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={maxLoad}
                      onChange={(e) => setMaxLoad(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Odometer (km)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={acquisitionCost}
                      onChange={(e) => setAcquisitionCost(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>
                </div>

                {isEditMode && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
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
