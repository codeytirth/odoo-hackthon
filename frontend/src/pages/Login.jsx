import React, { useState } from 'react';
import { api } from '../utils/api';

const QUICK_ROLES = [
  { label: 'Fleet Manager',    email: 'manager@transitops.com', accent: '#60a5fa', bg: '#0c1a2e', border: '#1e3a5f' },
  { label: 'Driver',           email: 'driver@transitops.com',  accent: '#4ade80', bg: '#0d2a1e', border: '#166534' },
  { label: 'Safety Officer',   email: 'safety@transitops.com',  accent: '#c084fc', bg: '#1a1040', border: '#4c1d95' },
  { label: 'Financial Analyst',email: 'finance@transitops.com', accent: '#fb923c', bg: '#1c0f00', border: '#78350f' },
];

export default function Login({ onLoginSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(null); // null | email | role

  async function doLogin(em, pw) {
    setError(''); setLoading(em);
    try {
      const data = await api.auth.login(em, pw);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.');
    } finally { setLoading(null); }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#060b14',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#f1f5f9',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, #4c1d9520 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #1e3a5f18 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px', borderRight: '1px solid #0d1525',
        '@media (max-width: 768px)': { display: 'none' },
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px #7c3aed44',
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#e9d5ff" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>TransitOps</div>
            <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Smart Transport Platform</div>
          </div>
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 900, color: '#f1f5f9', margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          Digitize your<br />
          <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            fleet operations.
          </span>
        </h1>
        <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '0 0 48px' }}>
          Manage vehicles, drivers, trips, and compliance — all in one platform. Purpose-built for logistics teams.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '🚛', text: 'Vehicle registry & real-time status' },
            { icon: '👤', text: 'Driver compliance & license tracking' },
            { icon: '🗺️', text: 'Trip dispatching with business rules' },
            { icon: '📊', text: 'Fuel, expenses & analytics reports' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 440, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 40px', background: '#0a0f1a', borderLeft: '1px solid #0d1525',
        flexShrink: 0,
      }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>Sign in to your TransitOps workspace.</p>
        </div>

        {error && (
          <div style={{
            display: 'flex', gap: 8, background: '#2a0d0d', border: '1px solid #991b1b',
            color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 12, marginBottom: 18,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); doLogin(email, password); }} style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@transitops.com"
                style={{
                  width: '100%', background: '#060b14', border: '1px solid #1e293b',
                  borderRadius: 10, padding: '11px 14px 11px 36px',
                  color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', background: '#060b14', border: '1px solid #1e293b',
                  borderRadius: 10, padding: '11px 14px 11px 36px',
                  color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={!!loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px #7c3aed44', opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
            {loading === email ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#0d1525' }} />
          <span style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quick Login</span>
          <div style={{ flex: 1, height: 1, background: '#0d1525' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {QUICK_ROLES.map(r => (
            <button key={r.label} disabled={!!loading}
              onClick={() => doLogin(r.email, 'password123')}
              style={{
                background: r.bg, border: `1px solid ${r.border}`, borderRadius: 10,
                padding: '10px 12px', cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = r.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = r.border; }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: r.accent, marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 10, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>
              {loading === r.email && <div style={{ fontSize: 9, color: r.accent, marginTop: 3 }}>Signing in...</div>}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 10, color: '#1e293b', textAlign: 'center', marginTop: 24 }}>
          All quick login passwords: <code style={{ color: '#334155' }}>password123</code>
        </p>
      </div>
    </div>
  );
}
