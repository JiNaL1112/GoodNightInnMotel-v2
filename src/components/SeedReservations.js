import React, { useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Dummy guest data ───────────────────────────────────────────
const GUESTS = [
  { pname: 'James Harrington',  email: 'james.harrington@gmail.com',   phone: '+1 (416) 555-0101' },
  { pname: 'Sophie Tremblay',   email: 'sophie.tremblay@hotmail.com',  phone: '+1 (647) 555-0202' },
  { pname: 'Daniel Okonkwo',    email: 'daniel.okonkwo@yahoo.com',     phone: '+1 (905) 555-0303' },
  { pname: 'Emily Nguyen',      email: 'emily.nguyen@gmail.com',       phone: '+1 (416) 555-0404' },
  { pname: 'Marco Bellini',     email: 'marco.bellini@outlook.com',    phone: '+1 (519) 555-0505' },
  { pname: 'Aisha Patel',       email: 'aisha.patel@gmail.com',        phone: '+1 (905) 555-0606' },
  { pname: 'Tyler Brooks',      email: 'tyler.brooks@gmail.com',       phone: '+1 (647) 555-0707' },
  { pname: 'Fatima Al-Rashid',  email: 'fatima.alrashid@hotmail.com',  phone: '+1 (416) 555-0808' },
  { pname: 'Lucas Ferreira',    email: 'lucas.ferreira@gmail.com',     phone: '+1 (289) 555-0909' },
  { pname: 'Chloe Dubois',      email: 'chloe.dubois@gmail.com',       phone: '+1 (905) 555-1010' },
  { pname: 'Nathan Kim',        email: 'nathan.kim@outlook.com',       phone: '+1 (416) 555-1111' },
  { pname: 'Priya Sharma',      email: 'priya.sharma@gmail.com',       phone: '+1 (647) 555-1212' },
  { pname: 'Oliver White',      email: 'oliver.white@gmail.com',       phone: '+1 (519) 555-1313' },
  { pname: 'Sara Johansson',    email: 'sara.johansson@hotmail.com',   phone: '+1 (416) 555-1414' },
  { pname: 'Carlos Mendoza',    email: 'carlos.mendoza@yahoo.com',     phone: '+1 (905) 555-1515' },
];

// ─── Helper: random int between min and max (inclusive) ─────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Helper: make a Date object from year, month (0-based), day ─
const makeDate = (year, month, day) => new Date(year, month, day, rand(10, 18), 0, 0);

// ─── Build the dummy reservation list using real room data ───────
const buildDummyReservations = (rooms) => {
  const records = [];

  // Spread reservations across 2024 and 2025 — roughly 20 per year
  const schedule = [
    // 2024
    { year: 2024, month: 0,  days: [5,  12] },
    { year: 2024, month: 1,  days: [8,  20] },
    { year: 2024, month: 2,  days: [3,  17] },
    { year: 2024, month: 3,  days: [10, 25] },
    { year: 2024, month: 4,  days: [1,  15] },
    { year: 2024, month: 5,  days: [7,  22] },
    { year: 2024, month: 6,  days: [4,  18] },
    { year: 2024, month: 7,  days: [9,  28] },
    { year: 2024, month: 8,  days: [5,  20] },
    { year: 2024, month: 9,  days: [12, 26] },
    { year: 2024, month: 10, days: [3,  19] },
    { year: 2024, month: 11, days: [8,  22] },
    // 2025
    { year: 2025, month: 0,  days: [6,  18] },
    { year: 2025, month: 1,  days: [10, 24] },
    { year: 2025, month: 2,  days: [4,  16] },
    { year: 2025, month: 3,  days: [9,  23] },
    { year: 2025, month: 4,  days: [2,  14] },
    { year: 2025, month: 5,  days: [11, 25] },
    { year: 2025, month: 6,  days: [7,  20] },
    { year: 2025, month: 7,  days: [3,  17] },
    { year: 2025, month: 8,  days: [8,  22] },
    { year: 2025, month: 9,  days: [5,  19] },
    { year: 2025, month: 10, days: [10, 27] },
    { year: 2025, month: 11, days: [6,  20] },
  ];

  let guestIdx = 0;

  schedule.forEach(({ year, month, days }) => {
    days.forEach((startDay) => {
      const room       = rooms[rand(0, rooms.length - 1)];
      const stayNights = rand(1, 5);
      const checkIn    = makeDate(year, month, startDay);
      const checkOut   = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + stayNights);

      const guest = GUESTS[guestIdx % GUESTS.length];
      guestIdx++;

      records.push({
        pname:      guest.pname,
        email:      guest.email,
        phone:      guest.phone,
        checkIn,
        checkOut,
        adults:     rand(1, 3),
        kids:       rand(0, 2),
        roomId:     room.id,
        roomName:   room.name,
        roomNumber: String(rand(101, 215)),
        status:     'booked',
        createdAt:  checkIn,   // createdAt matches checkIn for realistic ordering
      });
    });
  });

  return records;
};

// ─── Component ───────────────────────────────────────────────────
const SeedReservations = () => {
  const [status,   setStatus]   = useState('idle');  // idle | loading | done | error
  const [count,    setCount]    = useState(0);
  const [message,  setMessage]  = useState('');

  const handleSeed = async () => {
    if (!window.confirm('This will add ~48 dummy reservations to Firestore. Continue?')) return;

    setStatus('loading');
    setMessage('Fetching rooms…');

    try {
      // 1. Fetch real rooms so dummy records use valid roomId values
      const roomSnap = await getDocs(collection(db, 'rooms'));
      const rooms    = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (rooms.length === 0) {
        setStatus('error');
        setMessage('No rooms found in Firestore. Add rooms first.');
        return;
      }

      // 2. Build dummy records
      const records = buildDummyReservations(rooms);
      setMessage(`Writing ${records.length} reservations…`);

      // 3. Write to Firestore in batches (one by one to avoid rate limits)
      let written = 0;
      for (const record of records) {
        await addDoc(collection(db, 'reservations'), record);
        written++;
        setCount(written);
      }

      setStatus('done');
      setMessage(`✅ Successfully added ${written} dummy reservations across 2024–2025.`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{
      background: 'var(--ink-2)',
      border: '1px solid var(--border-2)',
      borderRadius: 12,
      padding: 24,
      marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: 1, textTransform: 'uppercase' }}>
            🌱 Seed Dummy Reservations
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            Injects ~48 realistic test bookings across Jan 2024 – Dec 2025 using your real room IDs.
          </div>
        </div>

        <button
          onClick={handleSeed}
          disabled={status === 'loading' || status === 'done'}
          style={{
            background: status === 'done' ? 'rgba(80,216,144,0.15)' : 'var(--gold-dim)',
            border: `1px solid ${status === 'done' ? 'rgba(80,216,144,0.3)' : 'var(--gold-glow)'}`,
            color: status === 'done' ? 'var(--green)' : 'var(--gold)',
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-disp)',
            cursor: status === 'loading' || status === 'done' ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' ? 0.6 : 1,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'idle'    && '▶ Run Seed'}
          {status === 'loading' && `⏳ Writing ${count}…`}
          {status === 'done'    && '✓ Done'}
          {status === 'error'   && '⚠ Retry'}
        </button>
      </div>

      {/* Progress / message */}
      {message && (
        <div style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: status === 'error' ? 'var(--rose)' : status === 'done' ? 'var(--green)' : 'var(--text-3)',
          background: 'var(--ink-3)',
          borderRadius: 6,
          padding: '8px 12px',
        }}>
          {message}
        </div>
      )}

      {/* Loading bar */}
      {status === 'loading' && (
        <div style={{ marginTop: 10, height: 4, background: 'var(--ink-3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.round((count / 48) * 100)}%`,
            background: 'var(--gold)',
            borderRadius: 4,
            transition: 'width 0.2s',
          }} />
        </div>
      )}

      {/* Warning */}
      {status === 'idle' && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
          ⚠ Remove this component from your dashboard after seeding — it's for development only.
        </div>
      )}
    </div>
  );
};

export default SeedReservations;