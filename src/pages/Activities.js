// src/pages/Activities.js
import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase'; // your firebase config file
import { collection, getDocs } from 'firebase/firestore';
import ScrollToTop from '../components/ScrollToTop';

const Activities = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'activities'));
        const activitiesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesList);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };

    fetchActivities();
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
          Local Attractions & Activities
        </h1>
      </div>

    
    <div className="p-4 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <img src={activity.imageUrl} alt={activity.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-semibold">{activity.name}</h2>
              <p className="text-gray-600">{activity.location}</p>
              <p className="text-gray-600">{activity.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    </section>
  );
  
};

export default Activities;
