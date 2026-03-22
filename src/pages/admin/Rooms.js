import React, { useContext, useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db }              from '../../config/firebase';
import ScrollToTop         from '../../components/ScrollToTop';
import { RoomContext }     from '../../context/RoomContext';
import { AuthContext }     from '../../context/AuthContext';

const DEFAULT_FACILITIES = [
  'Free WiFi', 'Coffee Maker', 'Private Bathroom', 'Free Parking',
  'Swimming Pool', 'Breakfast', 'GYM', 'Drinks',
];

const EMPTY_ROOM = {
  name: '',
  price: '',
  size: '',
  maxPerson: '',
  description: '',
};

const Rooms = () => {
  const { rooms, fetchRooms }                     = useContext(RoomContext);
  const { user, logout }                          = useContext(AuthContext);
  const [priceChanges,    setPriceChanges]    = useState({});
  const [descChanges,     setDescChanges]     = useState({});
  const [imageFiles,      setImageFiles]      = useState({});
  const [uploading,       setUploading]       = useState(false);
  const [savedRoom,       setSavedRoom]       = useState(null);
  const [deletingRoom,    setDeletingRoom]    = useState(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [newRoom,         setNewRoom]         = useState(EMPTY_ROOM);
  const [newRoomImage,    setNewRoomImage]    = useState(null);
  const [addingRoom,      setAddingRoom]      = useState(false);
  const [addSuccess,      setAddSuccess]      = useState(false);

  // Hide global header/footer
  useEffect(() => {
    const els = [
      document.querySelector('.site-header'),
      document.querySelector('.mobile-drawer'),
      document.querySelector('.site-footer'),
    ];
    els.forEach(el => { if (el) el.style.display = 'none'; });
    return () => els.forEach(el => { if (el) el.style.display = ''; });
  }, []);

  const getBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => res(reader.result);
    reader.onerror = err => rej(err);
  });

  // ── Save existing room ────────────────────────────────────────────────────
  const handleSave = async (roomId) => {
    setUploading(true);
    try {
      const room   = rooms.find(r => r.id === roomId);
      const update = {
        price:       Number(priceChanges[roomId] ?? room.price),
        description: descChanges[roomId] ?? room.description,
      };
      if (imageFiles[roomId]) {
        update.imageData = await getBase64(imageFiles[roomId]);
      }
      await updateDoc(doc(db, 'rooms', roomId), update);
      setSavedRoom(roomId);
      setTimeout(() => setSavedRoom(null), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to update room');
    }
    setUploading(false);
  };

  // ── Delete room ───────────────────────────────────────────────────────────
  const handleDelete = async (roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete "${roomName}"? This cannot be undone.`)) return;
    setDeletingRoom(roomId);
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      await fetchRooms();
    } catch (err) {
      console.error(err);
      alert('Failed to delete room');
    }
    setDeletingRoom(null);
  };

  // ── Add new room ──────────────────────────────────────────────────────────
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim() || !newRoom.price) {
      alert('Room name and price are required.');
      return;
    }
    setAddingRoom(true);
    try {
      const roomData = {
        name:        newRoom.name.trim(),
        price:       Number(newRoom.price),
        size:        Number(newRoom.size) || 0,
        maxPerson:   Number(newRoom.maxPerson) || 2,
        description: newRoom.description.trim(),
        facilities:  DEFAULT_FACILITIES.map(f => ({ name: f })),
        createdAt:   new Date(),
      };
      if (newRoomImage) {
        roomData.imageData = await getBase64(newRoomImage);
      }
      await addDoc(collection(db, 'rooms'), roomData);
      await fetchRooms();
      setAddSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setNewRoom(EMPTY_ROOM);
        setNewRoomImage(null);
        setAddSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to add room');
    }
    setAddingRoom(false);
  };

  return (
    <>
      <style>{`
        /* ── Shell ── */
        .rm-shell  { min-height: 100vh; background: #f8f7f4; font-family: 'DM Sans', sans-serif; color: #1a1a1a; }

        /* ── Top bar ── */
        .rm-topbar {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .rm-topbar-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #2563eb;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rm-topbar-icon {
          width: 32px; height: 32px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }
        .rm-topbar-right { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #6b7280; }
        .rm-user { color: #2563eb; font-weight: 600; }
        .rm-logout {
          background: #f1f0ed;
          border: 1px solid #d1d5db;
          color: #374151;
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 11px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, color 0.2s;
        }
        .rm-logout:hover { border-color: #2563eb; color: #2563eb; }

        /* ── Layout ── */
        .rm-body    { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 64px); }
        .rm-sidebar {
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          padding: 24px 8px;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }
        .rm-nav-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #9ca3af;
          padding: 0 12px;
          margin-bottom: 8px;
          display: block;
        }
        .rm-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          margin-bottom: 2px;
        }
        .rm-nav-item:hover   { background: #eff6ff; color: #2563eb; }
        .rm-nav-item.active  { background: #eff6ff; color: #2563eb; font-weight: 600; }
        .rm-nav-divider { height: 1px; background: #e5e7eb; margin: 12px 8px; }

        /* ── Content ── */
        .rm-content { padding: 32px; overflow-y: auto; }
        .rm-page-head { margin-bottom: 28px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .rm-page-head-text {}
        .rm-page-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #2563eb;
          margin-bottom: 6px;
        }
        .rm-page-title { font-size: 26px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
        .rm-page-sub   { font-size: 14px; color: #6b7280; }

        /* ── Add Room Button ── */
        .rm-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rm-add-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }

        /* ── Room Cards ── */
        .rm-card {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          margin-bottom: 20px;
          overflow: hidden;
          transition: box-shadow 0.2s, border-color 0.2s;
          position: relative;
        }
        .rm-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.10); border-color: #d1d5db; }
        .rm-card-inner {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 28px;
          padding: 24px;
        }

        /* ── Delete button on card ── */
        .rm-delete-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #dc2626;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          z-index: 10;
        }
        .rm-delete-btn:hover:not(:disabled) {
          background: #dc2626;
          color: #fff;
          border-color: #dc2626;
          transform: translateY(-1px);
        }
        .rm-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Image ── */
        .rm-img {
          width: 100%;
          border-radius: 10px;
          object-fit: cover;
          height: 180px;
          display: block;
        }
        .rm-img-placeholder {
          width: 100%;
          height: 180px;
          border-radius: 10px;
          background: #f1f0ed;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }

        /* ── Room fields ── */
        .rm-room-title { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; padding-right: 120px; }
        .rm-room-meta  { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .rm-meta-pill  {
          background: #f1f0ed;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 12px;
          color: #374151;
          font-family: 'JetBrains Mono', monospace;
        }
        .rm-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6b7280;
          display: block;
          margin-bottom: 6px;
        }
        .rm-input, .rm-textarea {
          background: #f8f7f4;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          outline: none;
          width: 100%;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .rm-input:focus, .rm-textarea:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .rm-textarea { resize: vertical; min-height: 80px; }
        .rm-file-label {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8f7f4;
          border: 1.5px dashed #d1d5db;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          color: #6b7280;
          font-size: 13px;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .rm-file-label:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
        .rm-file-input { display: none; }
        .rm-save-btn {
          margin-top: 20px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .rm-save-btn:not(:disabled):hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .rm-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rm-saved-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 20px;
        }

        /* ── Modal overlay ── */
        .rm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .rm-modal {
          background: #ffffff;
          border-radius: 18px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
        }
        .rm-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 2;
        }
        .rm-modal-title {
          font-size: 17px;
          font-weight: 700;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rm-modal-close {
          background: #f1f0ed;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          width: 32px; height: 32px;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
          line-height: 1;
        }
        .rm-modal-close:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .rm-modal-body {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .rm-modal-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .rm-modal-foot {
          padding: 18px 28px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .rm-modal-cancel {
          background: #f1f0ed;
          border: 1px solid #d1d5db;
          color: #374151;
          border-radius: 10px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s;
        }
        .rm-modal-cancel:hover { border-color: #9ca3af; }
        .rm-modal-submit {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 11px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, transform 0.15s;
        }
        .rm-modal-submit:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }
        .rm-modal-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .rm-modal-submit.success {
          background: #16a34a;
        }
        .rm-section-divider {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #2563eb;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .rm-body { grid-template-columns: 1fr; }
          .rm-sidebar { display: none; }
          .rm-content { padding: 20px 16px; }
          .rm-card-inner { grid-template-columns: 1fr; }
          .rm-modal-row { grid-template-columns: 1fr; }
          .rm-page-head { flex-direction: column; align-items: flex-start; }
          .rm-delete-btn { position: static; margin-bottom: 12px; }
        }
      `}</style>

      <div className="rm-shell">
        <ScrollToTop />

        {/* ── Top Bar ── */}
        <div className="rm-topbar">
          <span className="rm-topbar-title">
            <span className="rm-topbar-icon">🌙</span>
            GoodNight Inn · Admin
          </span>
          <div className="rm-topbar-right">
            {user && (
              <>
                <span className="rm-user">{user.displayName?.split(' ')[0]}</span>
                <button className="rm-logout" onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </div>

        <div className="rm-body">

          {/* ── Sidebar ── */}
          <aside className="rm-sidebar">
            <span className="rm-nav-label">Navigation</span>
            {[
              { href: '/admin',                  icon: '◈',  label: 'Dashboard'    },
              { href: '/admin/reservation',       icon: '📋', label: 'Reservations' },
              { href: '/admin/rooms',             icon: '🏨', label: 'Rooms', active: true },
              { href: '/admin/picturemanagement', icon: '🖼️', label: 'Pictures'     },
            ].map(n => (
              <a
                key={n.href}
                href={n.href}
                className={`rm-nav-item ${n.active ? 'active' : ''}`}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{n.icon}</span>
                {n.label}
              </a>
            ))}
            <div className="rm-nav-divider" />
            <a href="/" target="_blank" rel="noreferrer" className="rm-nav-item">
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🌐</span> View Site
            </a>
          </aside>

          {/* ── Main ── */}
          <main className="rm-content">
            <div className="rm-page-head">
              <div className="rm-page-head-text">
                <div className="rm-page-tag">Admin Management</div>
                <h1 className="rm-page-title">Manage Rooms</h1>
                <div className="rm-page-sub">
                  Update room details, prices, photos — or add / remove rooms.
                </div>
              </div>
              <button className="rm-add-btn" onClick={() => setShowAddModal(true)}>
                <span style={{ fontSize: 16 }}>＋</span> Add New Room
              </button>
            </div>

            {rooms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏨</div>
                <div style={{ fontSize: 14 }}>No rooms found. Add your first room above.</div>
              </div>
            )}

            {rooms.map(room => (
              <div key={room.id} className="rm-card">

                {/* ── Delete button ── */}
                <button
                  className="rm-delete-btn"
                  disabled={deletingRoom === room.id}
                  onClick={() => handleDelete(room.id, room.name)}
                  title="Delete this room"
                >
                  {deletingRoom === room.id ? (
                    <>
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #fca5a5', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'rm-spin 0.7s linear infinite' }} />
                      Deleting…
                    </>
                  ) : (
                    <>🗑 Delete</>
                  )}
                </button>

                <div className="rm-card-inner">

                  {/* ── Image column ── */}
                  <div>
                    {room.imageData
                      ? <img src={room.imageData} alt={room.name} className="rm-img" />
                      : <div className="rm-img-placeholder">🛏️</div>
                    }

                    {imageFiles[room.id] && (
                      <img
                        src={URL.createObjectURL(imageFiles[room.id])}
                        alt="Preview"
                        className="rm-img"
                        style={{ marginTop: 10, opacity: 0.8 }}
                      />
                    )}

                    <div style={{ marginTop: 14 }}>
                      <label className="rm-label">Upload New Photo</label>
                      <label className="rm-file-label">
                        <span>📷</span>
                        <span>{imageFiles[room.id] ? imageFiles[room.id].name : 'Choose image…'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="rm-file-input"
                          onChange={e => setImageFiles(prev => ({ ...prev, [room.id]: e.target.files[0] }))}
                        />
                      </label>
                    </div>
                  </div>

                  {/* ── Fields column ── */}
                  <div>
                    <div className="rm-room-title">{room.name}</div>
                    <div className="rm-room-meta">
                      <span className="rm-meta-pill">📐 {room.size}m²</span>
                      <span className="rm-meta-pill">👥 Max {room.maxPerson}</span>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label className="rm-label">Description</label>
                      <textarea
                        className="rm-textarea"
                        value={descChanges[room.id] ?? room.description}
                        onChange={e => setDescChanges(prev => ({ ...prev, [room.id]: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label className="rm-label">Price per Night ($)</label>
                      <input
                        type="number"
                        className="rm-input"
                        value={priceChanges[room.id] ?? room.price}
                        onChange={e => setPriceChanges(prev => ({ ...prev, [room.id]: e.target.value }))}
                        style={{ maxWidth: 200 }}
                      />
                    </div>

                    {savedRoom === room.id ? (
                      <div className="rm-saved-badge">✓ Saved successfully</div>
                    ) : (
                      <button
                        className="rm-save-btn"
                        disabled={uploading}
                        onClick={() => handleSave(room.id)}
                      >
                        {uploading ? 'Saving…' : 'Save Changes'}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </main>

        </div>
      </div>

      {/* ══════════════════════════════════════
          ADD ROOM MODAL
      ══════════════════════════════════════ */}
      {showAddModal && (
        <div className="rm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="rm-modal">
            <div className="rm-modal-head">
              <span className="rm-modal-title">
                <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🏨</span>
                Add New Room
              </span>
              <button className="rm-modal-close" onClick={() => { setShowAddModal(false); setNewRoom(EMPTY_ROOM); setNewRoomImage(null); }}>×</button>
            </div>

            <form onSubmit={handleAddRoom}>
              <div className="rm-modal-body">

                {/* Basic Info */}
                <div className="rm-section-divider">🛏️ Room Information</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="rm-label">Room Name *</label>
                  <input
                    className="rm-input"
                    placeholder="e.g. King Suite, Double Room…"
                    value={newRoom.name}
                    onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="rm-modal-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label className="rm-label">Price per Night ($) *</label>
                    <input
                      type="number"
                      min="1"
                      className="rm-input"
                      placeholder="e.g. 149"
                      value={newRoom.price}
                      onChange={e => setNewRoom(p => ({ ...p, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label className="rm-label">Max Persons *</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="rm-input"
                      placeholder="e.g. 2"
                      value={newRoom.maxPerson}
                      onChange={e => setNewRoom(p => ({ ...p, maxPerson: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="rm-label">Room Size (m²)</label>
                  <input
                    type="number"
                    min="0"
                    className="rm-input"
                    placeholder="e.g. 35"
                    value={newRoom.size}
                    onChange={e => setNewRoom(p => ({ ...p, size: e.target.value }))}
                    style={{ maxWidth: 160 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="rm-label">Description</label>
                  <textarea
                    className="rm-textarea"
                    placeholder="Describe the room — amenities, view, style…"
                    value={newRoom.description}
                    onChange={e => setNewRoom(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Photo */}
                <div className="rm-section-divider">📷 Room Photo</div>

                <div>
                  <label className="rm-file-label" style={{ cursor: 'pointer' }}>
                    <span>📷</span>
                    <span style={{ flex: 1 }}>
                      {newRoomImage ? newRoomImage.name : 'Choose a photo (optional)'}
                    </span>
                    {newRoomImage && (
                      <span
                        style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}
                        onClick={(e) => { e.preventDefault(); setNewRoomImage(null); }}
                      >
                        Remove
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="rm-file-input"
                      onChange={e => setNewRoomImage(e.target.files[0] || null)}
                    />
                  </label>
                  {newRoomImage && (
                    <img
                      src={URL.createObjectURL(newRoomImage)}
                      alt="Preview"
                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginTop: 10, border: '1px solid #e5e7eb' }}
                    />
                  )}
                </div>

                {/* Info note */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1d4ed8', lineHeight: 1.6 }}>
                  💡 Standard facilities (WiFi, parking, pool, etc.) will be added automatically. You can update the description and photo at any time.
                </div>

              </div>

              <div className="rm-modal-foot">
                <button
                  type="button"
                  className="rm-modal-cancel"
                  onClick={() => { setShowAddModal(false); setNewRoom(EMPTY_ROOM); setNewRoomImage(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rm-modal-submit ${addSuccess ? 'success' : ''}`}
                  disabled={addingRoom}
                >
                  {addSuccess ? '✓ Room Added!' : addingRoom ? 'Adding…' : '＋ Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes rm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default Rooms;