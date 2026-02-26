import React from 'react';
import { Link } from 'react-router-dom';
import { BsArrowsFullscreen, BsPeople } from 'react-icons/bs';

const tagColors = {
  'Best Value':    { bg: '#dcfce7', color: '#15803d' },
  'Family Fave':   { bg: '#dbeafe', color: '#1d4ed8' },
  'Most Spacious': { bg: '#fef9c3', color: '#92400e' },
  'Extended Stay': { bg: '#fce7f3', color: '#9d174d' },
};

const Room = ({ room }) => {
  const { id, name, size, maxPerson, description, price, imageData, tag } = room;

  const tagStyle = tag && tagColors[tag]
    ? tagColors[tag]
    : { bg: '#e5e7eb', color: '#374151' };

  return (
    <div className="room-card">
      {/* Image */}
      <div
        className="room-card-img"
        style={{
          background: imageData
            ? `url(${imageData}) center/cover`
            : 'linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%)',
        }}
      >
        {!imageData && <span className="room-card-emoji">🛏️</span>}

        {tag && (
          <span
            className="room-card-tag"
            style={{ background: tagStyle.bg, color: tagStyle.color }}
          >
            {tag}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="room-card-body">
        <div className="room-card-top">
          <Link to={`/room/${id}`} style={{ textDecoration: 'none' }}>
            <h3 className="room-card-name">{name}</h3>
          </Link>
          <div className="room-card-price">
            <span className="price-amount">${price}</span>
            <span className="price-per">/night</span>
          </div>
        </div>

        <p className="room-card-desc">
          {description ? description.slice(0, 80) + '…' : 'Comfortable, clean, and ready for your stay.'}
        </p>

        <div className="room-card-meta">
          <span className="room-meta-pill">
            <BsPeople style={{ display: 'inline', marginRight: 4 }} />
            Up to {maxPerson}
          </span>
          <span className="room-meta-pill">
            <BsArrowsFullscreen style={{ display: 'inline', marginRight: 4 }} />
            {size}m²
          </span>
        </div>

        <Link to={`/room/${id}`} className="btn-primary room-card-btn">
          Book This Room →
        </Link>
      </div>
    </div>
  );
};

export default Room;