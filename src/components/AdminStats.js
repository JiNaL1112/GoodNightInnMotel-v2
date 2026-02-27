import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const TOTAL_ROOMS = 20;

// ── Single source of truth — identical to AdminRecentReservations ─────────────
const getEffectiveStatus = (r) => {
  if (r.status === 'checked-out') return 'checked-out';

  if (r.status === 'booked') {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
    const coDay    = new Date(checkOut); coDay.setHours(0, 0, 0, 0);

    if (coDay < today) return 'checked-out';   // past checkout → auto checked-out
    if (r.checkedInAt) return 'in-house';       // admin clicked Check In → occupied
    return 'upcoming';                           // confirmed but not yet checked in
  }

  return 'pending';
};

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalReservations:   0,
    pendingReservations: 0,
    occupiedRooms:       0,
    revenueThisMonth:    0,
    revenueLastMonth:    0,
    bookingsThisMonth:   0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resSnap, roomSnap] = await Promise.all([
          getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'rooms')),
        ]);

        const reservations = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const rooms        = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const now            = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

        let revenueThis = 0, revenueLast = 0;

        const pending = reservations.filter(r => r.status === 'pending' || !r.status);

        reservations.forEach(r => {
          if (r.status !== 'booked') return;
          const room = rooms.find(rm => rm.id === r.roomId);
          if (!room) return;

          const checkIn  = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
          const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
          const nights   = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
          const total    = room.price * nights;

          const created = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
          if (created >= thisMonthStart) revenueThis += total;
          if (created >= lastMonthStart && created <= lastMonthEnd) revenueLast += total;
        });

        // ── FIX: Count occupied slots using same getEffectiveStatus as In-house tab ──
        // A slot is occupied ONLY when the admin has clicked Check In (checkedInAt exists)
        // and the guest has not been checked out yet.
        const occupiedSlotKeys = new Set();
        reservations.forEach(r => {
          if (getEffectiveStatus(r) === 'in-house') {
            const key = `${r.roomId}::${r.roomNumber}`;
            occupiedSlotKeys.add(key);
          }
        });

        const occupiedRooms = occupiedSlotKeys.size;

        const bookingsThisMonth = reservations.filter(r => {
          const created = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
          return created >= thisMonthStart;
        }).length;

        setStats({
          totalReservations:   reservations.length,
          pendingReservations: pending.length,
          occupiedRooms,
          revenueThisMonth:    revenueThis,
          revenueLastMonth:    revenueLast,
          bookingsThisMonth,
          loading: false,
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
        setStats(s => ({ ...s, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const revDelta = stats.revenueLastMonth > 0
    ? (((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100).toFixed(1)
    : null;

  const vacantRooms = TOTAL_ROOMS - stats.occupiedRooms;

  const cards = [
    {
      color: 'gold',
      icon:  '💰',
      val:   `$${stats.revenueThisMonth.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`,
      label: 'Revenue This Month',
      delta: revDelta ? `${Number(revDelta) > 0 ? '+' : ''}${revDelta}% vs last month` : 'First month',
      neg:   Number(revDelta) < 0,
    },
    {
      color: 'teal',
      icon:  '🛏️',
      val:   `${stats.occupiedRooms} / ${TOTAL_ROOMS}`,
      label: 'Occupied Rooms',
      delta: `${vacantRooms} of ${TOTAL_ROOMS} rooms vacant`,
      neg:   false,
    },
    {
      color: 'rose',
      icon:  '⏳',
      val:   stats.pendingReservations,
      label: 'Pending Approvals',
      delta: stats.pendingReservations > 0 ? 'Action required' : 'All cleared ✓',
      neg:   stats.pendingReservations > 0,
    },
    {
      color: 'violet',
      icon:  '📅',
      val:   stats.bookingsThisMonth,
      label: "This Month's Bookings",
      delta: `${stats.totalReservations} bookings all-time`,
      neg:   false,
    },
  ];

  return (
    <div className="adm-stats-grid">
      {cards.map((c) => (
        <div key={c.label} className={`adm-stat-card ${c.color}`}>
          <span className="adm-stat-icon">{c.icon}</span>
          {stats.loading
            ? <div className="adm-stat-val" style={{ color: 'var(--text-3)', fontSize: 16 }}>—</div>
            : <div className="adm-stat-val">{c.val}</div>
          }
          <div className="adm-stat-label">{c.label}</div>
          <div className={`adm-stat-delta ${c.neg ? 'neg' : ''}`}>
            {c.neg ? '↓' : '↑'} {c.delta}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;