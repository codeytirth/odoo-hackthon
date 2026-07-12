import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Activity, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Compass, 
  Clock, 
  Users, 
  Percent,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStats();
  }, [typeFilter, statusFilter]);

  async function fetchStats() {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (typeFilter) filters.type = typeFilter;
      if (statusFilter) filters.status = statusFilter;
      
      const res = await api.analytics.dashboard(filters);
      setStats(res);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Control <span className="text-gradient">Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Real-time fleet operational metrics, utilization rates, and active schedules.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-slate-350 hover:text-slate-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Interactive Filters Panel */}
      <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-white/[0.04] rounded-2xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-200 block">Fleet Filters</span>
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-extrabold mt-0.5">Narrow down metrics</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Vehicle Type Filter */}
          <div className="flex flex-col gap-1.5 w-full sm:w-44">
            <label className="text-[10px] text-slate-450 uppercase tracking-widest font-extrabold">Vehicle Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#070b13] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2 text-xs text-slate-250 font-semibold focus:outline-none focus:border-indigo-500/50 transition cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Trailer">Trailer</option>
              <option value="Car">Car</option>
            </select>
          </div>

          {/* Vehicle Status Filter */}
          <div className="flex flex-col gap-1.5 w-full sm:w-44">
            <label className="text-[10px] text-slate-450 uppercase tracking-widest font-extrabold">Vehicle Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#070b13] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2 text-xs text-slate-250 font-semibold focus:outline-none focus:border-indigo-500/50 transition cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-2xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Active Vehicles */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden transition hover:-translate-y-1 hover:border-white/[0.08] duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition duration-300" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shadow-lg shadow-blue-500/5">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 uppercase">Realtime</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">
              {loading ? '...' : stats?.activeVehicles ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-bold block mt-1">Active Vehicles</span>
          </div>
        </div>

        {/* KPI 2: Available Vehicles */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden transition hover:-translate-y-1 hover:border-white/[0.08] duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition duration-300" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-lg shadow-emerald-500/5">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">
              {loading ? '...' : stats?.availableVehicles ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-bold block mt-1">Available Vehicles</span>
          </div>
        </div>

        {/* KPI 3: In Maintenance */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden transition hover:-translate-y-1 hover:border-white/[0.08] duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition duration-300" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shadow-lg shadow-amber-500/5">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">
              {loading ? '...' : stats?.vehiclesInMaintenance ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-bold block mt-1">Vehicles In Shop</span>
          </div>
        </div>

        {/* KPI 4: Drivers On Duty */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden transition hover:-translate-y-1 hover:border-white/[0.08] duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition duration-300" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-lg shadow-indigo-500/5">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white block">
              {loading ? '...' : stats?.driversOnDuty ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-bold block mt-1">Drivers On Duty</span>
          </div>
        </div>
      </div>

      {/* Middle Grid - Fleet Utilization Progress Ring & Trip Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Utilization Ring Widget */}
        <div className="p-8 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-6">
            <Percent className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest">Fleet Utilization</h2>
          </div>

          <div className="relative flex items-center justify-center w-36 h-36 mt-2">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-indigo-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 62}`}
                strokeDashoffset={`${2 * Math.PI * 62 * (1 - (loading ? 0 : (stats?.fleetUtilization ?? 0)) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">
                {loading ? '...' : `${stats?.fleetUtilization ?? 0}%`}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase mt-1">Utilization</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            Overall capacity usage based on active trips relative to registered available fleet.
          </p>
        </div>

        {/* Trips Summary Panel */}
        <div className="p-8 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl flex flex-col lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest">Dispatches & Schedule</h2>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">Operational</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-auto">
            {/* Active Trips Card */}
            <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/25">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-white block">
                  {loading ? '...' : stats?.activeTrips ?? 0}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">Active Dispatches</span>
              </div>
            </div>

            {/* Pending (Draft) Trips Card */}
            <div className="p-5 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/25">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-white block">
                  {loading ? '...' : stats?.pendingTrips ?? 0}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">Pending Drafts</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/[0.04] pt-4 flex items-center justify-between text-xs text-slate-550">
            <span>Total Operational Capacity</span>
            <span className="font-bold text-slate-350">
              {loading ? '...' : `${stats?.totalVehicles ?? 0} Active Units`}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
