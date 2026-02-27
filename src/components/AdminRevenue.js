import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminRevenue = () => {
  const [allData,   setAllData]   = useState({});  // { year: [12 revenue values] }
  const [allNights, setAllNights] = useState({});  // { year: [12 nights values] }
  const [years,     setYears]     = useState([]);
  const [selYear,   setSelYear]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tooltip,   setTooltip]   = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSnap, roomSnap] = await Promise.all([
          getDocs(query(collection(db, 'reservations'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'rooms')),
        ]);

        const reservations = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const rooms        = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const revByYear    = {};
        const nightsByYear = {};

        reservations.forEach(r => {
          if (r.status !== 'booked') return;
          const room = rooms.find(rm => rm.id === r.roomId);
          if (!room) return;

          const checkIn  = r.checkIn?.toDate  ? r.checkIn.toDate()  : new Date(r.checkIn);
          const checkOut = r.checkOut?.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
          const n        = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
          const total    = (room.price || 0) * n;
          const year     = checkIn.getFullYear();
          const month    = checkIn.getMonth();

          if (!revByYear[year])    revByYear[year]    = Array(12).fill(0);
          if (!nightsByYear[year]) nightsByYear[year] = Array(12).fill(0);

          revByYear[year][month]    += total;
          nightsByYear[year][month] += n;
        });

        // Sort newest first in the dropdown
        const sortedYears = Object.keys(revByYear).map(Number).sort((a, b) => b - a);

        setAllData(revByYear);
        setAllNights(nightsByYear);
        setYears(sortedYears);

        const currentYear = new Date().getFullYear();
        setSelYear(sortedYears.includes(currentYear) ? currentYear : sortedYears[0] ?? currentYear);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const monthly     = allData[selYear]   || Array(12).fill(0);
  const nights      = allNights[selYear] || Array(12).fill(0);
  const maxRev      = Math.max(...monthly, 1);
  const currentYear = new Date().getFullYear();
  const currentM    = new Date().getMonth();
  const totalRev    = monthly.reduce((a, b) => a + b, 0);
  const totalNights = nights.reduce((a, b) => a + b, 0);
  const thisMonthRev = selYear === currentYear ? monthly[currentM] : null;

  return (
    <div className="adm-panel">

      {/* ── Header ── */}
      <div className="adm-panel-head">
        <span className="adm-panel-title">Revenue Overview</span>

        {/* Year filter dropdown */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{
            position: 'absolute', left: 10, fontSize: 12,
            pointerEvents: 'none', color: 'var(--gold)', zIndex: 1,
          }}>
            📅
          </span>
          <select
            value={selYear ?? ''}
            onChange={e => setSelYear(Number(e.target.value))}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'var(--ink-3)',
              border: '1px solid var(--border-2)',
              borderRadius: 8,
              color: 'var(--gold)',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              padding: '5px 32px 5px 30px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: 105,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--gold-glow)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border-2)')}
          >
            {years.length === 0 && (
              <option value={currentYear}>{currentYear}</option>
            )}
            {years.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          {/* Chevron */}
          <span style={{
            position: 'absolute', right: 9, fontSize: 9,
            color: 'var(--text-3)', pointerEvents: 'none',
          }}>▼</span>
        </div>
      </div>

      <div className="adm-panel-body">

        {/* ── Summary row ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            {
              label: `${selYear ?? '—'} Revenue`,
              val:   `$${totalRev.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`,
              color: 'var(--gold)',
            },
            {
              label: 'Total Nights',
              val:   totalNights,
              color: 'var(--teal)',
            },
            thisMonthRev !== null
              ? { label: 'This Month',  val: `$${thisMonthRev.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`, color: 'var(--violet)' }
              : { label: 'Avg / Month', val: `$${Math.round(totalRev / 12).toLocaleString('en-CA', { maximumFractionDigits: 0 })}`, color: 'var(--violet)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart ── */}
        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /></div>
        ) : (
          <div style={{ position: 'relative' }}>

            {/* Hover tooltip */}
            {tooltip && (
              <div style={{
                position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--ink-4)', border: '1px solid var(--border-2)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                fontFamily: 'var(--font-mono)', color: 'var(--gold)',
                whiteSpace: 'nowrap', zIndex: 10,
              }}>
                {tooltip}
              </div>
            )}

            {totalRev === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">📊</div>
                <div className="adm-empty-text">No revenue data for {selYear}</div>
              </div>
            ) : (
              <div className="adm-rev-chart">
                {monthly.map((val, i) => {
                  const heightPct = (val / maxRev) * 100;
                  const isCurrent = selYear === currentYear && i === currentM;
                  return (
                    <div key={i} className="adm-rev-bar-wrap">
                      <div
                        className={`adm-rev-bar ${isCurrent ? 'current' : ''}`}
                        style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}
                        onMouseEnter={() =>
                          setTooltip(`${MONTHS[i]} ${selYear}: $${val.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`)
                        }
                        onMouseLeave={() => setTooltip(null)}
                      />
                      <span className="adm-rev-month">{MONTHS[i]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;