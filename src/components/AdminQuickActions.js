import React from 'react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { icon: '➕', label: 'Add Booking',      href: '/admin/reservation' },
  { icon: '🏨', label: 'Manage Rooms',     href: '/admin/rooms'       },
  { icon: '🖼️', label: 'Pictures',         href: '/admin/picturemanagement' },
  { icon: '📞', label: 'Call Guest',        href: 'tel:+18338551818'   },
];

const AdminQuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <span className="adm-panel-title">Quick Actions</span>
      </div>
      <div className="adm-panel-body">
        <div className="adm-quick-actions">
          {actions.map(a => (
            <button
              key={a.label}
              className="adm-quick-btn"
              onClick={() => {
                if (a.href.startsWith('tel:')) window.location.href = a.href;
                else navigate(a.href);
              }}
            >
              <span className="adm-quick-icon">{a.icon}</span>
              <span className="adm-quick-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminQuickActions;
