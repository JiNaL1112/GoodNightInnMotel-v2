import React, { useState, useEffect, useContext } from 'react';
import LogoWhite from '../assets/img/Logo-white.png';
import LogoDark from '../assets/img/Logo-dark.png';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const [header, setHeader] = useState(true);
  const { user, role , login, logout , loading } = useContext(AuthContext);

  useEffect(() => {
    const handleScroll = () => {
      setHeader(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

   // ✅ Prevent render until role is ready
   if (loading) return null;
   
  const renderUserLinks = () => (
    <>
      <a href='/' className='hover:text-accent transition'>Home</a>
      <a href='/activities' className='hover:text-accent transition'>Activities</a>
      <a href='/gallery' className='hover:text-accent transition'>Gallery</a>
      <a href='/contact' className='hover:text-accent transition'>Contact</a>
    </>
  );

  const renderAdminLinks = () => (
    <>
      <a href='/admin/reservation' className='hover:text-accent transition'>Reservation</a>
      <a href='/admin/rooms' className='hover:text-accent transition'>Rooms</a>
      <a href='/admin/picturemanagement' className='hover:text-accent transition'>Picture Management</a>
    </>
  );

  return (
    <header
      className={`${header ? 'bg-white py-6 shadow-lg' : 'bg-transparent py-8'} fixed z-50 
      w-full transition-all duration-500`}
    >
      <div className='container mx-auto flex flex-col items-center gap-y-6 lg:flex-row lg:justify-between lg:gap-y-0'>
        {/* Logo */}
        <a href='/'>
          {header ? (
            <img className="h-20 object-contain" src={LogoDark} alt='Logo' />

          ) : (
            <img className="h-20 object-contain" src={LogoWhite} alt='Logo'   />
          )}
        </a>

        

        {/* Nav + Auth Button */}
        <div
          className={`${header ? 'text-primary' : 'text-white'}
          flex gap-x-4 lg:gap-x-8 font-tertiary tracking-[3px] text-[15px]
          items-center uppercase`}
        >
          {role === 'admin' ? renderAdminLinks() : renderUserLinks()}

          {/* Auth Button */}
          {user ? (
            <button
              onClick={logout}
              className='btn btn-secondary btn-sm rounded-lg'
            >
              Logout
            </button>
          ) : (
            
            <button 
             onClick={login}
            className='btn btn-primary btn-sm rounded-lg'>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
