import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

// Must match AdminRoomStatus — 4 types × 5 slots = 20 rooms
const TOTAL_ROOMS = 20;

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalReservations:   0,
    pendingReservations: 0,
    occupiedRooms:       0,   // individual slots occupied right now
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

        const confirmed = reservations.filter(r => r.status === 'booked');
        const pending   = reservations.filter(r => r.status === 'pending' || !r.status);

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

        // ── Count occupied SLOTS (roomId + roomNumber) not just room types ───
        // This mirrors the exact logic in AdminRoomStatus.getSlotStatus()
        const today           = new Date();
        const occupiedSlotKeys = new Set();

        confirmed.forEach(r => {
          const ci = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
          const co = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
          if (ci <= today && co >= today) {
            // Key = roomId::roomNumber — unique per physical room slot
            const key = `${r.roomId}::${r.roomNumber}`;
            occupiedSlotKeys.add(key);
          }
        });

        const occupiedRooms = occupiedSlotKeys.size;

        // ── Bookings created this calendar month (any status) ─────────────────
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
    // Card 1 — Revenue This Month
    {
      color: 'gold',
      icon:  '💰',
      val:   `$${stats.revenueThisMonth.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`,
      label: 'Revenue This Month',
      delta: revDelta ? `${Number(revDelta) > 0 ? '+' : ''}${revDelta}% vs last month` : 'First month',
      neg:   Number(revDelta) < 0,
    },

    // Card 2 — Occupied Rooms (X / 20)
    {
      color: 'teal',
      icon:  '🛏️',
      val:   `${stats.occupiedRooms} / ${TOTAL_ROOMS}`,
      label: 'Occupied Rooms',
      delta: `${vacantRooms} of ${TOTAL_ROOMS} rooms vacant`,
      neg:   false,
    },

    // Card 3 — Pending Approvals
    {
      color: 'rose',
      icon:  '⏳',
      val:   stats.pendingReservations,
      label: 'Pending Approvals',
      delta: stats.pendingReservations > 0 ? 'Action required' : 'All cleared ✓',
      neg:   stats.pendingReservations > 0,
    },

    // Card 4 — This Month's Bookings
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