import React, { useEffect, useState, useContext } from 'react';
import { db }               from '../../config/firebase';
import ScrollToTop          from '../../components/ScrollToTop';
import { AuthContext }      from '../../context/AuthContext';
import {
  collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';

const PictureManagement = () => {
  const { user, logout }       = useContext(AuthContext);
  const [images,    setImages]    = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [lightbox,  setLightbox]  = useState(null);

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

  const fetchImages = async () => {
    const snap = await getDocs(collection(db, 'gallery'));
    setImages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      await Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              await addDoc(collection(db, 'gallery'), {
                base64: reader.result, createdAt: serverTimestamp(),
              });
              resolve();
            } catch (err) { reject(err); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));
      await fetchImages();
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'gallery', id));
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) { console.error('Delete failed:', err); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <style>{`
        .pm-shell { min-height: 100vh; background: #0a0a0f; font-family: 'DM Sans', sans-serif; color: #e8e8f0; }
        .pm-topbar { background: #12121a; border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .pm-topbar-title { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #f0c060; display: flex; align-items: center; gap: 10px; }
        .pm-topbar-icon { width: 32px; height: 32px; background: rgba(240,192,96,0.12); border: 1px solid rgba(240,192,96,0.25); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .pm-topbar-right { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #5a5a7a; }
        .pm-user { color: #f0c060; font-weight: 600; }
        .pm-logout { background: #1a1a28; border: 1px solid rgba(255,255,255,0.12); color: #9898b8; border-radius: 6px; padding: 4px 12px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .pm-logout:hover { border-color: #f0c060; color: #f0c060; }
        .pm-body { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 64px); }
        .pm-sidebar { background: #12121a; border-right: 1px solid rgba(255,255,255,0.07); padding: 24px 0; position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; }
        .pm-nav-label { font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #5a5a7a; padding: 0 16px; margin-bottom: 8px; }
        .pm-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; color: #9898b8; cursor: pointer; border: none; background: none; width: 100%; text-align: left; transition: all 0.18s; font-family: 'DM Sans', sans-serif; text-decoration: none; }
        .pm-nav-item:hover  { background: #1a1a28; color: #e8e8f0; }
        .pm-nav-item.active { background: rgba(240,192,96,0.12); color: #f0c060; }
        .pm-nav-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 12px 16px; }
        .pm-content { padding: 32px; overflow-y: auto; }
        .pm-page-head { margin-bottom: 32px; }
        .pm-page-tag { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #40e0c8; }
        .pm-page-title { font-size: 26px; font-weight: 700; color: #e8e8f0; margin: 6px 0 4px; }
        .pm-page-sub { font-size: 13px; color: #5a5a7a; }
        .pm-upload-zone { background: #12121a; border: 2px dashed rgba(240,192,96,0.3); border-radius: 18px; padding: 48px 32px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 32px; position: relative; }
        .pm-upload-zone:hover { border-color: rgba(240,192,96,0.6); background: rgba(240,192,96,0.04); }
        .pm-upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .pm-upload-icon { font-size: 40px; margin-bottom: 12px; }
        .pm-upload-title { font-size: 16px; font-weight: 700; color: #e8e8f0; margin-bottom: 6px; }
        .pm-upload-sub { font-size: 13px; color: #5a5a7a; }
        .pm-upload-btn { display: inline-block; margin-top: 16px; background: #f0c060; color: #0a0a0f; border: none; border-radius: 8px; padding: 10px 24px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; pointer-events: none; }
        .pm-stats { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .pm-stat-pill { background: #12121a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px 20px; }
        .pm-stat-val { font-size: 24px; font-weight: 800; color: #f0c060; }
        .pm-stat-lbl { font-size: 11px; color: #5a5a7a; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .pm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .pm-img-card { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; background: #1a1a28; border: 1px solid rgba(255,255,255,0.07); cursor: zoom-in; }
        .pm-img-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
        .pm-img-card:hover img { transform: scale(1.07); }
        .pm-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: flex-end; justify-content: center; padding: 12px; opacity: 0; transition: opacity 0.25s; }
        .pm-img-card:hover .pm-img-overlay { opacity: 1; }
        .pm-del-btn { background: rgba(240,96,144,0.9); color: #fff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .pm-del-btn:hover { background: #f06090; }
        .pm-spinning { animation: pm-spin 0.7s linear infinite; }
        @keyframes pm-spin { to { transform: rotate(360deg); } }
        .pm-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(6px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .pm-lightbox-close { position: absolute; top: 20px; right: 24px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #fff; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 768px) { .pm-body { grid-template-columns: 1fr; } .pm-sidebar { display: none; } .pm-content { padding: 20px 16px; } .pm-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="pm-shell">
        <ScrollToTop />

        {/* Top bar */}
        <div className="pm-topbar">
          <span className="pm-topbar-title">
            <span className="pm-topbar-icon">🌙</span>
            GoodNight Inn · Admin
          </span>
          <div className="pm-topbar-right">
            {user && (
              <>
                <span className="pm-user">{user.displayName?.split(' ')[0]}</span>
                <button className="pm-logout" onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </div>

        <div className="pm-body">
          {/* Sidebar */}
          <aside className="pm-sidebar">
            <div style={{ padding: '0 8px' }}>
              <div className="pm-nav-label" style={{ padding: '0 8px', marginBottom: 8 }}>Navigation</div>
              {[
                { href: '/admin',              icon: '◈',  label: 'Dashboard'    },
                { href: '/admin/reservation',  icon: '📋', label: 'Reservations' },
                { href: '/admin/rooms',        icon: '🏨', label: 'Rooms'        },
                { href: '/admin/picturemanagement', icon: '🖼️', label: 'Pictures', active: true },
              ].map(n => (
                <a key={n.href} href={n.href} className={`pm-nav-item ${n.active ? 'active' : ''}`}>
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{n.icon}</span>
                  {n.label}
                </a>
              ))}
              <div className="pm-nav-divider" />
              <a href="/" target="_blank" rel="noreferrer" className="pm-nav-item">
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🌐</span> View Site
              </a>
            </div>
          </aside>

          {/* Main */}
          <main className="pm-content">
            <div className="pm-page-head">
              <div className="pm-page-tag">Admin Management</div>
              <h1 className="pm-page-title">Photo Gallery</h1>
              <div className="pm-page-sub">Upload and manage photos shown on the public gallery page.</div>
            </div>

            {/* Stats */}
            <div className="pm-stats">
              <div className="pm-stat-pill">
                <div className="pm-stat-val">{images.length}</div>
                <div className="pm-stat-lbl">Total Photos</div>
              </div>
              {uploading && (
                <div className="pm-stat-pill" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="pm-spinning" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f0c060', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0c060' }}>Uploading…</div>
                    <div className="pm-stat-lbl">Please wait</div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload zone */}
            <div className="pm-upload-zone">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
              <div className="pm-upload-icon">📷</div>
              <div className="pm-upload-title">Drop photos here or click to upload</div>
              <div className="pm-upload-sub">JPEG, PNG, WebP · Multiple files supported</div>
              <div className="pm-upload-btn">
                {uploading ? 'Uploading…' : 'Choose Files'}
              </div>
            </div>

            {/* Grid */}
            {images.length === 0 && !uploading && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a5a7a' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🖼️</div>
                <div style={{ fontSize: 14 }}>No photos yet — upload your first one above.</div>
              </div>
            )}

            {images.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#5a5a7a', marginBottom: 16 }}>
                  Gallery Photos ({images.length})
                </div>
                <div className="pm-grid">
                  {images.map(img => (
                    <div key={img.id} className="pm-img-card">
                      <img
                        src={img.base64}
                        alt="Gallery"
                        onClick={() => setLightbox(img.base64)}
                        loading="lazy"
                      />
                      <div className="pm-img-overlay" onClick={e => e.stopPropagation()}>
                        <button
                          className="pm-del-btn"
                          disabled={deleting === img.id}
                          onClick={() => handleDelete(img.id)}
                        >
                          {deleting === img.id ? 'Deleting…' : '🗑 Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="pm-lightbox" onClick={() => setLightbox(null)}>
            <button className="pm-lightbox-close" onClick={() => setLightbox(null)}>×</button>
            <img
              src={lightbox}
              alt="Preview"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default PictureManagement;