import React, { useContext, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ScrollToTop from '../../components/ScrollToTop';
import { RoomContext } from '../../context/RoomContext';

const Rooms = () => {
  const { rooms } = useContext(RoomContext);
  const [priceChanges, setPriceChanges] = useState({});
  const [descriptionChanges, setDescriptionChanges] = useState({});
  const [imageFiles, setImageFiles] = useState({});
  const [uploading, setUploading] = useState(false);

  const handlePriceChange = (roomId, newPrice) => {
    setPriceChanges(prev => ({ ...prev, [roomId]: newPrice }));
  };

  const handleDescriptionChange = (roomId, newDescription) => {
    setDescriptionChanges(prev => ({ ...prev, [roomId]: newDescription }));
  };

  const handleImageChange = (roomId, file) => {
    setImageFiles(prev => ({ ...prev, [roomId]: file }));
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const uploadImageAndSave = async (roomId, roomName) => {
    setUploading(true);
    try {
      let imageData = null;

      if (imageFiles[roomId]) {
        imageData = await getBase64(imageFiles[roomId]);
      }

      const room = rooms.find(r => r.id === roomId);

      const updateData = {
        price: Number(priceChanges[roomId] ?? room.price),
        description: descriptionChanges[roomId] ?? room.description,
      };

      if (imageData) {
        updateData.imageData = imageData;
      }

      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, updateData);
      alert(`Updated room ${roomName}`);
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update');
    }
    setUploading(false);
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
              <img
                src={room.imageData ?? 'https://via.placeholder.com/400x300?text=No+Image'}
                alt={room.name}
                className='rounded-xl w-full h-[300px] object-cover'
              />
            </div>

            <div className='w-full lg:w-1/2 px-6'>
              <h2 className='text-2xl font-semibold mb-2'>{room.name}</h2>

              <div className='mb-4'>
                <label className='block mb-1 font-semibold'>Description:</label>
                <textarea
                  value={descriptionChanges[room.id] ?? room.description}
                  onChange={(e) => handleDescriptionChange(room.id, e.target.value)}
                  className='border border-gray-300 rounded px-4 py-2 w-full'
                  rows={3}
                />
              </div>

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
              </div>

              <div className='mb-4'>
                <label className='block mb-1 font-semibold'>Upload Image:</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => handleImageChange(room.id, e.target.files[0])}
                  className='border border-gray-300 rounded px-4 py-2 w-full'
                />
              </div>

              <button
                onClick={() => uploadImageAndSave(room.id, room.name)}
                className={`mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Rooms;
