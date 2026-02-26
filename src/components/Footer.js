import React from 'react';
//logo
import LogoWhite from "../assets/img/Logo-white.png"


const Footer = () => {
  return <footer className='bg-primary py-12'>
    <div className='container mx-auto text-white flex justify-between'>
      {/* Logo */}
      <a href='/'>
         <img  src={LogoWhite} atl="" className="h-20 object-contain"/>
      </a>
      
      Copyright &copy; 2025. All rights reserved.
    </div>
  </footer>;
};

export default Footer;
