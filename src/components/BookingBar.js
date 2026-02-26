import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomContext } from '../context/RoomContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BookingBar = () => {
  const { checkInDate, setCheckInDate, checkOutDate, setCheckOutDate, adults, setAdults } = useContext(RoomContext);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/#rooms');
  };

  return (
    <section className="booking-bar">
      <div className="booking-bar-inner container">
        <div className="booking-label-row">
          <span className="booking-bar-title">Quick Availability Check</span>
          <span className="booking-bar-sub">No credit card required to check</span>
        </div>
        <form className="booking-fields" onSubmit={handleSearch}>
          <div className="booking-field">
            <label className="booking-field-label">Check In</label>
            <DatePicker
              selected={checkInDate}
              onChange={date => setCheckInDate(date)}
              placeholderText="Select date"
              className="booking-input"
              minDate={new Date()}
            />
          </div>
          <div className="booking-field-divider" />
          <div className="booking-field">
            <label className="booking-field-label">Check Out</label>
            <DatePicker
              selected={checkOutDate}
              onChange={date => setCheckOutDate(date)}
              placeholderText="Select date"
              className="booking-input"
              minDate={checkInDate || new Date()}
            />
          </div>
          <div className="booking-field-divider" />
          <div className="booking-field">
            <label className="booking-field-label">Guests</label>
            <select
              className="booking-input booking-select"
              value={adults}
              onChange={e => setAdults(e.target.value)}
            >
              <option>1 Adult</option>
              <option>2 Adults</option>
              <option>3 Adults</option>
              <option>4 Adults</option>
              <option>2 Adults, 1 Kid</option>
              <option>2 Adults, 2 Kids</option>
            </select>
          </div>
          <button type="submit" className="booking-btn">
            Check Rooms →
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingBar;
