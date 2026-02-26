import React from 'react';

// Home section components

import HeroSection from '../components/HeroSection';
import BookingBar from '../components/BookingBar';
import WhyUs from '../components/WhyUs';
import RoomHighlights from '../components/RoomHighlights';
import Testimonials from '../components/Testimonials';
import LocationBanner from '../components/LocationBanner';
import CtaBanner from '../components/CtaBanner';
import AmenitiesStrip from '../components/AmenitiesStrip';

const Home = () => {
  return (
    <>
      <HeroSection />
      <BookingBar />
      <WhyUs />
      <RoomHighlights />
      <AmenitiesStrip />
      <Testimonials />
      <LocationBanner />
      <CtaBanner />
    </>
  );
};

export default Home;
