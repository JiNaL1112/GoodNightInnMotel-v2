import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    totalRooms: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    avgNightlyRate: 0,
    occupancyRate: 0,
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
        const rooms = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

        let revenueThis = 0, revenueLast = 0;

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

        const confirmed  = reservations.filter(r => r.status === 'booked');
        const pending    = reservations.filter(r => r.status !== 'booked');
        const avgRate    = rooms.length ? rooms.reduce((a, r) => a + (r.price || 0), 0) / rooms.length : 0;

        // occupancy: rooms with at least one active confirmed booking today
        const today = new Date();
        const occupiedRoomIds = new Set();
        confirmed.forEach(r => {
          const ci = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
          const co = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
          if (ci <= today && co >= today) occupiedRoomIds.add(r.roomId);
        });
        const occupancyRate = rooms.length ? Math.round((occupiedRoomIds.size / rooms.length) * 100) : 0;

        setStats({
          totalReservations: reservations.length,
          pendingReservations: pending.length,
          confirmedReservations: confirmed.length,
          totalRooms: rooms.length,
          revenueThisMonth: revenueThis,
          revenueLastMonth: revenueLast,
          avgNightlyRate: avgRate,
          occupancyRate,
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

  const cards = [
    {
      color:   'gold',
      icon:    '💰',
      val:     `$${stats.revenueThisMonth.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`,
      label:   'Revenue This Month',
      delta:   revDelta ? `${revDelta > 0 ? '+' : ''}${revDelta}% vs last month` : 'First month',
      neg:     revDelta < 0,
      spark:   '▲',
    },
    {
      color:   'teal',
      icon:    '📋',
      val:     stats.confirmedReservations,
      label:   'Confirmed Bookings',
      delta:   `${stats.totalReservations} total reservations`,
      spark:   '◆',
    },
    {
      color:   'rose',
      icon:    '⏳',
      val:     stats.pendingReservations,
      label:   'Pending Approvals',
      delta:   stats.pendingReservations > 0 ? 'Action required' : 'All cleared ✓',
      neg:     stats.pendingReservations > 0,
      spark:   '●',
    },
    {
      color:   'violet',
      icon:    '🏨',
      val:     `${stats.occupancyRate}%`,
      label:   'Occupancy Rate',
      delta:   `${stats.totalRooms} rooms total`,
      spark:   '◉',
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
          <span className="adm-stat-sparkline">{c.spark}</span>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
