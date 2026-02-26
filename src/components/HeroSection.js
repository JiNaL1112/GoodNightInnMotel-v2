import React, { useState, useEffect } from 'react';

const slides = [
  {
    headline: ['Clean Rooms,', 'Honest Prices,', 'Great Location.'],
    sub: 'Minutes from Niagara Falls · Family-Managed · Open 365 Days',
  },
  {
    headline: ['Your Home Away', 'From Home in', 'Port Colborne.'],
    sub: 'Affordable Comfort · Spotless Rooms · 24/7 Support',
  },
  {
    headline: ['Near Niagara,', 'Near the Beach,', 'Near Perfect.'],
    sub: '10 min to Nickel Beach · Free Parking · Pool Included',
  },
];

const HeroSection = () => {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActive(p => (p + 1) % slides.length);
        setAnimating(false);
      }, 400);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const goTo = (i) => {
    setAnimating(true);
    setTimeout(() => {
      setActive(i);
      setAnimating(false);
    }, 300);
  };

  return (
    <section className="hero-section">
      {/* Background pattern */}
      <div className="hero-bg-pattern" />

      <div className="hero-inner container">
        {/* Left: Copy */}
        <div className={`hero-copy ${animating ? 'hero-fade-out' : 'hero-fade-in'}`}>
          <div className="hero-badge">
            <span className="badge-dot" />
            Family-Managed · Est. 2005
          </div>

          <h1 className="hero-heading">
            {slides[active].headline.map((line, i) => (
              <span key={i} className={`hero-line hero-line-${i}`}>
                {i === 1 ? <em className="hero-em">{line}</em> : line}
              </span>
            ))}
          </h1>

          <p className="hero-sub">{slides[active].sub}</p>

          <div className="hero-pills">
            {['Free WiFi', 'Free Parking', 'Pool Access', '24/7 Support'].map(pill => (
              <span key={pill} className="hero-pill">✓ {pill}</span>
            ))}
          </div>

          <div className="hero-actions">
            <a href="#rooms" className="btn-primary">See Our Rooms →</a>
            <a href="tel:+18338551818" className="btn-outline">📞 Call Us</a>
          </div>

          {/* Stats row */}
          <div className="hero-stats">
            {[['4.9★', 'Guest Rating'], ['$115', 'From / Night'], ['24/7', 'Support'], ['365', 'Days Open']].map(([v, l]) => (
              <div key={l} className="hero-stat">
                <span className="hero-stat-val">{v}</span>
                <span className="hero-stat-label">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual cards */}
        <div className="hero-visuals">
          <div className="hero-card hero-card-main">
            <div className="hero-card-img hero-card-img--room">
              <span className="hero-card-emoji">🛏️</span>
              <div className="hero-card-overlay">
                <span>Queen Suite</span>
                <strong>From $115/night</strong>
              </div>
            </div>
          </div>

          <div className="hero-card hero-card-sm hero-card-pool">
            <div className="hero-card-img hero-card-img--pool">
              <span className="hero-card-emoji">🏊</span>
              <div className="hero-card-overlay">
                <span>Outdoor Pool</span>
                <strong>Complimentary</strong>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="hero-float hero-float-rating">
            <span className="float-icon">⭐</span>
            <div>
              <div className="float-val">4.9 / 5</div>
              <div className="float-lbl">Google Reviews</div>
            </div>
          </div>

          <div className="hero-float hero-float-loc">
            <span className="float-icon">📍</span>
            <div>
              <div className="float-val">Near Niagara</div>
              <div className="float-lbl">Port Colborne, ON</div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === active ? 'hero-dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll nudge */}
      <div className="hero-scroll-hint">
        <span>Scroll</span>
        <div className="scroll-line" />
      </div>
    </section>
  );
};

export default HeroSection;
