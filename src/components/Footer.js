import React from 'react';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-top container">
      <div className="footer-brand">
        <div className="footer-logo">
          <div className="logo-icon">🌙</div>
          <span className="footer-logo-name">GoodNight Inn</span>
        </div>
        <p className="footer-tagline">
          Affordable, clean, and comfortable stays in Port Colborne, Ontario.
          Family-managed since 2005.
        </p>
        <div className="footer-social-row">
          <span className="footer-badge">✓ Best Rate Guarantee</span>
          <span className="footer-badge">✓ 24/7 Support</span>
        </div>
      </div>

      <div className="footer-links-group">
        <div className="footer-col">
          <div className="footer-col-title">Navigate</div>
          {[['Home', '/'], ['Rooms', '/#rooms'], ['Gallery', '/gallery'], ['Activities', '/activities'], ['Contact', '/contact']].map(([l, h]) => (
            <a key={l} href={h} className="footer-link">{l}</a>
          ))}
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Services</div>
          {['Room Booking', 'Extended Stay', 'Pool Access', 'Group Rates', 'Corporate Stays'].map(l => (
            <span key={l} className="footer-link">{l}</span>
          ))}
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Contact Us</div>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="footer-link">
            📍 664 Main St. W
          </a>
          <span className="footer-link">Port Colborne, ON L3K 5V4</span>
          <a href="tel:+18338551818" className="footer-link">📞 1-833-855-1818 (Toll Free)</a>
          <a href="tel:+19058351818" className="footer-link">📞 1-905-835-1818 (Local)</a>
          <a href="mailto:manager@goodnightinn.ca" className="footer-link">✉️ manager@goodnightinn.ca</a>
        </div>
      </div>
    </div>

    <div className="footer-bottom container">
      <span>© {new Date().getFullYear()} GoodNight Inn · All rights reserved</span>
      <span>Made with ❤️ in Port Colborne</span>
    </div>
  </footer>
);

export default Footer;
