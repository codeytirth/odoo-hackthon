import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import VehicleRegistry from './pages/VehicleRegistry';
import DashboardStub from './pages/DashboardStub';
import DriversStub from './pages/DriversStub';
import TripsStub from './pages/TripsStub';
import MaintenanceStub from './pages/MaintenanceStub';
import ExpensesStub from './pages/ExpensesStub';
import ReportsStub from './pages/ReportsStub';
import './App.css';

// Component to protect private dashboard routes
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#070b13] text-slate-400">Loading...</div>;
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Component to redirect authenticated users away from /login
const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#070b13] text-slate-400">Loading...</div>;
  }
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Dashboard Shell */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            {/* Child pages */}
            <Route index element={<DashboardStub />} />
            <Route path="vehicles" element={<VehicleRegistry />} />
            <Route path="drivers" element={<DriversStub />} />
            <Route path="trips" element={<TripsStub />} />
            <Route path="maintenance" element={<MaintenanceStub />} />
            <Route path="expenses" element={<ExpensesStub />} />
            <Route path="reports" element={<ReportsStub />} />
            
            {/* Fallback path */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
