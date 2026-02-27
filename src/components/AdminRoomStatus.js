import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

// 4 types × 5 rooms = 20 total
const ROOM_TYPES = [
  { name: 'Queen Bed',      icon: '🛏️',  color: '#60b0f0', slots: [101,102,103,104,105] },
  { name: 'Two Queen Beds', icon: '🛏🛏', color: '#f0c060', slots: [201,202,203,204,205] },
  { name: 'King Bed',       icon: '👑',   color: '#9080f0', slots: [301,302,303,304,305] },
  { name: 'Kitchenette',    icon: '🍳',   color: '#50d890', slots: [401,402,403,404,405] },
];

const fmtDate = (d) => {
  if (!d) return '';
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return dt.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
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

const AdminRoomStatus = () => {
  const [firestoreRooms, setFirestoreRooms] = useState([]);
  const [reservations,   setReservations]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [expandedTypes,  setExpandedTypes]  = useState(new Set());   // ← Set instead of single string
  const [filterStatus,   setFilterStatus]   = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const [roomSnap, resSnap] = await Promise.all([
          getDocs(collection(db, 'rooms')),
          getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))),
        ]);
        setFirestoreRooms(roomSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReservations(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpanded = (name) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const getSlotStatus = (roomName, roomNumber) => {
    const roomDoc = firestoreRooms.find(
      r => r.name?.trim().toLowerCase() === roomName.trim().toLowerCase()
    );
    if (!roomDoc) return { status: 'vacant', activeRes: null, upcoming: null };

    const slotRes = reservations.filter(r =>
      r.roomId === roomDoc.id &&
      String(r.roomNumber) === String(roomNumber)
    );

    const withEff = slotRes.map(r => ({ ...r, _eff: getEffectiveStatus(r) }));

    const activeRes = withEff.find(r => r._eff === 'in-house') || null;
    if (activeRes) return { status: 'occupied', activeRes, upcoming: null };

    const upcoming = withEff
      .filter(r => r._eff === 'upcoming')
      .sort((a, b) => {
        const aD = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const bD = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
        return aD - bD;
      })[0] || null;

    const hasPending = withEff.some(r => r._eff === 'pending');
    if (hasPending) return { status: 'pending', activeRes: null, upcoming };

    return { status: 'vacant', activeRes: null, upcoming };
  };

  const groups = ROOM_TYPES.map(type => {
    const slotInfos = type.slots.map(num => ({ number: num, ...getSlotStatus(type.name, num) }));
    const occupied  = slotInfos.filter(s => s.status === 'occupied').length;
    const pending   = slotInfos.filter(s => s.status === 'pending').length;
    const vacant    = slotInfos.filter(s => s.status === 'vacant').length;
    const pct       = Math.round((occupied / slotInfos.length) * 100);
    return { ...type, slotInfos, occupied, pending, vacant, pct };
  });

  const allSlots    = groups.flatMap(g => g.slotInfos);
  const totOccupied = allSlots.filter(s => s.status === 'occupied').length;
  const totPending  = allSlots.filter(s => s.status === 'pending').length;
  const totVacant   = allSlots.filter(s => s.status === 'vacant').length;

  // ── Filter change: auto-expand matching groups, hide non-matching ─────────
  const handleFilterChange = (key) => {
    setFilterStatus(key);
    if (key === 'all') {
      setExpandedTypes(new Set());
    } else {
      // Auto-expand every group that has at least one slot matching the filter
      const autoExpand = new Set(
        groups
          .filter(g => g.slotInfos.some(s => s.status === key))
          .map(g => g.name)
      );
      setExpandedTypes(autoExpand);
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      occupied: { label: 'Occupied', color: '#f06090', bg: '#f0609015' },
      pending:  { label: 'Pending',  color: '#f0c060', bg: '#f0c06015' },
      vacant:   { label: 'Vacant',   color: '#50d890', bg: '#50d89015' },
    };
    const s = map[status] || map.vacant;
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        padding: '3px 10px', borderRadius: 99,
        background: s.bg, color: s.color, border: `1px solid ${s.color}30`,
        whiteSpace: 'nowrap',
      }}>{s.label}</span>
    );
  };

  if (loading) {
    return (
      <div className="adm-panel">
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading room status…</span></div>
      </div>
    );
  }

  return (
    <div className="adm-panel">

      {/* Header */}
      <div className="adm-panel-head" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="adm-panel-title">Room Status</span>
          <span className="adm-panel-tag">20 Rooms · 4 Types</span>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all',      label: `All 20`,                    color: 'var(--text-3,#888)' },
            { key: 'occupied', label: `🔴 ${totOccupied} Occupied`, color: '#f06090' },
            { key: 'pending',  label: `🟡 ${totPending} Pending`,   color: '#f0c060' },
            { key: 'vacant',   label: `🟢 ${totVacant} Vacant`,     color: '#50d890' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 99, cursor: 'pointer',
                border:     `1px solid ${filterStatus === f.key ? f.color : '#ffffff18'}`,
                background: filterStatus === f.key ? `${f.color}15` : 'transparent',
                color:      filterStatus === f.key ? f.color : 'var(--text-3,#888)',
                fontWeight: filterStatus === f.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room type groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map(group => {
          // Slots visible in the expanded view based on active filter
          const visibleSlots = filterStatus === 'all'
            ? group.slotInfos
            : group.slotInfos.filter(s => s.status === filterStatus);

          // ── KEY FIX: hide the entire group row when filter is active and no slots match ──
          if (filterStatus !== 'all' && visibleSlots.length === 0) return null;

          const isExpanded = expandedTypes.has(group.name);

          return (
            <div
              key={group.name}
              style={{
                borderRadius: 10,
                border: `1px solid ${isExpanded ? group.color + '30' : '#ffffff12'}`,
                background: '#ffffff04',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Group header */}
              <div
                onClick={() => toggleExpanded(group.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', cursor: 'pointer',
                  borderBottom: isExpanded ? `1px solid ${group.color}18` : 'none',
                  background:   isExpanded ? `${group.color}10` : 'transparent',
                  transition:   'background 0.2s',
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{group.icon}</span>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: group.color, fontSize: 14 }}>
                    {group.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3,#888)', marginTop: 2 }}>
                    5 rooms ·{' '}
                    <span style={{ color: '#f06090' }}>{group.occupied} occupied</span> ·{' '}
                    <span style={{ color: '#f0c060' }}>{group.pending} pending</span> ·{' '}
                    <span style={{ color: '#50d890' }}>{group.vacant} vacant</span>
                    {filterStatus !== 'all' && (
                      <span style={{ color: group.color, fontWeight: 600, marginLeft: 6 }}>
                        · {visibleSlots.length} shown
                      </span>
                    )}
                  </div>
                </div>

                {/* Occupancy bar */}
                <div style={{ width: 90, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: group.color, textAlign: 'right', marginBottom: 3 }}>
                    {group.pct}%
                  </div>
                  <div style={{ height: 5, background: '#ffffff12', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${group.pct}%`, background: group.color,
                      borderRadius: 99, boxShadow: `0 0 6px ${group.color}70`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>

                {/* Dot indicators — dimmed when filter hides them */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {group.slotInfos.map(s => {
                    const c = s.status === 'occupied' ? '#f06090'
                            : s.status === 'pending'  ? '#f0c060' : '#50d890';
                    const isMatch = filterStatus === 'all' || s.status === filterStatus;
                    return (
                      <div
                        key={s.number}
                        title={`Room ${s.number} — ${s.status}`}
                        style={{
                          width: 11, height: 11, borderRadius: '50%',
                          background:  isMatch ? c : '#ffffff12',
                          boxShadow:   isMatch ? `0 0 5px ${c}90` : 'none',
                          transition:  'all 0.2s',
                        }}
                      />
                    );
                  })}
                </div>

                <span style={{
                  fontSize: 10, color: 'var(--text-3,#888)', marginLeft: 4, flexShrink: 0,
                  transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
                }}>▼</span>
              </div>

              {/* Expanded slot rows */}
              {isExpanded && (
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {visibleSlots.map(slot => (
                    <div
                      key={slot.number}
                      style={{
                        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                        padding: '10px 13px', borderRadius: 8,
                        background: slot.status === 'occupied' ? '#f0609010'
                          : slot.status === 'pending' ? '#f0c06010' : '#ffffff05',
                        border: `1px solid ${
                          slot.status === 'occupied' ? '#f0609022'
                          : slot.status === 'pending' ? '#f0c06022' : '#ffffff0e'
                        }`,
                      }}
                    >
                      {/* Room number pill */}
                      <div style={{
                        minWidth: 48, height: 28, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        borderRadius: 6, fontWeight: 700, fontSize: 13,
                        background: `${group.color}15`, color: group.color,
                        border: `1px solid ${group.color}28`,
                        fontFamily: 'var(--font-mono, monospace)', flexShrink: 0,
                      }}>
                        {slot.number}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--text-3,#888)', minWidth: 100 }}>
                        {slot.status === 'occupied' && slot.activeRes ? (
                          <>
                            👤{' '}
                            <span style={{ color: 'var(--text,#fff)', fontWeight: 600 }}>
                              {slot.activeRes.pname}
                            </span>
                            {slot.activeRes.checkIn && slot.activeRes.checkOut && (
                              <span style={{ marginLeft: 8 }}>
                                {fmtDate(slot.activeRes.checkIn)}
                                <span style={{ color: '#f06090' }}> → {fmtDate(slot.activeRes.checkOut)}</span>
                              </span>
                            )}
                          </>
                        ) : slot.status === 'pending' ? (
                          <span style={{ color: '#f0c060' }}>⏳ Awaiting confirmation</span>
                        ) : slot.upcoming ? (
                          <>
                            🕐{' '}
                            <span style={{ color: '#60b0f0', fontWeight: 600 }}>
                              {slot.upcoming.pname}
                            </span>
                            {slot.upcoming.checkIn && slot.upcoming.checkOut && (
                              <span style={{ marginLeft: 8 }}>
                                {fmtDate(slot.upcoming.checkIn)}
                                <span style={{ color: '#60b0f0' }}> → {fmtDate(slot.upcoming.checkOut)}</span>
                              </span>
                            )}
                            <span style={{ marginLeft: 6, color: '#60b0f060', fontSize: 10 }}>upcoming</span>
                          </>
                        ) : (
                          <span style={{ color: '#50d890' }}>✓ Available</span>
                        )}
                      </div>

                      <StatusBadge status={slot.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Global empty state */}
        {filterStatus !== 'all' && groups.every(g =>
          g.slotInfos.filter(s => s.status === filterStatus).length === 0
        ) && (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            color: 'var(--text-3,#888)', fontSize: 13,
            border: '1px dashed #ffffff15', borderRadius: 10,
          }}>
            No {filterStatus} rooms right now.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoomStatus;