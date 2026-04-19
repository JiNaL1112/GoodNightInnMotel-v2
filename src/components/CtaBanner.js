import React from 'react';

const CtaBanner = () => (
  <section className="cta-section">
    <div className="cta-inner container">
      <div className="cta-badge">🌙 Available 24/7 · 365 Days a Year</div>
      <h2 className="cta-heading">
        Ready for a Great <em className="cta-em">Night's Rest?</em>
      </h2>
      <p className="cta-sub">
        Book direct and get the best rate — no middleman, no booking fees, no markup.<br />
        Best rate guaranteed when you call or book with us directly.
      </p>
      <div className="cta-actions">
        <a href="tel:+18338551818" className="cta-btn-ghost">
          📞 1-833-855-1818
        </a>
      </div>
      <div className="cta-trust-row">
        <span className="cta-trust-pill">✓ Free Cancellation</span>
        <span className="cta-trust-pill">✓ Best Rate Guarantee</span>
        <span className="cta-trust-pill">✓ No Booking Fees</span>
        <span className="cta-trust-pill">✓ Instant Confirmation</span>
      </div>
    </div>
    {/* Decorative circles */}
    <div className="cta-circle cta-circle-1" />
    <div className="cta-circle cta-circle-2" />
  </section>
);

export default CtaBanner;