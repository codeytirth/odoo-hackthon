import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  LogOut,
  User,
  Menu,
  ChevronRight,
  Wrench,
  Fuel
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  // Integrated routes to satisfy PDF requirements
  const navItems = [
    {
      name: 'Vehicle Registry',
      path: '/vehicles',
      icon: Truck,
      roles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Maintenance Log',
      path: '/maintenance',
      icon: Wrench,
      roles: ['fleet_manager', 'safety_officer']
    },
    {
      name: 'Fuel & Expenses',
      path: '/expenses',
      icon: Fuel,
      roles: ['fleet_manager', 'financial_analyst']
    }
  ];

  // Filter menu based on authenticated user role
  const allowedNavItems = navItems.filter(item => item.roles.includes(user.role));

  const formatRole = (role) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'fleet_manager':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]';
      case 'driver':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]';
      case 'safety_officer':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]';
      case 'financial_analyst':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#070b13]/70 backdrop-blur-xl border-r border-white/[0.04]">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-6 py-6 border-b border-white/[0.04]">
        <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shadow-inner">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xl font-black tracking-tight text-white block">
            Transit<span className="text-indigo-400">Ops</span>
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mt-0.5">Control Tower</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:border-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-350'
                }`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-white/[0.04] bg-[#030712]/40">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-3">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/[0.04] text-slate-400">
            <User className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-slate-200 truncate">{user.email}</span>
            <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide ${getRoleColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#030712] text-slate-200 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-dark/80 backdrop-blur-md lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 transition-transform duration-300 transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 md:px-8 bg-[#030712]/50 border-b border-white/[0.04] backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 lg:hidden transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base font-bold text-white tracking-tight">
              {navItems.find((item) => item.path === location.pathname)?.name || 'Vehicle Registry'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">{user.email}</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getRoleColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
          </div>
        </header>

        {/* Content Area with custom scrollbar */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl w-full mx-auto animate-fade">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
