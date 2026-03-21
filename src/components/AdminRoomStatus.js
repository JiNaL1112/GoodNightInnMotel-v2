import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

// Flat list of 23 rooms — no type grouping
const ALL_ROOM_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 1);

// ── 3 states the admin actually needs to know about ──────────────────────────
const getRoomState = (r) => {
  if (!r) return null;
  if (r.status === 'checked-out') return null;

  if (r.status === 'booked') {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut || 0);
    const coDay    = new Date(checkOut); coDay.setHours(0, 0, 0, 0);
    if (coDay < today) return null;
    if (r.checkedInAt) return 'occupied';
    return 'booked';
  }

  return null; // pending — excluded from room board
};

const fmtDate = (d) => {
  if (!d) return '';
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return dt.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

const fmtArrival = (d) => {
  if (!d) return '';
  const dt   = d?.toDate ? d.toDate() : new Date(d);
  const dtN  = new Date(dt); dtN.setHours(0,0,0,0);
  const now  = new Date();   now.setHours(0,0,0,0);
  const diff = Math.ceil((dtN - now) / 86400000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
};

const STATE = {
  occupied: { label: 'Occupied', color: '#f06090', bg: 'rgba(240,96,144,0.11)',  border: 'rgba(240,96,144,0.32)'  },
  booked:   { label: 'Booked',   color: '#f0c060', bg: 'rgba(240,192,96,0.09)',  border: 'rgba(240,192,96,0.28)'  },
  free:     { label: 'Free',     color: '#50d890', bg: 'rgba(80,216,144,0.07)',  border: 'rgba(80,216,144,0.22)'  },
};

const AdminRoomStatus = () => {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resSnap = await getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc')));
      const res     = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReservations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Match reservations purely by room number — no type dependency
  const getSlotData = (roomNumber) => {
    const slotRes = reservations.filter(r =>
      String(r.roomNumber) === String(roomNumber)
    );

    const occupiedRes = slotRes.find(r => getRoomState(r) === 'occupied');
    if (occupiedRes) return { state: 'occupied', res: occupiedRes };

    const bookedRes = slotRes
      .filter(r => getRoomState(r) === 'booked')
      .sort((a, b) => {
        const aD = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const bD = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
        return aD - bD;
      })[0] || null;

    if (bookedRes) return { state: 'booked', res: bookedRes };
    return { state: 'free', res: null };
  };

  // Build flat card list — no type object attached
  const allCards = ALL_ROOM_NUMBERS.map(num => ({
    number: num,
    ...getSlotData(num),
  }));

  const totOccupied = allCards.filter(c => c.state === 'occupied').length;
  const totBooked   = allCards.filter(c => c.state === 'booked').length;
  const totFree     = allCards.filter(c => c.state === 'free').length;

  const visible = filter === 'all' ? allCards : allCards.filter(c => c.state === filter);

  if (loading) {
    return (
      <div className="adm-panel">
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading rooms…</span></div>
      </div>
    );
  }

  return (
    <div className="adm-panel">

      {/* Header */}
      <div className="adm-panel-head" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="adm-panel-title">Room Status</span>
          <span className="adm-panel-tag">23 Rooms</span>
        </div>
        <button
          onClick={fetchData}
          style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 99, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
            color: 'var(--text-3,#888)', fontFamily: 'inherit',
          }}
        >🔄 Refresh</button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { key: 'all',      dot: null,      label: 'All',      count: allCards.length },
          { key: 'occupied', dot: '#f06090', label: 'Occupied', count: totOccupied     },
          { key: 'booked',   dot: '#f0c060', label: 'Booked',   count: totBooked       },
          { key: 'free',     dot: '#50d890', label: 'Free',     count: totFree         },
        ].map(f => {
          const st     = f.key !== 'all' ? STATE[f.key] : null;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 500,
                border:     `1.5px solid ${active && st ? st.border : active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
                background: active && st ? st.bg : active ? 'rgba(255,255,255,0.06)' : 'transparent',
                color:      active && st ? st.color : active ? 'var(--text,#e8e8f0)' : 'var(--text-3,#888)',
                transition: 'all 0.15s',
              }}
            >
              {f.dot && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: f.dot, display: 'inline-block', flexShrink: 0,
                  boxShadow: active && f.key === 'occupied' ? `0 0 6px ${f.dot}` : 'none',
                }} />
              )}
              {f.label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 99,
                background: active && st ? `${st.color}22` : 'rgba(255,255,255,0.08)',
                color:      active && st ? st.color : 'var(--text-3,#888)',
                minWidth: 20, textAlign: 'center',
              }}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Room card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 10,
      }}>
        {visible.map(card => {
          const st = STATE[card.state];
          return (
            <div
              key={card.number}
              style={{
                padding: '14px', borderRadius: 12,
                border:     `1px solid ${st.border}`,
                background: st.bg,
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${st.border}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Top row: room icon + status badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>🛏️</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: 'rgba(0,0,0,0.3)', color: st.color, letterSpacing: '0.5px',
                  textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', background: st.color, display: 'inline-block',
                    boxShadow: card.state === 'occupied' ? `0 0 5px ${st.color}` : 'none',
                  }} />
                  {st.label}
                </span>
              </div>

              {/* Room number */}
              <div style={{
                fontSize: 28, fontWeight: 800, color: 'var(--text,#e8e8f0)',
                lineHeight: 1, marginBottom: 3,
              }}>
                {card.number}
              </div>

              {/* Room type from reservation (if any) */}
              <div style={{ fontSize: 10, color: 'var(--text-3,#888)', marginBottom: 10 }}>
                {card.res?.roomName || 'Room'}
              </div>

              {/* State-specific info */}
              {card.state === 'occupied' && card.res && (
                <div style={{ borderTop: `1px solid ${st.border}`, paddingTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text,#e8e8f0)', marginBottom: 3 }}>
                    👤 {card.res.pname}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3,#888)' }}>
                    Checks out {fmtDate(card.res.checkOut)}
                  </div>
                </div>
              )}

              {card.state === 'booked' && card.res && (
                <div style={{ borderTop: `1px solid ${st.border}`, paddingTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text,#e8e8f0)', marginBottom: 2 }}>
                    {card.res.pname}
                  </div>
                  <div style={{ fontSize: 11, color: '#f0c060', fontWeight: 600, marginBottom: 2 }}>
                    Arrives {fmtArrival(card.res.checkIn)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3,#888)' }}>
                    {fmtDate(card.res.checkIn)} → {fmtDate(card.res.checkOut)}
                  </div>
                </div>
              )}

              {card.state === 'free' && (
                <div style={{
                  borderTop: `1px solid ${st.border}`, paddingTop: 8,
                  fontSize: 12, color: '#50d890', fontWeight: 600,
                }}>
                  ✓ Available now
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px', marginTop: 8,
          color: 'var(--text-3,#888)', fontSize: 13,
          border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
        }}>
          No {STATE[filter]?.label.toLowerCase()} rooms right now.
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 20, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        fontSize: 11, color: 'var(--text-3,#888)', lineHeight: 1.7,
      }}>
        💡 <strong style={{ color: 'var(--text-2,#aaa)' }}>Tip:</strong> Pending requests are not shown
        here — go to <strong style={{ color: 'var(--text-2,#aaa)' }}>Reservations</strong> to review and
        confirm them. Once confirmed, the room will appear as{' '}
        <span style={{ color: '#f0c060' }}>Booked</span>.
      </div>
    </div>
  );
};

export default AdminRoomStatus;