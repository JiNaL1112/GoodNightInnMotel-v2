import React, { useEffect, useRef, useState } from 'react';

const reviews = [
  {
    name: 'Sarah M.',
    loc: 'Toronto, ON',
    text: 'Super clean rooms, friendly staff, and unbeatable price. Exactly what we needed for our Niagara trip. We\'ll definitely be back!',
    stars: 5,
    trip: 'Family Trip',
  },
  {
    name: 'Dave R.',
    loc: 'Buffalo, NY',
    text: 'Best value motel in the entire Niagara region. The pool was a bonus we didn\'t expect to enjoy so much. The family running it is wonderful.',
    stars: 5,
    trip: 'Couple\'s Getaway',
  },
  {
    name: 'Linda K.',
    loc: 'Hamilton, ON',
    text: 'We stay here every time we visit Port Colborne. Always clean, always comfortable, always a friendly face at the front desk.',
    stars: 5,
    trip: 'Repeat Guest',
  },
  {
    name: 'Mike T.',
    loc: 'Mississauga, ON',
    text: 'Checked in at midnight and the staff was incredibly helpful. 24/7 support isn\'t just a marketing line — they actually mean it.',
    stars: 5,
    trip: 'Business Travel',
  },
];

const Stars = ({ count = 5 }) => (
  <div className="review-stars">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="star-icon">★</span>
    ))}
  </div>
);

const Testimonials = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="reviews-section" ref={ref}>
      <div className="container">
        <div className={`section-header ${visible ? 'anim-in' : 'anim-hidden'}`}>
          <span className="section-tag">Guest Reviews</span>
          <h2 className="section-heading">
            Don't Take Our <em className="accent-em">Word For It</em>
          </h2>
          <div className="reviews-score-row">
            <Stars />
            <span className="reviews-score-text">4.9 out of 5 · 500+ verified reviews</span>
          </div>
        </div>

        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <div
              key={r.name}
              className={`review-card ${visible ? 'anim-in' : 'anim-hidden'}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <Stars count={r.stars} />
              <p className="review-text">"{r.text}"</p>
              <div className="review-footer">
                <div className="review-avatar">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="review-name">{r.name}</div>
                  <div className="review-loc">{r.loc}</div>
                </div>
                <span className="review-trip-badge">{r.trip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
