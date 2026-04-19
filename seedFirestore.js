/**
 * seedFirestore.js
 * ─────────────────────────────────────────────────────────────
 * ONE-TIME script to populate your Firestore with realistic dummy data.
 * Updated to match the full registration form fields.
 *
 * HOW TO RUN:
 *   1. Place this file in your project root (same level as package.json)
 *   2. Run:  node seedFirestore.js
 *   3. Done! Check your Firebase console to see the data.
 *
 * WHAT IT CREATES:
 *   • 4 room documents  (rooms collection)
 *   • 30 reservation documents  (reservations collection)
 *     — mix of: occupied (checkedInAt set), upcoming (booked, future),
 *               pending, checked-out
 *
 * FIELDS COVERED (matching RoomContext + Reservation form):
 *   Core:     pname, email, phone, checkIn, checkOut, adults, kids,
 *             roomId, roomName, roomNumber, status, createdAt
 *   Personal: address, city, province, country, postalCode, company
 *   ID:       driverLicNo, dob, plateNumber
 *   Payment:  deposit, returnedDeposit, methodOfPayment
 *   Admin:    clerk, numberOfRooms
 *   Timestamps: checkedInAt, checkedOutAt (where applicable)
 * ─────────────────────────────────────────────────────────────
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} = require('firebase/firestore');

// ── Firebase config (same as src/config/firebase.js) ─────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDFePwSoEz4tEA97GUyBAsPu6UMTtgRoUU",
  authDomain: "goodnightinn2026.firebaseapp.com",
  projectId: "goodnightinn2026",
  storageBucket: "goodnightinn2026.firebasestorage.app",
  messagingSenderId: "998426403387",
  appId: "1:998426403387:web:f8341e2a533dc7bbe6b21e"
};


const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Helpers ───────────────────────────────────────────────────────────────────
const days   = (n) => n * 24 * 60 * 60 * 1000;
const ts     = (date) => Timestamp.fromDate(new Date(date));
const past   = (n) => new Date(Date.now() - days(n));
const future = (n) => new Date(Date.now() + days(n));

// ── Room definitions ──────────────────────────────────────────────────────────
const ROOM_TYPES = [
  { name: 'Queen Bed',      price: 129, maxPerson: 2, size: 30 },
  { name: 'Two Queen Beds', price: 159, maxPerson: 4, size: 70 },
  { name: 'King Bed',       price: 189, maxPerson: 2, size: 50 },
  { name: 'Kitchenette',    price: 219, maxPerson: 4, size: 50 },
];

// ── Realistic Canadian guest data ─────────────────────────────────────────────
const GUESTS = [
  {
    pname: 'James Carter',
    email: 'james.carter@gmail.com',
    phone: '416-555-0101',
    address: '142 Maple Ave',
    city: 'Toronto',
    province: 'ON',
    country: 'Canada',
    postalCode: 'M4B 1B3',
    company: '',
    driverLicNo: 'C12345-67890-12345',
    dob: '1985-03-14',
    plateNumber: 'AZGR 421',
  },
  {
    pname: 'Sophia Williams',
    email: 'sophia.w@outlook.com',
    phone: '647-555-0202',
    address: '88 King St W',
    city: 'Hamilton',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L8P 1B1',
    company: 'Williams Consulting',
    driverLicNo: 'W98765-43210-98765',
    dob: '1990-07-22',
    plateNumber: 'BRTX 884',
  },
  {
    pname: 'Liam Johnson',
    email: 'liam.j@hotmail.com',
    phone: '905-555-0303',
    address: '305 Rideau St',
    city: 'Ottawa',
    province: 'ON',
    country: 'Canada',
    postalCode: 'K1N 5Y9',
    company: '',
    driverLicNo: 'J54321-09876-54321',
    dob: '1978-11-05',
    plateNumber: 'CLMN 257',
  },
  {
    pname: 'Olivia Brown',
    email: 'olivia.brown@gmail.com',
    phone: '416-555-0404',
    address: '77 Queen St E',
    city: 'Mississauga',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L5G 4T3',
    company: 'Brown Realty Inc.',
    driverLicNo: 'B11111-22222-33333',
    dob: '1993-04-18',
    plateNumber: 'DPQR 639',
  },
  {
    pname: 'Noah Davis',
    email: 'noah.davis@yahoo.com',
    phone: '647-555-0505',
    address: '210 Bloor St W',
    city: 'Toronto',
    province: 'ON',
    country: 'Canada',
    postalCode: 'M5S 1T8',
    company: '',
    driverLicNo: 'D44444-55555-66666',
    dob: '1988-09-30',
    plateNumber: 'EKLM 102',
  },
  {
    pname: 'Emma Wilson',
    email: 'emma.wilson@gmail.com',
    phone: '905-555-0606',
    address: '512 Main St',
    city: 'Niagara Falls',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L2E 3S2',
    company: '',
    driverLicNo: 'W77777-88888-99999',
    dob: '1995-02-14',
    plateNumber: 'FNST 774',
  },
  {
    pname: 'Mason Garcia',
    email: 'mason.g@outlook.com',
    phone: '416-555-0707',
    address: '19 Harbour St',
    city: 'Burlington',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L7R 2Y2',
    company: 'Garcia Logistics',
    driverLicNo: 'G22222-33333-44444',
    dob: '1982-06-07',
    plateNumber: 'GVWX 518',
  },
  {
    pname: 'Ava Martinez',
    email: 'ava.martinez@gmail.com',
    phone: '647-555-0808',
    address: '44 Park Rd',
    city: 'St. Catharines',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L2R 6P9',
    company: '',
    driverLicNo: 'M55555-66666-77777',
    dob: '1997-12-25',
    plateNumber: 'HABC 361',
  },
  {
    pname: 'Ethan Anderson',
    email: 'ethan.a@hotmail.com',
    phone: '905-555-0909',
    address: '900 Dundas St W',
    city: 'Welland',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L3C 1C2',
    company: 'Anderson Tech',
    driverLicNo: 'A88888-99999-00000',
    dob: '1975-08-19',
    plateNumber: 'IJKL 945',
  },
  {
    pname: 'Isabella Thomas',
    email: 'isabella.t@gmail.com',
    phone: '416-555-1010',
    address: '60 College St',
    city: 'Toronto',
    province: 'ON',
    country: 'Canada',
    postalCode: 'M5G 1A6',
    company: '',
    driverLicNo: 'T11111-00000-99999',
    dob: '1991-01-03',
    plateNumber: 'JMNO 287',
  },
  {
    pname: 'Lucas Jackson',
    email: 'lucas.j@outlook.com',
    phone: '647-555-1111',
    address: '33 Oak St',
    city: 'Fort Erie',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L2A 1M8',
    company: '',
    driverLicNo: 'J22222-11111-00000',
    dob: '1986-05-12',
    plateNumber: 'KPQR 412',
  },
  {
    pname: 'Mia White',
    email: 'mia.white@gmail.com',
    phone: '905-555-1212',
    address: '128 Victoria Ave',
    city: 'Grimsby',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L3M 1K3',
    company: 'White Events Co.',
    driverLicNo: 'W33333-22222-11111',
    dob: '1994-10-31',
    plateNumber: 'LSTU 856',
  },
  {
    pname: 'Logan Harris',
    email: 'logan.harris@yahoo.com',
    phone: '416-555-1313',
    address: '7 Elm Dr',
    city: 'Thorold',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L2V 1Y6',
    company: '',
    driverLicNo: 'H44444-33333-22222',
    dob: '1980-03-28',
    plateNumber: 'MUVW 193',
  },
  {
    pname: 'Charlotte Lewis',
    email: 'charlotte.l@gmail.com',
    phone: '647-555-1414',
    address: '250 Church St',
    city: 'Pelham',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L0S 1E0',
    company: 'Lewis Architecture',
    driverLicNo: 'L55555-44444-33333',
    dob: '1989-07-04',
    plateNumber: 'NXYZ 627',
  },
  {
    pname: 'Aiden Clark',
    email: 'aiden.clark@hotmail.com',
    phone: '905-555-1515',
    address: '15 Cedar Lane',
    city: 'Wainfleet',
    province: 'ON',
    country: 'Canada',
    postalCode: 'L0S 1V0',
    company: '',
    driverLicNo: 'C66666-55555-44444',
    dob: '1998-11-17',
    plateNumber: 'OABC 034',
  },
];

// ── Clerks on staff ───────────────────────────────────────────────────────────
const CLERKS = ['Priya', 'Raj', 'Mike', 'Sarah'];

// ── Payment methods (matching PAYMENT_METHODS in your components) ─────────────
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'E-Transfer', 'Other'];

const randClerk   = () => CLERKS[Math.floor(Math.random() * CLERKS.length)];
const randPayment = () => PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
const randDeposit = () => [0, 50, 100, 150, 200][Math.floor(Math.random() * 5)];

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
      size:        room.size,
      description: `Comfortable ${room.name} room with all modern amenities. Includes free WiFi, flat-screen TV, coffee maker, and daily housekeeping.`,
    });
    roomIds[room.name] = ref.id;
    console.log(`✅ Room created: ${room.name} → ID: ${ref.id}`);
  }

  // ── Step 2: Build reservations ──────────────────────────────────────────────
  //
  // Status logic (must match getEffectiveStatus in your components):
  //   status: 'booked' + checkedInAt set + checkOut in future  → "in-house"
  //   status: 'booked' + no checkedInAt  + checkIn in future   → "upcoming"
  //   status: 'booked' + checkOut in past (auto)               → "checked-out"
  //   status: 'checked-out' + checkedOutAt                     → "checked-out"
  //   status: 'pending'                                        → "pending"

  const reservations = [

    // ══════════════════════════════════════════════════════════════════════════
    //  CURRENTLY IN-HOUSE  (status: booked, checkedInAt set, checkOut future)
    // ══════════════════════════════════════════════════════════════════════════
    {
      ...GUESTS[0],
      roomName: 'Queen Bed',      roomNumber: 1,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(2)),      checkOut: ts(future(2)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(2)),
      deposit: 100, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Priya',
      createdAt: ts(past(5)),
    },
    {
      ...GUESTS[1],
      roomName: 'Queen Bed',      roomNumber: 2,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(1)),      checkOut: ts(future(3)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(1)),
      deposit: 100, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Raj',
      createdAt: ts(past(4)),
    },
    {
      ...GUESTS[2],
      roomName: 'Two Queen Beds', roomNumber: 6,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(3)),      checkOut: ts(future(1)),
      adults: 3, kids: 1,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(3)),
      deposit: 150, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Mike',
      createdAt: ts(past(7)),
    },
    {
      ...GUESTS[3],
      roomName: 'Two Queen Beds', roomNumber: 8,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(1)),      checkOut: ts(future(4)),
      adults: 4, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(1)),
      deposit: 200, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Sarah',
      createdAt: ts(past(3)),
    },
    {
      ...GUESTS[4],
      roomName: 'King Bed',       roomNumber: 11,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(2)),      checkOut: ts(future(5)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(2)),
      deposit: 150, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Priya',
      createdAt: ts(past(6)),
    },
    {
      ...GUESTS[5],
      roomName: 'King Bed',       roomNumber: 13,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(1)),      checkOut: ts(future(2)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(1)),
      deposit: 100, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Raj',
      createdAt: ts(past(2)),
    },
    {
      ...GUESTS[6],
      roomName: 'Kitchenette',    roomNumber: 16,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(4)),      checkOut: ts(future(3)),
      adults: 2, kids: 2,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(4)),
      deposit: 200, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Mike',
      createdAt: ts(past(8)),
    },
    {
      ...GUESTS[7],
      roomName: 'Kitchenette',    roomNumber: 18,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(1)),      checkOut: ts(future(6)),
      adults: 3, kids: 1,        numberOfRooms: 1,
      status: 'booked',
      checkedInAt: ts(past(1)),
      deposit: 150, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Sarah',
      createdAt: ts(past(3)),
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  UPCOMING  (status: booked, no checkedInAt, checkIn in future)
    // ══════════════════════════════════════════════════════════════════════════
    {
      ...GUESTS[8],
      roomName: 'Queen Bed',      roomNumber: 3,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(5)),    checkOut: ts(future(8)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      deposit: 100, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Priya',
      createdAt: ts(past(2)),
    },
    {
      ...GUESTS[9],
      roomName: 'Queen Bed',      roomNumber: 4,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(10)),   checkOut: ts(future(13)),
      adults: 1, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      deposit: 50, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Raj',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[10],
      roomName: 'Two Queen Beds', roomNumber: 7,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(future(3)),    checkOut: ts(future(7)),
      adults: 4, kids: 2,        numberOfRooms: 1,
      status: 'booked',
      deposit: 200, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Mike',
      createdAt: ts(past(4)),
    },
    {
      ...GUESTS[11],
      roomName: 'King Bed',       roomNumber: 12,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(7)),    checkOut: ts(future(10)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      deposit: 100, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Sarah',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[12],
      roomName: 'Kitchenette',    roomNumber: 17,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(future(4)),    checkOut: ts(future(9)),
      adults: 2, kids: 2,        numberOfRooms: 1,
      status: 'booked',
      deposit: 150, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Priya',
      createdAt: ts(past(3)),
    },
    {
      ...GUESTS[13],
      roomName: 'King Bed',       roomNumber: 14,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(14)),   checkOut: ts(future(17)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'booked',
      deposit: 100, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Raj',
      createdAt: ts(past(2)),
    },
    {
      ...GUESTS[14],
      roomName: 'Two Queen Beds', roomNumber: 9,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(future(6)),    checkOut: ts(future(9)),
      adults: 3, kids: 1,        numberOfRooms: 1,
      status: 'booked',
      deposit: 150, returnedDeposit: null,
      methodOfPayment: 'Debit Card',
      clerk: 'Mike',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[0],
      roomName: 'Kitchenette',    roomNumber: 19,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(future(20)),   checkOut: ts(future(24)),
      adults: 2, kids: 1,        numberOfRooms: 1,
      status: 'booked',
      deposit: 200, returnedDeposit: null,
      methodOfPayment: 'Credit Card',
      clerk: 'Sarah',
      createdAt: ts(past(1)),
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  PENDING  (status: pending — awaiting admin confirmation)
    // ══════════════════════════════════════════════════════════════════════════
    {
      ...GUESTS[1],
      roomName: 'Queen Bed',      roomNumber: 5,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(8)),    checkOut: ts(future(11)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'pending',
      deposit: null, returnedDeposit: null,
      methodOfPayment: '',
      clerk: '',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[3],
      roomName: 'King Bed',       roomNumber: 15,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(5)),    checkOut: ts(future(8)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'pending',
      deposit: null, returnedDeposit: null,
      methodOfPayment: '',
      clerk: '',
      createdAt: ts(past(0.5)),
    },
    {
      ...GUESTS[5],
      roomName: 'Two Queen Beds', roomNumber: 10,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(future(12)),   checkOut: ts(future(15)),
      adults: 4, kids: 1,        numberOfRooms: 1,
      status: 'pending',
      deposit: null, returnedDeposit: null,
      methodOfPayment: '',
      clerk: '',
      createdAt: ts(past(1)),
    },
    {
      ...GUESTS[7],
      roomName: 'Kitchenette',    roomNumber: 20,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(future(9)),    checkOut: ts(future(13)),
      adults: 2, kids: 2,        numberOfRooms: 1,
      status: 'pending',
      deposit: null, returnedDeposit: null,
      methodOfPayment: '',
      clerk: '',
      createdAt: ts(past(0.3)),
    },
    {
      ...GUESTS[9],
      roomName: 'Queen Bed',      roomNumber: 1,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(future(18)),   checkOut: ts(future(21)),
      adults: 1, kids: 0,        numberOfRooms: 1,
      status: 'pending',
      deposit: null, returnedDeposit: null,
      methodOfPayment: '',
      clerk: '',
      createdAt: ts(past(0.2)),
    },
    {
      ...GUESTS[11],
      roomName: 'King Bed',       roomNumber: 12,
      roomId: roomIds['King Bed'],
      checkIn:  ts(future(25)),   checkOut: ts(future(28)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'pending',
      deposit: null, returnedDeposit: null,
      methodOfPayment: '',
      clerk: '',
      createdAt: ts(past(0.1)),
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  CHECKED-OUT  (this month — for revenue stats)
    // ══════════════════════════════════════════════════════════════════════════
    {
      ...GUESTS[2],
      roomName: 'Queen Bed',      roomNumber: 2,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(14)),     checkOut: ts(past(11)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(14)),
      checkedOutAt: ts(past(11)),
      deposit: 100, returnedDeposit: 100,
      methodOfPayment: 'Debit Card',
      clerk: 'Raj',
      createdAt: ts(past(16)),
    },
    {
      ...GUESTS[4],
      roomName: 'Two Queen Beds', roomNumber: 6,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(10)),     checkOut: ts(past(7)),
      adults: 3, kids: 1,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(10)),
      checkedOutAt: ts(past(7)),
      deposit: 150, returnedDeposit: 150,
      methodOfPayment: 'Credit Card',
      clerk: 'Priya',
      createdAt: ts(past(12)),
    },
    {
      ...GUESTS[6],
      roomName: 'King Bed',       roomNumber: 11,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(8)),      checkOut: ts(past(5)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(8)),
      checkedOutAt: ts(past(5)),
      deposit: 150, returnedDeposit: 100,
      methodOfPayment: 'Debit Card',
      clerk: 'Mike',
      createdAt: ts(past(10)),
    },
    {
      ...GUESTS[8],
      roomName: 'Kitchenette',    roomNumber: 16,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(6)),      checkOut: ts(past(3)),
      adults: 2, kids: 1,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(6)),
      checkedOutAt: ts(past(3)),
      deposit: 200, returnedDeposit: 200,
      methodOfPayment: 'Credit Card',
      clerk: 'Sarah',
      createdAt: ts(past(8)),
    },
    {
      ...GUESTS[10],
      roomName: 'Queen Bed',      roomNumber: 3,
      roomId: roomIds['Queen Bed'],
      checkIn:  ts(past(5)),      checkOut: ts(past(3)),
      adults: 1, kids: 0,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(5)),
      checkedOutAt: ts(past(3)),
      deposit: 50, returnedDeposit: 50,
      methodOfPayment: 'Debit Card',
      clerk: 'Raj',
      createdAt: ts(past(7)),
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  CHECKED-OUT  (last month — for revenue comparison delta)
    // ══════════════════════════════════════════════════════════════════════════
    {
      ...GUESTS[12],
      roomName: 'King Bed',       roomNumber: 13,
      roomId: roomIds['King Bed'],
      checkIn:  ts(past(45)),     checkOut: ts(past(42)),
      adults: 2, kids: 0,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(45)),
      checkedOutAt: ts(past(42)),
      deposit: 150, returnedDeposit: 150,
      methodOfPayment: 'Credit Card',
      clerk: 'Priya',
      createdAt: ts(past(47)),
    },
    {
      ...GUESTS[13],
      roomName: 'Two Queen Beds', roomNumber: 7,
      roomId: roomIds['Two Queen Beds'],
      checkIn:  ts(past(38)),     checkOut: ts(past(35)),
      adults: 4, kids: 0,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(38)),
      checkedOutAt: ts(past(35)),
      deposit: 200, returnedDeposit: 200,
      methodOfPayment: 'Debit Card',
      clerk: 'Mike',
      createdAt: ts(past(40)),
    },
    {
      ...GUESTS[14],
      roomName: 'Kitchenette',    roomNumber: 17,
      roomId: roomIds['Kitchenette'],
      checkIn:  ts(past(32)),     checkOut: ts(past(28)),
      adults: 2, kids: 2,        numberOfRooms: 1,
      status: 'checked-out',
      checkedInAt: ts(past(32)),
      checkedOutAt: ts(past(28)),
      deposit: 200, returnedDeposit: 150,
      methodOfPayment: 'Credit Card',
      clerk: 'Sarah',
      createdAt: ts(past(34)),
    },
  ];

  // ── Insert all reservations ─────────────────────────────────────────────────
  for (const res of reservations) {
    await addDoc(collection(db, 'reservations'), res);
    const statusLabel =
      res.status === 'checked-out' ? 'checked-out' :
      res.checkedInAt              ? 'in-house'     :
      res.status === 'pending'     ? 'pending'      :
                                     'upcoming';
    console.log(`📋 ${res.pname.padEnd(20)} → Room ${String(res.roomNumber).padEnd(4)} ${res.roomName.padEnd(16)} (${statusLabel})`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`   Rooms created:        ${ROOM_TYPES.length}`);
  console.log(`   Reservations created: ${reservations.length}`);
  console.log(`   - In-house:           8  (booked + checkedInAt)`);
  console.log(`   - Upcoming:           8  (booked, future check-in)`);
  console.log(`   - Pending:            6  (awaiting confirmation)`);
  console.log(`   - Checked-out:        8  (5 this month + 3 last month)`);
  console.log('\n🔥 Check your Firebase console → Firestore Database\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});