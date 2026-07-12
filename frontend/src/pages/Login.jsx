import React, { useState } from 'react';
const API_URL = 'http://localhost:5000/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Loader2, UserCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver'); // Default role for registration
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !role)) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const bodyPayload = isRegister 
        ? { email, password, role } 
        : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Add a slight artificial delay to show off the loader animation
      setTimeout(() => {
        login(data.token, data.user);
      }, 800);

    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your inputs.');
      setLoading(false);
    }
  };

  const handleAutofill = (roleEmail) => {
    setIsRegister(false);
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030712] font-sans">
      {/* Dynamic Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[460px] p-6 mx-auto animate-slide">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl mb-4 text-white shadow-xl shadow-indigo-600/25 ring-4 ring-indigo-500/10 animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Transit<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Ops</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">Smart Transport Operations Platform</p>
        </div>

        {/* Auth Form Glass Panel Card */}
        <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl relative border border-white/[0.06] overflow-hidden">
          {/* Subtle top edge lighting */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isRegister 
                ? 'Get started with TransitOps fleet control tower.' 
                : 'Sign in with your credentials to manage operations.'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-fade">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all font-medium text-sm"
                  placeholder="name@transitops.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-800 bg-[#030712]/40 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all font-medium text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assign User Role
                </label>
                <div className="relative group">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-800 bg-[#030712] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500/80 transition-all font-medium text-sm"
                  >
                    <option value="driver">Driver</option>
                    <option value="fleet_manager">Fleet Manager</option>
                    <option value="safety_officer">Safety Officer</option>
                    <option value="financial_analyst">Financial Analyst</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isRegister ? 'Creating Workspace...' : 'Securing Session...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle link between login & registration */}
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              {isRegister 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Create one"}
            </button>
          </div>

          {/* Quick Demo Login Grid */}
          <div className="mt-8 pt-6 border-t border-white/[0.04]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3.5 text-center">
              Quick Role Autofills (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAutofill('manager@transitops.com')}
                className="py-2.5 px-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/20 text-xs text-slate-300 font-medium transition text-left flex items-center justify-between"
              >
                <span>💼 Fleet Mgr</span>
                <span className="text-[9px] text-slate-500">Seed</span>
              </button>
              <button
                onClick={() => handleAutofill('driver@transitops.com')}
                className="py-2.5 px-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/20 text-xs text-slate-300 font-medium transition text-left flex items-center justify-between"
              >
                <span>🚚 Driver</span>
                <span className="text-[9px] text-slate-500">Seed</span>
              </button>
              <button
                onClick={() => handleAutofill('safety@transitops.com')}
                className="py-2.5 px-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/20 text-xs text-slate-300 font-medium transition text-left flex items-center justify-between"
              >
                <span>🛡️ Safety</span>
                <span className="text-[9px] text-slate-500">Seed</span>
              </button>
              <button
                onClick={() => handleAutofill('finance@transitops.com')}
                className="py-2.5 px-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/20 text-xs text-slate-300 font-medium transition text-left flex items-center justify-between"
              >
                <span>📊 Finance</span>
                <span className="text-[9px] text-slate-500">Seed</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
