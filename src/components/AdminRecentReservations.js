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

// ── Sort value extractors ─────────────────────────────────────────
const SORT_COLS = {
  guest:    r => r.pname?.toLowerCase() || '',
  room:     r => r.roomName?.toLowerCase() || '',
  roomNo:   r => (r.roomNumber || '').toString().padStart(6, '0'),
  checkIn:  r => (r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn  || 0)).getTime(),
  checkOut: r => (r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0)).getTime(),
};

// ── Option B: compute effective display status from dates ─────────
// Returns 'checked-out' if Firestore status is 'booked' but checkOut < today
// This means old seed data + past bookings are automatically "checked out" visually
const getEffectiveStatus = (r) => {
  if (r.status === 'checked-out') return 'checked-out';
  if (r.status === 'booked') {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
    checkOut.setHours(0, 0, 0, 0);
    if (checkOut < today) return 'checked-out';
    return 'booked';
  }
  // ✅ Everything else (null, undefined, 'pending', any other value) → pending
  return 'pending';
};

// ── Sort arrows ───────────────────────────────────────────────────
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

  // ── Filter state ──────────────────────────────────────────────
  const [search,         setSearch]         = useState('');
  const [filterRoom,     setFilterRoom]     = useState('');
  const [filterFrom,     setFilterFrom]     = useState('');
  const [filterTo,       setFilterTo]       = useState('');

  // ── Sort state ────────────────────────────────────────────────
  const [sortCol,        setSortCol]        = useState('checkIn');
  const [sortDir,        setSortDir]        = useState('desc');

  // ── Pagination ────────────────────────────────────────────────
  const [page,           setPage]           = useState(1);

  useEffect(() => { fetchReservations(); }, []);
  useEffect(() => { setPage(1); }, [activeTab, search, filterRoom, filterFrom, filterTo, sortCol, sortDir]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const q    = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally       { setLoading(false); }
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleConfirm = async (id) => {
    await updateDoc(doc(db, 'reservations', id), { status: 'booked' });
    fetchReservations();
  };

  // ── Option A: manual Check Out — sets status: 'checked-out' in Firestore ──
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

  const openAdd = () => {
    setIsEditing(false); setEditTarget(null); setRoomNumber(''); setShowModal(true);
  };

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
    e.preventDefault();
    setSaving(true);
    const data = {
      pname, email, phone,
      checkIn: checkInDate, checkOut: checkOutDate,
      adults, kids,
      roomId: selectedRoomId, roomName: selectedRoomName,
      roomNumber, status: 'booked',
      [isEditing ? 'updatedAt' : 'createdAt']: new Date(),
    };
    try {
      if (isEditing && editTarget?.id)
        await updateDoc(doc(db, 'reservations', editTarget.id), data);
      else
        await addDoc(collection(db, 'reservations'), data);
      setShowModal(false); fetchReservations();
    } catch (err) { console.error(err); }
    finally       { setSaving(false); }
  };

  const generateBill = async (res) => {
    const roomSnap = await getDocs(collection(db, 'rooms'));
    const roomList = roomSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    const room     = roomList.find(r => r.id === res.roomId);
    if (!room) return;
    const checkIn  = res.checkIn?.toDate  ? res.checkIn.toDate()  : new Date(res.checkIn);
    const checkOut = res.checkOut?.toDate ? res.checkOut.toDate() : new Date(res.checkOut);
    const nights   = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const base     = room.price * nights;
    const hst      = base * 0.13;
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
        guest: billDetails.guest, room_name: billDetails.roomName,
        room_number: billDetails.roomNumber, check_in: billDetails.checkIn,
        check_out: billDetails.checkOut, nights: billDetails.nights,
        rate:     `$${billDetails.roomPrice.toFixed(2)}`,
        subtotal: `$${billDetails.baseAmount.toFixed(2)}`,
        hst:      `$${billDetails.hstAmount.toFixed(2)}`,
        total:    `$${billDetails.totalAmount.toFixed(2)}`,
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

  // ── Derived pipeline ─────────────────────────────────────────
  // Apply Option B: tag each reservation with its effective status
  const tagged = reservations.map(r => ({ ...r, _effectiveStatus: getEffectiveStatus(r) }));

  const pending    = tagged.filter(r => r._effectiveStatus === 'pending');
  const confirmed  = tagged.filter(r => r._effectiveStatus === 'booked');       // in-house today / future
  const checkedOut = tagged.filter(r => r._effectiveStatus === 'checked-out');  // past or manually checked out

  const tabList =
    activeTab === 'pending'     ? pending    :
    activeTab === 'confirmed'   ? confirmed  :
    checkedOut;

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

  // ── Tab config ────────────────────────────────────────────────
  const TABS = [
    { id: 'pending',    label: `⏳ Pending`,     count: pending.length,    activeColor: 'var(--gold)',   activeBg: 'rgba(240,192,96,0.15)'  },
    { id: 'confirmed',  label: `✅ Confirmed`,   count: confirmed.length,  activeColor: 'var(--green)',  activeBg: 'rgba(80,216,144,0.12)'  },
    { id: 'checkedout', label: `🏁 Checked Out`, count: checkedOut.length, activeColor: 'var(--teal)',   activeBg: 'rgba(64,224,200,0.12)'  },
  ];

  // ── Sortable <th> ─────────────────────────────────────────────
  const SortTh = ({ col, label }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
        letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap',
        cursor: 'pointer', userSelect: 'none', transition: 'color 0.15s',
        color: sortCol === col ? 'var(--gold)' : 'var(--text-3)',
      }}
      onMouseEnter={e => { if (sortCol !== col) e.currentTarget.style.color = 'var(--text-2)'; }}
      onMouseLeave={e => { if (sortCol !== col) e.currentTarget.style.color = 'var(--text-3)'; }}
    >
      {label}<SortArrow col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );

  const staticTh = (label) => (
    <th key={label} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
      {label}
    </th>
  );

  const filterInputSt = {
    background: 'var(--ink-3)', border: '1px solid var(--border-2)',
    borderRadius: 8, padding: '7px 11px', fontSize: 12,
    fontFamily: 'var(--font-disp)', color: 'var(--text)', outline: 'none',
  };

  return (
    <>
      <div className="adm-panel" style={{ marginBottom: 20 }}>

        {/* ── Tabs + Add Button ── */}
        <div className="adm-panel-head">
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none', cursor: 'pointer',
                  padding: '6px 16px', borderRadius: 6,
                  fontFamily: 'var(--font-disp)', fontSize: 12, fontWeight: 700,
                  letterSpacing: 1, textTransform: 'uppercase',
                  background: activeTab === tab.id ? tab.activeBg : 'transparent',
                  color:      activeTab === tab.id ? tab.activeColor : 'var(--text-3)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          {activeTab === 'confirmed' && (
            <button className="adm-btn adm-btn-primary adm-btn" onClick={openAdd}>+ Add Booking</button>
          )}
        </div>

        {/* ── Option B notice bar (only on confirmed tab) ── */}
        {activeTab === 'confirmed' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(64,224,200,0.06)', border: '1px solid rgba(64,224,200,0.15)',
            borderRadius: 8, padding: '8px 14px', marginBottom: 14,
            fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)',
          }}>
            <span>ℹ</span>
            <span>Showing active bookings only — guests whose check-out date has passed are automatically moved to <strong>Checked Out</strong>.</span>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
          background: 'var(--ink-3)', borderRadius: 10,
          padding: '12px 14px', marginBottom: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-3)', pointerEvents: 'none' }}>🔍</span>
            <input
              style={{ ...filterInputSt, paddingLeft: 28, width: '100%', boxSizing: 'border-box' }}
              placeholder="Search guest or email…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select style={{ ...filterInputSt, flex: '1 1 140px', minWidth: 130 }} value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
            <option value="">All Rooms</option>
            {roomNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 150px', minWidth: 140 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>From</span>
            <input type="date" style={{ ...filterInputSt, flex: 1 }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 150px', minWidth: 140 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>To</span>
            <input type="date" style={{ ...filterInputSt, flex: 1 }} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} style={{ ...filterInputSt, border: '1px solid var(--rose)', color: 'var(--rose)', background: 'rgba(240,96,144,0.08)', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', padding: '7px 14px' }}>
              ✕ Clear
            </button>
          )}

          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            {sorted.length} result{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="adm-table-wrap">
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading reservations…</span></div>
          ) : shown.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty-icon">
                {hasFilters ? '🔍' : activeTab === 'pending' ? '🎉' : activeTab === 'confirmed' ? '📋' : '🏁'}
              </div>
              <div className="adm-empty-text">
                {hasFilters
                  ? 'No reservations match your filters.'
                  : activeTab === 'pending'
                  ? 'No pending requests!'
                  : activeTab === 'confirmed'
                  ? 'No active stays right now.'
                  : 'No checked-out guests yet.'}
              </div>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <SortTh col="guest"    label="Guest"     />
                  <SortTh col="room"     label="Room"      />
                  <SortTh col="roomNo"   label="Room No."  />
                  <SortTh col="checkIn"  label="Check-in"  />
                  <SortTh col="checkOut" label="Check-out" />
                  {staticTh('Guests')}
                  {staticTh('Status')}
                  {staticTh('Actions')}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => {
                  const effStatus = r._effectiveStatus;
                  const isCheckedOut = effStatus === 'checked-out';
                  const isAutoCheckedOut = isCheckedOut && r.status !== 'checked-out'; // derived, not in Firestore yet

                  return (
                    <tr key={r.id} style={{ opacity: isCheckedOut ? 0.75 : 1 }}>
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

                      {/* ── Status badge ── */}
                      <td>
                        {effStatus === 'checked-out' ? (
                          <div>
                            <span className="adm-badge" style={{ background: 'rgba(64,224,200,0.12)', color: 'var(--teal)' }}>
                              🏁 Checked Out
                            </span>
                            {/* Small "auto" label if derived from date, not yet saved to Firestore */}
                            {isAutoCheckedOut && (
                              <div style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                                auto-detected
                              </div>
                            )}
                          </div>
                        ) : effStatus === 'booked' ? (
                          <span className="adm-badge booked">✅ In-house</span>
                        ) : (
                          <span className="adm-badge pending">⏳ Pending</span>
                        )}
                      </td>

                      {/* ── Actions ── */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {effStatus === 'pending' && (
                            <>
                              <button className="adm-btn adm-btn-confirm" onClick={() => handleConfirm(r.id)}>Confirm</button>
                              <button className="adm-btn adm-btn-reject"  onClick={() => handleDelete(r.id)}>Reject</button>
                            </>
                          )}

                          {effStatus === 'booked' && (
                            <>
                              {/* Option A: Check Out button — only shown when checkOut date is today or past */}
                              {(() => {
                                const today    = new Date(); today.setHours(0,0,0,0);
                                const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
                                checkOut.setHours(0,0,0,0);
                                return checkOut <= today ? (
                                  <button
                                    className="adm-btn"
                                    style={{ background: 'rgba(64,224,200,0.15)', color: 'var(--teal)', fontWeight: 700 }}
                                    onClick={() => handleCheckOut(r)}
                                  >
                                    🏁 Check Out
                                  </button>
                                ) : null;
                              })()}
                              <button className="adm-btn adm-btn-edit"   onClick={() => openEdit(r)}>Edit</button>
                              <button className="adm-btn adm-btn-bill"   onClick={() => generateBill(r)}>Receipt</button>
                              <button className="adm-btn adm-btn-reject" onClick={() => handleDelete(r.id)}>Remove</button>
                            </>
                          )}

                          {effStatus === 'checked-out' && (
                            <>
                              <button className="adm-btn adm-btn-bill"   onClick={() => generateBill(r)}>Receipt</button>
                              <button className="adm-btn adm-btn-reject" onClick={() => handleDelete(r.id)}>Remove</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 4px 2px', borderTop: '1px solid var(--border)', marginTop: 12,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnStyle(page === 1)}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                  acc.push(p); return acc;
                }, [])
                .map((p, idx) =>
                  p === '…'
                    ? <span key={`e-${idx}`} style={{ fontSize: 12, color: 'var(--text-3)', padding: '0 4px' }}>…</span>
                    : <button key={p} onClick={() => setPage(p)} style={pageNumStyle(p === page)}>{p}</button>
                )
              }
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnStyle(page === totalPages)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-head">
              <span className="adm-modal-title">{isEditing ? 'Edit Reservation' : 'Add Reservation'}</span>
              <button className="adm-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="adm-modal-body">
                <div className="adm-field-row">
                  <div className="adm-field">
                    <label className="adm-field-label">Guest Name</label>
                    <input className="adm-input" value={pname} onChange={e => setPName(e.target.value)} required placeholder="Full Name" />
                  </div>
                  <div className="adm-field">
                    <label className="adm-field-label">Phone</label>
                    <input className="adm-input" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1 (xxx) xxx-xxxx" />
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-field-label">Email</label>
                  <input className="adm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="guest@email.com" />
                </div>
                <div className="adm-field-row">
                  <div className="adm-field">
                    <label className="adm-field-label">Check-in</label>
                    <input className="adm-input" type="date"
                      value={checkInDate ? new Date(checkInDate).toISOString().split('T')[0] : ''}
                      onChange={e => setCheckInDate(new Date(e.target.value))} required />
                  </div>
                  <div className="adm-field">
                    <label className="adm-field-label">Check-out</label>
                    <input className="adm-input" type="date"
                      value={checkOutDate ? new Date(checkOutDate).toISOString().split('T')[0] : ''}
                      onChange={e => setCheckOutDate(new Date(e.target.value))} required />
                  </div>
                </div>
                <div className="adm-field-row">
                  <div className="adm-field">
                    <label className="adm-field-label">Adults</label>
                    <input className="adm-input" type="number" min={1} value={adults} onChange={e => setAdults(parseInt(e.target.value))} required />
                  </div>
                  <div className="adm-field">
                    <label className="adm-field-label">Kids</label>
                    <input className="adm-input" type="number" min={0} value={kids} onChange={e => setKids(parseInt(e.target.value))} required />
                  </div>
                </div>
                <div className="adm-field-row">
                  <div className="adm-field">
  <label className="adm-field-label">Room</label>
  <select className="adm-input" value={selectedRoomId} onChange={e => {
    const sel = rooms.find(r => r.id === e.target.value);
    setSelectedRoomId(sel?.id || '');
    setSelectedRoomName(sel?.name || '');
    setRoomNumber(''); // reset when room type changes
  }} required>
    <option value="">Select Room</option>
    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
  </select>
</div>
<div className="adm-field">
  <label className="adm-field-label">Room Number</label>
  <select className="adm-input" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required disabled={!selectedRoomName}>
    <option value="">{selectedRoomName ? 'Select Number' : '— pick room first —'}</option>
    {(ROOM_SLOTS[selectedRoomName] || []).map(n => (
      <option key={n} value={n}>{n}</option>
    ))}
  </select>
</div>
                </div>
              </div>
              <div className="adm-modal-foot">
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bill Modal ── */}
      {billModal && billDetails && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal-head">
              <span className="adm-modal-title">Guest Receipt</span>
              <button className="adm-modal-close" onClick={() => setBillModal(false)}>×</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-bill">
                {[
                  ['Guest',     billDetails.guest],
                  ['Room',      billDetails.roomName],
                  ['Room No.',  billDetails.roomNumber],
                  ['Check-in',  billDetails.checkIn],
                  ['Check-out', billDetails.checkOut],
                  ['Nights',    billDetails.nights],
                  ['Rate',      `$${billDetails.roomPrice.toFixed(2)}/night`],
                ].map(([k, v]) => (
                  <div className="adm-bill-row" key={k}>
                    <span className="adm-bill-key">{k}</span>
                    <span className="adm-bill-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="adm-bill-total" style={{ marginTop: 14 }}>
                <div>
                  <div className="adm-bill-total-label">Subtotal</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    HST (13%): ${billDetails.hstAmount.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="adm-bill-total-val">${billDetails.totalAmount.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>CAD incl. tax</div>
                </div>
              </div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn adm-btn-ghost"   onClick={() => setBillModal(false)}>Close</button>
              <button className="adm-btn adm-btn-primary" onClick={sendBill} disabled={sendingEmail}>
                {sendingEmail ? 'Sending…' : '✉ Send to Guest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Pagination styles ─────────────────────────────────────────────
const pageBtnStyle = (disabled) => ({
  background: 'var(--ink-3)', border: '1px solid var(--border-2)',
  color: disabled ? 'var(--text-3)' : 'var(--text-2)',
  borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700,
  fontFamily: 'var(--font-disp)', cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
});

const pageNumStyle = (active) => ({
  background: active ? 'var(--gold-dim)' : 'var(--ink-3)',
  border: `1px solid ${active ? 'var(--gold-glow)' : 'var(--border-2)'}`,
  color: active ? 'var(--gold)' : 'var(--text-3)',
  borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700,
  fontFamily: 'var(--font-mono)', cursor: 'pointer', minWidth: 30, transition: 'all 0.15s',
});

export default AdminRecentReservations;