import React, { createContext, useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { imageData } from '../data';

export const RoomContext = createContext();

// Room slots — used to auto-assign a room number when the guest doesn't pick one
const ROOM_SLOTS = {
  'Queen Bed':      [101, 102, 103, 104, 105],
  'Two Queen Beds': [201, 202, 203, 204, 205],
  'King Bed':       [301, 302, 303, 304, 305],
  'Kitchenette':    [401, 402, 403, 404, 405],
};

const RoomProvider = ({ children }) => {
  const [rooms,            setRooms]            = useState([]);
  const [loading,          setLoading]          = useState(false);

  // Booking form fields
  const [pname,            setPName]            = useState('');
  const [email,            setEmail]            = useState('');
  const [phone,            setPhone]            = useState('');
  const [checkInDate,      setCheckInDate]      = useState(null);
  const [checkOutDate,     setCheckOutDate]     = useState(null);
  const [adults,           setAdults]           = useState('1 Adult');
  const [kids,             setKids]             = useState('0 Kids');
  const [selectedRoomId,   setSelectedRoomId]   = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  // ── NEW: roomNumber is now tracked in context so it saves correctly ──────────
  const [roomNumber,       setRoomNumber]       = useState('');

  const images = imageData;

  // ── Fetch rooms from Firestore ─────────────────────────────────────────────
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'rooms'));
      const roomsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setRooms(roomsData);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter rooms by guest count (used on public search bar) ───────────────
  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);
    // Parse "2 Adults" → 2, "1 Kid" → 1, etc.
    const numAdults = parseInt(adults) || 1;
    const numKids   = parseInt(kids)   || 0;
    const total     = numAdults + numKids;
    const filtered  = rooms.filter(room => total <= (room.maxPerson || 99));
    setTimeout(() => {
      setRooms(filtered);
      setLoading(false);
    }, 3000);
  };

  // ── Submit public reservation request ─────────────────────────────────────
  // FIX: now saves roomNumber + status:'pending' so admin room grid works correctly
  const handleReservation = async () => {
    try {
      // If guest didn't pick a specific room number, auto-assign the first slot
      // for their chosen room type (admin can reassign later)
      const assignedRoomNumber =
        roomNumber ||
        (selectedRoomName && ROOM_SLOTS[selectedRoomName]
          ? ROOM_SLOTS[selectedRoomName][0]
          : null);

      await addDoc(collection(db, 'reservations'), {
        pname,
        email,
        phone,
        checkIn:    checkInDate,
        checkOut:   checkOutDate,
        adults,
        kids,
        roomId:     selectedRoomId,
        roomName:   selectedRoomName,
        roomNumber: assignedRoomNumber,   // ← FIXED: was missing before
        status:     'pending',            // ← FIXED: was missing before
        createdAt:  new Date(),
      });

      alert('Reservation request sent! Our admin will connect with you shortly to confirm your reservation.');

      // Reset form fields
      setPName('');
      setEmail('');
      setPhone('');
      setCheckInDate(null);
      setCheckOutDate(null);
      setAdults('1 Adult');
      setKids('0 Kids');
      setSelectedRoomId('');
      setSelectedRoomName('');
      setRoomNumber('');
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Failed to send reservation request. Please try again.');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <RoomContext.Provider
      value={{
        rooms,
        loading,
        images,

        // Booking form state
        pname,            setPName,
        email,            setEmail,
        phone,            setPhone,
        checkInDate,      setCheckInDate,
        checkOutDate,     setCheckOutDate,
        adults,           setAdults,
        kids,             setKids,
        selectedRoomId,   setSelectedRoomId,
        selectedRoomName, setSelectedRoomName,
        roomNumber,       setRoomNumber,   // ← NEW: exposed so forms can set it

        // Actions
        handleClick,
        handleReservation,
        fetchRooms,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;