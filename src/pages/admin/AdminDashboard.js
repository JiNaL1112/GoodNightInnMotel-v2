import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollToTop from '../../components/ScrollToTop';

import AdminStats              from '../../components/AdminStats';
import AdminRoomStatus         from '../../components/AdminRoomStatus';
import AdminTodayPanel         from '../../components/AdminTodayPanel';
import AdminRecentReservations from '../../components/AdminRecentReservations';
import AdminQuickActions       from '../../components/AdminQuickActions';
import { AuthContext }         from '../../context/AuthContext';

import './admin-dashboard.css';

const NAV = [
  { id: 'overview',     icon: '◈',  label: 'Overview'     },
  { id: 'reservations', icon: '📋', label: 'Reservations' },
  { id: 'rooms',        icon: '🏨', label: 'Rooms'        },
];

const AdminDashboard = () => {
  const [activeNav, setActiveNav] = useState('overview');
  const [now, setNow]             = useState(new Date());
  const { user, logout }          = useContext(AuthContext);
  const navigate                  = useNavigate();

  // Live clock — updates every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Hide the global site header/footer while on admin pages
  useEffect(() => {
    const siteHeader   = document.querySelector('.site-header');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const siteFooter   = document.querySelector('.site-footer');
    if (siteHeader)   siteHeader.style.display   = 'none';
    if (mobileDrawer) mobileDrawer.style.display = 'none';
    if (siteFooter)   siteFooter.style.display   = 'none';
    return () => {
      if (siteHeader)   siteHeader.style.display   = '';
      if (mobileDrawer) mobileDrawer.style.display = '';
      if (siteFooter)   siteFooter.style.display   = '';
    };
  }, []);

  return (
    <div className="adm-shell">
      <ScrollToTop />

      {/* ── Admin Top Bar ── */}
      <div className="adm-topbar">
        <span className="adm-topbar-title">
          <span className="adm-topbar-title-icon">🌙</span>
          GoodNight Inn · Admin
        </span>

        <div className="adm-topbar-meta">
          <div className="adm-live-dot" />
          <span>Live</span>
          <span>·</span>
          <span>
            {now.toLocaleDateString('en-CA', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
          <span>·</span>
          <span>
            {now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {user && (
            <>
              <span>·</span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>
                {user.displayName?.split(' ')[0] || 'Admin'}
              </span>
              <button
                onClick={logout}
                style={{
                  background:   '#f1f0ed',
                  border:       '1px solid #d1d5db',
                  color:        '#374151',
                  borderRadius: 6,
                  padding:      '3px 10px',
                  fontSize:     11,
                  cursor:       'pointer',
                  fontFamily:   'var(--font-disp)',
                  transition:   'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.color       = '#2563eb';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color       = '#374151';
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Body: Sidebar + Main ── */}
      <div className="adm-body">

        {/* ── Sidebar ── */}
        <aside className="adm-sidebar">

          {/* In-page navigation (tab switching) */}
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

          <div className="adm-nav-divider" />

          {/* Management — navigate to separate routes */}
          <div className="adm-nav-section">
            <div className="adm-nav-label">Management</div>
            <button
              className="adm-nav-item"
              onClick={() => navigate('/admin/reservation')}
            >
              <span className="adm-nav-icon">📝</span> Reservations
            </button>
            <button
              className="adm-nav-item"
              onClick={() => navigate('/admin/rooms')}
            >
              <span className="adm-nav-icon">🛏️</span> Manage Rooms
            </button>
            <button
              className="adm-nav-item"
              onClick={() => navigate('/admin/picturemanagement')}
            >
              <span className="adm-nav-icon">🖼️</span> Pictures
            </button>
          </div>

          <div className="adm-nav-divider" />

          {/* External links */}
          <div className="adm-nav-section">
            <div className="adm-nav-label">External</div>
            <button
              className="adm-nav-item"
              onClick={() => window.open('/', '_blank')}
            >
              <span className="adm-nav-icon">🌐</span> View Site
            </button>
            <a
              href="tel:+18338551818"
              className="adm-nav-item"
              style={{ textDecoration: 'none' }}
            >
              <span className="adm-nav-icon">📞</span> Call Guest
            </a>
          </div>

        </aside>

        {/* ── Main Content ── */}
        <main className="adm-content">

          {/* OVERVIEW */}
          {activeNav === 'overview' && (
            <>
              <AdminStats />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <AdminTodayPanel />
                <AdminQuickActions />
              </div>
              <AdminRoomStatus />
            </>
          )}

          {/* RESERVATIONS */}
          {activeNav === 'reservations' && (
            <>
              <AdminStats />
              <AdminRecentReservations />
            </>
          )}

          {/* ROOMS */}
          {activeNav === 'rooms' && (
            <>
              <AdminStats />
              <AdminRoomStatus />
            </>
          )}

          

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;