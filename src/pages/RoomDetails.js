import React,{useContext , useEffect} from 'react';
import { useParams } from 'react-router-dom';
//components
import AdultsDropdown from '../components/AdultsDropdown';
import CheckIn from '../components/CheckIn';
import CheckOut from '../components/CheckOut';
import KidsDropdown from '../components/KidsDropdown';
//scroll top component
import ScrollToTop from '../components/ScrollToTop';

//contenxt
import { RoomContext } from '../context/RoomContext';



//icons
import {FaCheck} from 'react-icons/fa';

import { FaWifi, FaTv, FaCoffee, FaWind, FaSwimmingPool } from 'react-icons/fa';
import { MdOutlineKitchen } from 'react-icons/md';



const RoomDetails = () => {
  const {
    pname, setPName,
    email, setEmail,
    phone, setPhone,
    checkInDate, setCheckInDate,
    checkOutDate, setCheckOutDate,
    adults, setAdults,
    kids, setKids,
    handleReservation , 
    rooms ,
    setSelectedRoomId, setSelectedRoomName
  } = useContext(RoomContext);

  const { id} = useParams();
  
  // get room
 
  const room = rooms.find(room => room.id.toString() === id);

  // Amenities list
  const facilitiesList = [
  { name: 'Free Wifi', icon: <FaWifi /> },
  { name: 'Fridge', icon: <MdOutlineKitchen /> },
  { name: 'TV', icon: <FaTv /> },
  { name: 'Hair Dryer', icon: <FaWind /> }, // alternative icon
  { name: 'Coffee Maker', icon: <FaCoffee /> },
  { name: 'Swimming Pool', icon: <FaSwimmingPool /> },
];



  useEffect(() => {
    if (room) {
      setSelectedRoomId(room.id);
      setSelectedRoomName(room.name); // Make sure 'name' is a field in your room data
    }
  }, [room]);

  if (!room) {
  return (
    <section className='py-24 text-center'>
      <h2 className='text-3xl font-semibold mb-4'>Room Not Found</h2>
      <p className='text-gray-500'>We couldn't find the room you're looking for.</p>
    </section>
  );
}

// Now it's safe to destructure
const { name, description, facilities, imageLg, price } = room;
  


  return <section>
    <ScrollToTop />
    {/*banner */}
    <div className='bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center'>
      {/*overlay */}
      <div className='absolute w-full h-full bg-black/70'></div>
      {/* title */}
      <h1 className='text-6xl text-white z-20 font-primary text-center'>
        {name} Details
      </h1>
    </div>
    <div className='container mx-auto'>
      <div className='flex flex-col lg:flex-row h-full py-24'>
        {/* Left */}
        <div className='w-full h-full lg:w-[60%] px-6 '>
          <h2 className='h2'>{name}</h2>
          <p className='mb-8'>{description}</p>
          <img src={imageLg} alt='' />
          { /* facilities */}
          <div className='mt-12'>
            <h3 className='h3 mb-3'>Room Facilities</h3>
            { /*grid */}
            <div className='grid grid-cols-3 gap-6 mb-12'>
            
      
       
          {facilitiesList.map((item, index) => (
            <div className='flex items-center gap-x-3 flex-1' key={index}>
              <div className='text-3xl text-accent'>{item.icon}</div>
              <div className='text-base'>{item.name}</div>
            </div>
          ))}


            </div>
          </div>
        </div>
        { /* right */}
        <div className='w-full h-full lg:w-[40%]'>
          {/* reservation */}
          

          <div className='py-9 px-6 bg-accent/20 mb-12'>
  <div className='flex flex-col space-y-4 mb-4'>
    <h3>Your Reservation</h3>

    <input
      type='text'
      placeholder='Your Name'
      value={pname}
      onChange={(e) => setPName(e.target.value)}
      className='border border-gray-300 rounded px-4 py-2'
    />
    <input
      type='email'
      placeholder='Email'
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className='border border-gray-300 rounded px-4 py-2'
    />
    <input
      type='tel'
      placeholder='Phone Number'
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      className='border border-gray-300 rounded px-4 py-2'
    />

    <div className='h-[60px]'><CheckIn /></div>
    <div className='h-[60px]'><CheckOut /></div>
    <div className='h-[60px]'><AdultsDropdown /></div>
    <div className='h-[60px]'><KidsDropdown /></div>
  </div>

  <button
    onClick={handleReservation}
    className='btn btn-lg btn-primary w-full mb-4'
  >
    Book now for ${price}
  </button>

  <a href='tel:+1234567890' className='btn btn-lg btn-secondary w-full text-center'>
    Call Admin Directly
  </a>
</div>

          {/* rules */}
          <div>
            <h3 className='h3'>Hotel Rules</h3>
            <p className='mb-6'>Lorem</p>
          </div>
          <ul className='flex flex-col gap-y-4'>
            <li className='flex items-center gap-x-4'>
              <FaCheck className='text-accent' />
              Check-in: 3:00 PM - 9:00 PM
            </li>
            <li className='flex items-center gap-x-4'>
              <FaCheck className='text-accent' />
              Check-out: 10:30 AM
            </li>
            <li className='flex items-center gap-x-4'>
              <FaCheck className='text-accent' />
              No Pets
            </li>
            <li className='flex items-center gap-x-4'>
              <FaCheck className='text-accent' />
              No Smoking
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>;
};

export default RoomDetails;
