import React, { useContext, useEffect, useState } from 'react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RoomContext } from '../context/RoomContext';
import emailjs from '@emailjs/browser';

const AVATAR_COLORS = ['#f0c060','#40e0c8','#f06090','#9080f0','#50d890','#60b0f0'];

const AdminRecentReservations = () => {
  const {
    rooms,
    pname, setPName, email, setEmail, phone, setPhone,
    checkInDate, setCheckInDate, checkOutDate, setCheckOutDate,
    adults, setAdults, kids, setKids,
    selectedRoomId, setSelectedRoomId,
    selectedRoomName, setSelectedRoomName,
  } = useContext(RoomContext);

  const [reservations,       setReservations]       = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [showModal,          setShowModal]          = useState(false);
  const [isEditing,          setIsEditing]          = useState(false);
  const [editTarget,         setEditTarget]         = useState(null);
  const [roomNumber,         setRoomNumber]         = useState('');
  const [billModal,          setBillModal]          = useState(false);
  const [billDetails,        setBillDetails]        = useState(null);
  const [activeTab,          setActiveTab]          = useState('pending'); // 'pending' | 'confirmed'
  const [saving,             setSaving]             = useState(false);
  const [sendingEmail,       setSendingEmail]       = useState(false);

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const q    = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally       { setLoading(false); }
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
    const total    = base + hst;

    setBillDetails({
      guest: res.pname, roomName: room.name, roomNumber: res.roomNumber || 'N/A',
      checkIn: checkIn.toDateString(), checkOut: checkOut.toDateString(),
      nights, roomPrice: room.price, baseAmount: base, hstAmount: hst, totalAmount: total,
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
        rate: `$${billDetails.roomPrice.toFixed(2)}`,
        subtotal: `$${billDetails.baseAmount.toFixed(2)}`,
        hst: `$${billDetails.hstAmount.toFixed(2)}`,
        total: `$${billDetails.totalAmount.toFixed(2)}`,
        to_email: billDetails.email,
      }, '8nzBG6xAhz4eIyVij');
      alert('Receipt sent!');
    } catch (err) { alert('Send failed'); }
    finally { setSendingEmail(false); }
  };

  const pending   = reservations.filter(r => r.status !== 'booked');
  const confirmed = reservations.filter(r => r.status === 'booked');
  const shown     = activeTab === 'pending' ? pending : confirmed;

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <div className="adm-panel-head">
          <div style={{ display: 'flex', gap: 0 }}>
            {['pending','confirmed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  border: 'none', cursor: 'pointer',
                  padding: '6px 16px', borderRadius: 6,
                  fontFamily: 'var(--font-disp)', fontSize: 12, fontWeight: 700,
                  letterSpacing: 1, textTransform: 'uppercase',
                  background: activeTab === tab ? (tab === 'pending' ? 'rgba(240,192,96,0.15)' : 'rgba(80,216,144,0.12)') : 'transparent',
                  color: activeTab === tab ? (tab === 'pending' ? 'var(--gold)' : 'var(--green)') : 'var(--text-3)',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'pending' ? `⏳ Pending (${pending.length})` : `✅ Confirmed (${confirmed.length})`}
              </button>
            ))}
          </div>
          {activeTab === 'confirmed' && (
            <button className="adm-btn-primary adm-btn" onClick={openAdd}>+ Add Booking</button>
          )}
        </div>

        <div className="adm-table-wrap">
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading reservations…</span></div>
          ) : shown.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty-icon">{activeTab === 'pending' ? '🎉' : '📋'}</div>
              <div className="adm-empty-text">
                {activeTab === 'pending' ? 'No pending requests!' : 'No confirmed reservations yet'}
              </div>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Room No.</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <div className="adm-guest-cell">
                        <div
                          className="adm-avatar"
                          style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22',
                                   color: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                        >
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
                    <td>
                      <span className={`adm-badge ${r.status === 'booked' ? 'booked' : 'pending'}`}>
                        {r.status === 'booked' ? 'Booked' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {r.status !== 'booked' ? (
                          <>
                            <button className="adm-btn adm-btn-confirm" onClick={() => handleConfirm(r.id)}>Confirm</button>
                            <button className="adm-btn adm-btn-reject"  onClick={() => handleDelete(r.id)}>Reject</button>
                          </>
                        ) : (
                          <>
                            <button className="adm-btn adm-btn-edit"    onClick={() => openEdit(r)}>Edit</button>
                            <button className="adm-btn adm-btn-bill"    onClick={() => generateBill(r)}>Receipt</button>
                            <button className="adm-btn adm-btn-reject"  onClick={() => handleDelete(r.id)}>Remove</button>
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
      </div>

      {/* Add / Edit Modal */}
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
                    <select className="adm-select" value={selectedRoomId} onChange={e => {
                      const sel = rooms.find(r => r.id === e.target.value);
                      setSelectedRoomId(sel?.id || ''); setSelectedRoomName(sel?.name || '');
                    }} required>
                      <option value="">Select Room</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label className="adm-field-label">Room Number</label>
                    <input className="adm-input" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required placeholder="e.g. 101" />
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

      {/* Bill Modal */}
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
              <button className="adm-btn adm-btn-ghost"    onClick={() => setBillModal(false)}>Close</button>
              <button className="adm-btn adm-btn-primary"  onClick={sendBill} disabled={sendingEmail}>
                {sendingEmail ? 'Sending…' : '✉ Send to Guest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRecentReservations;
