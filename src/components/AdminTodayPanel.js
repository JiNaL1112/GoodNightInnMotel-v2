import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Same status engine used across all admin components ──────────────────────
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

const fmtTime = (d) => {
  if (!d) return '';
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return dt.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const AdminTodayPanel = () => {
  const [checkIns,  setCheckIns]  = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))
        );
        const all      = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const todayStr = new Date().toDateString();

        // ── Check-ins: upcoming reservations whose checkIn date is TODAY ──────
        // These are guests the admin still needs to physically check in
        const ins = all.filter(r => {
          const eff = getEffectiveStatus(r);
          if (eff !== 'upcoming') return false;
          const d = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn);
          return d.toDateString() === todayStr;
        });

        // ── Check-outs: in-house guests whose checkOut date is TODAY ──────────
        // Also catch guests checked out today (status==='checked-out' + checkedOutAt today)
        const outs = all.filter(r => {
          const eff = getEffectiveStatus(r);
          // Currently in-house and due to leave today
          if (eff === 'in-house') {
            const d = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
            return d.toDateString() === todayStr;
          }
          // Already checked out today
          if (eff === 'checked-out' && r.checkedOutAt) {
            const d = r.checkedOutAt?.toDate ? r.checkedOutAt.toDate() : new Date(r.checkedOutAt);
            return d.toDateString() === todayStr;
          }
          return false;
        });

        setCheckIns(ins);
        setCheckOuts(outs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  const TodayList = ({ items, type }) => {
    if (!items.length)
      return (
        <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
          No {type === 'checkin' ? 'check-ins' : 'check-outs'} today
        </div>
      );

    return (
      <div className="adm-today-list">
        {items.map(r => {
          const eff = getEffectiveStatus(r);
          const alreadyDone = type === 'checkin'
            ? eff === 'in-house'      // already checked in
            : eff === 'checked-out';  // already checked out

          return (
            <div key={r.id} className={`adm-today-item ${type}`} style={{
              opacity: alreadyDone ? 0.5 : 1,
            }}>
              <div style={{ flex: 1 }}>
                <div className="adm-today-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {r.pname}
                  {alreadyDone && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                      background: type === 'checkin' ? 'rgba(80,216,144,0.15)' : 'rgba(64,224,200,0.15)',
                      color:      type === 'checkin' ? '#50d890' : '#40e0c8',
                    }}>
                      {type === 'checkin' ? '✓ Done' : '✓ Left'}
                    </span>
                  )}
                </div>
                <div className="adm-today-room">
                  {r.roomName}{r.roomNumber ? ` · Room ${r.roomNumber}` : ''}
                  {' · '}{r.adults}{parseInt(r.kids) > 0 ? `, ${r.kids} kids` : ''}
                </div>
              </div>
              <div className="adm-today-time">
                {type === 'checkin'
                  ? (r.checkedInAt  ? fmtTime(r.checkedInAt)  : '14:00')
                  : (r.checkedOutAt ? fmtTime(r.checkedOutAt) : '11:00')
                }
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <span className="adm-panel-title">Today's Activity</span>
        <span className="adm-panel-tag">
          {new Date().toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="adm-panel-body">
        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /></div>
        ) : (
          <>
            {/* Summary counters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(80,216,144,0.08)', border: '1px solid rgba(80,216,144,0.2)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{checkIns.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Check-ins</div>
              </div>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(240,96,144,0.08)', border: '1px solid rgba(240,96,144,0.2)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--rose)' }}>{checkOuts.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Check-outs</div>
              </div>
            </div>

            {/* Check-ins */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  ↓ Checking In Today
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  14:00 – 22:30
                </div>
              </div>
              <TodayList items={checkIns} type="checkin" />
            </div>

            {/* Check-outs */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--rose)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  ↑ Checking Out Today
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  until 11:00
                </div>
              </div>
              <TodayList items={checkOuts} type="checkout" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTodayPanel;