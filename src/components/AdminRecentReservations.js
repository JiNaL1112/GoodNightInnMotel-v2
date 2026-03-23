import React, { useContext, useEffect, useState } from 'react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  addDoc, query, orderBy, writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RoomContext } from '../context/RoomContext';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AVATAR_COLORS = ['#f0c060','#40e0c8','#f06090','#9080f0','#50d890','#60b0f0'];
const ALL_ROOM_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 1);
const PAGE_SIZE = 8;
const PAYMENT_METHODS = ['Credit Card', 'Debit Card'];

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
  const [deletingAll,    setDeletingAll]    = useState(false);
  // Progress state for the export+delete operation
  const [exportProgress, setExportProgress] = useState({ active: false, current: 0, total: 0, stage: '' });

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

  const handleSort     = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };
  const handleCheckIn  = async (r)  => { if (!window.confirm(`Check in ${r.pname}?`)) return; await updateDoc(doc(db, 'reservations', r.id), { checkedInAt: new Date() }); fetchReservations(); };
  const handleCheckOut = async (r)  => { if (!window.confirm(`Check out ${r.pname}?`)) return; await updateDoc(doc(db, 'reservations', r.id), { status: 'checked-out', checkedOutAt: new Date() }); fetchReservations(); };
  const handleDelete   = async (id) => { if (!window.confirm('Remove this reservation?')) return; await deleteDoc(doc(db, 'reservations', id)); fetchReservations(); };

  const handleConfirm = async (id) => {
    await updateDoc(doc(db, 'reservations', id), { status: 'booked' });
    const reservation = reservations.find(r => r.id === id);
    if (reservation?.email) {
      try {
        const checkIn  = reservation.checkIn?.toDate  ? reservation.checkIn.toDate()  : new Date(reservation.checkIn);
        const checkOut = reservation.checkOut?.toDate ? reservation.checkOut.toDate() : new Date(reservation.checkOut);
        const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
        await emailjs.send('service_kbo1u2f', 'template_sfskmym', {
          to_name:      reservation.pname       || 'Guest',
          to_email:     reservation.email,
          room_name:    reservation.roomName     || 'Room',
          room_number:  reservation.roomNumber   || 'TBD',
          check_in:     checkIn.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
          check_out:    checkOut.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
          nights,
          nights_plural:  nights === 1 ? '' : 's',
          adults:         reservation.adults ?? 1,
          kids_line:      parseInt(reservation.kids) > 0 ? `, ${reservation.kids} Kids` : '',
        }, 'bQHXnSt39Rw-xzwlP');
      } catch (err) { console.error('Confirmation email failed:', err); }
    }
    fetchReservations();
  };

  const openAdd = () => {
    setIsEditing(false); setEditTarget(null); setRoomNumber('');
    setAddress(''); setCity(''); setProvince(''); setCountry(''); setPostalCode('');
    setCompany(''); setDriverLicNo(''); setDob(''); setDeposit('');
    setReturnedDeposit(''); setMethodOfPayment(''); setPlateNumber('');
    setClerk(''); setNumberOfRooms(1);
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
    setAddress(res.address || '');         setCity(res.city || '');
    setProvince(res.province || '');       setCountry(res.country || '');
    setPostalCode(res.postalCode || '');   setCompany(res.company || '');
    setDriverLicNo(res.driverLicNo || ''); setDob(res.dob || '');
    setDeposit(res.deposit != null ? String(res.deposit) : '');
    setReturnedDeposit(res.returnedDeposit != null ? String(res.returnedDeposit) : '');
    setMethodOfPayment(res.methodOfPayment || ''); setPlateNumber(res.plateNumber || '');
    setClerk(res.clerk || '');             setNumberOfRooms(res.numberOfRooms || 1);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
    const roomPrice    = selectedRoom?.price ?? null;
    const data = {
      pname, email, phone, checkIn: checkInDate, checkOut: checkOutDate,
      adults, kids, roomId: selectedRoomId, roomName: selectedRoomName,
      roomNumber, status: 'booked', roomPrice,
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
    try {
      const roomSnap = await getDocs(collection(db, 'rooms'));
      const allRooms = roomSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      const bd = await buildBillDetails(res, allRooms);
      setBillDetails(bd);
      setBillModal(true);
    } catch (err) {
      console.error('generateBill error:', err);
      alert('Failed to load receipt. Please try again.');
    }
  };

  // ── Helper: build bill details from a reservation + rooms list ───────────
  const buildBillDetails = async (res, allRooms) => {
    let room = allRooms.find(r => r.id === res.roomId);
    if (!room && res.roomName) {
      room = allRooms.find(r => r.name?.toLowerCase().trim() === res.roomName?.toLowerCase().trim());
    }
    const roomPrice =
      room?.price != null   ? Number(room.price)     :
      res.roomPrice != null  ? Number(res.roomPrice)  : 0;
    const roomName = room?.name ?? res.roomName ?? 'Unknown Room';
    const checkIn  = res.checkIn?.toDate  ? res.checkIn.toDate()  : new Date(res.checkIn  || Date.now());
    const checkOut = res.checkOut?.toDate ? res.checkOut.toDate() : new Date(res.checkOut || Date.now());
    const nights    = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const roomTotal = roomPrice * nights;
    const accomTax  = roomTotal * 0.04;
    const subTotal  = roomTotal + accomTax;
    const hst       = subTotal * 0.13;
    return {
      guest: res.pname, email: res.email, phone: res.phone,
      address: res.address, city: res.city, province: res.province,
      country: res.country, postalCode: res.postalCode,
      company: res.company, driverLicNo: res.driverLicNo, dob: res.dob,
      plateNumber: res.plateNumber, roomName, roomNumber: res.roomNumber || 'N/A',
      numberOfRooms: res.numberOfRooms || 1,
      checkIn:   checkIn.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
      checkOut:  checkOut.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }),
      nights, roomPrice, roomTotal, accomTax, subTotal,
      hstAmount: hst, totalAmount: subTotal + hst,
      deposit: res.deposit, returnedDeposit: res.returnedDeposit,
      methodOfPayment: res.methodOfPayment, clerk: res.clerk,
      adults: res.adults, kids: res.kids,
    };
  };

  // ── Helper: build the receipt HTML string (self-contained, no React) ──────
  const buildReceiptHTML = (bd) => {
    const rcTd  = 'padding:4px 0;color:#9ca3af;font-size:11px;white-space:nowrap;';
    const rcVal = 'padding:4px 0;text-align:right;font-weight:600;color:#1a1a1a;font-size:11px;';
    const row   = (k, v) => `<tr><td style="${rcTd}">${k}</td><td style="${rcVal}">${v}</td></tr>`;
    return `
<div style="background:#ffffff;width:680px;font-family:Arial,sans-serif;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <!-- Header -->
  <div style="background:#1e3a5f;padding:13px 18px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:16px;">🌙</div>
      <div>
        <div style="font-weight:700;font-size:14px;color:#fff;">GoodNight Inn</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:1px;">664 Main St. W, Port Colborne, ON · 905-835-1818 · HST# 833074875RT0001</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Receipt</div>
      <div style="font-size:11px;color:#fff;font-weight:600;margin-top:2px;">${bd.createdAt}</div>
    </div>
  </div>
  <!-- Guest bar -->
  <div style="background:#f8f7f4;border-bottom:1px solid #e5e7eb;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Guest</div>
      <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-top:1px;">${bd.guest || ''}</div>
      <div style="font-size:10px;color:#6b7280;margin-top:1px;">${[bd.email, bd.phone].filter(Boolean).join(' · ')}</div>
      ${bd.company ? `<div style="font-size:10px;color:#6b7280;">${bd.company}</div>` : ''}
    </div>
    ${bd.clerk ? `<div style="text-align:right;"><div style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Clerk</div><div style="font-size:11px;font-weight:600;color:#374151;margin-top:1px;">${bd.clerk}</div></div>` : ''}
  </div>
  <!-- Body -->
  <div style="padding:12px 18px;">
    <!-- Two columns -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <!-- Stay -->
      <div style="background:#f8f7f4;border:1px solid #e5e7eb;border-radius:7px;padding:10px 12px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:7px;">Stay Details</div>
        <table style="width:100%;border-collapse:collapse;"><tbody>
          ${row('Room Type', bd.roomName)}
          ${row('Room No.', bd.roomNumber)}
          ${row('# of Rooms', bd.numberOfRooms || 1)}
          ${row('Check-in', bd.checkIn)}
          ${row('Check-out', bd.checkOut)}
          ${row('Nights', bd.nights)}
          ${row('Guests', `${bd.adults}${parseInt(bd.kids) > 0 ? `, ${bd.kids} kids` : ''}`)}
          ${row('Rate / Night', `$${Number(bd.roomPrice).toFixed(2)}`)}
        </tbody></table>
      </div>
      <!-- Guest -->
      <div style="background:#f8f7f4;border:1px solid #e5e7eb;border-radius:7px;padding:10px 12px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:7px;">Guest Details</div>
        <table style="width:100%;border-collapse:collapse;"><tbody>
          ${bd.address     ? row('Address',    [bd.address, bd.city, bd.province].filter(Boolean).join(', ')) : ''}
          ${bd.postalCode  ? row('Postal',     bd.postalCode)  : ''}
          ${bd.country     ? row('Country',    bd.country)     : ''}
          ${bd.driverLicNo ? row('Driver Lic.',bd.driverLicNo) : ''}
          ${bd.dob         ? row('DOB',        bd.dob)         : ''}
          ${bd.plateNumber ? row('Plate #',    bd.plateNumber) : ''}
          ${bd.methodOfPayment ? row('Payment', bd.methodOfPayment) : ''}
        </tbody></table>
      </div>
    </div>
    <!-- Notice -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:7px 10px;margin-bottom:10px;font-size:9px;color:#92400e;line-height:1.5;">
      <strong>Notice to Guests:</strong> Management reserves the right to refuse service. Not responsible for accidents, injury, or loss of valuables. Guests are responsible for all charges incurred during and after their stay.
    </div>
    <!-- Billing -->
    <div style="border:1px solid #e5e7eb;border-radius:7px;overflow:hidden;margin-bottom:10px;">
      <div style="background:#f8f7f4;padding:6px 12px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Billing Summary</span>
      </div>
      <table style="width:100%;border-collapse:collapse;"><tbody>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:6px 12px;font-size:11px;color:#374151;">Room Total (${bd.nights} &times; $${Number(bd.roomPrice).toFixed(2)})</td>
          <td style="padding:6px 12px;text-align:right;font-weight:600;font-size:11px;color:#1a1a1a;">$${Number(bd.roomTotal).toFixed(2)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:6px 12px;font-size:11px;color:#374151;">Accommodation Tax (4%)</td>
          <td style="padding:6px 12px;text-align:right;font-weight:600;font-size:11px;color:#1a1a1a;">$${Number(bd.accomTax).toFixed(2)}</td>
        </tr>
        <tr style="border-bottom:1px solid #dbeafe;background:#eff6ff;">
          <td style="padding:6px 12px;font-size:11px;font-weight:700;color:#1e3a5f;">Sub Total</td>
          <td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px;color:#1e3a5f;">$${Number(bd.subTotal).toFixed(2)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:6px 12px;font-size:11px;color:#374151;">HST (13%)</td>
          <td style="padding:6px 12px;text-align:right;font-weight:600;font-size:11px;color:#1a1a1a;">$${Number(bd.hstAmount).toFixed(2)}</td>
        </tr>
        <tr style="background:#1e3a5f;">
          <td style="padding:10px 12px;">
            <div style="font-size:12px;font-weight:700;color:#fff;">Total (CAD)</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:1px;">All taxes included</div>
          </td>
          <td style="padding:10px 12px;text-align:right;font-size:22px;font-weight:800;color:#fff;font-family:monospace;">$${Number(bd.totalAmount).toFixed(2)}</td>
        </tr>
      </tbody></table>
      ${(bd.deposit != null || bd.returnedDeposit != null || bd.methodOfPayment) ? `
      <div style="background:#f8f7f4;padding:6px 12px;display:flex;gap:20px;flex-wrap:wrap;font-size:10px;">
        ${bd.deposit != null ? `<span><span style="color:#9ca3af;">Deposit: </span><span style="font-weight:600;color:#1a1a1a;">$${Number(bd.deposit).toFixed(2)}</span></span>` : ''}
        ${bd.returnedDeposit != null ? `<span><span style="color:#9ca3af;">Returned: </span><span style="font-weight:600;color:#16a34a;">$${Number(bd.returnedDeposit).toFixed(2)}</span></span>` : ''}
        ${bd.methodOfPayment ? `<span><span style="color:#9ca3af;">Method: </span><span style="font-weight:600;color:#1a1a1a;">${bd.methodOfPayment}</span></span>` : ''}
      </div>` : ''}
    </div>
    <!-- Signature -->
    <div style="display:flex;align-items:flex-end;gap:16px;">
      <div style="flex:1;">
        <div style="font-size:9px;color:#9ca3af;margin-bottom:3px;">Guest's Signature</div>
        <div style="border-bottom:1px solid #d1d5db;height:26px;"></div>
      </div>
      <div style="font-size:9px;color:#9ca3af;text-align:right;line-height:1.6;">
        664 Main St. W, Port Colborne, ON L3K 5V4<br/>
        905-835-1818 · manager@goodnightinn.ca
      </div>
    </div>
  </div>
</div>`;
  };

  // ── Helper: render receipt HTML into a PDF blob (off-screen) ─────────────
  const generateReceiptPdfBlob = async (bd) => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-9999;background:#fff;padding:0;margin:0;';
    container.innerHTML = buildReceiptHTML(bd);
    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 150));
    const el = container.firstElementChild;
    try {
      const canvas = await html2canvas(el, {
        scale: 2.2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
        width: el.scrollWidth, height: el.scrollHeight,
        windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
        x: 0, y: 0, scrollX: 0, scrollY: 0,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const margin  = 10;
      const printW  = pageW - margin * 2;
      const totalH  = (canvas.height * printW) / canvas.width;
      const usableH = pageH - margin * 2;
      if (totalH <= usableH) {
        pdf.addImage(imgData, 'PNG', margin, (pageH - totalH) / 2, printW, totalH);
      } else {
        const pxPerMm = canvas.width / printW;
        const sliceH  = usableH * pxPerMm;
        let yPx = 0, pageIdx = 0;
        while (yPx < canvas.height) {
          const thisSlice = Math.min(sliceH, canvas.height - yPx);
          const sc = document.createElement('canvas');
          sc.width = canvas.width; sc.height = Math.ceil(thisSlice);
          const ctx = sc.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sc.width, sc.height);
          ctx.drawImage(canvas, 0, yPx, canvas.width, thisSlice, 0, 0, canvas.width, thisSlice);
          if (pageIdx > 0) pdf.addPage();
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, printW, thisSlice / pxPerMm);
          yPx += thisSlice; pageIdx++;
        }
      }
      return pdf.output('blob');
    } finally {
      document.body.removeChild(container);
    }
  };

  // ── Helper: fallback blob download (anchor click) ────────────────────────
  const downloadBlobFallback = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // ── Helper: save a blob directly into a directory handle (subfolder-aware)
  // folderHandle  = FileSystemDirectoryHandle (the root the user picked)
  // subfolderName = e.g. 'Export-data' or null for root
  // filename      = the file name to write
  // blob          = Blob | ArrayBuffer
  const saveToFolder = async (folderHandle, subfolderName, filename, blob) => {
    let targetDir = folderHandle;
    if (subfolderName) {
      targetDir = await folderHandle.getDirectoryHandle(subfolderName, { create: true });
    }
    const fileHandle = await targetDir.getFileHandle(filename, { create: true });
    const writable   = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  };

  // ── Helper: check if File System Access API is available ─────────────────
  const hasFSAPI = () => typeof window.showDirectoryPicker === 'function';

  // ── Core export helper (Excel only) ──────────────────────────────────────
  const buildExcelWorkbook = async (recordsToExport) => {
    const roomSnap = await getDocs(collection(db, 'rooms'));
    const roomMap  = {};
    roomSnap.docs.forEach(d => { roomMap[d.id] = d.data(); });

    const fmtD = (ts) => {
      if (!ts) return '';
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-CA');
    };

    const rows = recordsToExport.map(r => {
      let room = roomMap[r.roomId];
      if (!room && r.roomName) {
        room = Object.values(roomMap).find(rm =>
          rm.name?.toLowerCase().trim() === r.roomName?.toLowerCase().trim()
        );
      }
      const price = room?.price != null ? Number(room.price)
                  : r.roomPrice  != null ? Number(r.roomPrice)
                  : 0;
      const ci     = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn  || 0);
      const co     = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
      const nights = Math.max(1, Math.ceil((co - ci) / (1000 * 60 * 60 * 24)));
      const roomTotal = parseFloat((price * nights).toFixed(2));
      const accomTax  = parseFloat((roomTotal * 0.04).toFixed(2));
      const subTotal  = parseFloat((roomTotal + accomTax).toFixed(2));
      const hst       = parseFloat((subTotal * 0.13).toFixed(2));
      const total     = parseFloat((subTotal + hst).toFixed(2));
      const statusLabel =
        r._eff === 'pending'     ? 'Pending'     :
        r._eff === 'upcoming'    ? 'Upcoming'    :
        r._eff === 'in-house'    ? 'In-House'    :
        r._eff === 'checked-out' ? 'Checked Out' : r.status || '';
      return {
        'Status':               statusLabel,
        'Guest Name':           r.pname          || '',
        'Email':                r.email          || '',
        'Phone':                r.phone          || '',
        'Address':              r.address        || '',
        'City':                 r.city           || '',
        'Province':             r.province       || '',
        'Country':              r.country        || '',
        'Postal Code':          r.postalCode     || '',
        'Company':              r.company        || '',
        'Driver Lic No.':       r.driverLicNo    || '',
        'DOB':                  r.dob            || '',
        'Plate #':              r.plateNumber    || '',
        'Room Type':            r.roomName       || '',
        'Room No.':             r.roomNumber     || '',
        '# of Rooms':           Number(r.numberOfRooms) || 1,
        'Adults':               r.adults         ?? '',
        'Kids':                 r.kids           ?? '',
        'Check-In':             fmtD(r.checkIn),
        'Check-Out':            fmtD(r.checkOut),
        'Checked-Out At':       fmtD(r.checkedOutAt),
        'Nights':               nights,
        'Rate/Night ($)':       price,
        'Room Total ($)':       roomTotal,
        'Accom. Tax 4% ($)':    accomTax,
        'Sub Total ($)':        subTotal,
        'HST 13% ($)':          hst,
        'Total Paid ($)':       total,
        'Deposit ($)':          r.deposit           != null ? Number(r.deposit)         : '',
        'Returned Deposit ($)': r.returnedDeposit   != null ? Number(r.returnedDeposit) : '',
        'Method of Payment':    r.methodOfPayment   || '',
        'Clerk':                r.clerk             || '',
      };
    });

    const SUM_COLS = [
      '# of Rooms', 'Adults', 'Kids', 'Nights',
      'Rate/Night ($)', 'Room Total ($)', 'Accom. Tax 4% ($)',
      'Sub Total ($)', 'HST 13% ($)', 'Total Paid ($)',
      'Deposit ($)', 'Returned Deposit ($)',
    ];
    const headers = Object.keys(rows[0]);
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');
    const ws   = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb   = XLSX.utils.book_new();
    const firstDataRow = 2;
    const lastDataRow  = 1 + rows.length;
    const totalsRow    = lastDataRow + 1;
    const colLetter = (idx) => {
      let letter = ''; let n = idx + 1;
      while (n > 0) { const rem = (n - 1) % 26; letter = String.fromCharCode(65 + rem) + letter; n = Math.floor((n - 1) / 26); }
      return letter;
    };
    ws[`A${totalsRow}`] = { t: 's', v: 'TOTALS' };
    headers.forEach((h, colIdx) => {
      if (!SUM_COLS.includes(h)) return;
      const col = colLetter(colIdx);
      ws[`${col}${totalsRow}`] = { t: 'n', f: `SUM(${col}${firstDataRow}:${col}${lastDataRow})` };
    });
    const range = XLSX.utils.decode_range(ws['!ref']);
    range.e.r  = totalsRow - 1;
    ws['!ref'] = XLSX.utils.encode_range(range);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Reservations');
    return { XLSX, wb };
  };

  // ── Helper: human-readable date stamp for folder names ──────────────────
  // e.g.  15-Jan-2026
  const dateFolderStamp = () => {
    const d = new Date();
    const day   = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-CA', { month: 'short' }); // Jan, Feb …
    const year  = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // ── Helper: open (or reuse) the GoodNightInn folder handle ───────────────
  // The user picks the GoodNightInn folder itself — NOT a parent above it.
  // We cache it in sessionStorage as a key so the browser can restore it
  // across button clicks within the same session (no re-picking needed).
  const getGoodNightInnDir = async () => {
    // showDirectoryPicker — user picks the GoodNightInn folder directly
    const handle = await window.showDirectoryPicker({
      id:      'goodnightinn-root',   // browser remembers the last location
      mode:    'readwrite',
      startIn: 'desktop',
    });
    return handle; // this IS the GoodNightInn folder
  };

  // ── Export Excel only (no delete) ────────────────────────────────────────
  const handleExportExcel = async () => {
    if (sorted.length === 0) { alert('No records to export.'); return; }

    const stamp      = dateFolderStamp();
    const dateSuffix = new Date().toISOString().slice(0, 10);

    // Pick folder FIRST — must be called directly inside the user-gesture handler
    // before any other await, otherwise Chrome blocks the picker
    let expDir = null;
    if (hasFSAPI()) {
      try {
        const gniDir = await window.showDirectoryPicker({
          id:      'goodnightinn-root',
          mode:    'readwrite',
          startIn: 'desktop',
        });
        expDir = await gniDir.getDirectoryHandle(`Export-data-${stamp}`, { create: true });
      } catch (err) {
        if (err.name === 'AbortError') return; // user pressed Cancel
        console.warn('Folder picker failed, using browser download:', err);
        expDir = null;
      }
    }

    // Build Excel now (after folder is resolved)
    const excelFilename = `GoodNightInn_Export_${dateSuffix}.xlsx`;
    const { XLSX, wb }  = await buildExcelWorkbook(sorted);

    if (expDir) {
      try {
        const buffer   = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const fileH    = await expDir.getFileHandle(excelFilename, { create: true });
        const writable = await fileH.createWritable();
        await writable.write(new Uint8Array(buffer));
        await writable.close();
        alert(`✅ Excel saved!\n\nGoodNightInn / Export-data-${stamp} / ${excelFilename}`);
      } catch (writeErr) {
        console.error('Write failed:', writeErr);
        XLSX.writeFile(wb, excelFilename);
      }
    } else {
      XLSX.writeFile(wb, excelFilename);
    }
  };

  // ── Export Excel + all PDFs + delete filtered records ────────────────────
  const handleExportAndDelete = async () => {
    if (sorted.length === 0) {
      alert('No records match the current filters. Nothing to export or delete.');
      return;
    }

    const useFSAPI   = hasFSAPI();
    const stamp      = dateFolderStamp();                      // e.g. 15-Jan-2026
    const dateSuffix = new Date().toISOString().slice(0, 10); // for filenames

    // ── STEP 1: Open folder picker IMMEDIATELY on button click ──────────────
    // showDirectoryPicker MUST be called synchronously inside a user-gesture
    // handler. Any await before it (confirm, fetch, etc.) breaks the gesture
    // chain in Chrome/Edge and the picker never opens. So we pick the folder
    // FIRST, confirm second.
    let expDir = null;  // FileSystemDirectoryHandle for GoodNightInn/Export-data-DD-Mon-YYYY

    if (useFSAPI) {
      try {
        // User picks their GoodNightInn folder directly.
        // 'id' key makes the browser remember the last location —
        // on repeat exports it re-opens inside GoodNightInn automatically.
        const gniDir = await window.showDirectoryPicker({
          id:      'goodnightinn-root',
          mode:    'readwrite',
          startIn: 'desktop',
        });
        // Auto-create the dated subfolder inside GoodNightInn
        expDir = await gniDir.getDirectoryHandle(`Export-data-${stamp}`, { create: true });
      } catch (err) {
        if (err.name === 'AbortError') return; // user pressed Cancel — stop everything
        // Any other error: warn and continue with fallback downloads
        console.warn('Folder picker failed, will use browser downloads instead:', err);
        expDir = null;
      }
    }

    // ── STEP 2: Confirm after folder is already picked ──────────────────────
    const filterSummary = [];
    if (search)     filterSummary.push(`Guest/email: "${search}"`);
    if (filterRoom) filterSummary.push(`Room: ${filterRoom}`);
    if (filterFrom) filterSummary.push(`From: ${filterFrom}`);
    if (filterTo)   filterSummary.push(`To: ${filterTo}`);
    const filterLine = filterSummary.length
      ? `\n\nActive filters:\n  • ${filterSummary.join('\n  • ')}`
      : '\n\n(No filters — this will export & delete ALL visible records)';

    const confirmed = window.confirm(
      `This will:\n\n` +
      `  1. Save Excel summary (${sorted.length} records)\n` +
      `  2. Save ${sorted.length} individual PDF receipt(s)\n` +
      `  3. Permanently delete those ${sorted.length} record(s) from Firestore` +
      filterLine +
      (expDir
        ? `\n\n📁 Saving to:\n   GoodNightInn / Export-data-${stamp} /`
        : useFSAPI
          ? `\n\n⚠️  Folder access failed. Files will download to Downloads folder.`
          : `\n\n⚠️  Your browser doesn't support folder picking (use Chrome/Edge).\n   Files will download to your Downloads folder instead.`) +
      `\n\nCannot be undone. Continue?`
    );
    if (!confirmed) return;

    // ── STEP 3: Run the export ───────────────────────────────────────────────
    setDeletingAll(true);

    // Write a blob to expDir (folder mode) or trigger a browser download (fallback)
    const saveFile = async (blob, filename) => {
      if (expDir) {
        const fileH    = await expDir.getFileHandle(filename, { create: true });
        const writable = await fileH.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        downloadBlobFallback(blob, filename);
        await new Promise(r => setTimeout(r, 350)); // pace downloads
      }
    };

    try {
      // Fetch all room data once
      const roomSnap = await getDocs(collection(db, 'rooms'));
      const allRooms = roomSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      // ── Save Excel ───────────────────────────────────────────────────────
      setExportProgress({ active: true, current: 0, total: sorted.length, stage: 'Generating Excel…' });
      const excelFilename = `GoodNightInn_Export_${dateSuffix}.xlsx`;
      const { XLSX, wb }  = await buildExcelWorkbook(sorted);
      if (expDir) {
        const buffer   = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const fileH    = await expDir.getFileHandle(excelFilename, { create: true });
        const writable = await fileH.createWritable();
        await writable.write(new Uint8Array(buffer));
        await writable.close();
      } else {
        XLSX.writeFile(wb, excelFilename);
        await new Promise(r => setTimeout(r, 600));
      }

      // ── Save each PDF receipt ────────────────────────────────────────────
      for (let i = 0; i < sorted.length; i++) {
        const res      = sorted[i];
        const safeName = (res.pname || 'Guest')
          .replace(/[^a-zA-Z0-9 _\-]/g, '')
          .replace(/\s+/g, '_')
          .slice(0, 28);
        const idx      = String(i + 1).padStart(3, '0');
        const filename = `Receipt_${idx}_${safeName}_${dateSuffix}.pdf`;

        setExportProgress({
          active:  true,
          current: i + 1,
          total:   sorted.length,
          stage:   `${expDir ? 'Saving' : 'Downloading'} PDF ${i + 1} of ${sorted.length}: ${res.pname || 'Guest'}`,
        });

        try {
          const bd   = await buildBillDetails(res, allRooms);
          const blob = await generateReceiptPdfBlob(bd);
          await saveFile(blob, filename);
        } catch (pdfErr) {
          console.error(`PDF failed for record ${i + 1} (${res.pname}):`, pdfErr);
        }
      }

      // ── Delete records from Firestore ────────────────────────────────────
      setExportProgress({ active: true, current: sorted.length, total: sorted.length, stage: 'Deleting from Firestore…' });
      const ids      = sorted.map(r => r.id);
      const BATCH_SZ = 450;
      for (let i = 0; i < ids.length; i += BATCH_SZ) {
        const batch = writeBatch(db);
        ids.slice(i, i + BATCH_SZ).forEach(id => batch.delete(doc(db, 'reservations', id)));
        await batch.commit();
      }

      // ── Done ─────────────────────────────────────────────────────────────
      await fetchReservations();
      clearFilters();
      alert(
        `✅ Export & Archive Complete!\n\n` +
        (expDir
          ? `📁 All files saved to:\n   GoodNightInn / Export-data-${stamp} /\n\n`
          : `📥 Files downloaded to your Downloads folder.\n\n`) +
        `📊 ${excelFilename}\n` +
        `🧾 ${sorted.length} PDF receipt(s)\n\n` +
        `🗑️  ${ids.length} record(s) deleted from Firestore.`
      );
    } catch (err) {
      console.error('Export & Delete failed:', err);
      alert('❌ Something went wrong. Check the browser console.\nAny files already saved are valid.');
    } finally {
      setDeletingAll(false);
      setExportProgress({ active: false, current: 0, total: 0, stage: '' });
    }
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const tagged         = reservations.map(r => ({ ...r, _eff: getEffectiveStatus(r) }));
  const pendingList    = tagged.filter(r => r._eff === 'pending');
  const upcomingList   = tagged.filter(r => r._eff === 'upcoming');
  const inHouseList    = tagged.filter(r => r._eff === 'in-house');
  const checkedOutList = tagged.filter(r => r._eff === 'checked-out');

  const tabList =
    activeTab === 'pending'  ? pendingList  :
    activeTab === 'upcoming' ? upcomingList :
    activeTab === 'inhouse'  ? inHouseList  :
    checkedOutList;

  const roomNames = [...new Set(reservations.map(r => r.roomName).filter(Boolean))].sort();

  const filtered = tabList.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.pname?.toLowerCase().includes(q) && !r.email?.toLowerCase().includes(q)) return false;
    if (filterRoom && r.roomName !== filterRoom) return false;
    if (filterFrom) { const ci = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn); if (ci < new Date(filterFrom)) return false; }
    if (filterTo)   { const co = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut); if (co > new Date(filterTo + 'T23:59:59')) return false; }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const getter = SORT_COLS[sortCol]; if (!getter) return 0;
    const av = getter(a), bv = getter(b);
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const totalPages   = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const shown        = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters   = search || filterRoom || filterFrom || filterTo;
  const clearFilters = () => { setSearch(''); setFilterRoom(''); setFilterFrom(''); setFilterTo(''); };

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

  const inp       = { background: 'var(--ink-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '7px 11px', fontSize: 12, fontFamily: 'var(--font-disp)', color: 'var(--text)', outline: 'none' };
  const pageBtnSt = (dis) => ({ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--ink-3)', color: dis ? 'var(--text-3)' : 'var(--text)', cursor: dis ? 'not-allowed' : 'pointer', fontSize: 11, opacity: dis ? 0.5 : 1 });
  const mi        = { background: '#1a1a28', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#e8e8f0', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const rcTd      = { padding: '4px 0', color: '#9ca3af', fontSize: 11, whiteSpace: 'nowrap' };
  const rcVal     = { padding: '4px 0', textAlign: 'right', fontWeight: 600, color: '#1a1a1a', fontSize: 11 };

  const tabInfo = {
    pending:    '⏳ Awaiting admin confirmation. Room is NOT blocked until confirmed.',
    upcoming:   '🕐 Confirmed bookings arriving in future. Click Check In when guest arrives.',
    inhouse:    '✅ Guest is currently in the room. Room is occupied.',
    checkedout: '🏁 Completed stays. Use "Export & Clear" to download Excel + all PDFs, then delete records.',
  };

  return (
    <>
      {/* ── Progress overlay ── */}
      {exportProgress.active && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#12121a', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 18, padding: '36px 40px', maxWidth: 480, width: '90%',
            textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0', marginBottom: 8 }}>
              Exporting Records…
            </div>
            <div style={{ fontSize: 13, color: '#9898b8', marginBottom: 20, minHeight: 20 }}>
              {exportProgress.stage}
            </div>
            {/* Progress bar */}
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 8, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #40e0c8, #2563eb)',
                width: `${exportProgress.total > 0 ? Math.round((exportProgress.current / exportProgress.total) * 100) : 0}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#5a5a7a', fontFamily: 'var(--font-mono)' }}>
              {exportProgress.current} / {exportProgress.total}
            </div>
            <div style={{ marginTop: 18, fontSize: 11, color: '#5a5a7a', lineHeight: 1.7 }}>
              Your browser will download each file automatically.<br />
              Do not close this tab.
            </div>
          </div>
        </div>
      )}

      <div className="adm-panel" style={{ marginBottom: 20 }}>
        {/* Tabs */}
        <div className="adm-panel-head">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 6,
                fontFamily: 'var(--font-disp)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>ℹ</span><span>{tabInfo[activeTab]}</span>
        </div>

        {/* Filter bar */}
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

          {/* Checked-out action buttons */}
          {activeTab === 'checkedout' && (
            <>
              <button
                onClick={handleExportExcel}
                style={{ ...inp, cursor: 'pointer', color: '#40e0c8', border: '1px solid rgba(64,224,200,0.35)', background: 'rgba(64,224,200,0.08)', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                ⬇ Export Excel
              </button>

              <button
                onClick={handleExportAndDelete}
                disabled={deletingAll}
                title={hasFilters ? `Export Excel + PDFs, then delete ${sorted.length} filtered record(s)` : `Export Excel + PDFs, then delete all ${sorted.length} checked-out record(s)`}
                style={{
                  ...inp,
                  cursor: deletingAll ? 'not-allowed' : 'pointer',
                  color: deletingAll ? 'var(--text-3)' : '#f06090',
                  border: `1px solid ${deletingAll ? 'rgba(255,255,255,0.1)' : 'rgba(240,96,144,0.4)'}`,
                  background: deletingAll ? 'rgba(255,255,255,0.03)' : 'rgba(240,96,144,0.08)',
                  fontWeight: 700, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: deletingAll ? 0.6 : 1, transition: 'all 0.2s',
                }}
              >
                {deletingAll
                  ? <><span style={{ display: 'inline-block', width: 11, height: 11, border: '2px solid rgba(240,96,144,0.3)', borderTopColor: '#f06090', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} /> Working…</>
                  : hasFilters ? '⬇🗑 Export + PDFs & Clear Filtered' : '⬇🗑 Export + PDFs & Clear All'
                }
              </button>
            </>
          )}
        </div>

        {/* Table */}
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

        {/* Pagination */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px 2px', borderTop: '1px solid var(--border)', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnSt(page === 1)}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                .map((p, idx) => p === '…'
                  ? <span key={`e${idx}`} style={{ color: 'var(--text-3)', fontSize: 11, padding: '0 4px' }}>…</span>
                  : <button key={p} onClick={() => setPage(p)} style={{ ...pageBtnSt(false), background: page === p ? 'var(--gold)' : 'var(--ink-3)', color: page === p ? '#000' : 'var(--text)', fontWeight: page === p ? 700 : 400 }}>{p}</button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnSt(page === totalPages)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ══════ ADD / EDIT MODAL ══════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#12121a', borderRadius: 18, width: '100%', maxWidth: 660, border: '1px solid rgba(255,255,255,0.12)', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#e8e8f0' }}>{isEditing ? '✏️ Edit Reservation' : '➕ Add Reservation'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5a5a7a', fontSize: 22, cursor: 'pointer' }}>×</button>
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
                <Field label="Company (optional)"><input style={mi} value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" /></Field>
                <SectionDivider label="🪪 Identification & Vehicle" />
                <FieldRow>
                  <Field label="Driver's Licence No."><input style={mi} value={driverLicNo} onChange={e => setDriverLicNo(e.target.value)} placeholder="Licence number" /></Field>
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
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: '#1a1a28', color: '#9898b8', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#6b7280' : '#f0c060', color: '#0a0a0f', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                  {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ RECEIPT MODAL ══════ */}
      {billModal && billDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#f1f0ed', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', fontFamily: "'DM Sans', sans-serif" }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px 0' }}>
              <button onClick={() => setBillModal(false)} style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', width: 30, height: 30, borderRadius: 7, fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
            </div>

            <div id="receipt-printable" style={{ background: '#ffffff', margin: '8px 12px 12px', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ background: '#1e3a5f', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>GoodNight Inn</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>664 Main St. W, Port Colborne, ON · 905-835-1818 · HST# 833074875RT0001</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Receipt</div>
                  <div style={{ fontSize: 11, color: '#fff', fontWeight: 600, marginTop: 2 }}>{billDetails.createdAt}</div>
                </div>
              </div>

              <div style={{ background: '#f8f7f4', borderBottom: '1px solid #e5e7eb', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Guest</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginTop: 1 }}>{billDetails.guest}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{[billDetails.email, billDetails.phone].filter(Boolean).join(' · ')}</div>
                  {billDetails.company && <div style={{ fontSize: 10, color: '#6b7280' }}>{billDetails.company}</div>}
                </div>
                {billDetails.clerk && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Clerk</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginTop: 1 }}>{billDetails.clerk}</div>
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div style={{ background: '#f8f7f4', border: '1px solid #e5e7eb', borderRadius: 7, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 7 }}>Stay Details</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[['Room Type', billDetails.roomName], ['Room No.', billDetails.roomNumber], ['# of Rooms', billDetails.numberOfRooms || 1], ['Check-in', billDetails.checkIn], ['Check-out', billDetails.checkOut], ['Nights', billDetails.nights], ['Guests', `${billDetails.adults}${parseInt(billDetails.kids) > 0 ? `, ${billDetails.kids} kids` : ''}`], ['Rate / Night', `$${billDetails.roomPrice.toFixed(2)}`]].map(([k, v]) => (
                          <tr key={k}><td style={rcTd}>{k}</td><td style={rcVal}>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ background: '#f8f7f4', border: '1px solid #e5e7eb', borderRadius: 7, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 7 }}>Guest Details</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {billDetails.address && <tr><td style={rcTd}>Address</td><td style={{ ...rcVal, whiteSpace: 'normal', fontSize: 10 }}>{[billDetails.address, billDetails.city, billDetails.province].filter(Boolean).join(', ')}</td></tr>}
                        {billDetails.postalCode   && <tr><td style={rcTd}>Postal</td><td style={rcVal}>{billDetails.postalCode}</td></tr>}
                        {billDetails.country      && <tr><td style={rcTd}>Country</td><td style={rcVal}>{billDetails.country}</td></tr>}
                        {billDetails.driverLicNo  && <tr><td style={rcTd}>Driver Lic.</td><td style={rcVal}>{billDetails.driverLicNo}</td></tr>}
                        {billDetails.dob          && <tr><td style={rcTd}>DOB</td><td style={rcVal}>{billDetails.dob}</td></tr>}
                        {billDetails.plateNumber  && <tr><td style={rcTd}>Plate #</td><td style={rcVal}>{billDetails.plateNumber}</td></tr>}
                        {billDetails.methodOfPayment && <tr><td style={rcTd}>Payment</td><td style={rcVal}>{billDetails.methodOfPayment}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '7px 10px', marginBottom: 10, fontSize: 9, color: '#92400e', lineHeight: 1.5 }}>
                  <strong>Notice to Guests:</strong> Management reserves the right to refuse service. Not responsible for accidents, injury, or loss of valuables. Guests are responsible for all charges incurred during and after their stay.
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: 7, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ background: '#f8f7f4', padding: '6px 12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280' }}>Billing Summary</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#374151' }}>Room Total ({billDetails.nights} × ${billDetails.roomPrice.toFixed(2)})</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#1a1a1a' }}>${billDetails.roomTotal.toFixed(2)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#374151' }}>Accommodation Tax (4%)</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#1a1a1a' }}>${billDetails.accomTax.toFixed(2)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dbeafe', background: '#eff6ff' }}>
                        <td style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#1e3a5f' }}>Sub Total</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, color: '#1e3a5f' }}>${billDetails.subTotal.toFixed(2)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px 12px', fontSize: 11, color: '#374151' }}>HST (13%)</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#1a1a1a' }}>${billDetails.hstAmount.toFixed(2)}</td>
                      </tr>
                      <tr style={{ background: '#1e3a5f' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Total (CAD)</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>All taxes included</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>${billDetails.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {(billDetails.deposit != null || billDetails.returnedDeposit != null || billDetails.methodOfPayment) && (
                    <div style={{ background: '#f8f7f4', padding: '6px 12px', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 10 }}>
                      {billDetails.deposit != null && <span><span style={{ color: '#9ca3af' }}>Deposit: </span><span style={{ fontWeight: 600, color: '#1a1a1a' }}>${Number(billDetails.deposit).toFixed(2)}</span></span>}
                      {billDetails.returnedDeposit != null && <span><span style={{ color: '#9ca3af' }}>Returned: </span><span style={{ fontWeight: 600, color: '#16a34a' }}>${Number(billDetails.returnedDeposit).toFixed(2)}</span></span>}
                      {billDetails.methodOfPayment && <span><span style={{ color: '#9ca3af' }}>Method: </span><span style={{ fontWeight: 600, color: '#1a1a1a' }}>{billDetails.methodOfPayment}</span></span>}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3 }}>Guest's Signature</div>
                    <div style={{ borderBottom: '1px solid #d1d5db', height: 26 }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'right', lineHeight: 1.6 }}>
                    664 Main St. W, Port Colborne, ON L3K 5V4<br />
                    905-835-1818 · manager@goodnightinn.ca
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '0 12px 14px', flexWrap: 'wrap' }}>
              <button onClick={async () => {
                const el = document.getElementById('receipt-printable');
                if (!el) return;
                setGeneratingPdf(true);
                try {
                  const canvas = await html2canvas(el, { scale: 2.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                  const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
                  const margin = 10, printW = pageW - margin * 2;
                  const totalImgH = (canvas.height * printW) / canvas.width;
                  const usablePageH = pageH - margin * 2;
                  if (totalImgH <= usablePageH) {
                    pdf.addImage(imgData, 'PNG', margin, (pageH - totalImgH) / 2, printW, totalImgH);
                  } else {
                    const pxPerMm = canvas.width / printW, sliceHpx = usablePageH * pxPerMm;
                    let yPx = 0, pageIdx = 0;
                    while (yPx < canvas.height) {
                      const thisSlice = Math.min(sliceHpx, canvas.height - yPx);
                      const sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = Math.ceil(thisSlice);
                      const ctx = sc.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sc.width, sc.height);
                      ctx.drawImage(canvas, 0, yPx, canvas.width, thisSlice, 0, 0, canvas.width, thisSlice);
                      if (pageIdx > 0) pdf.addPage();
                      pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, printW, thisSlice / pxPerMm);
                      yPx += thisSlice; pageIdx++;
                    }
                  }
                  pdf.save(`receipt_${(billDetails.guest || 'guest').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
                } catch (err) { console.error('PDF failed:', err); alert('PDF generation failed.'); }
                finally { setGeneratingPdf(false); }
              }} disabled={generatingPdf}
                style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', background: generatingPdf ? '#f1f0ed' : '#fff', color: generatingPdf ? '#9ca3af' : '#374151', cursor: generatingPdf ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {generatingPdf ? '⏳ Generating…' : '⬇ Download PDF'}
              </button>
              <button onClick={async () => {
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
                } catch { alert('Send failed'); }
                finally { setSendingEmail(false); }
              }} disabled={sendingEmail}
                style={{ flex: 2, padding: '11px 14px', borderRadius: 10, border: 'none', background: sendingEmail ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: sendingEmail ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {sendingEmail ? '⏳ Sending…' : '📧 Email Receipt to Guest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

export default AdminRecentReservations;