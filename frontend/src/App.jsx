import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import VehicleRegistry from './pages/VehicleRegistry';
import MaintenanceStub from './pages/MaintenanceStub';
import ExpensesStub from './pages/ExpensesStub';
import DriverManagement from './pages/DriverManagement';
import TripManagement from './pages/TripManagement';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
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
    return <Navigate to="/vehicles" replace />;
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
            {/* Dashboard Index Route */}
            <Route index element={<Dashboard />} />
            
            {/* Owned Vehicle Registry Route */}
            <Route path="vehicles" element={<VehicleRegistry />} />
            
            {/* Teammate Maintenance Route */}
            <Route path="maintenance" element={<MaintenanceStub />} />
            
            {/* Teammate Fuel & Expenses Route */}
            <Route path="expenses" element={<ExpensesStub />} />

            {/* Drivers Management Route */}
            <Route path="drivers" element={<DriverManagement />} />

            {/* Trips Management Route */}
            <Route path="trips" element={<TripManagement />} />

            {/* Financial Reports & ROI Route */}
            <Route path="reports" element={<Reports />} />
            
            {/* Fallback path */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
