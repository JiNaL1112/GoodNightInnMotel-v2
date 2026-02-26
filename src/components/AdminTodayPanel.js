import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const AdminTodayPanel = () => {
  const [checkIns,  setCheckIns]  = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))
        );
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const today    = new Date();
        const todayStr = today.toDateString();

        const ins  = all.filter(r => {
          const d = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn);
          return d.toDateString() === todayStr && r.status === 'booked';
        });
        const outs = all.filter(r => {
          const d = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
          return d.toDateString() === todayStr && r.status === 'booked';
        });

        setCheckIns(ins);
        setCheckOuts(outs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
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
        {items.map(r => (
          <div key={r.id} className={`adm-today-item ${type}`}>
            <div>
              <div className="adm-today-name">{r.pname}</div>
              <div className="adm-today-room">
                {r.roomName}{r.roomNumber ? ` · Room ${r.roomNumber}` : ''} · {r.adults} adults{r.kids > 0 ? `, ${r.kids} kids` : ''}
              </div>
            </div>
            <div className="adm-today-time">
              {type === 'checkin' ? '3:00 PM' : '10:30 AM'}
            </div>
          </div>
        ))}
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
            {/* Summary pills */}
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

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                ↓ Checking In
              </div>
              <TodayList items={checkIns} type="checkin" />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--rose)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                ↑ Checking Out
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
