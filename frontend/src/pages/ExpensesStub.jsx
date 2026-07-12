import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  Droplet,
  FileText,
  Activity
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function FuelExpenseTracker() {
  const { user, token } = useAuth();
  const isAuthorized = ['fleet_manager', 'financial_analyst'].includes(user?.role);

  // Lists state
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('fuel'); // 'fuel' | 'expenses'
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering state
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('All');

  // Form states - Modals
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fuel Form state
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);

  // Expense Form state
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
    fetchVehicles();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch fuel logs
      const fuelRes = await fetch(`${API_URL}/fuel-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fuelData = await fuelRes.json();
      if (!fuelRes.ok) throw new Error(fuelData.error || 'Failed to fetch fuel logs');
      setFuelLogs(fuelData.data || []);

      // Fetch expenses
      const expRes = await fetch(`${API_URL}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const expData = await expRes.json();
      if (!expRes.ok) throw new Error(expData.error || 'Failed to fetch expenses');
      setExpenses(expData.data || []);

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
        headers: { 'Authorization': `Bearer ${token}` }
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

  const openFuelModal = () => {
    setFuelVehicleId('');
    setFuelLiters('');
    setFuelCost('');
    setFuelDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsFuelModalOpen(true);
  };

  const openExpenseModal = () => {
    setExpVehicleId('');
    setExpType('');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsExpenseModalOpen(true);
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!fuelVehicleId || !fuelLiters || !fuelCost || !fuelDate) {
      setFormError('All fields are required.');
      return;
    }

    const litersVal = parseFloat(fuelLiters);
    const costVal = parseFloat(fuelCost);

    if (isNaN(litersVal) || litersVal <= 0) {
      setFormError('Liters must be a positive number.');
      return;
    }

    if (isNaN(costVal) || costVal <= 0) {
      setFormError('Cost must be a positive number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/fuel-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: parseInt(fuelVehicleId),
          liters: litersVal,
          cost: costVal,
          date: fuelDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create fuel log');

      showSuccess('Fuel log added successfully!');
      setIsFuelModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!expVehicleId || !expType.trim() || !expAmount || !expDate) {
      setFormError('All fields are required.');
      return;
    }

    const amountVal = parseFloat(expAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: parseInt(expVehicleId),
          type: expType.trim(),
          amount: amountVal,
          date: expDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create expense');

      showSuccess('Expense registered successfully!');
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter lists based on selected vehicle
  const filteredFuelLogs = fuelLogs.filter((log) => {
    return selectedVehicleFilter === 'All' || log.vehicleId.toString() === selectedVehicleFilter;
  });

  const filteredExpenses = expenses.filter((exp) => {
    return selectedVehicleFilter === 'All' || exp.vehicleId.toString() === selectedVehicleFilter;
  });

  // Calculate overview totals based on filter
  const totalLiters = filteredFuelLogs.reduce((sum, l) => sum + l.liters, 0);
  const totalFuelCost = filteredFuelLogs.reduce((sum, l) => sum + l.cost, 0);
  const totalExpenseCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOperationalCost = totalFuelCost + totalExpenseCost;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Fuel & Expenses
          </h1>
          <p className="text-sm text-slate-400 mt-1">Monitor fuel consumption logs and track operational expenses across the fleet.</p>
        </div>

        {isAuthorized ? (
          <div className="flex items-center gap-3">
            <button
              onClick={openFuelModal}
              className="flex items-center gap-2 px-4.5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-750 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.03]"
            >
              <Droplet className="w-4 h-4" />
              Add Fuel Log
            </button>
            <button
              onClick={openExpenseModal}
              className="flex items-center gap-2 px-4.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 font-bold text-sm transition-all duration-300 hover:scale-[1.03]"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              Add Expense
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium select-none shadow-inner">
            <Info className="w-4 h-4 text-slate-500" />
            View-Only Mode
          </div>
        )}
      </div>

      {/* Alert Banner */}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/85 transition-all duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Fuel Liters</span>
            <span className="text-2xl font-extrabold text-white mt-1.5 block tracking-tight">{totalLiters.toLocaleString()} L</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-2xl text-slate-350 border border-slate-750/30">
            <Droplet className="w-5 h-5" />
          </div>
        </div>

        <div class="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/85 transition-all duration-300">
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Fuel Spent</span>
            <span class="text-2xl font-extrabold text-indigo-400 mt-1.5 block tracking-tight">₹{totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        <div class="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/85 transition-all duration-300">
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Other Costs</span>
            <span class="text-2xl font-extrabold text-amber-400 mt-1.5 block tracking-tight">₹{totalExpenseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div class="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-slate-950/40 backdrop-blur-md flex items-center justify-between hover:scale-[1.02] hover:border-slate-700/85 transition-all duration-300">
          <div>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Grand Total</span>
            <span class="text-2xl font-extrabold text-emerald-405 mt-1.5 block tracking-tight text-emerald-400">₹{totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Tabs Header */}
      <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Tabs */}
        <div className="flex gap-2.5 p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'fuel'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-md shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fuel Consumption
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'expenses'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white shadow-md shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Other Expenses
          </button>
        </div>

        {/* Vehicle Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-550" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter by Vehicle:</span>
          </div>
          {vehiclesLoading ? (
            <span className="text-xs text-slate-500">Loading...</span>
          ) : (
            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="w-full md:w-56 px-4 py-2 text-xs rounded-xl border border-slate-800 bg-[#0f172a] text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="All" className="bg-[#0f172a] text-slate-200">All Fleet Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0f172a] text-slate-200">
                  {v.regNumber} - {v.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content Section based on Tab selection */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 border-r-2" />
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Fetching logs...</span>
        </div>
      ) : activeTab === 'fuel' ? (
        /* Fuel Logs Table */
        filteredFuelLogs.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 text-slate-500 flex flex-col items-center justify-center gap-2">
            <Fuel className="w-8 h-8 text-slate-650 animate-pulse" />
            <span className="text-sm font-medium">No fuel logs registered</span>
            <span className="text-xs text-slate-600 max-w-xs">Add a new log using the button at the top to populate this tab.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900/60">
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4 text-right">Liters Consumed</th>
                  <th className="px-6 py-4 text-right">Total Cost</th>
                  <th className="px-6 py-4 text-right">Fuel Rate</th>
                  <th className="px-6 py-4">Fill Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
                {filteredFuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-white block tracking-wider">{log.vehicle?.regNumber}</span>
                      <span className="text-xs text-slate-500 block mt-0.5">{log.vehicle?.name || `Vehicle ID: ${log.vehicleId}`}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-200 font-mono">{log.liters.toFixed(2)} L</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-400 font-mono">
                      ₹{log.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-405 text-slate-400 font-mono">
                      ₹{(log.cost / log.liters).toFixed(2)} / L
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{formatDate(log.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Expenses Table */
        filteredExpenses.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 text-slate-500 flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-slate-655 animate-pulse" />
            <span className="text-sm font-medium">No expenses registered</span>
            <span className="text-xs text-slate-600 max-w-xs">Create general vehicle expenses (e.g. tolls, permits) to start tracking.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900/60">
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Expense Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Expense Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-white block tracking-wider">{exp.vehicle?.regNumber}</span>
                      <span className="text-xs text-slate-500 block mt-0.5">{exp.vehicle?.name || `Vehicle ID: ${exp.vehicleId}`}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">{exp.type}</td>
                    <td className="px-6 py-4 text-right font-bold text-amber-400 font-mono">
                      ₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{formatDate(exp.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal - Add Fuel Log */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-955/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-indigo-400" />
                <span>Add Fuel Consumption Log</span>
              </h3>
              <button
                onClick={() => setIsFuelModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold p-1 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFuelSubmit}>
              <div className="p-6 space-y-4">
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
                      value={fuelVehicleId}
                      onChange={(e) => setFuelVehicleId(e.target.value)}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Liters (L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Total Cost (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={fuelCost}
                        onChange={(e) => setFuelCost(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Log Date
                  </label>
                  <input
                    type="date"
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-semibold transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/10 hover:scale-[1.02]"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-955/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Record Operational Expense</span>
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold p-1 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit}>
              <div className="p-6 space-y-4">
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
                      value={expVehicleId}
                      onChange={(e) => setExpVehicleId(e.target.value)}
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
                    Expense Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tolls, Insurance, Permit, Cleaning"
                    value={expType}
                    onChange={(e) => setExpType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-semibold transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-750 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/10 hover:scale-[1.02]"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
