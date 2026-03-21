import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { RoomContext } from '../../context/RoomContext';
import { AuthContext } from '../../context/AuthContext';
import emailjs from '@emailjs/browser';
import ScrollToTop from '../../components/ScrollToTop';

const AVATAR_COLORS = ['#f0c060','#40e0c8','#f06090','#9080f0','#50d890','#60b0f0'];

const ALL_ROOM_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 1);
const PAGE_SIZE = 10;
const PAYMENT_METHODS = ['Credit Card', 'Debit Card'];

const NAV = [
  { id: 'overview',     icon: '◈',  label: 'Overview',     href: '/admin'                    },
  { id: 'reservations', icon: '📝', label: 'Reservations', href: '/admin/reservation'        },
  { id: 'rooms',        icon: '🛏️', label: 'Manage Rooms', href: '/admin/rooms'              },
  { id: 'pictures',     icon: '🖼️', label: 'Pictures',     href: '/admin/picturemanagement'  },
];

const SectionDivider = ({ label }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#40e0c8', padding: '10px 0 6px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>{label}</div>
);

const AdminReservations = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useContext(AuthContext);

  const {
    rooms,
    pname, setPName, email, setEmail, phone, setPhone,
    checkInDate, setCheckInDate, checkOutDate, setCheckOutDate,
    adults, setAdults, kids, setKids,
    selectedRoomId, setSelectedRoomId,
    selectedRoomName, setSelectedRoomName,
    // Extended fields
    address,         setAddress,
    city,            setCity,
    province,        setProvince,
    country,         setCountry,
    postalCode,      setPostalCode,
    company,         setCompany,
    driverLicNo,     setDriverLicNo,
    dob,             setDob,
    deposit,         setDeposit,
    returnedDeposit, setReturnedDeposit,
    methodOfPayment, setMethodOfPayment,
    plateNumber,     setPlateNumber,
    clerk,           setClerk,
    numberOfRooms,   setNumberOfRooms,
  } = useContext(RoomContext);

  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [isEditing,    setIsEditing]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [roomNumber,   setRoomNumber]   = useState('');
  const [billModal,    setBillModal]    = useState(false);
  const [billDetails,  setBillDetails]  = useState(null);
  const [activeTab,    setActiveTab]    = useState('pending');
  const [saving,       setSaving]       = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterRoom,   setFilterRoom]   = useState('');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');
  const [page,         setPage]         = useState(1);

  useEffect(() => {
    const els = [document.querySelector('.site-header'), document.querySelector('.mobile-drawer'), document.querySelector('.site-footer')];
    els.forEach(el => { if (el) el.style.display = 'none'; });
    return () => els.forEach(el => { if (el) el.style.display = ''; });
  }, []);

  useEffect(() => { fetchReservations(); }, []);
  useEffect(() => { setPage(1); }, [activeTab, search, filterRoom, filterFrom, filterTo]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const q    = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleConfirm = async (id) => {
    await updateDoc(doc(db, 'reservations', id), { status: 'booked' });
    fetchReservations();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this reservation?')) return;
    await deleteDoc(doc(db, 'reservations', id));
    fetchReservations();
  };

  const resetExtended = () => {
    setAddress(''); setCity(''); setProvince(''); setCountry(''); setPostalCode('');
    setCompany(''); setDriverLicNo(''); setDob(''); setDeposit('');
    setReturnedDeposit(''); setMethodOfPayment(''); setPlateNumber('');
    setClerk(''); setNumberOfRooms(1);
  };

  const openAdd = () => {
    setIsEditing(false); setEditTarget(null); setRoomNumber('');
    resetExtended();
    setShowModal(true);
  };

  const openEdit = (res) => {
    setIsEditing(true); setEditTarget(res);
    setPName(res.pname); setEmail(res.email); setPhone(res.phone);
    setCheckInDate(res.checkIn?.toDate?.() || new Date());
    setCheckOutDate(res.checkOut?.toDate?.() || new Date());
    setAdults(res.adults); setKids(res.kids);
    setSelectedRoomId(res.roomId); setSelectedRoomName(res.roomName);
    setRoomNumber(res.roomNumber || '');
    // Extended
    setAddress(res.address || ''); setCity(res.city || '');
    setProvince(res.province || ''); setCountry(res.country || '');
    setPostalCode(res.postalCode || ''); setCompany(res.company || '');
    setDriverLicNo(res.driverLicNo || ''); setDob(res.dob || '');
    setDeposit(res.deposit != null ? String(res.deposit) : '');
    setReturnedDeposit(res.returnedDeposit != null ? String(res.returnedDeposit) : '');
    setMethodOfPayment(res.methodOfPayment || ''); setPlateNumber(res.plateNumber || '');
    setClerk(res.clerk || ''); setNumberOfRooms(res.numberOfRooms || 1);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      pname, email, phone, checkIn: checkInDate, checkOut: checkOutDate,
      adults, kids, roomId: selectedRoomId, roomName: selectedRoomName,
      roomNumber, status: 'booked',
      [isEditing ? 'updatedAt' : 'createdAt']: new Date(),
      address, city, province, country, postalCode,
      company, driverLicNo, dob,
      deposit:         deposit         ? Number(deposit)         : null,
      returnedDeposit: returnedDeposit ? Number(returnedDeposit) : null,
      methodOfPayment, plateNumber, clerk,
      numberOfRooms:   Number(numberOfRooms) || 1,
    };
    try {
      if (isEditing && editTarget?.id) await updateDoc(doc(db, 'reservations', editTarget.id), data);
      else await addDoc(collection(db, 'reservations'), data);
      setShowModal(false); fetchReservations();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const generateBill = async (res) => {
    const roomSnap = await getDocs(collection(db, 'rooms'));
    const room     = roomSnap.docs.map(d => ({ ...d.data(), id: d.id })).find(r => r.id === res.roomId);
    if (!room) return;
    const checkIn  = res.checkIn?.toDate  ? res.checkIn.toDate()  : new Date(res.checkIn);
    const checkOut = res.checkOut?.toDate ? res.checkOut.toDate() : new Date(res.checkOut);
    const nights   = Math.max(1, Math.ceil((checkOut - checkIn) / 86400000));
    const base     = room.price * nights;
    const hst      = base * 0.13;
    setBillDetails({
      guest: res.pname, roomName: room.name, roomNumber: res.roomNumber || 'N/A',
      checkIn: checkIn.toDateString(), checkOut: checkOut.toDateString(),
      nights, roomPrice: room.price, baseAmount: base,
      hstAmount: hst, totalAmount: base + hst, email: res.email,
      methodOfPayment: res.methodOfPayment, deposit: res.deposit,
      returnedDeposit: res.returnedDeposit, clerk: res.clerk,
    });
    setBillModal(true);
  };

  const sendBill = async () => {
    if (!billDetails) return;
    setSendingEmail(true);
    try {
      await emailjs.send('service_d3cy1e9', 'template_11t5n5a', {
        guest: billDetails.guest, room_name: billDetails.roomName,
        room_number: billDetails.roomNumber, check_in: billDetails.checkIn,
        check_out: billDetails.checkOut, nights: billDetails.nights,
        rate: `$${billDetails.roomPrice.toFixed(2)}`,
        subtotal: `$${billDetails.baseAmount.toFixed(2)}`,
        hst: `$${billDetails.hstAmount.toFixed(2)}`,
        total: `$${billDetails.totalAmount.toFixed(2)}`,
        to_email: billDetails.email,
      }, '8nzBG6xAhz4eIyVij');
      alert('Receipt sent!');
    } catch { alert('Send failed'); }
    finally { setSendingEmail(false); }
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pending   = reservations.filter(r => r.status !== 'booked');
  const confirmed = reservations.filter(r => r.status === 'booked');
  const tabList   = activeTab === 'pending' ? pending : confirmed;
  const roomNames = [...new Set(reservations.map(r => r.roomName).filter(Boolean))].sort();

  const filtered = tabList.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.pname?.toLowerCase().includes(q) && !r.email?.toLowerCase().includes(q)) return false;
    if (filterRoom && r.roomName !== filterRoom) return false;
    if (filterFrom) { const ci = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn); if (ci < new Date(filterFrom)) return false; }
    if (filterTo)   { const co = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut); if (co > new Date(filterTo + 'T23:59:59')) return false; }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || filterRoom || filterFrom || filterTo;
  const clearFilters = () => { setSearch(''); setFilterRoom(''); setFilterFrom(''); setFilterTo(''); };

  // Modal input style
  const mi = { background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#e8e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const FieldRow = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
  const Field = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#5a5a7a' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <>
      <style>{`
        .res-shell { min-height: 100vh; background: #0a0a0f; font-family: 'DM Sans', sans-serif; color: #e8e8f0; }
        .res-topbar { background: #12121a; border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .res-topbar-title { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #f0c060; display: flex; align-items: center; gap: 10px; }
        .res-topbar-icon { width: 32px; height: 32px; background: rgba(240,192,96,0.12); border: 1px solid rgba(240,192,96,0.25); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .res-topbar-right { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #5a5a7a; }
        .res-topbar-user  { color: #f0c060; font-weight: 600; }
        .res-logout-btn { background: #1a1a28; border: 1px solid rgba(255,255,255,0.12); color: #9898b8; border-radius: 6px; padding: 4px 12px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .res-logout-btn:hover { border-color: #f0c060; color: #f0c060; }
        .res-body { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 64px); }
        .res-sidebar { background: #12121a; border-right: 1px solid rgba(255,255,255,0.07); padding: 24px 0; position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; }
        .res-nav-label { font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #5a5a7a; padding: 0 28px; margin-bottom: 8px; }
        .res-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; color: #9898b8; cursor: pointer; border: none; background: none; width: calc(100% - 16px); text-align: left; transition: all 0.18s; font-family: 'DM Sans', sans-serif; border-radius: 8px; margin: 0 8px; text-decoration: none; }
        .res-nav-item:hover { background: #1a1a28; color: #e8e8f0; }
        .res-nav-item.active { background: rgba(240,192,96,0.12); color: #f0c060; }
        .res-nav-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 12px 16px; }
        .res-content { padding: 32px; overflow-y: auto; }
        .res-page-head { margin-bottom: 28px; }
        .res-page-tag { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #40e0c8; }
        .res-page-title { font-size: 26px; font-weight: 700; color: #e8e8f0; margin: 6px 0 4px; }
        .res-page-sub { font-size: 13px; color: #5a5a7a; }
        .res-panel { background: #12121a; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 24px; margin-bottom: 20px; }
        .res-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .res-tab-btn { border: none; cursor: pointer; padding: 6px 16px; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; transition: all 0.15s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .res-body { grid-template-columns: 1fr; } .res-sidebar { display: none; } .res-content { padding: 20px 16px; } }
      `}</style>

      <ScrollToTop />
      <div className="res-shell">

        <div className="res-topbar">
          <span className="res-topbar-title">
            <span className="res-topbar-icon">🌙</span>
            GoodNight Inn · Admin
          </span>
          <div className="res-topbar-right">
            {user && <span className="res-topbar-user">{user.displayName?.split(' ')[0] || 'Admin'}</span>}
            <button className="res-logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="res-body">
          <aside className="res-sidebar">
            <div className="res-nav-label">Navigation</div>
            {NAV.map(n => (
              <a key={n.id} href={n.href} className={`res-nav-item ${location.pathname === n.href ? 'active' : ''}`}>
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{n.icon}</span>
                {n.label}
              </a>
            ))}
            <div className="res-nav-divider" />
            <a href="/" target="_blank" rel="noreferrer" className="res-nav-item">
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🌐</span> View Site
            </a>
          </aside>

          <main className="res-content">
            <div className="res-page-head">
              <div className="res-page-tag">Admin Management</div>
              <h1 className="res-page-title">Reservations</h1>
              <div className="res-page-sub">Manage all guest bookings — pending approvals and confirmed stays.</div>
            </div>

            <div className="res-panel">
              <div className="res-panel-head">
                <div style={{ display: 'flex', gap: 4 }}>
                  {['pending', 'confirmed'].map(tab => (
                    <button key={tab} className="res-tab-btn" onClick={() => setActiveTab(tab)} style={{
                      background: activeTab === tab ? (tab === 'pending' ? 'rgba(240,192,96,0.15)' : 'rgba(80,216,144,0.12)') : 'transparent',
                      color: activeTab === tab ? (tab === 'pending' ? '#f0c060' : '#50d890') : '#5a5a7a',
                    }}>
                      {tab === 'pending' ? `⏳ Pending (${pending.length})` : `✅ Confirmed (${confirmed.length})`}
                    </button>
                  ))}
                </div>
                {activeTab === 'confirmed' && (
                  <button onClick={openAdd} style={{ background: '#f0c060', color: '#0a0a0f', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>+ Add Booking</button>
                )}
              </div>

              {/* Filter Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: '#1a1a28', borderRadius: 10, padding: '12px 14px', marginBottom: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#5a5a7a', pointerEvents: 'none' }}>🔍</span>
                  <input style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 11px 7px 28px', fontSize: 12, fontFamily: 'DM Sans, sans-serif', color: '#e8e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' }} placeholder="Search guest or email…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontFamily: 'DM Sans, sans-serif', color: '#e8e8f0', outline: 'none', flex: '1 1 140px', minWidth: 130 }} value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
                  <option value="">All Rooms</option>
                  {roomNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {hasFilters && (
                  <button onClick={clearFilters} style={{ background: '#12121a', border: '1px solid rgba(240,96,144,0.4)', borderRadius: 8, padding: '7px 14px', color: '#f06090', cursor: 'pointer', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', fontSize: 12 }}>✕ Clear</button>
                )}
                <span style={{ fontSize: 11, color: '#5a5a7a', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#5a5a7a' }}>
                    <div style={{ display: 'inline-block', width: 22, height: 22, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f0c060', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <div style={{ marginTop: 10, fontSize: 13 }}>Loading reservations…</div>
                  </div>
                ) : shown.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#5a5a7a' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{hasFilters ? '🔍' : activeTab === 'pending' ? '🎉' : '📋'}</div>
                    <div style={{ fontSize: 14 }}>{hasFilters ? 'No reservations match your filters.' : activeTab === 'pending' ? 'No pending requests!' : 'No confirmed reservations yet'}</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Guest','Room','Room No.','Check-in','Check-out','Payment','Status','Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#5a5a7a', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22', color: AVATAR_COLORS[i % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{r.pname?.charAt(0) || '?'}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{r.pname}</div>
                                <div style={{ fontSize: 11, color: '#5a5a7a', fontFamily: 'JetBrains Mono, monospace' }}>{r.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#9898b8', whiteSpace: 'nowrap' }}>{r.roomName}</td>
                          <td style={{ padding: '12px 14px', color: '#40e0c8', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{r.roomNumber || '—'}</td>
                          <td style={{ padding: '12px 14px', color: '#9898b8', whiteSpace: 'nowrap' }}>{fmtDate(r.checkIn)}</td>
                          <td style={{ padding: '12px 14px', color: '#9898b8', whiteSpace: 'nowrap' }}>{fmtDate(r.checkOut)}</td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12, color: '#9898b8' }}>{r.methodOfPayment || '—'}</div>
                            {r.deposit ? <div style={{ fontSize: 10, color: '#50d890' }}>Dep: ${r.deposit}</div> : null}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: r.status === 'booked' ? 'rgba(80,216,144,0.15)' : 'rgba(240,192,96,0.15)', color: r.status === 'booked' ? '#50d890' : '#f0c060' }}>
                              {r.status === 'booked' ? 'Booked' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {r.status !== 'booked' ? (
                                <>
                                  <button onClick={() => handleConfirm(r.id)} style={{ border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, background: 'rgba(80,216,144,0.15)', color: '#50d890', fontFamily: 'DM Sans, sans-serif' }}>Confirm</button>
                                  <button onClick={() => handleDelete(r.id)}  style={{ border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, background: 'rgba(240,96,144,0.15)', color: '#f06090', fontFamily: 'DM Sans, sans-serif' }}>Reject</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => openEdit(r)}        style={{ border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, background: 'rgba(64,224,200,0.12)', color: '#40e0c8', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
                                  <button onClick={() => generateBill(r)}    style={{ border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, background: 'rgba(144,128,240,0.12)', color: '#9080f0', fontFamily: 'DM Sans, sans-serif' }}>Receipt</button>
                                  <button onClick={() => handleDelete(r.id)} style={{ border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, background: 'rgba(240,96,144,0.15)', color: '#f06090', fontFamily: 'DM Sans, sans-serif' }}>Remove</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!loading && filtered.length > PAGE_SIZE && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px 2px', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: '#5a5a7a', fontFamily: 'JetBrains Mono, monospace' }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', color: page === 1 ? '#3a3a5a' : '#9898b8', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', color: page === totalPages ? '#3a3a5a' : '#9898b8', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ════════ ADD / EDIT MODAL ════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, width: '100%', maxWidth: 660, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0' }}>{isEditing ? '✏️ Edit Reservation' : '➕ Add Reservation'}</span>
              <button style={{ background: 'none', border: 'none', color: '#5a5a7a', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                <SectionDivider label="👤 Personal Information" />
                <FieldRow>
                  <Field label="Guest Name *"><input style={mi} value={pname} onChange={e => setPName(e.target.value)} required placeholder="Full name" /></Field>
                  <Field label="Phone *"><input style={mi} value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1 (xxx) xxx-xxxx" /></Field>
                </FieldRow>
                <Field label="Email *"><input style={mi} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="guest@email.com" /></Field>
                <Field label="Address"><input style={mi} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" /></Field>
                <FieldRow>
                  <Field label="City"><input style={mi} value={city} onChange={e => setCity(e.target.value)} placeholder="City" /></Field>
                  <Field label="Province / State"><input style={mi} value={province} onChange={e => setProvince(e.target.value)} placeholder="ON" /></Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Country"><input style={mi} value={country} onChange={e => setCountry(e.target.value)} placeholder="Canada" /></Field>
                  <Field label="Postal / Zip Code"><input style={mi} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="L3K 5V4" /></Field>
                </FieldRow>
                <Field label="Company"><input style={mi} value={company} onChange={e => setCompany(e.target.value)} placeholder="Optional" /></Field>

                <SectionDivider label="🪪 Identification & Vehicle" />
                <FieldRow>
                  <Field label="Driver's Licence No."><input style={mi} value={driverLicNo} onChange={e => setDriverLicNo(e.target.value)} /></Field>
                  <Field label="Date of Birth"><input type="date" style={mi} value={dob} onChange={e => setDob(e.target.value)} /></Field>
                </FieldRow>
                <Field label="Vehicle Plate #"><input style={mi} value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="ABC 1234" /></Field>

                <SectionDivider label="🛏️ Stay Details" />
                <FieldRow>
                  <Field label="Check-in *"><input type="date" style={mi} value={checkInDate ? new Date(checkInDate).toISOString().split('T')[0] : ''} onChange={e => setCheckInDate(new Date(e.target.value))} required /></Field>
                  <Field label="Check-out *"><input type="date" style={mi} value={checkOutDate ? new Date(checkOutDate).toISOString().split('T')[0] : ''} onChange={e => setCheckOutDate(new Date(e.target.value))} required /></Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Room Type *">
                    <select style={mi} value={selectedRoomId} onChange={e => { const sel = rooms.find(r => r.id === e.target.value); setSelectedRoomId(sel?.id || ''); setSelectedRoomName(sel?.name || ''); setRoomNumber(''); }} required>
                      <option value="">Select Room</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Room Number *">
                    <select style={{ ...mi, opacity: !selectedRoomName ? 0.5 : 1 }} value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required disabled={!selectedRoomName}>
                      <option value="">{selectedRoomName ? 'Select Number' : '— pick room first —'}</option>
                      {ALL_ROOM_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Adults *"><input type="number" min={1} style={mi} value={adults} onChange={e => setAdults(parseInt(e.target.value))} required /></Field>
                  <Field label="Kids"><input type="number" min={0} style={mi} value={kids} onChange={e => setKids(parseInt(e.target.value))} /></Field>
                </FieldRow>
                <Field label="# of Rooms"><input type="number" min={1} max={10} style={{ ...mi, maxWidth: 120 }} value={numberOfRooms} onChange={e => setNumberOfRooms(e.target.value)} /></Field>

                <SectionDivider label="💳 Payment & Deposit" />
                <Field label="Method of Payment">
                  <select style={mi} value={methodOfPayment} onChange={e => setMethodOfPayment(e.target.value)}>
                    <option value="">Select method…</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <FieldRow>
                  <Field label="Deposit ($)"><input type="number" min={0} step="0.01" style={mi} value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0.00" /></Field>
                  <Field label="Returned Deposit ($)"><input type="number" min={0} step="0.01" style={mi} value={returnedDeposit} onChange={e => setReturnedDeposit(e.target.value)} placeholder="0.00" /></Field>
                </FieldRow>
                <Field label="Clerk"><input style={mi} value={clerk} onChange={e => setClerk(e.target.value)} placeholder="Staff name" /></Field>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button type="button" style={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', color: '#9898b8', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ background: '#f0c060', color: '#0a0a0f', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Update' : 'Add Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ BILL MODAL ════════ */}
      {billModal && billDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0' }}>Guest Receipt</span>
              <button style={{ background: 'none', border: 'none', color: '#5a5a7a', fontSize: 22, cursor: 'pointer' }} onClick={() => setBillModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Guest', billDetails.guest],['Room', billDetails.roomName],['Room No.', billDetails.roomNumber],['Check-in', billDetails.checkIn],['Check-out', billDetails.checkOut],['Nights', billDetails.nights],['Rate', `$${billDetails.roomPrice.toFixed(2)}/night`],['Payment', billDetails.methodOfPayment || '—'],['Deposit', billDetails.deposit != null ? `$${Number(billDetails.deposit).toFixed(2)}` : '—'],['Returned', billDetails.returnedDeposit != null ? `$${Number(billDetails.returnedDeposit).toFixed(2)}` : '—'],['Clerk', billDetails.clerk || '—']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 12, color: '#5a5a7a' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'rgba(240,192,96,0.12)', border: '1px solid rgba(240,192,96,0.25)', borderRadius: 10, padding: '14px 16px', marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0' }}>Total</div>
                  <div style={{ fontSize: 12, color: '#5a5a7a', fontFamily: 'JetBrains Mono, monospace' }}>HST (13%): ${billDetails.hstAmount.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f0c060', fontFamily: 'JetBrains Mono, monospace' }}>${billDetails.totalAmount.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: '#5a5a7a' }}>CAD incl. tax</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button style={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', color: '#9898b8', borderRadius: 8, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} onClick={() => setBillModal(false)}>Close</button>
              <button style={{ background: '#f0c060', color: '#0a0a0f', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} onClick={sendBill} disabled={sendingEmail}>{sendingEmail ? 'Sending…' : '✉ Send to Guest'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminReservations;