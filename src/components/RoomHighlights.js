import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RoomContext } from '../context/RoomContext';

const tagColors = {
  'Best Value':    { bg: '#dcfce7', color: '#15803d' },
  'Family Fave':   { bg: '#dbeafe', color: '#1d4ed8' },
  'Most Spacious': { bg: '#fef9c3', color: '#92400e' },
  'Extended Stay': { bg: '#fce7f3', color: '#9d174d' },
};

const cardEmojis = ['🛏️', '🛌', '👑', '🍳'];
const cardBgs = [
  'linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%)',
  'linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)',
  'linear-gradient(135deg,#fef9c3 0%,#fefce8 100%)',
  'linear-gradient(135deg,#fce7f3 0%,#fdf2f8 100%)',
];

const RoomHighlights = () => {
  const { rooms } = useContext(RoomContext);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Show max 4 rooms on homepage
  const displayRooms = rooms.slice(0, 4);

  return (
    <section className="rooms-section" id="rooms" ref={ref}>
      <div className="container">
        <div className={`section-header ${visible ? 'anim-in' : 'anim-hidden'}`}>
          <span className="section-tag">Accommodations</span>
          <h2 className="section-heading">
            Find Your <em className="accent-em">Perfect Room</em>
          </h2>
          <p className="section-sub">All rooms include free WiFi, free parking, and daily housekeeping.</p>
        </div>

        <div className="rooms-grid" ref={ref}>
          {displayRooms.map((room, i) => {
            const tag = room.tag || Object.keys(tagColors)[i] || 'Great Stay';
            const tagStyle = tagColors[tag] || { bg: '#e5e7eb', color: '#374151' };

            return (
              <div
                key={room.id}
                className={`room-card ${visible ? 'anim-in' : 'anim-hidden'}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Image / placeholder */}
                <div
                  className="room-card-img"
                  style={{
                    background: room.imageData
                      ? `url(${room.imageData}) center/cover`
                      : cardBgs[i % cardBgs.length],
                  }}
                >
                  {!room.imageData && (
                    <span className="room-card-emoji">{cardEmojis[i % cardEmojis.length]}</span>
                  )}
                  <span
                    className="room-card-tag"
                    style={{ background: tagStyle.bg, color: tagStyle.color }}
                  >
                    {tag}
                  </span>
                </div>

                {/* Content */}
                <div className="room-card-body">
                  <div className="room-card-top">
                    <h3 className="room-card-name">{room.name}</h3>
                    <div className="room-card-price">
                      <span className="price-amount">${room.price}</span>
                      <span className="price-per">/night</span>
                    </div>
                  </div>

                  <p className="room-card-desc">
                    {room.description ? room.description.slice(0, 80) + '…' : 'Comfortable, clean, and ready for your stay.'}
                  </p>

                  <div className="room-card-meta">
                    <span className="room-meta-pill">👥 Up to {room.maxPerson}</span>
                    <span className="room-meta-pill">📐 {room.size}m²</span>
                  </div>

                  <Link to={`/room/${room.id}`} className="btn-primary room-card-btn">
                    Book This Room →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rooms-footer">
          <Link to="/#rooms" className="btn-outline-dark">View All Rooms</Link>
        </div>
      </div>
    </section>
  );
};

export default RoomHighlights;
