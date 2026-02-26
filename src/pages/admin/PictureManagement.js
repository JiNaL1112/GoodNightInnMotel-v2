import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import ScrollToTop from '../../components/ScrollToTop';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

const PictureManagement = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch all images from Firestore
  const fetchImages = async () => {
    const snapshot = await getDocs(collection(db, 'gallery'));
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setImages(items);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Upload image as base64 string
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64String = reader.result; // base64 encoded string

      try {
        await addDoc(collection(db, 'gallery'), {
          base64: base64String,
          createdAt: serverTimestamp()
        });

        await fetchImages();
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Delete image document from Firestore
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
      fetchImages();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <section>
      <ScrollToTop />
      <div className='bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center'>
        <div className='absolute w-full h-full bg-black/70'></div>
        <h1 className='text-6xl text-white z-20 font-primary text-center'>Admin Dashboard</h1>
      </div>
   
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Picture Management</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="mb-4"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group">
            <img
              src={img.base64}
              alt="Gallery"
              className="rounded shadow-md w-full h-48 object-cover"
            />
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
     </section>
  );
};

export default PictureManagement;
