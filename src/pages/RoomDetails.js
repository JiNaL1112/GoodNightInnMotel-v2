import React, { useContext, useEffect, useState, useCallback } from 'react';
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
  { name: 'Free WiFi',      icon: <FaWifi />,           color: '#dbeafe', border: '#bfdbfe', iconColor: '#2563eb' },
  { name: 'Fridge',         icon: <MdOutlineKitchen />, color: '#dcfce7', border: '#bbf7d0', iconColor: '#16a34a' },
  { name: 'Flat-Screen TV', icon: <FaTv />,             color: '#fef9c3', border: '#fde68a', iconColor: '#d97706' },
  { name: 'Hair Dryer',     icon: <FaWind />,           color: '#ede9fe', border: '#c4b5fd', iconColor: '#7c3aed' },
  { name: 'Coffee Maker',   icon: <FaCoffee />,         color: '#fce7f3', border: '#fbcfe8', iconColor: '#db2777' },
  { name: 'Swimming Pool',  icon: <FaSwimmingPool />,   color: '#e0f2fe', border: '#bae6fd', iconColor: '#0284c7' },
];

const rules = [
  'Check-in: 3:00 PM – 9:00 PM',
  'Check-out: 10:30 AM',
  'No Pets Allowed',
  'No Smoking',
];

/* ─── Placeholder gradient slides used when no real images exist ─── */
const PLACEHOLDER_SLIDES = [
  { emoji: '🛏️', bg: 'linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%)', label: 'Bedroom' },
  { emoji: '🚿', bg: 'linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)', label: 'Bathroom' },
  { emoji: '🪑', bg: 'linear-gradient(135deg,#fef9c3 0%,#fefce8 100%)', label: 'Seating Area' },
  { emoji: '🌅', bg: 'linear-gradient(135deg,#fce7f3 0%,#fdf2f8 100%)', label: 'View' },
];

/* ─────────────────────────────────────────────────────────────
   IMAGE CAROUSEL COMPONENT
───────────────────────────────────────────────────────────── */
const ImageCarousel = ({ images, roomName }) => {
  const [active, setActive]         = useState(0);
  const [prev, setPrev]             = useState(null);
  const [dir, setDir]               = useState('next'); // 'next' | 'prev'
  const [animating, setAnimating]   = useState(false);
  const [lightbox, setLightbox]     = useState(false);
  const [thumbsScroll, setThumbsScroll] = useState(0);

  const total = images.length;

  const goTo = useCallback((index, direction = 'next') => {
    if (animating || index === active) return;
    setDir(direction);
    setPrev(active);
    setActive(index);
    setAnimating(true);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 500);
  }, [active, animating]);

  const goNext = useCallback(() => goTo((active + 1) % total, 'next'),  [active, total, goTo]);
  const goPrev = useCallback(() => goTo((active - 1 + total) % total, 'prev'), [active, total, goTo]);

  /* keyboard nav */
  useEffect(() => {
    const handler = (e) => {
      if (lightbox) {
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft')  goPrev();
        if (e.key === 'Escape')     setLightbox(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, goNext, goPrev]);

  /* touch swipe */
  const touchRef = React.useRef({});
  const onTouchStart = (e) => { touchRef.current.x = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const diff = touchRef.current.x - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
  };

  const renderSlide = (slide, index, isActive, isPrev) => {
    let translateX = '100%';
    if (isActive) translateX = '0%';
    else if (isPrev) translateX = dir === 'next' ? '-100%' : '100%';
    else return null; // don't render other slides at all

    return (
      <div
        key={index}
        style={{
          position: 'absolute', inset: 0,
          transform: `translateX(${translateX})`,
          transition: (isActive || isPrev) ? 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' : 'none',
          willChange: 'transform',
        }}
      >
        {slide.type === 'image' ? (
          <img
            src={slide.src}
            alt={`${roomName} — ${index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: slide.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 72, opacity: 0.45 }}>{slide.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', opacity: 0.6, letterSpacing: 1 }}>{slide.label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: '#f1f0ed' }}>

        {/* ── Main stage ── */}
        <div
          style={{ position: 'relative', height: '420px', overflow: 'hidden', cursor: 'zoom-in' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightbox(true)}
        >
          {images.map((slide, i) => renderSlide(slide, i, i === active, i === prev))}

          {/* Gradient overlay bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)', pointerEvents: 'none' }} />

          {/* Counter badge */}
          <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, letterSpacing: 1, zIndex: 5, pointerEvents: 'none' }}>
            {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>

          {/* Zoom hint */}
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 100, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
            🔍 View Full
          </div>

          {/* Prev / Next arrows */}
          {total > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} style={arrowBtnStyle('left')}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} style={arrowBtnStyle('right')}>›</button>
            </>
          )}

          {/* Dot indicators */}
          {total > 1 && (
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5, pointerEvents: 'none' }}>
              {images.map((_, i) => (
                <div key={i} style={{
                  width: i === active ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === active ? '#fff' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ── */}
        {total > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '10px', background: '#fff', overflowX: 'auto' }}>
            {images.map((slide, i) => (
              <div
                key={i}
                onClick={() => goTo(i, i > active ? 'next' : 'prev')}
                style={{
                  flexShrink: 0,
                  width: 72, height: 52,
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: i === active ? '2.5px solid var(--blue, #2563eb)' : '2.5px solid transparent',
                  transition: 'border-color 0.2s, transform 0.15s',
                  transform: i === active ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: i === active ? '0 2px 10px rgba(37,99,235,0.25)' : '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                {slide.type === 'image' ? (
                  <img src={slide.src} alt={`thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: slide.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {slide.emoji}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >×</button>

          {/* Counter */}
          <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
            {active + 1} / {total}
          </div>

          {/* Arrows */}
          {total > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} style={lbArrowStyle('left')}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} style={lbArrowStyle('right')}>›</button>
            </>
          )}

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
            {images[active].type === 'image' ? (
              <img src={images[active].src} alt={roomName} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 10, display: 'block' }} />
            ) : (
              <div style={{ width: 500, height: 360, background: images[active].bg, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <span style={{ fontSize: 90, opacity: 0.5 }}>{images[active].emoji}</span>
                <span style={{ fontSize: 15, color: '#374151', opacity: 0.7 }}>{images[active].label}</span>
              </div>
            )}
          </div>

          {/* Thumbnail dots at bottom */}
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i, i > active ? 'next' : 'prev'); }} style={{ width: i === active ? 28 : 8, height: 8, borderRadius: 4, border: 'none', background: i === active ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const arrowBtnStyle = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: 14,
  transform: 'translateY(-50%)',
  zIndex: 5,
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff',
  width: 40, height: 40,
  borderRadius: '50%',
  fontSize: 22,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.2s',
  lineHeight: 1,
});

const lbArrowStyle = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: 20,
  transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#fff',
  width: 52, height: 52,
  borderRadius: '50%',
  fontSize: 28,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10,
  transition: 'background 0.2s',
});

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const RoomDetails = () => {
  const {
    pname, setPName,
    email, setEmail,
    phone, setPhone,
    checkInDate,
    checkOutDate,
    adults,
    kids,
    handleReservation,
    rooms,
    setSelectedRoomId,
    setSelectedRoomName,
    address,         setAddress,
    city,            setCity,
    province,        setProvince,
    country,         setCountry,
    postalCode,      setPostalCode,
    company,         setCompany,
    driverLicNo,     setDriverLicNo,
    dob,             setDob,
    plateNumber,     setPlateNumber,
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
        <h2 style={{ fontFamily: 'var(--font-disp)', fontSize: '32px', marginBottom: '12px' }}>
          Room Not Found
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>We couldn't find the room you're looking for.</p>
      </section>
    );
  }

  const { name, description, imageData, price } = room;
  const localRoom = roomData.find((r) => r.name === name) || roomData[0];

  /* ── Build the slides array ── */
  const slides = [];
  // Primary image from Firestore
  if (imageData) slides.push({ type: 'image', src: imageData });
  // Local static images from data.js (imageLg then image)
  if (localRoom?.imageLg) slides.push({ type: 'image', src: localRoom.imageLg });
  if (localRoom?.image && localRoom?.image !== localRoom?.imageLg) slides.push({ type: 'image', src: localRoom.image });
  // Fill remaining slots with placeholder cards up to 4 total
  const needed = Math.max(0, 4 - slides.length);
  PLACEHOLDER_SLIDES.slice(0, needed).forEach(p => slides.push({ ...p, type: 'placeholder' }));

  return (
    <section>
      <ScrollToTop />

      {/* Hero banner */}
      <div className="bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center">
        <div className="absolute w-full h-full bg-black/70" />
        <h1 className="text-6xl text-white z-20 font-primary text-center">{name} Details</h1>
      </div>

      <div className="container mx-auto">
        <div style={layoutStyle}>

          {/* ── LEFT COLUMN ── */}
          <div style={leftColStyle}>

            <div style={{ marginBottom: '28px' }}>
              <span className="section-tag">Accommodation</span>
              <h2 style={roomTitleStyle}>{name}</h2>
              <p style={roomDescStyle}>{description}</p>
            </div>

            {/* ── IMAGE CAROUSEL ── */}
            <ImageCarousel images={slides} roomName={name} />

            {/* Facilities */}
            <div style={{ marginTop: '44px' }}>
              <span className="section-tag">What's Included</span>
              <h3 style={sectionHeadStyle}>
                Room <em className="accent-em">Facilities</em>
              </h3>
              <div style={facilitiesGridStyle}>
                {facilitiesConfig.map((f) => (
                  <div
                    key={f.name}
                    style={{ ...facilityCardStyle, background: f.color, border: `1.5px solid ${f.border}` }}
                  >
                    <div style={{ ...facilityIconWrapStyle, color: f.iconColor }}>{f.icon}</div>
                    <span style={facilityNameStyle}>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={rightColStyle}>

            {/* Booking form */}
            <div style={formCardStyle}>

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

              <div style={formDividerStyle} />

              <div style={formBodyStyle}>

                {/* Personal Info */}
                <div style={sectionLabelStyle}>👤 Personal Information</div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" placeholder="Your name" value={pname}
                    onChange={(e) => setPName(e.target.value)} style={inputStyle} />
                </div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Phone *</label>
                    <input type="tel" placeholder="+1 (000) 000-0000" value={phone}
                      onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Address</label>
                  <input type="text" placeholder="Street address" value={address}
                    onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
                </div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>City</label>
                    <input type="text" placeholder="City" value={city}
                      onChange={(e) => setCity(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Province / State</label>
                    <input type="text" placeholder="ON" value={province}
                      onChange={(e) => setProvince(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Country</label>
                    <input type="text" placeholder="Canada" value={country}
                      onChange={(e) => setCountry(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Postal / Zip Code</label>
                    <input type="text" placeholder="L3K 5V4" value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Company (optional)</label>
                  <input type="text" placeholder="Company name" value={company}
                    onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
                </div>

                {/* ID & Vehicle */}
                <div style={{ ...sectionLabelStyle, marginTop: '8px' }}>🪪 Identification & Vehicle</div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Driver's Licence No.</label>
                    <input type="text" placeholder="Licence number" value={driverLicNo}
                      onChange={(e) => setDriverLicNo(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Date of Birth</label>
                    <input type="date" value={dob}
                      onChange={(e) => setDob(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Vehicle Plate #</label>
                  <input type="text" placeholder="ABC 1234" value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)} style={inputStyle} />
                </div>

                {/* Stay Details */}
                <div style={{ ...sectionLabelStyle, marginTop: '8px' }}>🛏️ Stay Details</div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Check In</label>
                    <div style={datePickerWrapStyle}><CheckIn /></div>
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Check Out</label>
                    <div style={datePickerWrapStyle}><CheckOut /></div>
                  </div>
                </div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Adults</label>
                    <div style={dropdownWrapStyle}><AdultsDropdown /></div>
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Kids</label>
                    <div style={dropdownWrapStyle}><KidsDropdown /></div>
                  </div>
                </div>

              </div>

              {/* CTA */}
              <div style={formFooterStyle}>
                <button onClick={handleReservation} className="btn-primary" style={bookBtnStyle}>
                  Book Now — ${price}/night
                </button>
                <a href="tel:+18338551818" style={callBtnStyle}>
                  📞 Call to Reserve
                </a>
              </div>

              <div style={trustRowStyle}>
                {['Free Cancellation', 'No Hidden Fees', 'Instant Confirm'].map(t => (
                  <span key={t} style={trustPillStyle}>✓ {t}</span>
                ))}
              </div>
            </div>

            {/* Hotel Rules */}
            <div style={rulesCardStyle}>
              <h3 style={sectionHeadStyle}>
                Hotel <em className="accent-em">Rules</em>
              </h3>
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

      <style>{`
        .facility-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        @media (max-width: 768px) {
          .room-details-layout { flex-direction: column !important; }
          .room-details-right  { position: static !important; min-width: 0 !important; }
          .two-col-field       { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

/* ─── Styles ─── */
const layoutStyle         = { display: 'flex', flexDirection: 'row', gap: '48px', padding: '72px 24px', alignItems: 'flex-start' };
const leftColStyle        = { flex: '1 1 55%', minWidth: 0 };
const rightColStyle       = { flex: '1 1 40%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '88px' };
const roomTitleStyle      = { fontFamily: 'var(--font-disp)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '500', color: 'var(--text)', lineHeight: '1.2', margin: '8px 0 12px' };
const roomDescStyle       = { fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.8' };
const sectionHeadStyle    = { fontFamily: 'var(--font-disp)', fontSize: '24px', fontWeight: '500', color: 'var(--text)', margin: '8px 0 20px' };
const facilitiesGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' };
const facilityCardStyle   = { borderRadius: 'var(--radius)', padding: '16px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' };
const facilityIconWrapStyle = { fontSize: '20px', flexShrink: 0, width: '36px', height: '36px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const facilityNameStyle   = { fontSize: '13px', fontWeight: '600', color: 'var(--text)', lineHeight: '1.3' };
const formCardStyle       = { background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-md)', overflow: 'visible' };
const formHeaderStyle     = { background: 'var(--blue)', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' };
const formBadgeStyle      = { fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' };
const formPriceRowStyle   = { display: 'flex', alignItems: 'baseline', gap: '4px' };
const formPriceStyle      = { fontFamily: 'var(--font-disp)', fontSize: '32px', fontWeight: '500', color: '#fff' };
const formPricePerStyle   = { fontSize: '13px', color: 'rgba(255,255,255,0.65)' };
const formRatingStyle     = { background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600' };
const formDividerStyle    = { height: '1px', background: 'var(--border)' };
const formBodyStyle       = { padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '12px' };
const sectionLabelStyle   = { fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--blue)', paddingBottom: '8px', borderBottom: '1px solid var(--border)', marginBottom: '4px' };
const fieldGroupStyle     = { display: 'flex', flexDirection: 'column', gap: '5px' };
const twoColStyle         = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const labelStyle          = { fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' };
const inputStyle          = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '100%', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const datePickerWrapStyle = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', height: '44px', background: 'var(--bg)', overflow: 'hidden', marginTop: '5px' };
const dropdownWrapStyle   = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', height: '44px', background: 'var(--bg)', overflow: 'visible', marginTop: '5px', position: 'relative', zIndex: 10 };
const formFooterStyle     = { padding: '0 24px 18px', display: 'flex', flexDirection: 'column', gap: '10px' };
const bookBtnStyle        = { width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px 20px' };
const callBtnStyle        = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px 20px', borderRadius: 'var(--radius)', border: '2px solid var(--border-mid)', fontSize: '14px', fontWeight: '600', color: 'var(--text)', fontFamily: 'var(--font-body)', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s', cursor: 'pointer' };
const trustRowStyle       = { display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px 20px' };
const trustPillStyle      = { fontSize: '11px', color: 'var(--text-faint)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '100px' };
const rulesCardStyle      = { background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' };
const ruleItemStyle       = { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' };
const ruleIconStyle       = { color: 'var(--blue)', fontSize: '12px', flexShrink: 0 };

export default RoomDetails;