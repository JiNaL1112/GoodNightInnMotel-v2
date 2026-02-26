import React, { useState } from 'react';
import ScrollToTop from '../../components/ScrollToTop';

import AdminStats              from '../../components/AdminStats';
import AdminRoomStatus         from '../../components/AdminRoomStatus';
import AdminRevenue            from '../../components/AdminRevenue';
import AdminTodayPanel         from '../../components/AdminTodayPanel';
import AdminRecentReservations from '../../components/AdminRecentReservations';
import AdminQuickActions       from '../../components/AdminQuickActions';

import './admin-dashboard.css';

const NAV = [
  { id: 'overview',      icon: '◈', label: 'Overview'     },
  { id: 'reservations',  icon: '📋', label: 'Reservations' },
  { id: 'rooms',         icon: '🏨', label: 'Rooms'        },
  { id: 'revenue',       icon: '💰', label: 'Revenue'      },
];

const AdminDashboard = () => {
  const [activeNav, setActiveNav] = useState('overview');
  const now = new Date();

  return (
    <div className="adm-shell">
      <ScrollToTop />

      {/* Top bar */}
      <div className="adm-topbar">
        <span className="adm-topbar-title">GoodNight Inn · Admin</span>
        <div className="adm-topbar-meta">
          <div className="adm-live-dot" />
          <span>Live</span>
          <span>·</span>
          <span>{now.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>·</span>
          <span>{now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="adm-body">
        {/* Sidebar */}
        <aside className="adm-sidebar">
          <div className="adm-nav-section">
            <div className="adm-nav-label">Navigation</div>
            {NAV.map(n => (
              <button
                key={n.id}
                className={`adm-nav-item ${activeNav === n.id ? 'active' : ''}`}
                onClick={() => setActiveNav(n.id)}
              >
                <span className="adm-nav-icon">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>
          <div className="adm-nav-section">
            <div className="adm-nav-label">External Links</div>
            <button className="adm-nav-item" onClick={() => window.open('/', '_blank')}>
              <span className="adm-nav-icon">🌐</span> View Site
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="adm-content">

          {/* ── OVERVIEW ── */}
          {activeNav === 'overview' && (
            <>
              <AdminStats />

              <div className="adm-panels-3">
                <AdminRevenue />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <AdminTodayPanel />
                  <AdminQuickActions />
                </div>
              </div>

              <AdminRoomStatus />
            </>
          )}

          {/* ── RESERVATIONS ── */}
          {activeNav === 'reservations' && (
            <>
              <AdminStats />
              <AdminRecentReservations />
            </>
          )}

          {/* ── ROOMS ── */}
          {activeNav === 'rooms' && (
            <>
              <AdminStats />
              <AdminRoomStatus />
            </>
          )}

          {/* ── REVENUE ── */}
          {activeNav === 'revenue' && (
            <>
              <AdminStats />
              <AdminRevenue />
              <div className="adm-panels" style={{ marginTop: 18 }}>
                <AdminTodayPanel />
                <AdminQuickActions />
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
