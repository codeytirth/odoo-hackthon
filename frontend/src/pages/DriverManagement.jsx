import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function licenseStatus(expiry) {
  const exp  = new Date(expiry);
  const now  = new Date();
  const days = Math.ceil((exp - now) / 86400000);
  if (days < 0)   return { type: 'expired', label: `Expired ${Math.abs(days)}d ago` };
  if (days <= 30) return { type: 'warning', label: `Expires in ${days}d` };
  return               { type: 'valid',   label: 'Valid' };
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

/* ─────────────────────────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  Available: { dot: '#22c55e', text: '#4ade80', bg: 'rgba(22,101,52,.25)',  border: '#166534' },
  'On Trip':  { dot: '#818cf8', text: '#a5b4fc', bg: 'rgba(67,56,202,.25)', border: '#4338ca' },
  'Off Duty': { dot: '#94a3b8', text: '#cbd5e1', bg: 'rgba(71,85,105,.2)',  border: '#475569' },
  Suspended:  { dot: '#f87171', text: '#fca5a5', bg: 'rgba(153,27,27,.25)', border: '#991b1b' },
};

const LICENSE_STYLES = {
  valid:   { text: '#4ade80', bg: 'rgba(22,101,52,.2)',   border: '#166534' },
  warning: { text: '#fbbf24', bg: 'rgba(120,53,15,.3)',   border: '#78350f' },
  expired: { text: '#f87171', bg: 'rgba(127,29,29,.3)',   border: '#7f1d1d' },
};

/* ─────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Off Duty'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.text, fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function LicensePill({ expiry }) {
  const li = licenseStatus(expiry);
  const s  = LICENSE_STYLES[li.type];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 12,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.text, fontSize: 10, fontWeight: 700,
    }}>
      {li.label}
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';
  const text  = score >= 90 ? '#4ade80' : score >= 70 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: text, minWidth: 34 }}>{score}</span>
      <div style={{ width: 60, height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: 'linear-gradient(135deg,#4c1d95,#1e3a8a)',
      border: '1px solid #4338ca',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, color: '#a5b4fc',
    }}>
      {initials}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', background: '#0d1525',
      border: '1px solid #1e293b', borderRadius: 6,
      fontSize: 11, fontWeight: 600, color: '#94a3b8',
    }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FORM FIELD
───────────────────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: '#7c3aed' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function FInput({ value, onChange, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      {...rest}
      style={{
        width: '100%', background: '#060b14',
        border: `1px solid ${focus ? '#7c3aed' : '#1e293b'}`,
        borderRadius: 10, padding: '9px 13px', color: '#f1f5f9',
        fontSize: 13, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color .15s',
        ...rest.style,
      }}
    />
  );
}

function FSelect({ value, onChange, children }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', background: '#060b14',
        border: `1px solid ${focus ? '#7c3aed' : '#1e293b'}`,
        borderRadius: 10, padding: '9px 13px', color: '#f1f5f9',
        fontSize: 13, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color .15s',
      }}
    >
      {children}
    </select>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 14,
      padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ fontSize: 22, opacity: 0.4 }}>{icon}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  name: '', license_number: '', license_category: 'Class A',
  license_expiry: '', contact: '', safety_score: '95', status: 'Available',
};

export default function DriverManagement({ currentUser }) {
  const [drivers,      setDrivers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState(null); // null = add, object = edit
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState('');
  const [saving,     setSaving]     = useState(false);

  // Delete confirm
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // Hover row
  const [hoverRow, setHoverRow] = useState(null);

  const canEdit = ['fleet_manager', 'safety_officer'].includes(currentUser.role);

  /* ── Data ── */
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await api.drivers.list();
      setDrivers(r.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load drivers.');
    } finally { setLoading(false); }
  }

  /* ── Modal helpers ── */
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setModalOpen(true);
  }

  function openEdit(d) {
    setEditing(d);
    setForm({
      name:             d.name,
      license_number:   d.license_number,
      license_category: d.license_category,
      license_expiry:   new Date(d.license_expiry).toISOString().split('T')[0],
      contact:          d.contact,
      safety_score:     String(d.safety_score),
      status:           d.status,
    });
    setFormErr('');
    setModalOpen(true);
  }

  function patchForm(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  /* ── Submit ── */
  async function handleSave(e) {
    e.preventDefault();
    setFormErr(''); setSaving(true);
    try {
      const payload = { ...form, safety_score: parseFloat(form.safety_score) };
      if (editing) await api.drivers.update(editing.id, payload);
      else         await api.drivers.create(payload);
      setModalOpen(false);
      load();
    } catch (e) {
      setFormErr(e.message || 'Failed to save driver.');
    } finally { setSaving(false); }
  }

  /* ── Delete ── */
  async function handleDelete() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await api.drivers.delete(delTarget.id);
      setDelTarget(null);
      load();
    } catch (e) {
      alert(e.message || 'Failed to delete driver.');
    } finally { setDeleting(false); }
  }

  /* ── Filter ── */
  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      d.license_number.toLowerCase().includes(q) ||
      (d.contact || '').includes(q);
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Stats ── */
  const total     = drivers.length;
  const available = drivers.filter(d => d.status === 'Available').length;
  const onTrip    = drivers.filter(d => d.status === 'On Trip').length;
  const suspended = drivers.filter(d => d.status === 'Suspended').length;
  const expired   = drivers.filter(d => licenseStatus(d.license_expiry).type === 'expired').length;

  /* ── Export CSV ── */
  function exportCSV() {
    if (!filtered.length) return;
    const headers = ['ID', 'Name', 'License Number', 'Category', 'Expiry Date', 'Contact', 'Safety Score', 'Status'];
    const rows = filtered.map(d => [
      d.id,
      `"${d.name}"`,
      `"${d.license_number}"`,
      `"${d.license_category}"`,
      `"${d.license_expiry.split('T')[0]}"`,
      `"${d.contact}"`,
      d.safety_score,
      `"${d.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transitops_drivers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{
      flex: 1, background: '#060b14', minHeight: '100vh',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#f1f5f9',
      padding: '32px 36px',
    }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Driver Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
            Maintain driver profiles — license compliance, safety scores & operational status.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              border: 'none', color: '#fff',
              padding: '10px 20px', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 18px #7c3aed33',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Add Driver
          </button>
        )}
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 26 }}>
        <StatCard label="Total"     value={total}     color="#a78bfa" icon="👥" />
        <StatCard label="Available" value={available} color="#4ade80" icon="✅" />
        <StatCard label="On Trip"   value={onTrip}    color="#818cf8" icon="🚛" />
        <StatCard label="Suspended" value={suspended} color="#f87171" icon="🚫" />
        <StatCard label="Exp. License" value={expired} color="#fb923c" icon="⚠️" />
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center',
        background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 14, padding: '10px 14px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, license number or contact..."
            style={{
              width: '100%', background: '#060b14', border: '1px solid #1e293b',
              borderRadius: 10, padding: '8px 12px 8px 32px', color: '#f1f5f9',
              fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#1e293b'}
          />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => {
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 13px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: active ? '1px solid #7c3aed' : '1px solid #1e293b',
                background: active ? '#4c1d95' : '#060b14',
                color: active ? '#ddd6fe' : '#475569', transition: 'all .15s',
              }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <button onClick={load} title="Refresh" style={{
          background: 'none', border: '1px solid #1e293b',
          borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#475569',
          display: 'flex', alignItems: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#334155'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>

        {/* Export CSV */}
        <button onClick={exportCSV} title="Export to CSV" style={{
          background: 'rgba(76,29,149,.15)', border: '1px solid #4c1d95',
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#a78bfa',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,29,149,.3)'; e.currentTarget.style.color = '#c4b5fd'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(76,29,149,.15)'; e.currentTarget.style.color = '#a78bfa'; }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155', fontSize: 14 }}>
          Loading driver profiles…
        </div>
      ) : error ? (
        <div style={{
          background: '#2a0d0d', border: '1px solid #7f1d1d', borderRadius: 12,
          padding: '14px 18px', color: '#f87171', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ {error}
          <button onClick={load} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontSize: 12 }}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', background: '#060b14' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1a', borderBottom: '1px solid #1e293b' }}>
                {[
                  '#', 'Driver', 'License Number', 'Category',
                  'License Expiry', 'Contact', 'Safety Score', 'Status',
                  canEdit ? 'Actions' : '',
                ].map((h, i) => (
                  <th key={i} style={{
                    padding: '11px 16px', fontSize: 10, fontWeight: 800, color: '#334155',
                    textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '64px 0', color: '#334155', fontSize: 14 }}>
                    No drivers found.{statusFilter !== 'All' && (
                      <button onClick={() => setStatusFilter('All')} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}>
                        Clear filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map(d => {
                const isHover = hoverRow === d.id;
                const tdStyle = {
                  padding: '13px 16px', borderBottom: '1px solid #0d1525',
                  background: isHover ? '#0d1525' : 'transparent',
                  transition: 'background .1s', verticalAlign: 'middle',
                };
                return (
                  <tr key={d.id}
                    onMouseEnter={() => setHoverRow(d.id)}
                    onMouseLeave={() => setHoverRow(null)}>

                    {/* # */}
                    <td style={{ ...tdStyle, width: 36 }}>
                      <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>{d.id}</span>
                    </td>

                    {/* Driver */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={d.name} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                          {d.name}
                        </span>
                      </div>
                    </td>

                    {/* License Number */}
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 12, color: '#94a3b8',
                        background: '#0d1525', border: '1px solid #1e293b',
                        padding: '3px 9px', borderRadius: 6,
                      }}>
                        {d.license_number}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={tdStyle}>
                      <Chip>{d.license_category}</Chip>
                    </td>

                    {/* License Expiry */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                        {fmt(d.license_expiry)}
                      </div>
                      <LicensePill expiry={d.license_expiry} />
                    </td>

                    {/* Contact */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{d.contact}</span>
                    </td>

                    {/* Safety Score */}
                    <td style={tdStyle}>
                      <ScoreBar score={d.safety_score} />
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <StatusBadge status={d.status} />
                    </td>

                    {/* Actions */}
                    {canEdit && (
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(d)}
                            title="Edit"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '5px 7px', borderRadius: 7, color: '#475569',
                              transition: 'all .15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#a78bfa'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => d.status !== 'On Trip' && setDelTarget(d)}
                            title={d.status === 'On Trip' ? 'Cannot delete — driver is On Trip' : 'Delete'}
                            disabled={d.status === 'On Trip'}
                            style={{
                              background: 'none', border: 'none', cursor: d.status === 'On Trip' ? 'not-allowed' : 'pointer',
                              padding: '5px 7px', borderRadius: 7, color: '#475569',
                              opacity: d.status === 'On Trip' ? 0.35 : 1,
                              transition: 'all .15s',
                            }}
                            onMouseEnter={e => { if (d.status !== 'On Trip') { e.currentTarget.style.background = '#2a0d0d'; e.currentTarget.style.color = '#f87171'; } }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6l-1 14H6L5 6m5 0V4h4v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table footer */}
          <div style={{
            padding: '10px 16px', background: '#0a0f1a', borderTop: '1px solid #0d1525',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>
              {filtered.length} of {total} driver{total !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {drivers.filter(d => licenseStatus(d.license_expiry).type === 'expired').length > 0 && (
                <span style={{ fontSize: 10, color: '#fb923c', background: 'rgba(120,53,15,.2)', border: '1px solid #78350f', padding: '2px 9px', borderRadius: 10, fontWeight: 700 }}>
                  ⚠️ {expired} expired license{expired > 1 ? 's' : ''} — action required
                </span>
              )}
              {drivers.filter(d => licenseStatus(d.license_expiry).type === 'warning').length > 0 && (
                <span style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(120,53,15,.15)', border: '1px solid #78350f55', padding: '2px 9px', borderRadius: 10, fontWeight: 700 }}>
                  🕐 {drivers.filter(d => licenseStatus(d.license_expiry).type === 'warning').length} expiring soon
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,.82)',
            backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
          <div style={{
            background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 20,
            width: '100%', maxWidth: 560, boxShadow: '0 32px 80px #000000bb',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 24px', borderBottom: '1px solid #1e293b',
              background: '#060b14', borderRadius: '20px 20px 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  display: 'inline-flex', padding: '6px 7px',
                  background: '#1a1040', border: '1px solid #4c1d95', borderRadius: 8,
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 5v6m-3-3h6" />
                  </svg>
                </span>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
                  {editing ? 'Edit Driver Profile' : 'Register New Driver'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {formErr && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  background: '#2a0d0d', border: '1px solid #7f1d1d',
                  color: '#fca5a5', padding: '10px 14px', borderRadius: 10,
                  fontSize: 12, marginBottom: 16,
                }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                  </svg>
                  {formErr}
                </div>
              )}

              <form id="driverForm" onSubmit={handleSave}>
                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <Field label="Full Name" required>
                    <FInput
                      type="text"
                      value={form.name}
                      onChange={e => patchForm('name', e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      required
                    />
                  </Field>
                </div>

                {/* License Number + Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <Field label="License Number" required>
                    <FInput
                      type="text"
                      value={form.license_number}
                      onChange={e => patchForm('license_number', e.target.value)}
                      placeholder="e.g. DL-12345678"
                      style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      required
                    />
                  </Field>
                  <Field label="License Category" required>
                    <FSelect
                      value={form.license_category}
                      onChange={e => patchForm('license_category', e.target.value)}>
                      {['Class A', 'Class B', 'Class C', 'Commercial HGV', 'Light Motor Vehicle', 'Motorcycle'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </FSelect>
                  </Field>
                </div>

                {/* Expiry + Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <Field label="License Expiry Date" required>
                    <FInput
                      type="date"
                      value={form.license_expiry}
                      onChange={e => patchForm('license_expiry', e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Contact Number" required>
                    <FInput
                      type="text"
                      value={form.contact}
                      onChange={e => patchForm('contact', e.target.value)}
                      placeholder="+1-555-0199"
                      required
                    />
                  </Field>
                </div>

                {/* Safety Score + Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 }}>
                  <Field label="Safety Score (0 – 100)" required>
                    <FInput
                      type="number"
                      min="0" max="100" step="0.5"
                      value={form.safety_score}
                      onChange={e => patchForm('safety_score', e.target.value)}
                      required
                    />
                    {/* mini progress bar */}
                    <div style={{ marginTop: 6, height: 4, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, transition: 'width .3s, background .3s',
                        width: `${Math.min(100, Math.max(0, parseFloat(form.safety_score) || 0))}%`,
                        background: form.safety_score >= 90 ? '#22c55e' : form.safety_score >= 70 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                  </Field>

                  <Field label="Status" required>
                    <FSelect
                      value={form.status}
                      onChange={e => patchForm('status', e.target.value)}>
                      <option value="Available">✅ Available</option>
                      <option value="On Trip">🚛 On Trip</option>
                      <option value="Off Duty">😴 Off Duty</option>
                      <option value="Suspended">🚫 Suspended</option>
                    </FSelect>
                  </Field>
                </div>

                {/* Suspension warning */}
                {form.status === 'Suspended' && (
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    background: 'rgba(127,29,29,.25)', border: '1px solid #7f1d1d',
                    color: '#fca5a5', padding: '10px 14px', borderRadius: 10,
                    fontSize: 12, marginTop: 12,
                  }}>
                    ⚠️ This driver will not be assignable to any trip while Suspended.
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              padding: '14px 24px', borderTop: '1px solid #1e293b',
              background: '#060b14', borderRadius: '0 0 20px 20px',
            }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '9px 20px', borderRadius: 10, border: '1px solid #1e293b',
                  background: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button
                form="driverForm"
                type="submit"
                disabled={saving}
                style={{
                  padding: '9px 24px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px #7c3aed33', opacity: saving ? 0.7 : 1,
                }}>
                {saving ? 'Saving…' : editing ? '💾 Update Driver' : '✅ Register Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ══════════════════════════════════════════════════════════ */}
      {delTarget && (
        <div
          onClick={e => e.target === e.currentTarget && setDelTarget(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,.82)',
            backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
          <div style={{
            background: '#0a0f1a', border: '1px solid #7f1d1d', borderRadius: 18,
            maxWidth: 400, width: '100%', padding: 28,
            boxShadow: '0 24px 60px #000000aa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{
                display: 'inline-flex', padding: '7px 8px',
                background: 'rgba(127,29,29,.3)', border: '1px solid #7f1d1d', borderRadius: 9,
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
                </svg>
              </span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>
                Delete Driver Profile
              </h3>
            </div>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Permanently delete <strong style={{ color: '#f1f5f9' }}>{delTarget.name}</strong>?
              This cannot be undone and all associated trip history will remain intact.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelTarget(null)} style={{
                padding: '9px 20px', borderRadius: 10, border: '1px solid #1e293b',
                background: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                padding: '9px 22px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px #dc262633', opacity: deleting ? 0.7 : 1,
              }}>
                {deleting ? 'Deleting…' : '🗑 Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
