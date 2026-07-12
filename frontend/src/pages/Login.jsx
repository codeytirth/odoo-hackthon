import React, { useState } from 'react';
const API_URL = 'http://localhost:5000/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to autofill credentials for testing/evaluation
  const handleAutofill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070b13]">
      {/* Decorative gradient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md p-8 mx-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mb-3 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">TransitOps</h1>
          <p className="text-sm text-slate-400 mt-1">Smart Transport Operations Platform</p>
        </div>

        {/* Login Form Card */}
        <div className="p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-6">Sign In to Dashboard</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="name@transitops.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Role Autofills (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAutofill('manager@transitops.com')}
                className="py-2 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/50 text-xs text-slate-300 transition text-left"
              >
                💼 Fleet Manager
              </button>
              <button
                onClick={() => handleAutofill('driver@transitops.com')}
                className="py-2 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/50 text-xs text-slate-300 transition text-left"
              >
                🚚 Driver
              </button>
              <button
                onClick={() => handleAutofill('safety@transitops.com')}
                className="py-2 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/50 text-xs text-slate-300 transition text-left"
              >
                🛡️ Safety Officer
              </button>
              <button
                onClick={() => handleAutofill('finance@transitops.com')}
                className="py-2 px-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800/50 text-xs text-slate-300 transition text-left"
              >
                📊 Fin. Analyst
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
