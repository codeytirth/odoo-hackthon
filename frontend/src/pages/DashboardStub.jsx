import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Shield, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function DashboardStub() {
  const { token } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/dashboard/kpis`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setKpis(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-sans">Operations Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time status overview and operational performance metrics.</p>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading metrics...</div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Fleet Utilization</span>
            <span className="text-3xl font-extrabold text-indigo-400 mt-2 block">{kpis.fleetUtilization}%</span>
          </div>
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Active Dispatched Trips</span>
            <span className="text-3xl font-extrabold text-blue-400 mt-2 block">{kpis.activeTrips}</span>
          </div>
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Available Drivers</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">{kpis.availableDrivers} / {kpis.totalDrivers}</span>
          </div>
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Available Vehicles</span>
            <span className="text-3xl font-extrabold text-teal-400 mt-2 block">{kpis.availableVehicles} / {kpis.totalVehicles}</span>
          </div>
        </div>
      ) : (
        <div className="text-slate-500">Failed to load KPIs.</div>
      )}

      <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-4">
        <Shield className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Shared Workspace Integration Dashboard</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            This workspace placeholder fetches the live DB counts for development. Person D will enrich this dashboard with full charts, visual analytics filters, and region tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
