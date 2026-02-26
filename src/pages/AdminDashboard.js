import React, { useContext, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // adjust path as needed
import ScrollToTop from '../components/ScrollToTop';
import { RoomContext } from '../context/RoomContext';
import RoomImg1 from '../assets/img/rooms/1.png'

const AdminDashboard = () => {
  const { rooms } = useContext(RoomContext);
  const [priceChanges, setPriceChanges] = useState({});

  const handlePriceChange = (roomId, newPrice) => {
    setPriceChanges(prev => ({ ...prev, [roomId]: newPrice }));
  };

  const updatePriceInFirebase = async (roomId ,roomName) => {
    const newPrice = priceChanges[roomId];
    console.log(newPrice,"NEwPrice")
    try {
      const roomRef = doc(db, 'rooms', roomId);
      console.log(roomRef)
      await updateDoc(roomRef, { price: Number(newPrice) });
      alert(`Updated price for room ${roomName}`);
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price');
    }
  };

  return (
    <section>
      <ScrollToTop />
      <div className='bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center'>
        <div className='absolute w-full h-full bg-black/70'></div>
        <h1 className='text-6xl text-white z-20 font-primary text-center'>Admin Dashboard</h1>
      </div>

      <div className='container mx-auto py-12'>
        {rooms.map((room) => (
          <div
            key={room.id}
            className='flex flex-col lg:flex-row h-full border p-6 mb-12 shadow-lg rounded-xl'
          >
            <div className='w-full lg:w-1/2 px-6'>
              <img src={RoomImg1} alt={room.name} className='rounded-xl' />
            </div>

            <div className='w-full lg:w-1/2 px-6'>
              <h2 className='text-2xl font-semibold mb-2'>{room.name}</h2>
              <p className='mb-4 text-gray-700'>{room.description}</p>
              <p className='mb-2'>Size: {room.size}m²</p>
              <p className='mb-4'>Max Persons: {room.maxPerson}</p>

              <div className='mb-4'>
                <label className='block mb-1 font-semibold'>Price ($):</label>
                <input
                  type='number'
                  value={priceChanges[room.id] ?? room.price}
                  onChange={(e) => handlePriceChange(room.id, e.target.value)}
                  className='border border-gray-300 rounded px-4 py-2 w-full'
                />
                <button
                  onClick={() => updatePriceInFirebase(room.id , room.name)}
                  className='mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminDashboard;
