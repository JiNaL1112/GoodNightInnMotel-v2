import React, { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdultsDropdown from '../components/AdultsDropdown';
import CheckIn from '../components/CheckIn';
import CheckOut from '../components/CheckOut';
import KidsDropdown from '../components/KidsDropdown';
import ScrollToTop from '../components/ScrollToTop';
import { RoomContext } from '../context/RoomContext';
import { roomData } from '../data';
import { FaCheck } from 'react-icons/fa';
import { FaWifi, FaTv, FaCoffee, FaWind, FaSwimmingPool } from 'react-icons/fa';
import { MdOutlineKitchen } from 'react-icons/md';

const facilitiesConfig = [
  { name: 'Free WiFi',     icon: <FaWifi />,           color: '#dbeafe', border: '#bfdbfe', iconColor: '#2563eb' },
  { name: 'Fridge',        icon: <MdOutlineKitchen />, color: '#dcfce7', border: '#bbf7d0', iconColor: '#16a34a' },
  { name: 'Flat-Screen TV',icon: <FaTv />,             color: '#fef9c3', border: '#fde68a', iconColor: '#d97706' },
  { name: 'Hair Dryer',    icon: <FaWind />,           color: '#ede9fe', border: '#c4b5fd', iconColor: '#7c3aed' },
  { name: 'Coffee Maker',  icon: <FaCoffee />,         color: '#fce7f3', border: '#fbcfe8', iconColor: '#db2777' },
  { name: 'Swimming Pool', icon: <FaSwimmingPool />,   color: '#e0f2fe', border: '#bae6fd', iconColor: '#0284c7' },
];

const rules = [
  'Check-in: 3:00 PM – 9:00 PM',
  'Check-out: 10:30 AM',
  'No Pets Allowed',
  'No Smoking',
];

const RoomDetails = () => {
  const {
    pname, setPName,
    email, setEmail,
    phone, setPhone,
    checkInDate, setCheckInDate,
    checkOutDate, setCheckOutDate,
    adults, setAdults,
    kids, setKids,
    handleReservation,
    rooms,
    setSelectedRoomId, setSelectedRoomName,
  } = useContext(RoomContext);

  const { id } = useParams();
  const room = rooms.find(room => room.id.toString() === id);

  useEffect(() => {
    if (room) {
      setSelectedRoomId(room.id);
      setSelectedRoomName(room.name);
    }
  }, [room]);

  if (!room) {
    return (
      <section style={{ padding: '96px 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-disp)', fontSize: '32px', marginBottom: '12px' }}>Room Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>We couldn't find the room you're looking for.</p>
      </section>
    );
  }

  const { name, description, imageLg, imageData, price } = room;

  // Match local asset images from data.js by position (Firebase rooms are ordered same as data.js)
  const localRoom = roomData.find((r) => r.name === name) || roomData[0];
  const roomImage = imageData || localRoom?.imageLg || localRoom?.image || null;

  return (
    <section>
      <ScrollToTop />

      {/* Banner */}
      <div className="bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center">
        <div className="absolute w-full h-full bg-black/70" />
        <h1 className="text-6xl text-white z-20 font-primary text-center">{name} Details</h1>
      </div>

      <div className="container mx-auto">
        <div style={layoutStyle}>

          {/* ── LEFT COLUMN ── */}
          <div style={leftColStyle}>
            {/* Room title + desc */}
            <div style={{ marginBottom: '28px' }}>
              <span className="section-tag">Accommodation</span>
              <h2 style={roomTitleStyle}>{name}</h2>
              <p style={roomDescStyle}>{description}</p>
            </div>

            {/* Room image */}
            {roomImage && (
              <div style={imgWrapStyle}>
                <img src={roomImage} alt={name} style={imgStyle} />
              </div>
            )}

            {/* ── FACILITIES ── */}
            <div style={{ marginTop: '44px' }}>
              <span className="section-tag">What's Included</span>
              <h3 style={sectionHeadStyle}>
                Room <em className="accent-em">Facilities</em>
              </h3>
              <div style={facilitiesGridStyle}>
                {facilitiesConfig.map((f) => (
                  <div
                    key={f.name}
                    style={{
                      ...facilityCardStyle,
                      background: f.color,
                      border: `1.5px solid ${f.border}`,
                    }}
                    className="facility-card"
                  >
                    <div style={{ ...facilityIconWrapStyle, color: f.iconColor }}>
                      {f.icon}
                    </div>
                    <span style={facilityNameStyle}>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={rightColStyle}>

            {/* ── BOOKING FORM ── */}
            <div style={formCardStyle}>
              {/* Form header */}
              <div style={formHeaderStyle}>
                <div>
                  <div style={formBadgeStyle}>Reserve Your Stay</div>
                  <div style={formPriceRowStyle}>
                    <span style={formPriceStyle}>${price}</span>
                    <span style={formPricePerStyle}>/night</span>
                  </div>
                </div>
                <div style={formRatingStyle}>⭐ 4.9</div>
              </div>

              {/* Divider */}
              <div style={formDividerStyle} />

              {/* Fields */}
              <div style={formBodyStyle}>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={pname}
                    onChange={(e) => setPName(e.target.value)}
                    style={inputStyle}
                    className="form-input"
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    className="form-input"
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (000) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                    className="form-input"
                  />
                </div>

                {/* Date row */}
                <div style={dateRowStyle}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Check In</label>
                    <div style={datePickerWrapStyle}><CheckIn /></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Check Out</label>
                    <div style={datePickerWrapStyle}><CheckOut /></div>
                  </div>
                </div>

                {/* Guests row */}
                <div style={dateRowStyle}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Adults</label>
                    <div style={datePickerWrapStyle}><AdultsDropdown /></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Kids</label>
                    <div style={datePickerWrapStyle}><KidsDropdown /></div>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div style={formFooterStyle}>
                <button onClick={handleReservation} className="btn-primary" style={bookBtnStyle}>
                  Book Now — ${price}/night
                </button>
                <a href="tel:+18338551818" style={callBtnStyle} className="btn-outline-dark">
                  📞 Call to Reserve
                </a>
              </div>

              {/* Trust row */}
              <div style={trustRowStyle}>
                {['Free Cancellation', 'No Hidden Fees', 'Instant Confirm'].map(t => (
                  <span key={t} style={trustPillStyle}>✓ {t}</span>
                ))}
              </div>
            </div>

            {/* ── HOTEL RULES ── */}
            <div style={rulesCardStyle}>
              <h3 style={sectionHeadStyle}>Hotel <em className="accent-em">Rules</em></h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {rules.map((rule) => (
                  <li key={rule} style={ruleItemStyle}>
                    <span style={ruleIconStyle}><FaCheck /></span>
                    <span style={{ fontSize: '14px', color: 'var(--text-mid)' }}>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Styles ── */

const layoutStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: '48px',
  padding: '72px 24px',
  alignItems: 'flex-start',
};

const leftColStyle = {
  flex: '1 1 55%',
  minWidth: 0,
};

const rightColStyle = {
  flex: '1 1 40%',
  minWidth: '320px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  position: 'sticky',
  top: '88px',
};

const roomTitleStyle = {
  fontFamily: 'var(--font-disp)',
  fontSize: 'clamp(28px, 4vw, 42px)',
  fontWeight: '500',
  color: 'var(--text)',
  lineHeight: '1.2',
  margin: '8px 0 12px',
};

const roomDescStyle = {
  fontSize: '15px',
  color: 'var(--text-muted)',
  lineHeight: '1.8',
};

const imgWrapStyle = {
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-md)',
};

const imgStyle = {
  width: '100%',
  display: 'block',
  objectFit: 'cover',
};

const sectionHeadStyle = {
  fontFamily: 'var(--font-disp)',
  fontSize: '24px',
  fontWeight: '500',
  color: 'var(--text)',
  margin: '8px 0 20px',
};

const facilitiesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

const facilityCardStyle = {
  borderRadius: 'var(--radius)',
  padding: '16px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'default',
};

const facilityIconWrapStyle = {
  fontSize: '20px',
  flexShrink: 0,
  width: '36px',
  height: '36px',
  background: 'rgba(255,255,255,0.7)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const facilityNameStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text)',
  lineHeight: '1.3',
};

/* Form card */
const formCardStyle = {
  background: 'var(--bg-white)',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid var(--border)',
  boxShadow: 'var(--shadow-md)',
  overflow: 'hidden',
};

const formHeaderStyle = {
  background: 'var(--blue)',
  padding: '22px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const formBadgeStyle = {
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.7)',
  marginBottom: '6px',
};

const formPriceRowStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
};

const formPriceStyle = {
  fontFamily: 'var(--font-disp)',
  fontSize: '32px',
  fontWeight: '500',
  color: '#fff',
};

const formPricePerStyle = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
};

const formRatingStyle = {
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  padding: '6px 14px',
  borderRadius: '100px',
  fontSize: '13px',
  fontWeight: '600',
};

const formDividerStyle = {
  height: '1px',
  background: 'var(--border)',
};

const formBodyStyle = {
  padding: '22px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const inputStyle = {
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  color: 'var(--text)',
  background: 'var(--bg)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
};

const dateRowStyle = {
  display: 'flex',
  gap: '12px',
};

const datePickerWrapStyle = {
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius)',
  height: '44px',
  background: 'var(--bg)',
  overflow: 'hidden',
  marginTop: '5px',
};

const formFooterStyle = {
  padding: '0 24px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const bookBtnStyle = {
  width: '100%',
  justifyContent: 'center',
  fontSize: '15px',
  padding: '13px 20px',
};

const callBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 20px',
  borderRadius: 'var(--radius)',
  border: '2px solid var(--border-mid)',
  fontSize: '14px',
  fontWeight: '600',
  color: 'var(--text)',
  fontFamily: 'var(--font-body)',
  textDecoration: 'none',
  transition: 'border-color 0.2s, color 0.2s',
};

const trustRowStyle = {
  display: 'flex',
  gap: '6px',
  justifyContent: 'center',
  flexWrap: 'wrap',
  padding: '0 24px 20px',
};

const trustPillStyle = {
  fontSize: '11px',
  color: 'var(--text-faint)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  padding: '3px 10px',
  borderRadius: '100px',
};

/* Rules card */
const rulesCardStyle = {
  background: 'var(--bg-white)',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid var(--border)',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
};

const ruleItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
};

const ruleIconStyle = {
  color: 'var(--blue)',
  fontSize: '12px',
  flexShrink: 0,
};

export default RoomDetails;