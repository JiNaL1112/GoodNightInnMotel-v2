import React, { createContext, useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { imageData } from '../data';

export const RoomContext = createContext();

const RoomProvider = ({ children }) => {
  const [rooms,            setRooms]            = useState([]);
  const [loading,          setLoading]          = useState(false);

  // ── Core booking fields ────────────────────────────────────────────────────
  const [pname,            setPName]            = useState('');
  const [email,            setEmail]            = useState('');
  const [phone,            setPhone]            = useState('');
  const [checkInDate,      setCheckInDate]      = useState(null);
  const [checkOutDate,     setCheckOutDate]     = useState(null);
  const [adults,           setAdults]           = useState('1 Adult');
  const [kids,             setKids]             = useState('0 Kids');
  const [selectedRoomId,   setSelectedRoomId]   = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [roomNumber,       setRoomNumber]       = useState('');

  // ── Extended registration fields (matching physical form) ─────────────────
  const [address,          setAddress]          = useState('');
  const [city,             setCity]             = useState('');
  const [province,         setProvince]         = useState('');
  const [country,          setCountry]          = useState('');
  const [postalCode,       setPostalCode]       = useState('');
  const [company,          setCompany]          = useState('');
  const [driverLicNo,      setDriverLicNo]      = useState('');
  const [dob,              setDob]              = useState('');
  const [deposit,          setDeposit]          = useState('');
  const [returnedDeposit,  setReturnedDeposit]  = useState('');
  const [methodOfPayment,  setMethodOfPayment]  = useState('');
  const [plateNumber,      setPlateNumber]      = useState('');
  const [clerk,            setClerk]            = useState('');
  const [numberOfRooms,    setNumberOfRooms]    = useState(1);

  const images = imageData;

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

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);
    const numAdults = parseInt(adults) || 1;
    const numKids   = parseInt(kids)   || 0;
    const total     = numAdults + numKids;
    const filtered  = rooms.filter(room => total <= (room.maxPerson || 99));
    setTimeout(() => {
      setRooms(filtered);
      setLoading(false);
    }, 3000);
  };

  // ── Reset all form fields ──────────────────────────────────────────────────
  const resetForm = () => {
    setPName('');           setEmail('');            setPhone('');
    setCheckInDate(null);   setCheckOutDate(null);
    setAdults('1 Adult');   setKids('0 Kids');
    setSelectedRoomId('');  setSelectedRoomName(''); setRoomNumber('');
    setAddress('');         setCity('');             setProvince('');
    setCountry('');         setPostalCode('');       setCompany('');
    setDriverLicNo('');     setDob('');              setDeposit('');
    setReturnedDeposit(''); setMethodOfPayment('');  setPlateNumber('');
    setClerk('');           setNumberOfRooms(1);
  };

  const handleReservation = async () => {
    try {
      if (!pname.trim()) { alert('Please enter your full name.'); return; }
      if (!phone.trim()) { alert('Please enter your phone number.'); return; }
      const assignedRoomNumber = roomNumber || null;

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
        roomNumber: assignedRoomNumber,
        status:     'pending',
        createdAt:  new Date(),
        address,
        city,
        province,
        country,
        postalCode,
        company,
        driverLicNo,
        dob,
        deposit:         deposit        ? Number(deposit)        : null,
        returnedDeposit: returnedDeposit ? Number(returnedDeposit) : null,
        methodOfPayment,
        plateNumber,
        clerk,
        numberOfRooms:   Number(numberOfRooms) || 1,
      });

      alert('Reservation request sent! Our admin will connect with you shortly to confirm your reservation.');
      resetForm();
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
        pname,            setPName,
        email,            setEmail,
        phone,            setPhone,
        checkInDate,      setCheckInDate,
        checkOutDate,     setCheckOutDate,
        adults,           setAdults,
        kids,             setKids,
        selectedRoomId,   setSelectedRoomId,
        selectedRoomName, setSelectedRoomName,
        roomNumber,       setRoomNumber,
        address,          setAddress,
        city,             setCity,
        province,         setProvince,
        country,          setCountry,
        postalCode,       setPostalCode,
        company,          setCompany,
        driverLicNo,      setDriverLicNo,
        dob,              setDob,
        deposit,          setDeposit,
        returnedDeposit,  setReturnedDeposit,
        methodOfPayment,  setMethodOfPayment,
        plateNumber,      setPlateNumber,
        clerk,            setClerk,
        numberOfRooms,    setNumberOfRooms,
        handleClick,
        handleReservation,
        fetchRooms,
        resetForm,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;