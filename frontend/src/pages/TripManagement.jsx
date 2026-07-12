import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

/* ─────────────────────────────────────────────────────────────────
   HELPERS & PALETTE
───────────────────────────────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_STYLES = {
  Draft:       { dot: '#94a3b8', text: '#cbd5e1', bg: 'rgba(71,85,105,.2)',  border: '#475569' },
  Dispatched:  { dot: '#818cf8', text: '#a5b4fc', bg: 'rgba(67,56,202,.25)', border: '#4338ca' },
  Completed:   { dot: '#22c55e', text: '#4ade80', bg: 'rgba(22,101,52,.25)', border: '#166534' },
  Cancelled:   { dot: '#f87171', text: '#fca5a5', bg: 'rgba(153,27,27,.25)', border: '#991b1b' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Draft;
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
   FORM FIELD COMPONENTS
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

function FSelect({ value, onChange, children, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
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
        fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color .15s',
        ...rest.style,
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
export default function TripManagement({ currentUser }) {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', distance: ''
  });
  const [createErr, setCreateErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Complete Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState({ odometer: '', fuelLiters: '', fuelCost: '' });
  const [completeErr, setCompleteErr] = useState('');
  const [completing, setCompleting] = useState(false);

  // Hover states
  const [hoverRow, setHoverRow] = useState(null);

  const canModify = ['fleet_manager', 'driver'].includes(currentUser.role);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError('');
    try {
      const [t, v, d] = await Promise.all([
        api.trips.list().catch(() => ({ data: [] })),
        api.vehicles.list().catch(() => ({ data: [] })),
        api.drivers.list().catch(() => ({ data: [] }))
      ]);
      setTrips(t.data || []);
      setVehicles(v.data || []);
      setDrivers(d.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load trip data.');
    } finally { setLoading(false); }
  }

  /* ── Modals & Submits ── */
  function openCreate() {
    if (!canModify) return;
    setCreateForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', distance: '' });
    setCreateErr('');
    setShowCreateModal(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!canModify) return;
    setCreateErr('');

    const selVeh = vehicles.find(v => String(v.id) === String(createForm.vehicle_id));
    if (selVeh && parseFloat(createForm.cargo_weight) > selVeh.max_load) {
      setCreateErr(`Cargo weight exceeds vehicle capacity (${selVeh.max_load}kg max).`);
      return;
    }

    setSubmitting(true);
    try {
      await api.trips.create({
        ...createForm,
        vehicle_id: parseInt(createForm.vehicle_id),
        driver_id: parseInt(createForm.driver_id),
        cargo_weight: parseFloat(createForm.cargo_weight),
        distance: parseFloat(createForm.distance),
      });
      setShowCreateModal(false);
      load();
    } catch (err) {
      setCreateErr(err.message || 'Failed to create trip.');
    } finally { setSubmitting(false); }
  }

  async function handleDispatch(id) {
    if (!canModify) return;
    if (!window.confirm('Dispatch this trip now? Driver and Vehicle will be marked "On Trip".')) return;
    try {
      await api.trips.dispatch(id);
      load();
    } catch (err) { alert(err.message || 'Failed to dispatch trip.'); }
  }

  function openComplete(trip) {
    if (!canModify) return;
    setSelectedTrip(trip);
    const currOdo = trip.vehicles?.odometer || 0;
    const suggOdo = currOdo + trip.distance;
    setCompleteForm({ odometer: String(suggOdo), fuelLiters: '', fuelCost: '' });
    setCompleteErr('');
    setShowCompleteModal(true);
  }

  async function handleCompleteSubmit(e) {
    e.preventDefault();
    if (!canModify || !selectedTrip) return;
    setCompleteErr('');
    const currOdo = selectedTrip.vehicles?.odometer || 0;
    const inOdo = parseFloat(completeForm.odometer);
    if (isNaN(inOdo) || inOdo < currOdo) {
      setCompleteErr(`Final odometer must be at least ${currOdo} km.`);
      return;
    }
    setCompleting(true);
    try {
      await api.trips.complete(selectedTrip.id, {
        odometer: inOdo,
        fuelLiters: completeForm.fuelLiters ? parseFloat(completeForm.fuelLiters) : undefined,
        fuelCost: completeForm.fuelCost ? parseFloat(completeForm.fuelCost) : undefined,
      });
      setShowCompleteModal(false);
      load();
    } catch (err) {
      setCompleteErr(err.message || 'Failed to complete trip.');
    } finally { setCompleting(false); }
  }

  async function handleCancel(id) {
    if (!canModify) return;
    if (!window.confirm('Cancel this trip? Associated resources will revert to "Available".')) return;
    try {
      await api.trips.cancel(id);
      load();
    } catch (err) { alert(err.message || 'Failed to cancel trip.'); }
  }

  /* ── Filter ── */
  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      t.source.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.drivers?.name?.toLowerCase().includes(q) ||
      t.vehicles?.license_plate?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => d.status === 'Available');

  /* ── Stats ── */
  const total = trips.length;
  const draft = trips.filter(t => t.status === 'Draft').length;
  const dispatched = trips.filter(t => t.status === 'Dispatched').length;
  const completed = trips.filter(t => t.status === 'Completed').length;
  const cancelled = trips.filter(t => t.status === 'Cancelled').length;

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{
      flex: 1, background: '#060b14', minHeight: '100vh',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#f1f5f9',
      padding: '32px 36px',
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🗺️</span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Trip Management
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
            Coordinate dispatch, monitor active trips, and finalize routes.
          </p>
        </div>

        {canModify && (
          <button
            onClick={openCreate}
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
            Create Trip
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 26 }}>
        <StatCard label="Total Trips" value={total}      color="#a78bfa" icon="📋" />
        <StatCard label="Drafts"      value={draft}      color="#cbd5e1" icon="📝" />
        <StatCard label="Dispatched"  value={dispatched} color="#818cf8" icon="🚚" />
        <StatCard label="Completed"   value={completed}  color="#4ade80" icon="✅" />
        <StatCard label="Cancelled"   value={cancelled}  color="#f87171" icon="❌" />
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center',
        background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 14, padding: '10px 14px',
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search source, destination, driver, or vehicle..."
            style={{
              width: '100%', background: '#060b14', border: '1px solid #1e293b',
              borderRadius: 10, padding: '8px 12px 8px 32px', color: '#f1f5f9',
              fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map(s => {
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
        <button onClick={load} title="Refresh" style={{
          background: 'none', border: '1px solid #1e293b',
          borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#475569',
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#334155', fontSize: 14 }}>Loading trips…</div>
      ) : error ? (
        <div style={{
          background: '#2a0d0d', border: '1px solid #7f1d1d', borderRadius: 12,
          padding: '14px 18px', color: '#f87171', fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      ) : (
        <div style={{ border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', background: '#060b14' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0f1a', borderBottom: '1px solid #1e293b' }}>
                {['#', 'Route', 'Vehicle & Driver', 'Logistics', 'Schedule', 'Status', canModify ? 'Actions' : ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '11px 16px', fontSize: 10, fontWeight: 800, color: '#334155',
                    textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '64px 0', color: '#334155', fontSize: 14 }}>
                    No trips found.
                  </td>
                </tr>
              ) : filtered.map(t => {
                const isHover = hoverRow === t.id;
                const tdStyle = {
                  padding: '13px 16px', borderBottom: '1px solid #0d1525',
                  background: isHover ? '#0d1525' : 'transparent', verticalAlign: 'middle',
                };
                return (
                  <tr key={t.id} onMouseEnter={() => setHoverRow(t.id)} onMouseLeave={() => setHoverRow(null)}>
                    <td style={{ ...tdStyle, width: 40 }}><span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>{t.id}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{t.source}</span>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{t.destination}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {t.distance} km
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12 }}>🚛</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc' }}>{t.vehicles?.license_plate || 'Unassigned'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12 }}>👤</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{t.drivers?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <Chip>{t.cargo_weight} kg</Chip>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        <div><span style={{ color: '#64748b' }}>Start:</span> {fmtDate(t.start_time)}</div>
                        {t.end_time && <div><span style={{ color: '#64748b' }}>End:</span> {fmtDate(t.end_time)}</div>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={t.status} />
                    </td>
                    {canModify && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {t.status === 'Draft' && (
                            <button onClick={() => handleDispatch(t.id)} style={{
                              background: 'rgba(67,56,202,.2)', border: '1px solid #4338ca', color: '#a5b4fc',
                              borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}>Dispatch</button>
                          )}
                          {t.status === 'Dispatched' && (
                            <button onClick={() => openComplete(t)} style={{
                              background: 'rgba(22,101,52,.2)', border: '1px solid #166534', color: '#4ade80',
                              borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}>Complete</button>
                          )}
                          {['Draft', 'Dispatched'].includes(t.status) && (
                            <button onClick={() => handleCancel(t.id)} style={{
                              background: 'rgba(127,29,29,.2)', border: '1px solid #7f1d1d', color: '#fca5a5',
                              borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}>Cancel</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', background: '#0a0f1a', borderTop: '1px solid #0d1525' }}>
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>Showing {filtered.length} of {total} trips</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CREATE TRIP MODAL
      ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div
          onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,.82)',
            backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
          <div style={{
            background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 20,
            width: '100%', maxWidth: 600, boxShadow: '0 32px 80px #000000bb',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 24px', borderBottom: '1px solid #1e293b', background: '#060b14', borderRadius: '20px 20px 0 0',
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Create New Trip (Draft)</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {createErr && (
                <div style={{ background: '#2a0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 12, marginBottom: 16 }}>
                  ⚠️ {createErr}
                </div>
              )}
              <form id="createTripForm" onSubmit={handleCreateSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <Field label="Source" required>
                    <FInput required value={createForm.source} onChange={e => setCreateForm({ ...createForm, source: e.target.value })} placeholder="e.g. Warehouse A" />
                  </Field>
                  <Field label="Destination" required>
                    <FInput required value={createForm.destination} onChange={e => setCreateForm({ ...createForm, destination: e.target.value })} placeholder="e.g. Fulfillment Center B" />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <Field label="Vehicle (Available)" required>
                    <FSelect required value={createForm.vehicle_id} onChange={e => setCreateForm({ ...createForm, vehicle_id: e.target.value })}>
                      <option value="">Select a Vehicle</option>
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.license_plate} - {v.model} (Max: {v.max_load}kg)</option>
                      ))}
                    </FSelect>
                  </Field>
                  <Field label="Driver (Available)" required>
                    <FSelect required value={createForm.driver_id} onChange={e => setCreateForm({ ...createForm, driver_id: e.target.value })}>
                      <option value="">Select a Driver</option>
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.license_category})</option>
                      ))}
                    </FSelect>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Cargo Weight (kg)" required>
                    <FInput required type="number" step="0.1" value={createForm.cargo_weight} onChange={e => setCreateForm({ ...createForm, cargo_weight: e.target.value })} />
                  </Field>
                  <Field label="Planned Distance (km)" required>
                    <FInput required type="number" step="0.1" value={createForm.distance} onChange={e => setCreateForm({ ...createForm, distance: e.target.value })} />
                  </Field>
                </div>
              </form>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              padding: '14px 24px', borderTop: '1px solid #1e293b', background: '#060b14', borderRadius: '0 0 20px 20px',
            }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #1e293b', background: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button form="createTripForm" type="submit" disabled={submitting} style={{
                padding: '9px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px #7c3aed33',
              }}>
                {submitting ? 'Creating…' : 'Create Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          COMPLETE TRIP MODAL
      ══════════════════════════════════════════════════════════ */}
      {showCompleteModal && selectedTrip && (
        <div
          onClick={e => e.target === e.currentTarget && setShowCompleteModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(2,6,16,.82)',
            backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
          <div style={{
            background: '#0a0f1a', border: '1px solid #166534', borderRadius: 20,
            width: '100%', maxWidth: 450, boxShadow: '0 32px 80px #000000bb',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '18px 24px', borderBottom: '1px solid #166534', background: 'rgba(22,101,52,.1)', borderRadius: '20px 20px 0 0',
            }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#4ade80' }}>Complete Trip</h2>
            </div>
            <div style={{ padding: '24px' }}>
              {completeErr && (
                <div style={{ background: '#2a0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 12, marginBottom: 16 }}>
                  ⚠️ {completeErr}
                </div>
              )}
              <form id="completeTripForm" onSubmit={handleCompleteSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <Field label={`Final Odometer (Current: ${selectedTrip.vehicles?.odometer || 0} km)`} required>
                    <FInput required type="number" step="0.1" value={completeForm.odometer} onChange={e => setCompleteForm({ ...completeForm, odometer: e.target.value })} />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Fuel Logged (Liters)">
                    <FInput type="number" step="0.1" value={completeForm.fuelLiters} onChange={e => setCompleteForm({ ...completeForm, fuelLiters: e.target.value })} placeholder="Optional" />
                  </Field>
                  <Field label="Fuel Cost ($)">
                    <FInput type="number" step="0.01" value={completeForm.fuelCost} onChange={e => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} placeholder="Optional" />
                  </Field>
                </div>
              </form>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              padding: '14px 24px', borderTop: '1px solid #166534', background: 'rgba(22,101,52,.05)', borderRadius: '0 0 20px 20px',
            }}>
              <button onClick={() => setShowCompleteModal(false)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #166534', background: 'none', color: '#4ade80', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button form="completeTripForm" type="submit" disabled={completing} style={{
                padding: '9px 24px', borderRadius: 10, border: 'none', background: '#166534',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: completing ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px #16653444',
              }}>
                {completing ? 'Completing…' : 'Complete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
