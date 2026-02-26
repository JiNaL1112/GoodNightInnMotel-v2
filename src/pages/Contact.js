import React, { useState } from 'react';
import ScrollToTop from '../components/ScrollToTop';
import emailjs from '@emailjs/browser';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  

  const handleSubmit = (e) => {
  e.preventDefault();

  emailjs
    .send(
      'service_d3cy1e9', // e.g., 'service_xxx'
      'template_b98nics', // e.g., 'template_xxx'
      formData,
      '8nzBG6xAhz4eIyVij'   // e.g., 'your_user_id'
    )
    .then(
      () => {
        alert('Message sent successfully!');
        setFormData({ name: '', email: '', phone: '', subject: '' });
      },
      (error) => {
        alert('Failed to send message. Error: ' + error.text);
      }
    );
};


  return (
    <section >
      <ScrollToTop />
      {/*banner */}
      <div className='bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center'>
        {/*overlay */}
        <div className='absolute w-full h-full bg-black/70'></div>
        {/* title */}
        <h1 className='text-6xl text-white z-20 font-primary text-center'>
          Contact Us
        </h1>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
                
                {/* Google Map */}
      <div className="mb-12 overflow-hidden rounded-2xl shadow-xl border border-gray-200">
        <iframe
          title="Good Night Inn Location"
          width="100%"
          height="350"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed/v1/place?q=Good+Night+Inn+664+Main+St+W,+Port+Colborne,+Ontario,+Canada&key=AIzaSyB0G4b_xQd8d7z454PJuyPUyrY5kL0qkTc"
          allowFullScreen
        ></iframe>
      </div>

      {/* Flex Container for Address and Form */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Address Details */}
        <div className="bg-white shadow-xl rounded-2xl p-8 flex-1 border border-gray-100">
          <h2 className="text-3xl font-bold text-primary mb-4">Good Night Inn</h2>
          <p className="text-gray-600">664 Main St. W,</p>
          <p className="text-gray-600 mb-2">Port Colborne, Ontario L3K 5V4</p>
          <p className="text-gray-700">TOLL FREE: <a href="tel:1-833-855-1818" className="text-primary hover:underline">1-833-855-1818</a></p>
          <p className="text-gray-700">TEL: <a href="tel:1-905-835-1818" className="text-primary hover:underline">1-905-835-1818</a></p>
          <p className="text-gray-700 mb-4">Email: <a href="mailto:manager@goodnightinn.ca" className="text-primary hover:underline">manager@goodnightinn.ca</a></p>
          <button
  onClick={() =>
    window.open(
      "https://www.google.com/maps/dir/?api=1&destination=664+Main+St+W,+Port+Colborne,+Ontario,+Canada",
      "_blank",
      "noopener,noreferrer"
    )
  }
  className="btn btn-primary btn-sm rounded-lg"
>
  Get Directions
</button>

        </div>

        {/* Contact Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 shadow-2xl rounded-2xl flex-1 border border-gray-100"
        >
          <h3 className="text-2xl font-bold mb-6 text-primary text-center">Reservation Inquiry</h3>

          <div className="mb-5">
            <label htmlFor="name" className="block mb-1 font-semibold text-primary">Name *</label>
            <input
              required
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="email" className="block mb-1 font-semibold text-primary">Email *</label>
            <input
              required
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="phone" className="block mb-1 font-semibold text-primary">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="subject" className="block mb-1 font-semibold text-primary">Subject</label>
            <textarea
              id="subject"
              name="subject"
              rows="4"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn btn-secondary btn-sm max-w-[240px] mx-auto"
          >
            Submit
          </button>
        </form>
      </div>
      </div>
      
    </section>
  );
};

export default Contact;
