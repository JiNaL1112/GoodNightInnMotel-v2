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
            const isBlocked = !!room.blocked;

            const tagMap = {
              'Queen Bed':      'Best Value',
              'Two Queen Beds': 'Family Fave',
              'King Bed':       'Most Spacious',
              'Kitchenette':    'Extended Stay',
            };
            const tag = room.tag || tagMap[room.name] || 'Great Stay';
            const tagStyle = tagColors[tag] || { bg: '#e5e7eb', color: '#374151' };

            return (
              <div
                key={room.id}
                className={`room-card ${visible ? 'anim-in' : 'anim-hidden'}`}
                style={{
                  transitionDelay: `${i * 0.1}s`,
                  // dim blocked rooms slightly
                  opacity: isBlocked ? 0.8 : 1,
                  position: 'relative',
                }}
              >
                {/* Image / placeholder */}
                <div
                  className="room-card-img"
                  style={{
                    background: room.imageData
                      ? `url(${room.imageData}) center/cover`
                      : cardBgs[i % cardBgs.length],
                    filter: isBlocked ? 'grayscale(60%)' : 'none',
                  }}
                >
                  {!room.imageData && (
                    <span className="room-card-emoji">{cardEmojis[i % cardEmojis.length]}</span>
                  )}

                  {/* Show "Unavailable" badge instead of the normal tag when blocked */}
                  {isBlocked ? (
                    <span
                      className="room-card-tag"
                      style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}
                    >
                      🚫 Unavailable
                    </span>
                  ) : (
                    <span
                      className="room-card-tag"
                      style={{ background: tagStyle.bg, color: tagStyle.color }}
                    >
                      {tag}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="room-card-body">
                  <div className="room-card-top">
                    <h3 className="room-card-name">{room.name}</h3>
                    <div className="room-card-price">
                      {isBlocked ? (
                        <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 600 }}>
                          Not available
                        </span>
                      ) : (
                        <>
                          <span className="price-amount">${room.price}</span>
                          <span className="price-per">/night</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="room-card-desc">
                    {isBlocked
                      ? 'This room type is currently not available for booking. Please check back later or contact us directly.'
                      : (room.description ? room.description.slice(0, 80) + '…' : 'Comfortable, clean, and ready for your stay.')}
                  </p>

                  <div className="room-card-meta">
                    <span className="room-meta-pill">👥 Up to {room.maxPerson}</span>
                    <span className="room-meta-pill">📐 {room.size}m²</span>
                  </div>

                  {/* Show disabled button for blocked rooms, normal link otherwise */}
                  {isBlocked ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 26px',
                        borderRadius: 'var(--radius)',
                        fontSize: '14px',
                        fontWeight: '600',
                        background: '#f3f4f6',
                        color: '#9ca3af',
                        border: '1.5px solid #e5e7eb',
                        cursor: 'not-allowed',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      🚫 Currently Unavailable
                    </button>
                  ) : (
                    <Link to={`/room/${room.id}`} className="btn-primary room-card-btn">
                      Book This Room →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RoomHighlights;