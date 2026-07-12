import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Gauge, 
  Layers,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    setError('');
    try {
      const res = await api.analytics.reports();
      setReports(res.data || []);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  }

  // Format currency in Indian Rupees style
  const fmtRupees = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // CSV Export logic
  const handleExportCSV = () => {
    if (reports.length === 0) return;

    // Headers
    const headers = [
      'Vehicle Reg Number',
      'Vehicle Name',
      'Type',
      'Acquisition Cost (INR)',
      'Total Distance (km)',
      'Fuel Efficiency (km/L)',
      'Fuel Cost (INR)',
      'Maintenance Cost (INR)',
      'Other Expenses (INR)',
      'Total Operational Cost (INR)',
      'Est Revenue (INR)',
      'ROI (%)'
    ];

    // Data rows
    const rows = reports.map(r => [
      r.regNumber,
      `"${r.name.replace(/"/g, '""')}"`,
      r.type,
      r.acquisitionCost,
      r.totalDistance,
      r.fuelEfficiency,
      r.totalFuelCost,
      r.totalMaintenanceCost,
      r.totalOtherExpenses,
      r.totalOperationalCost,
      r.revenue,
      r.roi
    ]);

    // Build string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  // Global Averages/Aggregates
  const totalOperationalCost = reports.reduce((sum, r) => sum + r.totalOperationalCost, 0);
  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);
  
  const validEfficiencyVehicles = reports.filter(r => r.fuelEfficiency > 0);
  const avgFuelEfficiency = validEfficiencyVehicles.length > 0
    ? Math.round((validEfficiencyVehicles.reduce((sum, r) => sum + r.fuelEfficiency, 0) / validEfficiencyVehicles.length) * 100) / 100
    : 0;

  const avgRoi = reports.length > 0
    ? Math.round((reports.reduce((sum, r) => sum + r.roi, 0) / reports.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-8 animate-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Financial & <span className="text-gradient">ROI Reports</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Operational summaries, investment logs, and vehicle efficiency statistics.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-slate-350 hover:text-slate-200 transition duration-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={loading || reports.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-2xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total Fleet Operational Costs */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 w-fit">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white block">
              {loading ? '...' : fmtRupees(totalOperationalCost)}
            </span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mt-1">Total Operational Cost</span>
          </div>
        </div>

        {/* KPI 2: Total Estimated Revenue */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white block">
              {loading ? '...' : fmtRupees(totalRevenue)}
            </span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mt-1">Estimated Revenue</span>
          </div>
        </div>

        {/* KPI 3: Average Fuel Efficiency */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 w-fit">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white block">
              {loading ? '...' : `${avgFuelEfficiency} km/L`}
            </span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mt-1">Avg Fuel Efficiency</span>
          </div>
        </div>

        {/* KPI 4: Average Fleet ROI */}
        <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-white/[0.04] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit">
            <Layers className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white block">
              {loading ? '...' : `${avgRoi}%`}
            </span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mt-1">Average Vehicle ROI</span>
          </div>
        </div>
      </div>

      {/* Reports Table Section */}
      <div className="p-6 bg-slate-900/40 backdrop-blur-md border border-white/[0.04] rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Fleet Performance Ledger</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">All Registered Assets</span>
        </div>

        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <div className="overflow-hidden border border-white/[0.03] rounded-xl">
              <table className="min-w-full divide-y divide-white/[0.03]">
                <thead className="bg-[#050910]">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-450 uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-450 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">Distance</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">Fuel Eff.</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">Fuel Cost</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">Maintenance</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">Op Cost</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">Revenue</th>
                    <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-450 uppercase tracking-wider">ROI (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] bg-white/[0.01]">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center text-xs text-slate-450">
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                          <span>Calculating performance analytics ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-xs text-slate-450">
                        No performance records found. Complete a trip to calculate ROI.
                      </td>
                    </tr>
                  ) : (
                    reports.map(r => (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="block text-xs font-bold text-slate-100">{r.regNumber}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">{r.name}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-semibold text-slate-300">
                          {r.totalDistance} km
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-semibold text-slate-350">
                          {r.fuelEfficiency > 0 ? `${r.fuelEfficiency} km/L` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-semibold text-slate-350">
                          {r.totalFuelCost > 0 ? fmtRupees(r.totalFuelCost) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-semibold text-slate-350">
                          {r.totalMaintenanceCost > 0 ? fmtRupees(r.totalMaintenanceCost) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-bold text-slate-200">
                          {fmtRupees(r.totalOperationalCost)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-bold text-indigo-400">
                          {fmtRupees(r.revenue)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className={`text-xs font-extrabold ${r.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {r.roi}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
