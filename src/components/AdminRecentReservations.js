import React, { useContext, useEffect, useState } from 'react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RoomContext } from '../context/RoomContext';
import emailjs from '@emailjs/browser';

const AVATAR_COLORS = ['#f0c060','#40e0c8','#f06090','#9080f0','#50d890','#60b0f0'];
const ROOM_SLOTS = {
  'Queen Bed':      [101, 102, 103, 104, 105],
  'Two Queen Beds': [201, 202, 203, 204, 205],
  'King Bed':       [301, 302, 303, 304, 305],
  'Kitchenette':    [401, 402, 403, 404, 405],
};
const PAGE_SIZE = 8;

const SORT_COLS = {
  guest:    r => r.pname?.toLowerCase() || '',
  room:     r => r.roomName?.toLowerCase() || '',
  roomNo:   r => (r.roomNumber || '').toString().padStart(6, '0'),
  checkIn:  r => (r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn  || 0)).getTime(),
  checkOut: r => (r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0)).getTime(),
};

// ── 4-state status engine ─────────────────────────────────────────────────────
// 'pending'     → waiting for admin to confirm
// 'upcoming'    → confirmed, but checkIn date is still in the future
// 'in-house'    → admin manually checked them in (checkedInAt exists) OR checkIn ≤ today and NOT yet checked out
// 'checked-out' → manually checked out, or checkOut date has passed
const getEffectiveStatus = (r) => {
  if (r.status === 'checked-out') return 'checked-out';

  if (r.status === 'booked') {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const checkIn  = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn  || 0);
    const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
    const ciDay    = new Date(checkIn);  ciDay.setHours(0, 0, 0, 0);
    const coDay    = new Date(checkOut); coDay.setHours(0, 0, 0, 0);

    // Auto-move to checked-out if checkout date has passed
    if (coDay < today) return 'checked-out';

    // If admin manually checked them in → in-house
    if (r.checkedInAt) return 'in-house';

    // Check-in day has arrived but admin hasn't checked them in yet → still upcoming
    // (room is NOT physically occupied until admin clicks Check In)
    if (ciDay > today) return 'upcoming';

    // checkIn date is today or past but no manual check-in yet
    // We keep it as 'upcoming' so room isn't shown as occupied until admin acts
    return 'upcoming';
  }

  return 'pending';
};

// ── Sort arrows ───────────────────────────────────────────────────────────────
const SortArrow = ({ col, sortCol, sortDir }) => {
  const active = sortCol === col;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 5, gap: 1, verticalAlign: 'middle', opacity: active ? 1 : 0.3 }}>
      <span style={{ fontSize: 7, lineHeight: 1, color: active && sortDir === 'asc'  ? 'var(--gold)' : 'var(--text-3)' }}>▲</span>
      <span style={{ fontSize: 7, lineHeight: 1, color: active && sortDir === 'desc' ? 'var(--gold)' : 'var(--text-3)' }}>▼</span>
    </span>
  );
};

const AdminRecentReservations = () => {
  const {
    rooms,
    pname, setPName, email, setEmail, phone, setPhone,
    checkInDate, setCheckInDate, checkOutDate, setCheckOutDate,
    adults, setAdults, kids, setKids,
    selectedRoomId, setSelectedRoomId,
    selectedRoomName, setSelectedRoomName,
  } = useContext(RoomContext);

  const [reservations,   setReservations]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [roomNumber,     setRoomNumber]     = useState('');
  const [billModal,      setBillModal]      = useState(false);
  const [billDetails,    setBillDetails]    = useState(null);
  const [activeTab,      setActiveTab]      = useState('pending');
  const [saving,         setSaving]         = useState(false);
  const [sendingEmail,   setSendingEmail]   = useState(false);
  const [search,         setSearch]         = useState('');
  const [filterRoom,     setFilterRoom]     = useState('');
  const [filterFrom,     setFilterFrom]     = useState('');
  const [filterTo,       setFilterTo]       = useState('');
  const [sortCol,        setSortCol]        = useState('checkIn');
  const [sortDir,        setSortDir]        = useState('asc');
  const [page,           setPage]           = useState(1);

  useEffect(() => { fetchReservations(); }, []);
  useEffect(() => { setPage(1); }, [activeTab, search, filterRoom, filterFrom, filterTo, sortCol, sortDir]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc')));
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Pending → confirmed upcoming
  const handleConfirm = async (id) => {
    await updateDoc(doc(db, 'reservations', id), { status: 'booked' });
    fetchReservations();
  };

  // Admin marks guest as physically arrived → sets checkedInAt, moves to In-house
  const handleCheckIn = async (r) => {
    if (!window.confirm(`Check in ${r.pname}? This confirms the guest has arrived and the room is now occupied.`)) return;
    await updateDoc(doc(db, 'reservations', r.id), { checkedInAt: new Date() });
    fetchReservations();
  };

  // Admin marks guest as departed → sets status: checked-out
  const handleCheckOut = async (r) => {
    if (!window.confirm(`Check out ${r.pname}? This will mark the reservation as completed.`)) return;
    await updateDoc(doc(db, 'reservations', r.id), {
      status: 'checked-out',
      checkedOutAt: new Date(),
    });
    fetchReservations();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this reservation?')) return;
    await deleteDoc(doc(db, 'reservations', id));
    fetchReservations();
  };

  const openAdd = () => { setIsEditing(false); setEditTarget(null); setRoomNumber(''); setShowModal(true); };

  const openEdit = (res) => {
    setIsEditing(true); setEditTarget(res);
    setPName(res.pname); setEmail(res.email); setPhone(res.phone);
    setCheckInDate(res.checkIn?.toDate?.() || new Date());
    setCheckOutDate(res.checkOut?.toDate?.() || new Date());
    setAdults(res.adults); setKids(res.kids);
    setSelectedRoomId(res.roomId); setSelectedRoomName(res.roomName);
    setRoomNumber(res.roomNumber || '');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const data = {
      pname, email, phone, checkIn: checkInDate, checkOut: checkOutDate,
      adults, kids, roomId: selectedRoomId, roomName: selectedRoomName,
      roomNumber, status: 'booked',
      [isEditing ? 'updatedAt' : 'createdAt']: new Date(),
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
    const room = roomSnap.docs.map(d => ({ ...d.data(), id: d.id })).find(r => r.id === res.roomId);
    if (!room) return;
    const checkIn  = res.checkIn?.toDate  ? res.checkIn.toDate()  : new Date(res.checkIn);
    const checkOut = res.checkOut?.toDate ? res.checkOut.toDate() : new Date(res.checkOut);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const base = room.price * nights;
    const hst  = base * 0.13;
    setBillDetails({
      guest: res.pname, roomName: room.name, roomNumber: res.roomNumber || 'N/A',
      checkIn: checkIn.toDateString(), checkOut: checkOut.toDateString(),
      nights, roomPrice: room.price, baseAmount: base, hstAmount: hst, totalAmount: base + hst,
      email: res.email,
    });
    setBillModal(true);
  };

  const sendBill = async () => {
    if (!billDetails) return;
    setSendingEmail(true);
    try {
      await emailjs.send('service_d3cy1e9', 'template_11t5n5a', {
        guest: billDetails.guest, room_name: billDetails.roomName, room_number: billDetails.roomNumber,
        check_in: billDetails.checkIn, check_out: billDetails.checkOut, nights: billDetails.nights,
        rate: `$${billDetails.roomPrice.toFixed(2)}`, subtotal: `$${billDetails.baseAmount.toFixed(2)}`,
        hst: `$${billDetails.hstAmount.toFixed(2)}`, total: `$${billDetails.totalAmount.toFixed(2)}`,
        to_email: billDetails.email,
      }, '8nzBG6xAhz4eIyVij');
      alert('Receipt sent!');
    } catch (err) { alert('Send failed'); }
    finally { setSendingEmail(false); }
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Tag each reservation ──────────────────────────────────────────────────
  const tagged = reservations.map(r => ({ ...r, _eff: getEffectiveStatus(r) }));

  const pendingList    = tagged.filter(r => r._eff === 'pending');
  const upcomingList   = tagged.filter(r => r._eff === 'upcoming');
  const inHouseList    = tagged.filter(r => r._eff === 'in-house');
  const checkedOutList = tagged.filter(r => r._eff === 'checked-out');

  const tabList =
    activeTab === 'pending'    ? pendingList    :
    activeTab === 'upcoming'   ? upcomingList   :
    activeTab === 'inhouse'    ? inHouseList    :
    checkedOutList;

  const roomNames = [...new Set(reservations.map(r => r.roomName).filter(Boolean))].sort();

  const filtered = tabList.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.pname?.toLowerCase().includes(q) && !r.email?.toLowerCase().includes(q)) return false;
    if (filterRoom && r.roomName !== filterRoom) return false;
    if (filterFrom) {
      const ci = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn);
      if (ci < new Date(filterFrom)) return false;
    }
    if (filterTo) {
      const co = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
      if (co > new Date(filterTo + 'T23:59:59')) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const getter = SORT_COLS[sortCol];
    if (!getter) return 0;
    const av = getter(a), bv = getter(b);
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const shown      = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || filterRoom || filterFrom || filterTo;
  const clearFilters = () => { setSearch(''); setFilterRoom(''); setFilterFrom(''); setFilterTo(''); };

  // ── Tab config — 4 tabs ────────────────────────────────────────────────────
  const TABS = [
    { id: 'pending',    label: '⏳ Pending',     count: pendingList.length,    activeColor: '#f0c060', activeBg: 'rgba(240,192,96,0.15)'  },
    { id: 'upcoming',   label: '🕐 Upcoming',    count: upcomingList.length,   activeColor: '#60b0f0', activeBg: 'rgba(96,176,240,0.15)'  },
    { id: 'inhouse',    label: '✅ In-house',    count: inHouseList.length,    activeColor: '#50d890', activeBg: 'rgba(80,216,144,0.12)'  },
    { id: 'checkedout', label: '🏁 Checked Out', count: checkedOutList.length, activeColor: '#40e0c8', activeBg: 'rgba(64,224,200,0.12)'  },
  ];

  // ── Status badge ───────────────────────────────────────────────────────────
  const StatusBadge = ({ eff }) => {
    const map = {
      'pending':     { label: '⏳ Pending',     bg: 'rgba(240,192,96,0.12)',  color: '#f0c060' },
      'upcoming':    { label: '🕐 Upcoming',    bg: 'rgba(96,176,240,0.12)',  color: '#60b0f0' },
      'in-house':    { label: '✅ In-house',    bg: 'rgba(80,216,144,0.15)',  color: '#50d890' },
      'checked-out': { label: '🏁 Checked Out', bg: 'rgba(64,224,200,0.12)', color: '#40e0c8' },
    };
    const s = map[eff] || map['pending'];
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11,
        fontWeight: 700, background: s.bg, color: s.color,
        border: `1px solid ${s.color}30`, whiteSpace: 'nowrap',
      }}>{s.label}</span>
    );
  };

  // ── Action buttons per status ──────────────────────────────────────────────
  const ActionButtons = ({ r }) => {
    const eff = r._eff;
    if (eff === 'pending') return (
      <>
        <button className="adm-btn adm-btn-confirm" onClick={() => handleConfirm(r.id)}>Confirm</button>
        <button className="adm-btn adm-btn-reject"  onClick={() => handleDelete(r.id)}>Reject</button>
      </>
    );
    if (eff === 'upcoming') return (
      <>
        {/* Check In button — always visible for upcoming so admin can act any time on/after arrival day */}
        <button
          className="adm-btn"
          style={{ background: 'rgba(80,216,144,0.15)', color: '#50d890', fontWeight: 700, border: '1px solid rgba(80,216,144,0.3)', whiteSpace: 'nowrap' }}
          onClick={() => handleCheckIn(r)}
        >
          🏨 Check In
        </button>
        <button className="adm-btn adm-btn-edit"   onClick={() => openEdit(r)}>Edit</button>
        <button className="adm-btn adm-btn-reject"  onClick={() => handleDelete(r.id)}>Cancel</button>
      </>
    );
    if (eff === 'in-house') return (
      <>
        <button
          className="adm-btn"
          style={{ background: 'rgba(240,96,144,0.15)', color: '#f06090', fontWeight: 700, border: '1px solid rgba(240,96,144,0.3)', whiteSpace: 'nowrap' }}
          onClick={() => handleCheckOut(r)}
        >
          🏁 Check Out
        </button>
        <button className="adm-btn adm-btn-edit" onClick={() => openEdit(r)}>Edit</button>
        <button className="adm-btn adm-btn-bill" onClick={() => generateBill(r)}>Receipt</button>
      </>
    );
    if (eff === 'checked-out') return (
      <>
        <button className="adm-btn adm-btn-bill"   onClick={() => generateBill(r)}>Receipt</button>
        <button className="adm-btn adm-btn-reject"  onClick={() => handleDelete(r.id)}>Remove</button>
      </>
    );
    return null;
  };

  // ── Sortable th ────────────────────────────────────────────────────────────
  const SortTh = ({ col, label }) => (
    <th onClick={() => handleSort(col)} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', color: sortCol === col ? 'var(--gold)' : 'var(--text-3)' }}>
      {label}<SortArrow col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );
  const staticTh = (label) => (
    <th style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{label}</th>
  );

  const inp = { background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontFamily: 'var(--font-disp)', color: 'var(--text)', outline: 'none' };
  const pageBtnSt = (dis) => ({ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--ink-3)', color: dis ? 'var(--text-3)' : 'var(--text)', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 11, opacity: dis ? 0.5 : 1 });

  // Info text per tab
  const tabInfo = {
    pending:    '⏳ Awaiting admin confirmation. Room is NOT blocked until confirmed.',
    upcoming:   '🕐 Confirmed bookings arriving in future. Room is reserved but NOT yet occupied — click Check In when guest arrives.',
    inhouse:    '✅ Guest is currently in the room. Room is occupied.',
    checkedout: '🏁 Completed stays.',
  };

  return (
    <>
      <div className="adm-panel" style={{ marginBottom: 20 }}>

        {/* ── Tabs + Add Button ── */}
        <div className="adm-panel-head">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 6,
                fontFamily: 'var(--font-disp)', fontSize: 12, fontWeight: 700,
                letterSpacing: 1, textTransform: 'uppercase',
                background: activeTab === tab.id ? tab.activeBg : 'transparent',
                color:      activeTab === tab.id ? tab.activeColor : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          {(activeTab === 'upcoming' || activeTab === 'inhouse') && (
            <button className="adm-btn adm-btn-primary" onClick={openAdd}>+ Add Booking</button>
          )}
        </div>

        {/* ── Tab info bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>ℹ</span>
          <span>{tabInfo[activeTab]}</span>
        </div>

        {/* ── Filter Bar ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: 'var(--ink-2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-3)', pointerEvents: 'none' }}>🔍</span>
            <input style={{ ...inp, paddingLeft: 28, width: '100%', boxSizing: 'border-box' }} placeholder="Search guest or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select style={{ ...inp, flex: '1 1 140px', minWidth: 130 }} value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
            <option value="">All Rooms</option>
            {roomNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 150px', minWidth: 140 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>From</span>
            <input type="date" style={{ ...inp, flex: 1 }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 150px', minWidth: 140 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>To</span>
            <input type="date" style={{ ...inp, flex: 1 }} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} style={{ ...inp, cursor: 'pointer', color: '#f06090', border: '1px solid rgba(240,96,144,0.3)' }}>✕ Clear</button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading reservations…</span></div>
          ) : shown.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty-icon">{hasFilters ? '🔍' : TABS.find(t => t.id === activeTab)?.label.split(' ')[0]}</div>
              <div className="adm-empty-text">
                {hasFilters ? 'No reservations match your filters.'
                  : activeTab === 'pending'    ? 'No pending requests — all clear!'
                  : activeTab === 'upcoming'   ? 'No upcoming bookings.'
                  : activeTab === 'inhouse'    ? 'No guests currently in-house.'
                  : 'No checked-out guests yet.'}
              </div>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <SortTh col="guest"    label="Guest"    />
                  <SortTh col="room"     label="Room"     />
                  <SortTh col="roomNo"   label="Room No." />
                  <SortTh col="checkIn"  label="Check-in" />
                  <SortTh col="checkOut" label="Check-out"/>
                  {staticTh('Guests')}
                  {staticTh('Status')}
                  {staticTh('Actions')}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={r.id}
                    style={{ opacity: r._eff === 'checked-out' ? 0.7 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td>
                      <div className="adm-guest-cell">
                        <div className="adm-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22', color: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                          {r.pname?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="adm-guest-name">{r.pname}</div>
                          <div className="adm-guest-email">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text)' }}>{r.roomName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>{r.roomNumber || '—'}</td>
                    <td>{fmtDate(r.checkIn)}</td>
                    <td>{fmtDate(r.checkOut)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.adults}A {r.kids > 0 ? `${r.kids}K` : ''}</td>
                    <td><StatusBadge eff={r._eff} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <ActionButtons r={r} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px 2px', borderTop: '1px solid var(--border)', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnSt(page === 1)}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx-1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                .map((p, idx) => p === '…'
                  ? <span key={`e${idx}`} style={{ color: 'var(--text-3)', fontSize: 11, padding: '0 4px' }}>…</span>
                  : <button key={p} onClick={() => setPage(p)} style={{ ...pageBtnSt(false), background: page === p ? 'var(--gold)' : 'var(--ink-3)', color: page === p ? '#000' : 'var(--text)', fontWeight: page === p ? 700 : 400 }}>{p}</button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnSt(page === totalPages)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--ink-1)', borderRadius: 16, width: '100%', maxWidth: 540, border: '1px solid var(--border-2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{isEditing ? 'Edit Booking' : 'Add Booking'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleFormSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Guest Name', pname, setPName, 'text'], ['Email', email, setEmail, 'email'], ['Phone', phone, setPhone, 'tel']].map(([label, val, setter, type]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <input required type={type} value={val} onChange={e => setter(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', ...inp }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Check-in', checkInDate, setCheckInDate], ['Check-out', checkOutDate, setCheckOutDate]].map(([label, val, setter]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                    <input required type="date" value={val ? new Date(val).toISOString().split('T')[0] : ''} onChange={e => setter(new Date(e.target.value))} style={{ width: '100%', boxSizing: 'border-box', ...inp }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Room Type</div>
                  <select required value={selectedRoomId} onChange={e => { const sel = rooms.find(r => r.id === e.target.value); setSelectedRoomId(sel?.id || ''); setSelectedRoomName(sel?.name || ''); setRoomNumber(''); }} style={{ width: '100%', ...inp }}>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Room Number</div>
                  <select required value={roomNumber} onChange={e => setRoomNumber(e.target.value)} disabled={!selectedRoomName} style={{ width: '100%', ...inp, opacity: !selectedRoomName ? 0.5 : 1 }}>
                    <option value="">{selectedRoomName ? 'Select Number' : '— pick room first —'}</option>
                    {(ROOM_SLOTS[selectedRoomName] || []).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Adults', adults, setAdults, 1], ['Kids', kids, setKids, 0]].map(([label, val, setter, min]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                    <input required type="number" min={min} value={val} onChange={e => setter(parseInt(e.target.value))} style={{ width: '100%', boxSizing: 'border-box', ...inp }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {billModal && billDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--ink-1)', borderRadius: 16, width: '100%', maxWidth: 420, border: '1px solid var(--border-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Guest Receipt</span>
              <button onClick={() => setBillModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {[['Guest', billDetails.guest], ['Room', billDetails.roomName], ['Room No.', billDetails.roomNumber], ['Check-in', billDetails.checkIn], ['Check-out', billDetails.checkOut], ['Nights', billDetails.nights], ['Rate/night', `$${billDetails.roomPrice.toFixed(2)}`], ['Subtotal', `$${billDetails.baseAmount.toFixed(2)}`], ['HST (13%)', `$${billDetails.hstAmount.toFixed(2)}`]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 16, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--gold)' }}>${billDetails.totalAmount.toFixed(2)}</span>
              </div>
              <button onClick={sendBill} disabled={sendingEmail} style={{ marginTop: 20, width: '100%', padding: 11, borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: sendingEmail ? 'not-allowed' : 'pointer', fontSize: 14, opacity: sendingEmail ? 0.7 : 1 }}>
                {sendingEmail ? 'Sending…' : '📧 Email Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRecentReservations;