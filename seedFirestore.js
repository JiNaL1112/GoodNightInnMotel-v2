/**
 * seedFirestore.js
 * ─────────────────────────────────────────────────────────────
 * ONE-TIME script to populate your Firestore with dummy data.
 *
 * HOW TO RUN:
 *   1. Place this file in your project root (same level as package.json)
 *   2. Run:  node seedFirestore.js
 *   3. Done! Check your Firebase console to see the data.
 *
 * WHAT IT CREATES:
 *   • 4 room documents  (rooms collection)
 *   • 30 reservation documents  (reservations collection)
 *     — mix of: booked (current), booked (past), pending, checked-out
 * ─────────────────────────────────────────────────────────────
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// ── Paste your Firebase config here (same as src/config/firebase.js) ──────────

const firebaseConfig = {
  apiKey: "AIzaSyCbclH1nS5O7IbWH5oEJsVL-LBWGUeEUhY",
  authDomain: "goodnightinn-fe916.firebaseapp.com",
  projectId: "goodnightinn-fe916",
  storageBucket: "goodnightinn-fe916.firebasestorage.app",
  messagingSenderId: "960107487429",
  appId: "1:960107487429:web:252e7b09937899b62fd0ac",
  measurementId: "G-ELQQ14GLFY"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Helpers ───────────────────────────────────────────────────────────────────
const days  = (n) => n * 24 * 60 * 60 * 1000;
const ts    = (date) => Timestamp.fromDate(new Date(date));
const past  = (n) => new Date(Date.now() - days(n));
const future= (n) => new Date(Date.now() + days(n));

// ── Room definitions (matches your AdminRoomStatus ROOM_TYPES) ────────────────
const ROOM_TYPES = [
  { name: 'Queen Bed',      price: 129, maxPerson: 2, slots: [101,102,103,104,105] },
  { name: 'Two Queen Beds', price: 159, maxPerson: 4, slots: [201,202,203,204,205] },
  { name: 'King Bed',       price: 189, maxPerson: 2, slots: [301,302,303,304,305] },
  { name: 'Kitchenette',    price: 219, maxPerson: 4, slots: [401,402,403,404,405] },
];

// ── Fake guest data ───────────────────────────────────────────────────────────
const GUESTS = [
  { pname: 'James Carter',    email: 'james.carter@gmail.com',    phone: '416-555-0101' },
  { pname: 'Sophia Williams', email: 'sophia.w@outlook.com',      phone: '647-555-0202' },
  { pname: 'Liam Johnson',    email: 'liam.j@hotmail.com',        phone: '905-555-0303' },
  { pname: 'Olivia Brown',    email: 'olivia.brown@gmail.com',    phone: '416-555-0404' },
  { pname: 'Noah Davis',      email: 'noah.davis@yahoo.com',      phone: '647-555-0505' },
  { pname: 'Emma Wilson',     email: 'emma.wilson@gmail.com',     phone: '905-555-0606' },
  { pname: 'Mason Garcia',    email: 'mason.g@outlook.com',       phone: '416-555-0707' },
  { pname: 'Ava Martinez',    email: 'ava.martinez@gmail.com',    phone: '647-555-0808' },
  { pname: 'Ethan Anderson',  email: 'ethan.a@hotmail.com',       phone: '905-555-0909' },
  { pname: 'Isabella Thomas', email: 'isabella.t@gmail.com',      phone: '416-555-1010' },
  { pname: 'Lucas Jackson',   email: 'lucas.j@outlook.com',       phone: '647-555-1111' },
  { pname: 'Mia White',       email: 'mia.white@gmail.com',       phone: '905-555-1212' },
  { pname: 'Logan Harris',    email: 'logan.harris@yahoo.com',    phone: '416-555-1313' },
  { pname: 'Charlotte Lewis', email: 'charlotte.l@gmail.com',     phone: '647-555-1414' },
  { pname: 'Aiden Clark',     email: 'aiden.clark@hotmail.com',   phone: '905-555-1515' },
];

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 Starting Firestore seed...\n');

  // ── Step 1: Insert rooms ────────────────────────────────────────────────────
  const roomIds = {};

  for (const room of ROOM_TYPES) {
    const ref = await addDoc(collection(db, 'rooms'), {
      name:        room.name,
      price:       room.price,
      maxPerson:   room.maxPerson,
      description: `Comfortable ${room.name} room with all modern amenities. Includes free WiFi, flat-screen TV, and daily housekeeping.`,
    });
    roomIds[room.name] = ref.id;
    console.log(`✅ Room created: ${room.name} → ID: ${ref.id}`);
  }

  // ── Step 2: Insert reservations ─────────────────────────────────────────────
  // We'll create a realistic spread:
  //   - 8 currently occupied (check-in past, check-out future)  → status: booked
  //   - 8 upcoming future bookings                              → status: booked
  //   - 6 pending requests                                      → status: pending
  //   - 5 past checked-out stays                                → status: checked-out
  //   - 3 past checked-out stays from last month (for revenue)  → status: checked-out

  const reservations = [

    // ── CURRENTLY OCCUPIED (check-in ≤ today ≤ check-out) ──────────────────
    {
      ...GUESTS[0], roomName: 'Queen Bed',      roomNumber: 101,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(2)),   checkOut: ts(future(2)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(5)),
    },
    {
      ...GUESTS[1], roomName: 'Queen Bed',      roomNumber: 102,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(1)),   checkOut: ts(future(3)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(4)),
    },
    {
      ...GUESTS[2], roomName: 'Two Queen Beds', roomNumber: 201,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(3)),   checkOut: ts(future(1)),
      adults: 3, kids: 1, status: 'booked',
      createdAt: ts(past(7)),
    },
    {
      ...GUESTS[3], roomName: 'Two Queen Beds', roomNumber: 203,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(1)),   checkOut: ts(future(4)),
      adults: 4, kids: 0, status: 'booked',
      createdAt: ts(past(3)),
    },
    {
      ...GUESTS[4], roomName: 'King Bed',       roomNumber: 301,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(2)),   checkOut: ts(future(5)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(6)),
    },
    {
      ...GUESTS[5], roomName: 'King Bed',       roomNumber: 303,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(1)),   checkOut: ts(future(2)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(2)),
    },
    {
      ...GUESTS[6], roomName: 'Kitchenette',    roomNumber: 401,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(4)),   checkOut: ts(future(3)),
      adults: 2, kids: 2, status: 'booked',
      createdAt: ts(past(8)),
    },
    {
      ...GUESTS[7], roomName: 'Kitchenette',    roomNumber: 403,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(1)),   checkOut: ts(future(6)),
      adults: 3, kids: 1, status: 'booked',
      createdAt: ts(past(3)),
    },

    // ── UPCOMING FUTURE BOOKINGS ─────────────────────────────────────────────
    {
      ...GUESTS[8],  roomName: 'Queen Bed',      roomNumber: 103,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(5)),  checkOut: ts(future(8)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(2)),
    },
    {
      ...GUESTS[9],  roomName: 'Queen Bed',      roomNumber: 104,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(10)), checkOut: ts(future(13)),
      adults: 1, kids: 0, status: 'booked',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[10], roomName: 'Two Queen Beds', roomNumber: 202,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(future(3)),  checkOut: ts(future(7)),
      adults: 4, kids: 2, status: 'booked',
      createdAt: ts(past(4)),
    },
    {
      ...GUESTS[11], roomName: 'King Bed',       roomNumber: 302,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(7)),  checkOut: ts(future(10)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[12], roomName: 'Kitchenette',    roomNumber: 402,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(future(4)),  checkOut: ts(future(9)),
      adults: 2, kids: 2, status: 'booked',
      createdAt: ts(past(3)),
    },
    {
      ...GUESTS[13], roomName: 'King Bed',       roomNumber: 304,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(14)), checkOut: ts(future(17)),
      adults: 2, kids: 0, status: 'booked',
      createdAt: ts(past(2)),
    },
    {
      ...GUESTS[14], roomName: 'Two Queen Beds', roomNumber: 204,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(future(6)),  checkOut: ts(future(9)),
      adults: 3, kids: 1, status: 'booked',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[0],  roomName: 'Kitchenette',    roomNumber: 404,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(future(20)), checkOut: ts(future(24)),
      adults: 2, kids: 1, status: 'booked',
      createdAt: ts(past(1)),
    },

    // ── PENDING REQUESTS ─────────────────────────────────────────────────────
    {
      ...GUESTS[1], roomName: 'Queen Bed',      roomNumber: 105,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(8)),  checkOut: ts(future(11)),
      adults: 2, kids: 0, status: 'pending',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[3], roomName: 'King Bed',       roomNumber: 305,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(5)),  checkOut: ts(future(8)),
      adults: 2, kids: 0, status: 'pending',
      createdAt: ts(past(0.5)),
    },
    {
      ...GUESTS[5], roomName: 'Two Queen Beds', roomNumber: 205,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(future(12)), checkOut: ts(future(15)),
      adults: 4, kids: 1, status: 'pending',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[7], roomName: 'Kitchenette',    roomNumber: 405,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(future(9)),  checkOut: ts(future(13)),
      adults: 2, kids: 2, status: 'pending',
      createdAt: ts(past(0.3)),
    },
    {
      ...GUESTS[9], roomName: 'Queen Bed',      roomNumber: 101,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(18)), checkOut: ts(future(21)),
      adults: 1, kids: 0, status: 'pending',
      createdAt: ts(past(0.2)),
    },
    {
      ...GUESTS[11], roomName: 'King Bed',      roomNumber: 302,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(25)), checkOut: ts(future(28)),
      adults: 2, kids: 0, status: 'pending',
      createdAt: ts(past(0.1)),
    },

    // ── PAST / CHECKED-OUT (this month) ──────────────────────────────────────
    {
      ...GUESTS[2], roomName: 'Queen Bed',      roomNumber: 102,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(14)), checkOut: ts(past(11)),
      adults: 2, kids: 0, status: 'checked-out',
      createdAt: ts(past(16)), checkedOutAt: ts(past(11)),
    },
    {
      ...GUESTS[4], roomName: 'Two Queen Beds', roomNumber: 201,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(10)), checkOut: ts(past(7)),
      adults: 3, kids: 1, status: 'checked-out',
      createdAt: ts(past(12)), checkedOutAt: ts(past(7)),
    },
    {
      ...GUESTS[6], roomName: 'King Bed',       roomNumber: 301,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(8)),  checkOut: ts(past(5)),
      adults: 2, kids: 0, status: 'checked-out',
      createdAt: ts(past(10)), checkedOutAt: ts(past(5)),
    },
    {
      ...GUESTS[8], roomName: 'Kitchenette',    roomNumber: 401,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(6)),  checkOut: ts(past(3)),
      adults: 2, kids: 1, status: 'checked-out',
      createdAt: ts(past(8)),  checkedOutAt: ts(past(3)),
    },
    {
      ...GUESTS[10], roomName: 'Queen Bed',     roomNumber: 103,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(5)),  checkOut: ts(past(3)),
      adults: 1, kids: 0, status: 'checked-out',
      createdAt: ts(past(7)),  checkedOutAt: ts(past(3)),
    },

    // ── PAST / CHECKED-OUT (last month — for revenue comparison) ─────────────
    {
      ...GUESTS[12], roomName: 'King Bed',      roomNumber: 303,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(45)), checkOut: ts(past(42)),
      adults: 2, kids: 0, status: 'checked-out',
      createdAt: ts(past(47)), checkedOutAt: ts(past(42)),
    },
    {
      ...GUESTS[13], roomName: 'Two Queen Beds',roomNumber: 202,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(38)), checkOut: ts(past(35)),
      adults: 4, kids: 0, status: 'checked-out',
      createdAt: ts(past(40)), checkedOutAt: ts(past(35)),
    },
    {
      ...GUESTS[14], roomName: 'Kitchenette',   roomNumber: 402,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(32)), checkOut: ts(past(28)),
      adults: 2, kids: 2, status: 'checked-out',
      createdAt: ts(past(34)), checkedOutAt: ts(past(28)),
    },
  ];

  // Insert all reservations
  for (const res of reservations) {
    await addDoc(collection(db, 'reservations'), res);
    console.log(`📋 Reservation added: ${res.pname} → ${res.roomName} ${res.roomNumber} (${res.status})`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`   Rooms created:        ${ROOM_TYPES.length}`);
  console.log(`   Reservations created: ${reservations.length}`);
  console.log(`   - Currently occupied: 8`);
  console.log(`   - Upcoming booked:    8`);
  console.log(`   - Pending:            6`);
  console.log(`   - Checked-out:        8`);
  console.log('\n🔥 Check your Firebase console → Firestore Database\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});