import React, { useEffect, useRef, useState } from 'react';

const reasons = [
  {
    icon: '💰',
    title: 'Honest Pricing',
    desc: 'Rooms from $115/night with zero hidden fees. No resort charges, no surprises at checkout.',
    color: '#e0f2fe',
    border: '#bae6fd',
  },
  {
    icon: '🧼',
    title: 'Spotlessly Clean',
    desc: 'We take cleanliness seriously. Every room is deep-cleaned and inspected before your arrival.',
    color: '#dcfce7',
    border: '#bbf7d0',
  },
  {
    icon: '📍',
    title: 'Unbeatable Location',
    desc: 'Minutes from Niagara Falls, Nickel Beach, and Canal Days Marina. The perfect base to explore.',
    color: '#fef9c3',
    border: '#fde68a',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Family-Run Since 2005',
    desc: 'We\'re not a chain. We\'re a family who cares — and it shows in every interaction.',
    color: '#fce7f3',
    border: '#fbcfe8',
  },
  {
    icon: '🕐',
    title: '24/7, 365 Days',
    desc: 'We never close. Whether it\'s 3am or Christmas Day, someone is always here to help.',
    color: '#ede9fe',
    border: '#c4b5fd',
  },
  {
    icon: '🏊',
    title: 'Packed with Amenities',
    desc: 'Pool, free WiFi, free parking, coffee maker, flat-screen TV — all included, no extras.',
    color: '#ffedd5',
    border: '#fed7aa',
  },
];

const WhyUs = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="whyus-section" ref={ref}>
      <div className="container">
        <div className={`section-header ${visible ? 'anim-in' : 'anim-hidden'}`}>
          <span className="section-tag">Why Choose Us</span>
          <h2 className="section-heading">
            Simple, Clean & <em className="accent-em">Affordable</em>
          </h2>
          <p className="section-sub">
            We've been welcoming guests to Port Colborne since 2005. Here's why they keep coming back.
          </p>
        </div>

        <div className="whyus-grid">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className={`whyus-card ${visible ? 'anim-in' : 'anim-hidden'}`}
              style={{ animationDelay: `${i * 0.08}s`, transitionDelay: `${i * 0.08}s` }}
            >
              <div className="whyus-icon-wrap" style={{ background: r.color, border: `1.5px solid ${r.border}` }}>
                <span className="whyus-icon">{r.icon}</span>
              </div>
              <h3 className="whyus-title">{r.title}</h3>
              <p className="whyus-desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
