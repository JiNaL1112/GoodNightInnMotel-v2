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

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'E-Transfer', 'Other'];

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

    // Extended fields
    address,         setAddress,
    city,            setCity,
    province,        setProvince,
    country,         setCountry,
    postalCode,      setPostalCode,
    company,         setCompany,
    driverLicNo,     setDriverLicNo,
    dob,             setDob,
    deposit,         setDeposit,
    returnedDeposit, setReturnedDeposit,
    methodOfPayment, setMethodOfPayment,
    plateNumber,     setPlateNumber,
    numberOfRooms,   setNumberOfRooms,
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
        <p style={{ color: 'var(--text-muted)' }}>
          We couldn't find the room you're looking for.
        </p>
      </section>
    );
  }

  const { name, description, imageData, price } = room;
  const localRoom = roomData.find((r) => r.name === name) || roomData[0];
  const roomImage = imageData || localRoom?.imageLg || localRoom?.image || null;

  return (
    <section>
      <ScrollToTop />

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

            {roomImage && (
              <div style={imgWrapStyle}>
                <img src={roomImage} alt={name} style={imgStyle} />
              </div>
            )}

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

                {/* ── Section: Personal Info ── */}
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

                {/* ── Section: ID & Vehicle ── */}
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

                {/* ── Section: Stay Details ── */}
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

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}># of Rooms</label>
                  <input type="number" min={1} max={10} value={numberOfRooms}
                    onChange={(e) => setNumberOfRooms(e.target.value)} style={{ ...inputStyle, maxWidth: '120px' }} />
                </div>

                {/* ── Section: Payment ── */}
                <div style={{ ...sectionLabelStyle, marginTop: '8px' }}>💳 Payment & Deposit</div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Method of Payment</label>
                  <select value={methodOfPayment} onChange={(e) => setMethodOfPayment(e.target.value)} style={selectStyle}>
                    <option value="">Select method…</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div style={twoColStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Deposit ($)</label>
                    <input type="number" min={0} step="0.01" placeholder="0.00" value={deposit}
                      onChange={(e) => setDeposit(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Returned Deposit ($)</label>
                    <input type="number" min={0} step="0.01" placeholder="0.00" value={returnedDeposit}
                      onChange={(e) => setReturnedDeposit(e.target.value)} style={inputStyle} />
                  </div>
                </div>

              </div>

              {/* CTA buttons */}
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

            {/* ── HOTEL RULES ── */}
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
const layoutStyle       = { display: 'flex', flexDirection: 'row', gap: '48px', padding: '72px 24px', alignItems: 'flex-start' };
const leftColStyle      = { flex: '1 1 55%', minWidth: 0 };
const rightColStyle     = { flex: '1 1 40%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '88px' };
const roomTitleStyle    = { fontFamily: 'var(--font-disp)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '500', color: 'var(--text)', lineHeight: '1.2', margin: '8px 0 12px' };
const roomDescStyle     = { fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.8' };
const imgWrapStyle      = { borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' };
const imgStyle          = { width: '100%', display: 'block', objectFit: 'cover' };
const sectionHeadStyle  = { fontFamily: 'var(--font-disp)', fontSize: '24px', fontWeight: '500', color: 'var(--text)', margin: '8px 0 20px' };
const facilitiesGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' };
const facilityCardStyle = { borderRadius: 'var(--radius)', padding: '16px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' };
const facilityIconWrapStyle = { fontSize: '20px', flexShrink: 0, width: '36px', height: '36px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const facilityNameStyle = { fontSize: '13px', fontWeight: '600', color: 'var(--text)', lineHeight: '1.3' };

const formCardStyle     = { background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-md)', overflow: 'visible' };
const formHeaderStyle   = { background: 'var(--blue)', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' };
const formBadgeStyle    = { fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' };
const formPriceRowStyle = { display: 'flex', alignItems: 'baseline', gap: '4px' };
const formPriceStyle    = { fontFamily: 'var(--font-disp)', fontSize: '32px', fontWeight: '500', color: '#fff' };
const formPricePerStyle = { fontSize: '13px', color: 'rgba(255,255,255,0.65)' };
const formRatingStyle   = { background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600' };
const formDividerStyle  = { height: '1px', background: 'var(--border)' };
const formBodyStyle     = { padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '12px' };

const sectionLabelStyle = {
  fontSize: '11px', fontWeight: '700', letterSpacing: '2px',
  textTransform: 'uppercase', color: 'var(--blue)',
  paddingBottom: '8px', borderBottom: '1px solid var(--border)',
  marginBottom: '4px',
};

const fieldGroupStyle   = { display: 'flex', flexDirection: 'column', gap: '5px' };
const twoColStyle       = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', className: 'two-col-field' };
const labelStyle        = { fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' };

const inputStyle = {
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font-body)',
  color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '100%',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

const datePickerWrapStyle = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', height: '44px', background: 'var(--bg)', overflow: 'hidden', marginTop: '5px' };
const dropdownWrapStyle   = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', height: '44px', background: 'var(--bg)', overflow: 'visible', marginTop: '5px', position: 'relative', zIndex: 10 };

const formFooterStyle = { padding: '0 24px 18px', display: 'flex', flexDirection: 'column', gap: '10px' };
const bookBtnStyle    = { width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px 20px' };
const callBtnStyle    = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px 20px', borderRadius: 'var(--radius)', border: '2px solid var(--border-mid)', fontSize: '14px', fontWeight: '600', color: 'var(--text)', fontFamily: 'var(--font-body)', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s', cursor: 'pointer' };
const trustRowStyle   = { display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px 20px' };
const trustPillStyle  = { fontSize: '11px', color: 'var(--text-faint)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '100px' };
const rulesCardStyle  = { background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' };
const ruleItemStyle   = { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' };
const ruleIconStyle   = { color: 'var(--blue)', fontSize: '12px', flexShrink: 0 };

export default RoomDetails;