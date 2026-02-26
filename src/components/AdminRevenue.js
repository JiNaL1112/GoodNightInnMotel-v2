import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminRevenue = () => {
  const [monthly, setMonthly] = useState(Array(12).fill(0));
  const [nights,  setNights]  = useState(Array(12).fill(0));
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [resSnap, roomSnap] = await Promise.all([
          getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'rooms')),
        ]);
        const reservations = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const rooms = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const rev  = Array(12).fill(0);
        const nts  = Array(12).fill(0);

        reservations.forEach(r => {
          if (r.status !== 'booked') return;
          const room = rooms.find(rm => rm.id === r.roomId);
          if (!room) return;

          const checkIn  = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
          const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
          const n        = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
          const total    = room.price * n;
          const month    = checkIn.getMonth();

          rev[month] += total;
          nts[month] += n;
        });

        setMonthly(rev);
        setNights(nts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const maxRev    = Math.max(...monthly, 1);
  const currentM  = new Date().getMonth();
  const totalRev  = monthly.reduce((a, b) => a + b, 0);
  const totalNights = nights.reduce((a, b) => a + b, 0);

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <span className="adm-panel-title">Revenue Overview</span>
        <span className="adm-panel-tag" style={{ color: 'var(--gold)' }}>
          ${totalRev.toLocaleString('en-CA', { maximumFractionDigits: 0 })} YTD
        </span>
      </div>
      <div className="adm-panel-body">
        {/* Summary row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Revenue', val: `$${totalRev.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`, color: 'var(--gold)' },
            { label: 'Total Nights',  val: totalNights, color: 'var(--teal)' },
            { label: 'This Month',    val: `$${monthly[currentM].toLocaleString('en-CA', { maximumFractionDigits: 0 })}`, color: 'var(--violet)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /></div>
        ) : (
          <div style={{ position: 'relative' }}>
            {tooltip && (
              <div style={{
                position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--ink-4)', border: '1px solid var(--border-2)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                fontFamily: 'var(--font-mono)', color: 'var(--gold)', whiteSpace: 'nowrap', zIndex: 10,
              }}>
                {tooltip}
              </div>
            )}
            <div className="adm-rev-chart">
              {monthly.map((val, i) => {
                const heightPct = (val / maxRev) * 100;
                return (
                  <div key={i} className="adm-rev-bar-wrap">
                    <div
                      className={`adm-rev-bar ${i === currentM ? 'current' : ''}`}
                      style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}
                      onMouseEnter={() => setTooltip(`${MONTHS[i]}: $${val.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    <span className="adm-rev-month">{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
