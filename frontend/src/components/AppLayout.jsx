import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  // Define navigation items with roles allowed to see them
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['fleet_manager', 'safety_officer', 'financial_analyst', 'driver']
    },
    {
      name: 'Vehicle Registry',
      path: '/vehicles',
      icon: Truck,
      roles: ['fleet_manager', 'safety_officer', 'financial_analyst', 'driver']
    },
    {
      name: 'Driver Management',
      path: '/drivers',
      icon: Users,
      roles: ['fleet_manager', 'safety_officer', 'driver']
    },
    {
      name: 'Trip Dispatching',
      path: '/trips',
      icon: Navigation,
      roles: ['fleet_manager', 'driver']
    },
    {
      name: 'Maintenance Log',
      path: '/maintenance',
      icon: Wrench,
      roles: ['fleet_manager', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Fuel & Expenses',
      path: '/expenses',
      icon: Fuel,
      roles: ['fleet_manager', 'financial_analyst']
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['fleet_manager', 'financial_analyst', 'safety_officer']
    }
  ];

  // Filter menu items by user role
  const allowedNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const formatRole = (role) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'fleet_manager':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'driver':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'safety_officer':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'financial_analyst':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0b0f19] border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
        <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-500">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white block">TransitOps</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Smart Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info / Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/20">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-850/50 mb-3">
          <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-slate-200 truncate">{user.email}</span>
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${getRoleColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/5 transition"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#070b13] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[#0b0f19]/40 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-md font-semibold text-slate-200">
              {navItems.find((item) => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">{user.email}</span>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
              {formatRole(user.role)}
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
