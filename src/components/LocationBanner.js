import React, { useEffect, useRef, useState } from 'react';

const nearby = [
  { icon: '💦', place: 'Niagara Falls',    dist: '~25 min drive' },
  { icon: '🏖️', place: 'Nickel Beach',     dist: '~10 min drive' },
  { icon: '⛵', place: 'Canal Days Marina', dist: '~5 min drive'  },
  { icon: '🛍️', place: 'Downtown Shops',   dist: 'Walking distance'},
  { icon: '🍽️', place: 'Local Restaurants', dist: 'Steps away'   },
  { icon: '🛣️', place: 'QEW Highway',       dist: 'Easy access'   },
];

const LocationBanner = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="location-section" ref={ref}>
      <div className="container">
        <div className="location-grid">
          {/* Left: Info */}
          <div className={`location-info ${visible ? 'anim-in' : 'anim-hidden'}`}>
            <span className="section-tag">Our Location</span>
            <h2 className="section-heading" style={{ textAlign: 'left', marginBottom: '12px' }}>
              Right in the Heart of <em className="accent-em">Port Colborne</em>
            </h2>
            <p className="section-sub" style={{ textAlign: 'left', marginBottom: '24px' }}>
              664 Main St. W — easy highway access, walkable to restaurants and shops, and a short drive to all the best Niagara region attractions.
            </p>

            <div className="nearby-grid">
              {nearby.map(({ icon, place, dist }) => (
                <div key={place} className="nearby-item">
                  <span className="nearby-icon">{icon}</span>
                  <div>
                    <div className="nearby-place">{place}</div>
                    <div className="nearby-dist">{dist}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="location-contact">
              <div className="location-contact-row">
                <span>📍</span>
                <span>664 Main St. W, Port Colborne, ON L3K 5V4</span>
              </div>
              <div className="location-contact-row">
                <span>📞</span>
                <a href="tel:+18338551818" className="location-link">1-833-855-1818 (Toll Free)</a>
              </div>
              <div className="location-contact-row">
                <span>📞</span>
                <a href="tel:+19058351818" className="location-link">1-905-835-1818 (Local)</a>
              </div>
              <div className="location-contact-row">
                <span>✉️</span>
                <a href="mailto:manager@goodnightinn.ca" className="location-link">manager@goodnightinn.ca</a>
              </div>
            </div>

            <div className="location-actions">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=664+Main+St+W,+Port+Colborne,+Ontario,+Canada"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                📍 Get Directions
              </a>
              <a href="tel:+18338551818" className="btn-outline-dark">Call Us Now</a>
            </div>
          </div>

          {/* Right: Map embed */}
          <div className={`location-map-wrap ${visible ? 'anim-in' : 'anim-hidden'}`} style={{ transitionDelay: '0.2s' }}>
            <iframe
              title="GoodNight Inn Location"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, borderRadius: '12px', minHeight: '380px' }}
              src="https://www.google.com/maps/embed/v1/place?q=Good+Night+Inn+664+Main+St+W,+Port+Colborne,+Ontario,+Canada&key=AIzaSyB0G4b_xQd8d7z454PJuyPUyrY5kL0qkTc"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationBanner;
