import React, { useEffect, useRef, useState } from 'react';

const amenities = [
  { icon: '📶', label: 'Free WiFi',          desc: 'High-speed throughout' },
  { icon: '🅿️', label: 'Free Parking',       desc: 'On-site, always free' },
  { icon: '🏊', label: 'Outdoor Pool',        desc: 'Open all summer' },
  { icon: '☕', label: 'Coffee Maker',        desc: 'In every room' },
  { icon: '📺', label: 'Flat-Screen TV',      desc: 'Cable included' },
  { icon: '❄️', label: 'A/C & Heating',       desc: 'Year-round comfort' },
  { icon: '🛁', label: 'Private Bathroom',    desc: 'Clean & fresh daily' },
  { icon: '🧹', label: 'Daily Housekeeping',  desc: 'Every single day' },
  { icon: '🔒', label: 'Secure Key Access',   desc: 'Your safety first' },
  { icon: '🌙', label: '24/7 Front Desk',     desc: 'Always here for you' },
];

const AmenitiesStrip = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="amenities-section" ref={ref} id="amenities">
      <div className="container">
        <div className={`section-header ${visible ? 'anim-in' : 'anim-hidden'}`}>
          <span className="section-tag">What's Included</span>
          <h2 className="section-heading">
            Everything You Need, <em className="accent-em">No Surprises</em>
          </h2>
          <p className="section-sub">
            All amenities are complimentary — packed into every room, every stay.
          </p>
        </div>

        <div className="amenities-grid">
          {amenities.map((a, i) => (
            <div
              key={a.label}
              className={`amenity-card ${visible ? 'anim-in' : 'anim-hidden'}`}
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <div className="amenity-icon-wrap">
                <span className="amenity-icon">{a.icon}</span>
              </div>
              <div>
                <div className="amenity-label">{a.label}</div>
                <div className="amenity-desc">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pool callout banner */}
        <div className={`amenity-callout ${visible ? 'anim-in' : 'anim-hidden'}`} style={{ transitionDelay: '0.5s' }}>
          <div className="callout-left">
            <span className="callout-emoji">🏊</span>
            <div>
              <div className="callout-title">Outdoor Pool — Open All Summer</div>
              <div className="callout-sub">Complimentary for all guests · Towels provided at the pool deck</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AmenitiesStrip;
