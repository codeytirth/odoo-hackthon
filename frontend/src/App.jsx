import React, { useState, useEffect } from 'react';
// Imports
import DriverManagement from './pages/DriverManagement';
import TripManagement from './pages/TripManagement';

const NAV = [
  {
    group: 'MY MODULES',
    items: [
      { key: 'drivers', label: 'Driver Management',   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 5v6m-3-3h6' },
      { key: 'trips',   label: 'Trip Management',     icon: 'M5 12h14M12 5l7 7-7 7' },
    ],
  },
  {
    group: 'TEAM MODULES',
    items: [
      { key: null, label: 'Vehicle Registry',       icon: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm11 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', owner: 'A' },
      { key: null, label: 'Maintenance Logs',       icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', owner: 'C' },
      { key: null, label: 'Fuel & Expenses',        icon: 'M3 22V12h3V8h6v4h3v10H3zM12 8V4h1l5 5-1 1-5-5V8z', owner: 'C' },
      { key: null, label: 'Analytics & Reports',    icon: 'M18 20V10M12 20V4M6 20v-6', owner: 'D' },
    ],
  },
];

function getRoleInfo(role) {
  const map = {
    fleet_manager:     { label: 'Fleet Manager',     color: '#60a5fa', bg: '#0c1a2e', border: '#1e3a5f' },
    driver:            { label: 'Driver',             color: '#4ade80', bg: '#0d2a1e', border: '#166534' },
    safety_officer:    { label: 'Safety Officer',     color: '#c084fc', bg: '#1a1040', border: '#4c1d95' },
    financial_analyst: { label: 'Financial Analyst',  color: '#fb923c', bg: '#1c0f00', border: '#78350f' },
  };
  return map[role] || { label: role, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
}

function SvgIcon({ d, size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState({ id: 1, name: 'Fleet Manager', email: 'manager@transitops.com', role: 'fleet_manager' });
  const [activeTab, setActiveTab] = useState('drivers');
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    alert("Logout disabled in demo mode.");
  }


  const roleInfo = getRoleInfo(currentUser.role);
  const sideW = collapsed ? 64 : 240;

  const styles = {
    shell: { display: 'flex', minHeight: '100vh', background: '#060b14', fontFamily: "'Inter', system-ui, sans-serif" },
    sidebar: {
      width: sideW, minHeight: '100vh', background: '#0a0f1a',
      borderRight: '1px solid #0d1525', display: 'flex', flexDirection: 'column',
      flexShrink: 0, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden',
      position: 'sticky', top: 0, height: '100vh',
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: collapsed ? '18px 0' : '18px 16px',
      borderBottom: '1px solid #0d1525', justifyContent: collapsed ? 'center' : 'space-between',
      cursor: 'pointer', flexShrink: 0,
    },
    logoBrand: { display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' },
    logoIcon: {
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#e9d5ff',
    },
    logoText: { fontSize: 15, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap' },
    logoSub: { fontSize: 9, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 },
    navSection: { flex: 1, overflowY: 'auto', padding: '12px 8px' },
    navGroup: { marginBottom: 20 },
    navGroupLabel: {
      fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '0.15em',
      textTransform: 'uppercase', padding: collapsed ? '0 0 6px' : '0 8px 6px',
      textAlign: collapsed ? 'center' : 'left',
    },
    navItem: (active, disabled) => ({
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: collapsed ? '10px 0' : '9px 10px',
      borderRadius: 10, border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: active ? '#1a1040' : 'transparent',
      color: active ? '#a78bfa' : disabled ? '#1e293b' : '#475569',
      fontSize: 13, fontWeight: active ? 700 : 500,
      transition: 'all 0.15s', textAlign: 'left',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
    }),
    userCard: {
      padding: collapsed ? '12px 0' : '12px 12px',
      borderTop: '1px solid #0d1525', flexShrink: 0,
    },
    userInner: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 10,
      background: '#0d1525', border: '1px solid #1e293b',
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    avatar: {
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: roleInfo.bg, border: `1px solid ${roleInfo.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, color: roleInfo.color,
    },
    userEmail: { fontSize: 12, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    roleBadge: {
      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
      background: roleInfo.bg, border: `1px solid ${roleInfo.border}`,
      color: roleInfo.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
    },
    logoutBtn: {
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
      padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 8, fontSize: 12,
      justifyContent: collapsed ? 'center' : 'flex-start', marginTop: 8,
      transition: 'all 0.15s',
    },
  };

  return (
    <div style={styles.shell}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
          <div style={styles.logoBrand}>
            <div style={styles.logoIcon}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={styles.logoText}>TransitOps</div>
                <div style={styles.logoSub}>Person B · Workspace</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </div>

        {/* Nav */}
        <nav style={styles.navSection}>
          {NAV.map(group => (
            <div key={group.group} style={styles.navGroup}>
              {!collapsed && <div style={styles.navGroupLabel}>{group.group}</div>}
              {group.items.map(item => (
                <button
                  key={item.label}
                  style={styles.navItem(activeTab === item.key, item.key === null)}
                  onClick={() => item.key && setActiveTab(item.key)}
                  title={collapsed ? item.label : ''}
                >
                  <span style={{ flexShrink: 0, color: activeTab === item.key ? '#7c3aed' : item.key === null ? '#1e293b' : 'inherit' }}>
                    <SvgIcon d={item.icon} />
                  </span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                      {item.owner && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#1e293b', background: '#0d1525', border: '1px solid #1e293b', borderRadius: 4, padding: '1px 5px' }}>
                          {item.owner}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.userInner}>
            <div style={styles.avatar}>{currentUser.email.charAt(0).toUpperCase()}</div>
            {!collapsed && (
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={styles.userEmail}>{currentUser.email}</div>
                <div style={styles.roleBadge}>{roleInfo.label}</div>
              </div>
            )}
          </div>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = '#2a0d0d'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {activeTab === 'drivers' ? (
          <DriverManagement currentUser={currentUser} />
        ) : (
          <TripManagement currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
