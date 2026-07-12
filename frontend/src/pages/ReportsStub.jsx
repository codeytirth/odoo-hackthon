import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ReportsStub() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
      <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-slate-400 mb-4">
        <BarChart3 className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-semibold text-slate-200">Reports & Analytics</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1">
        This screen is reserved for **Person D** to implement fleet utilization reports, fuel efficiency calculators, and CSV export.
      </p>
    </div>
  );
}
