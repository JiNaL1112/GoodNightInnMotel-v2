import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLORS = ['#f0c060', '#40e0c8', '#f06090', '#9080f0', '#50d890', '#60b0f0'];

const AdminRoomStatus = () => {
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomSnap, resSnap] = await Promise.all([
          getDocs(collection(db, 'rooms')),
          getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))),
        ]);
        setRooms(roomSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReservations(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();

  const getRoomInfo = (room) => {
    const roomRes = reservations.filter(r => r.roomId === room.id && r.status === 'booked');
    const activeRes = roomRes.find(r => {
      const ci = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
      const co = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
      return ci <= today && co >= today;
    });

    const upcoming = roomRes
      .filter(r => {
        const ci = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn);
        return ci > today;
      })
      .sort((a, b) => {
        const aDate = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const bDate = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
        return aDate - bDate;
      })[0];

    const bookingCount = roomRes.length;

    // Compute total revenue for this room
    let revenue = 0;
    roomRes.forEach(r => {
      const ci  = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
      const co  = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
      const nights = Math.max(1, Math.ceil((co - ci) / (1000 * 60 * 60 * 24)));
      revenue += (room.price || 0) * nights;
    });

    const pendingCount = reservations.filter(
      r => r.roomId === room.id && r.status !== 'booked'
    ).length;

    return { activeRes, upcoming, bookingCount, revenue, pendingCount };
  };

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <span className="adm-panel-title">Room Status</span>
        <span className="adm-panel-tag">{rooms.length} Rooms</span>
      </div>
      <div className="adm-panel-body">
        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
        ) : rooms.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">🏨</div>
            <div className="adm-empty-text">No rooms found</div>
          </div>
        ) : (
          rooms.map((room, i) => {
            const { activeRes, upcoming, bookingCount, revenue, pendingCount } = getRoomInfo(room);
            const isOccupied = !!activeRes;
            const hasPending = pendingCount > 0;

            const status     = isOccupied ? 'booked' : hasPending ? 'pending' : 'vacant';
            const statusText = isOccupied ? 'Occupied' : hasPending ? 'Pending' : 'Vacant';
            const pct        = isOccupied ? 100 : hasPending ? 45 : 0;
            const barColor   = COLORS[i % COLORS.length];

            const guestName  = isOccupied ? activeRes.pname : upcoming ? `Next: ${upcoming.pname}` : '—';
            const checkoutStr = isOccupied && activeRes.checkOut
              ? (activeRes.checkOut.toDate ? activeRes.checkOut.toDate() : new Date(activeRes.checkOut))
                  .toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
              : null;

            return (
              <div key={room.id} style={{ marginBottom: 18 }}>
                <div className="adm-room-row">
                  <span className="adm-room-name" title={room.name}>{room.name}</span>
                  <div className="adm-room-bar-wrap">
                    <div
                      className="adm-room-bar"
                      style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}50` }}
                    />
                  </div>
                  <span className="adm-room-pct">{pct}%</span>
                  <span className={`adm-room-status ${status}`}>{statusText}</span>
                </div>
                <div style={{ paddingLeft: 0, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    👤 {guestName}
                    {checkoutStr && <span style={{ color: 'var(--rose)', marginLeft: 6 }}>→ {checkoutStr}</span>}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    📦 {bookingCount} bookings
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                    ${revenue.toLocaleString('en-CA', { maximumFractionDigits: 0 })} lifetime
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    ${room.price}/night
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminRoomStatus;
