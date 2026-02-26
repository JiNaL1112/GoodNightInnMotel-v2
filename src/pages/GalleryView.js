import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import ScrollToTop from '../components/ScrollToTop';

const GalleryView = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        const imgs = querySnapshot.docs.map(doc => doc.data().base64); // adapt if your field name is different
        setImages(imgs);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  return (
    <section>
      <ScrollToTop />
      {/*banner */}
      <div className='bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center'>
        {/*overlay */}
        <div className='absolute w-full h-full bg-black/70'></div>
        {/* title */}
        <h1 className='text-6xl text-white z-20 font-primary text-center'>
          Motel Images
        </h1>
      </div>

      <div className='bg-white min-h-[500px] p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
        {images.map((image, index) => (
          <div key={index} className='shadow-2xl rounded overflow-hidden group'>
            <img
              className='group-hover:scale-110 transition-all duration-300 w-full h-64 object-cover'
              src={image}
              alt={`gallery-${index + 1}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default GalleryView;
