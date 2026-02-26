import React, { createContext, useEffect, useState } from 'react';
import { collection, getDocs , addDoc  } from 'firebase/firestore';
import { db } from '../config/firebase';

import { imageData } from '../data';
import { data } from 'autoprefixer';


export const RoomContext = createContext();



const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pname, setPName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoomName, setSelectedRoomName] = useState('');
  


  const images = imageData;

  const roomsCollectionRef = collection(db,"rooms")

  const fetchRooms = async () => {
    setLoading(true);
    
    try{
      const snapshot = await getDocs(roomsCollectionRef);
      const roomsData = snapshot.docs.map((doc) => ({ 
        ...doc.data(),
        id: doc.id
      }))
      
      console.log(roomsData);
     setRooms(roomsData);
     setLoading(false);

    }catch(err){
      console.log(err)
    }
    
  };

  const handleClick = (e) => {
    e.preventDefault();
    setLoading(true);
    const newRooms = rooms.filter((room) => total <= room.maxPerson);
    setTimeout(() => {
      setRooms(newRooms);
      setLoading(false);
    }, 3000);
  };


  const handleReservation = async () => {
  try {


    await addDoc(collection(db, 'reservations'), {
      pname,
      email,
      phone,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults,
      kids,
      roomId: selectedRoomId,
      roomName: selectedRoomName,
      createdAt: new Date()
    });

    
    alert('Reservation request sent! Our admin will connect with you shortly to confirm your reservation.');
    // Optionally reset fields
    setPName('');
    setEmail('');
    setPhone('');
  } catch (error) {
    console.error('Reservation error:', error);
    alert('Failed to send reservation request.');
  }
};





  useEffect(() => {
    setTotal(Number(adults[0]) + Number(kids[0]));
  }, [adults, kids]);

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <RoomContext.Provider
  value={{
    rooms,
    adults,
    setAdults,
    kids,
    setKids,
    pname,
    setPName,
    email,
    setEmail,
    phone,
    setPhone,
    checkInDate,
    setCheckInDate,
    checkOutDate,
    setCheckOutDate,
    handleClick,
    loading,
    images,
    selectedRoomId,
    selectedRoomName,
    handleReservation,
    setSelectedRoomId, 
    setSelectedRoomName,
    
  }}
>
  {children}
</RoomContext.Provider>

  );
};

export default RoomProvider;
