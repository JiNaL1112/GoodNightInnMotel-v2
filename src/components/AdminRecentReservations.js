import React, { useContext, useEffect, useState } from 'react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RoomContext } from '../context/RoomContext';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AVATAR_COLORS = ['#f0c060','#40e0c8','#f06090','#9080f0','#50d890','#60b0f0'];
const ROOM_SLOTS = {
  'Queen Bed':      [101, 102, 103, 104, 105],
  'Two Queen Beds': [201, 202, 203, 204, 205],
  'King Bed':       [301, 302, 303, 304, 305],
  'Kitchenette':    [401, 402, 403, 404, 405],
};
const PAGE_SIZE = 8;
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'E-Transfer', 'Other'];

const SORT_COLS = {
  guest:    r => r.pname?.toLowerCase() || '',
  room:     r => r.roomName?.toLowerCase() || '',
  roomNo:   r => (r.roomNumber || '').toString().padStart(6, '0'),
  checkIn:  r => (r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn  || 0)).getTime(),
  checkOut: r => (r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0)).getTime(),
};

const getEffectiveStatus = (r) => {
  if (r.status === 'checked-out') return 'checked-out';
  if (r.status === 'booked') {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
    const coDay    = new Date(checkOut); coDay.setHours(0, 0, 0, 0);
    if (coDay < today) return 'checked-out';
    if (r.checkedInAt) return 'in-house';
    return 'upcoming';
  }
  return 'pending';
};

const SortArrow = ({ col, sortCol, sortDir }) => {
  const active = sortCol === col;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 5, gap: 1, verticalAlign: 'middle', opacity: active ? 1 : 0.3 }}>
      <span style={{ fontSize: 7, lineHeight: 1, color: active && sortDir === 'asc'  ? 'var(--gold)' : 'var(--text-3)' }}>▲</span>
      <span style={{ fontSize: 7, lineHeight: 1, color: active && sortDir === 'desc' ? 'var(--gold)' : 'var(--text-3)' }}>▼</span>
    </span>
  );
};

// ── Reusable field components for the modal ───────────────────────────────────
const FieldRow = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
);

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#5a5a7a' }}>{label}</label>
    {children}
  </div>
);

const SectionDivider = ({ label }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
    color: '#40e0c8', padding: '10px 0 6px',
    borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4,
  }}>{label}</div>
);

const AdminRecentReservations = () => {
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
  const [generatingPdf,  setGeneratingPdf]  = useState(false);
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

  const handleConfirm = async (id) => {
    await updateDoc(doc(db, 'reservations', id), { status: 'booked' });
    fetchReservations();
  };

  const handleCheckIn = async (r) => {
    if (!window.confirm(`Check in ${r.pname}?`)) return;
    await updateDoc(doc(db, 'reservations', r.id), { checkedInAt: new Date() });
    fetchReservations();
  };

  const handleCheckOut = async (r) => {
    if (!window.confirm(`Check out ${r.pname}?`)) return;
    await updateDoc(doc(db, 'reservations', r.id), { status: 'checked-out', checkedOutAt: new Date() });
    fetchReservations();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this reservation?')) return;
    await deleteDoc(doc(db, 'reservations', id));
    fetchReservations();
  };

  const openAdd = () => {
    setIsEditing(false); setEditTarget(null); setRoomNumber('');
    // Reset extended fields
    setAddress(''); setCity(''); setProvince(''); setCountry(''); setPostalCode('');
    setCompany(''); setDriverLicNo(''); setDob(''); setDeposit('');
    setReturnedDeposit(''); setMethodOfPayment(''); setPlateNumber('');
    setClerk(''); setNumberOfRooms(1);
    setShowModal(true);
  };

  const openEdit = (res) => {
    setIsEditing(true); setEditTarget(res);
    // Core
    setPName(res.pname); setEmail(res.email); setPhone(res.phone);
    setCheckInDate(res.checkIn?.toDate?.() || new Date());
    setCheckOutDate(res.checkOut?.toDate?.() || new Date());
    setAdults(res.adults); setKids(res.kids);
    setSelectedRoomId(res.roomId); setSelectedRoomName(res.roomName);
    setRoomNumber(res.roomNumber || '');
    // Extended
    setAddress(res.address || '');
    setCity(res.city || '');
    setProvince(res.province || '');
    setCountry(res.country || '');
    setPostalCode(res.postalCode || '');
    setCompany(res.company || '');
    setDriverLicNo(res.driverLicNo || '');
    setDob(res.dob || '');
    setDeposit(res.deposit != null ? String(res.deposit) : '');
    setReturnedDeposit(res.returnedDeposit != null ? String(res.returnedDeposit) : '');
    setMethodOfPayment(res.methodOfPayment || '');
    setPlateNumber(res.plateNumber || '');
    setClerk(res.clerk || '');
    setNumberOfRooms(res.numberOfRooms || 1);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const data = {
      // Core
      pname, email, phone, checkIn: checkInDate, checkOut: checkOutDate,
      adults, kids, roomId: selectedRoomId, roomName: selectedRoomName,
      roomNumber, status: 'booked',
      [isEditing ? 'updatedAt' : 'createdAt']: new Date(),
      // Extended
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
    const room = roomSnap.docs.map(d => ({ ...d.data(), id: d.id })).find(r => r.id === res.roomId);
    if (!room) return;
    const checkIn  = res.checkIn?.toDate  ? res.checkIn.toDate()  : new Date(res.checkIn);
    const checkOut = res.checkOut?.toDate ? res.checkOut.toDate() : new Date(res.checkOut);
    const nights    = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const roomTotal = room.price * nights;
    const accomTax  = roomTotal * 0.04;
    const subTotal  = roomTotal + accomTax;
    const hst       = subTotal * 0.13;
    const total     = subTotal + hst;
    setBillDetails({
      guest: res.pname, email: res.email, phone: res.phone,
      address: res.address, city: res.city, province: res.province,
      country: res.country, postalCode: res.postalCode,
      company: res.company, driverLicNo: res.driverLicNo, dob: res.dob,
      plateNumber: res.plateNumber,
      roomName: room.name, roomNumber: res.roomNumber || 'N/A',
      numberOfRooms: res.numberOfRooms || 1,
      checkIn: checkIn.toDateString(), checkOut: checkOut.toDateString(),
      nights, roomPrice: room.price, roomTotal, accomTax, subTotal,
      hstAmount: hst, totalAmount: total,
      deposit: res.deposit, returnedDeposit: res.returnedDeposit,
      methodOfPayment: res.methodOfPayment,
      clerk: res.clerk, adults: res.adults, kids: res.kids,
    });
    setBillModal(true);
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('receipt-printable');
    if (!el) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData   = canvas.toDataURL('image/png');
      const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight= pdf.internal.pageSize.getHeight();
      const imgWidth  = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yOffset   = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 10;
      pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight);
      const safeName = (billDetails.guest || 'guest').replace(/\s+/g, '_');
      const dateStr  = new Date().toISOString().slice(0, 10);
      pdf.save(`receipt_${safeName}_${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed.');
    } finally { setGeneratingPdf(false); }
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
        room_total: `$${billDetails.roomTotal.toFixed(2)}`,
        accom_tax: `$${billDetails.accomTax.toFixed(2)}`,
        subtotal: `$${billDetails.subTotal.toFixed(2)}`,
        hst: `$${billDetails.hstAmount.toFixed(2)}`,
        total: `$${billDetails.totalAmount.toFixed(2)}`,
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

  const handleExportExcel = async () => {
    if (sorted.length === 0) { alert('No records to export.'); return; }
    const roomSnap = await getDocs(collection(db, 'rooms'));
    const roomMap  = {};
    roomSnap.docs.forEach(d => { roomMap[d.id] = d.data(); });
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');
    const fmtD = (ts) => { if (!ts) return ''; const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('en-CA'); };
    const rows = sorted.map(r => {
      const room = roomMap[r.roomId];
      const price = room?.price ?? 0;
      const checkIn  = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn  || 0);
      const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
      const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
      const roomTotal = price * nights;
      const accomTax  = roomTotal * 0.04;
      const subTotal  = roomTotal + accomTax;
      const hst       = subTotal * 0.13;
      const total     = subTotal + hst;
      return {
        'Guest Name': r.pname || '', 'Email': r.email || '', 'Phone': r.phone || '',
        'Address': r.address || '', 'City': r.city || '', 'Province': r.province || '',
        'Country': r.country || '', 'Postal Code': r.postalCode || '',
        'Company': r.company || '', 'Driver Lic No.': r.driverLicNo || '',
        'DOB': r.dob || '', 'Plate #': r.plateNumber || '',
        'Room Type': r.roomName || '', 'Room No.': r.roomNumber || '',
        '# of Rooms': r.numberOfRooms || 1,
        'Adults': r.adults ?? '', 'Kids': r.kids ?? '',
        'Check-In': fmtD(r.checkIn), 'Check-Out': fmtD(r.checkOut),
        'Checked-Out At': fmtD(r.checkedOutAt), 'Nights': nights,
        'Rate/Night ($)': price, 'Room Total ($)': parseFloat(roomTotal.toFixed(2)),
        'Accom. Tax 4% ($)': parseFloat(accomTax.toFixed(2)),
        'Sub Total ($)': parseFloat(subTotal.toFixed(2)),
        'HST 13% ($)': parseFloat(hst.toFixed(2)),
        'Total Paid ($)': parseFloat(total.toFixed(2)),
        'Deposit ($)': r.deposit ?? '', 'Returned Deposit ($)': r.returnedDeposit ?? '',
        'Method of Payment': r.methodOfPayment || '',
        'Clerk': r.clerk || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservations');
    const dateTag = `_${new Date().toISOString().slice(0, 10)}`;
    XLSX.writeFile(wb, `reservations${dateTag}.xlsx`);
  };

  const TABS = [
    { id: 'pending',    label: '⏳ Pending',     count: pendingList.length,    activeColor: '#f0c060', activeBg: 'rgba(240,192,96,0.15)'  },
    { id: 'upcoming',   label: '🕐 Upcoming',    count: upcomingList.length,   activeColor: '#60b0f0', activeBg: 'rgba(96,176,240,0.15)'  },
    { id: 'inhouse',    label: '✅ In-house',    count: inHouseList.length,    activeColor: '#50d890', activeBg: 'rgba(80,216,144,0.12)'  },
    { id: 'checkedout', label: '🏁 Checked Out', count: checkedOutList.length, activeColor: '#40e0c8', activeBg: 'rgba(64,224,200,0.12)'  },
  ];

  const StatusBadge = ({ eff }) => {
    const map = {
      'pending':     { label: '⏳ Pending',     bg: 'rgba(240,192,96,0.12)',  color: '#f0c060' },
      'upcoming':    { label: '🕐 Upcoming',    bg: 'rgba(96,176,240,0.12)',  color: '#60b0f0' },
      'in-house':    { label: '✅ In-house',    bg: 'rgba(80,216,144,0.15)',  color: '#50d890' },
      'checked-out': { label: '🏁 Checked Out', bg: 'rgba(64,224,200,0.12)', color: '#40e0c8' },
    };
    const s = map[eff] || map['pending'];
    return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30`, whiteSpace: 'nowrap' }}>{s.label}</span>;
  };

  const ActionButtons = ({ r }) => {
    const eff = r._eff;
    if (eff === 'pending') return (
      <><button className="adm-btn adm-btn-confirm" onClick={() => handleConfirm(r.id)}>Confirm</button>
      <button className="adm-btn adm-btn-reject" onClick={() => handleDelete(r.id)}>Reject</button></>
    );
    if (eff === 'upcoming') return (
      <><button className="adm-btn" style={{ background: 'rgba(80,216,144,0.15)', color: '#50d890', fontWeight: 700, border: '1px solid rgba(80,216,144,0.3)', whiteSpace: 'nowrap' }} onClick={() => handleCheckIn(r)}>🏨 Check In</button>
      <button className="adm-btn adm-btn-edit" onClick={() => openEdit(r)}>Edit</button>
      <button className="adm-btn adm-btn-reject" onClick={() => handleDelete(r.id)}>Cancel</button></>
    );
    if (eff === 'in-house') return (
      <><button className="adm-btn" style={{ background: 'rgba(240,96,144,0.15)', color: '#f06090', fontWeight: 700, border: '1px solid rgba(240,96,144,0.3)', whiteSpace: 'nowrap' }} onClick={() => handleCheckOut(r)}>🏁 Check Out</button>
      <button className="adm-btn adm-btn-edit" onClick={() => openEdit(r)}>Edit</button>
      <button className="adm-btn adm-btn-bill" onClick={() => generateBill(r)}>Receipt</button></>
    );
    if (eff === 'checked-out') return (
      <><button className="adm-btn adm-btn-bill" onClick={() => generateBill(r)}>Receipt</button>
      <button className="adm-btn adm-btn-reject" onClick={() => handleDelete(r.id)}>Remove</button></>
    );
    return null;
  };

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

  // ── Modal input style ────────────────────────────────────────────────────────
  const mi = { background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#e8e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' };

  const tabInfo = {
    pending:    '⏳ Awaiting admin confirmation. Room is NOT blocked until confirmed.',
    upcoming:   '🕐 Confirmed bookings arriving in future. Click Check In when guest arrives.',
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

        {/* Tab info bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>ℹ</span><span>{tabInfo[activeTab]}</span>
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
          {activeTab === 'checkedout' && (
            <button onClick={handleExportExcel} style={{ ...inp, cursor: 'pointer', color: '#40e0c8', border: '1px solid rgba(64,224,200,0.35)', background: 'rgba(64,224,200,0.08)', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
              ⬇ Export Excel
            </button>
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
                  {staticTh('Payment')}
                  {staticTh('Status')}
                  {staticTh('Actions')}
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={r.id} style={{ opacity: r._eff === 'checked-out' ? 0.7 : 1 }}
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
                          {r.phone && <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text)' }}>{r.roomName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>{r.roomNumber || '—'}</td>
                    <td>{fmtDate(r.checkIn)}</td>
                    <td>{fmtDate(r.checkOut)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.adults}A {r.kids > 0 ? `${r.kids}K` : ''}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {r.methodOfPayment || '—'}
                      {r.deposit ? <div style={{ color: '#50d890', fontSize: 10 }}>Dep: ${r.deposit}</div> : null}
                    </td>
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

      {/* ════════════════════════════════════════════════════════
          ADD / EDIT MODAL — with all extended fields
      ════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#12121a', borderRadius: 18, width: '100%', maxWidth: 660, border: '1px solid rgba(255,255,255,0.12)', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#e8e8f0' }}>{isEditing ? '✏️ Edit Reservation' : '➕ Add Reservation'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5a5a7a', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ── Personal Info ── */}
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
                <Field label="Company (optional)"><input style={mi} value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" /></Field>

                {/* ── ID & Vehicle ── */}
                <SectionDivider label="🪪 Identification & Vehicle" />
                <FieldRow>
                  <Field label="Driver's Licence No."><input style={mi} value={driverLicNo} onChange={e => setDriverLicNo(e.target.value)} placeholder="Licence number" /></Field>
                  <Field label="Date of Birth"><input type="date" style={mi} value={dob} onChange={e => setDob(e.target.value)} /></Field>
                </FieldRow>
                <Field label="Vehicle Plate #"><input style={mi} value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="ABC 1234" /></Field>

                {/* ── Stay Details ── */}
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
                      {(ROOM_SLOTS[selectedRoomName] || []).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                </FieldRow>
                <FieldRow>
                  <Field label="Adults *"><input type="number" min={1} style={mi} value={adults} onChange={e => setAdults(parseInt(e.target.value))} required /></Field>
                  <Field label="Kids"><input type="number" min={0} style={mi} value={kids} onChange={e => setKids(parseInt(e.target.value))} /></Field>
                </FieldRow>
                <Field label="# of Rooms"><input type="number" min={1} max={10} style={{ ...mi, maxWidth: 120 }} value={numberOfRooms} onChange={e => setNumberOfRooms(e.target.value)} /></Field>

                {/* ── Payment & Deposit ── */}
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
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#1a1a28', color: '#9898b8', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#6b7280' : '#f0c060', color: '#0a0a0f', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                  {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          RECEIPT MODAL — matches physical form layout
      ════════════════════════════════════════════════════════ */}
      {billModal && billDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 520, border: '1px solid #e5e7eb', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', fontFamily: "'DM Sans', sans-serif" }}>

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
              <button onClick={() => setBillModal(false)} style={{ background: '#f1f0ed', border: '1px solid #e5e7eb', color: '#6b7280', width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
            </div>

            {/* ── Printable area ── */}
            <div id="receipt-printable" style={{ background: '#ffffff', padding: '0 0 4px' }}>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', padding: '22px 24px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌙</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>GoodNight Inn</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>664 Main St. West, Port Colborne, ON L3K5V4</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>905-835-1818 · www.goodnightinn.ca · manager@goodnightinn.ca</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Guest Registration Receipt</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{billDetails.guest}</div>
                    {billDetails.company && <div style={{ fontSize: 12, opacity: 0.8 }}>{billDetails.company}</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, opacity: 0.75 }}>
                    <div>HST# 833074875RT0001</div>
                    {billDetails.clerk && <div>Clerk: {billDetails.clerk}</div>}
                  </div>
                </div>
              </div>

              <div style={{ padding: '18px 24px' }}>

                {/* ── Grid 1: Stay Info ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    ['Room Type',    billDetails.roomName],
                    ['Room No.',     billDetails.roomNumber],
                    ['# of Rooms',   String(billDetails.numberOfRooms || 1)],
                    ['Check-in',     billDetails.checkIn],
                    ['Check-out',    billDetails.checkOut],
                    ['Nights',       String(billDetails.nights)],
                    ['Adults',       String(billDetails.adults || '')],
                    ['Kids',         String(billDetails.kids || 0)],
                    ['Rate/Night',   `$${billDetails.roomPrice.toFixed(2)}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#f8f7f4', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>

                {/* ── Guest Details ── */}
                <div style={{ background: '#f8f7f4', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6b7280', marginBottom: 10 }}>Guest Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
                    {[
                      ['Phone',          billDetails.phone],
                      ['Email',          billDetails.email],
                      ['Address',        [billDetails.address, billDetails.city, billDetails.province, billDetails.postalCode, billDetails.country].filter(Boolean).join(', ')],
                      ['Driver Lic No.', billDetails.driverLicNo],
                      ['Date of Birth',  billDetails.dob],
                      ['Plate #',        billDetails.plateNumber],
                    ].map(([label, val]) => val ? (
                      <div key={label}>
                        <span style={{ color: '#9ca3af', fontWeight: 600 }}>{label}: </span>
                        <span style={{ color: '#374151' }}>{val}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* ── Notice to Guests ── */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>
                  <strong>Notice to Guests:</strong> This property is owned, and management reserves the right to refuse service to anyone and will not be responsible for accidents or injury to our guests or loss of money, jewellery or valuable of any kind. We reserve the right to evict any persons being neglect or mishandling hotel property or any boisterous behaviour. Any items inadvertently misused or removed will be billed to your account. It is also understood that you are responsible for any charges incurred during your stay and for those who are realized after your departure.
                </div>

                {/* ── Billing Summary ── */}
                <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ background: '#f8f7f4', padding: '9px 16px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6b7280' }}>Billing Summary</span>
                  </div>
                  {[
                    [`Room Total (${billDetails.nights} × $${billDetails.roomPrice.toFixed(2)})`, `$${billDetails.roomTotal.toFixed(2)}`],
                    ['Accommodation Tax (4%)', `$${billDetails.accomTax.toFixed(2)}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#fff' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #dbeafe', background: '#eff6ff' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>Sub Total</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>${billDetails.subTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>HST (13%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>${billDetails.hstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Total (CAD)</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>All taxes included</div>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>${billDetails.totalAmount.toFixed(2)}</div>
                  </div>

                  {/* Deposit row */}
                  {(billDetails.deposit || billDetails.returnedDeposit) && (
                    <div style={{ background: '#f8f7f4', padding: '10px 16px', display: 'flex', gap: 24 }}>
                      {billDetails.deposit != null && (
                        <div><span style={{ fontSize: 11, color: '#6b7280' }}>Deposit: </span><span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>${Number(billDetails.deposit).toFixed(2)}</span></div>
                      )}
                      {billDetails.returnedDeposit != null && (
                        <div><span style={{ fontSize: 11, color: '#6b7280' }}>Returned: </span><span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>${Number(billDetails.returnedDeposit).toFixed(2)}</span></div>
                      )}
                      {billDetails.methodOfPayment && (
                        <div><span style={{ fontSize: 11, color: '#6b7280' }}>Payment: </span><span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{billDetails.methodOfPayment}</span></div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Signature ── */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>Guest's Signature</div>
                    <div style={{ borderBottom: '1px solid #d1d5db', height: 32 }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', lineHeight: 1.6 }}>
                    664 Main St. W, Port Colborne, ON L3K 5V4<br />
                    905-835-1818 · manager@goodnightinn.ca
                  </div>
                </div>
              </div>
            </div>
            {/* ── End printable area ── */}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, padding: '14px 24px 20px', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
              <button onClick={handleDownloadPdf} disabled={generatingPdf} style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', background: generatingPdf ? '#f1f0ed' : '#f8f7f4', color: generatingPdf ? '#9ca3af' : '#374151', cursor: generatingPdf ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {generatingPdf ? '⏳ Generating…' : '⬇ Download PDF'}
              </button>
              <button onClick={sendBill} disabled={sendingEmail} style={{ flex: 2, padding: '11px 14px', borderRadius: 10, border: 'none', background: sendingEmail ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: sendingEmail ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {sendingEmail ? '⏳ Sending…' : '📧 Email Receipt to Guest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminRecentReservations;