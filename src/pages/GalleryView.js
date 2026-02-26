import React, { useEffect, useState, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ScrollToTop from '../components/ScrollToTop';

// ─── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '24px',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', width: '40px', height: '40px', borderRadius: '50%',
          fontSize: '20px', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        ×
      </button>
      <img
        src={src}
        alt="Gallery"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '85vh',
          objectFit: 'contain', borderRadius: '10px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  );
};

// ─── Gallery View ──────────────────────────────────────────────────────────────
const GalleryView = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [visible, setVisible] = useState(false);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'gallery'));
        const imgs = snapshot.docs.map(doc => ({
          id: doc.id,
          src: doc.data().base64,
        }));
        setImages(imgs);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (gridRef.current) obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, [loading]);

  return (
    <section>
      <ScrollToTop />

      {/* ── Banner ── */}
      <div className="bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center" ref={heroRef}>
        <div className="absolute w-full h-full bg-black/70" />
        <div style={{ position: 'relative', zIndex: 20, textAlign: 'center', padding: '0 24px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '11px', fontWeight: '700',
            letterSpacing: '2.5px', textTransform: 'uppercase',
            padding: '5px 16px', borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.25)',
            marginBottom: '18px',
          }}>
            Port Colborne, Ontario
          </div>
          <h1 style={{
            fontFamily: 'var(--font-disp)',
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: '500', color: '#fff', lineHeight: '1.15',
            marginBottom: '14px', textShadow: '0 2px 20px rgba(0,0,0,0.4)',
          }}>
            Our Motel Gallery
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.72)',
            fontSize: '16px', lineHeight: '1.7',
            maxWidth: '520px', margin: '0 auto',
          }}>
            A warm, welcoming place that has hosted guests since 2005 — see for yourself.
          </p>
        </div>
      </div>

      {/* ── About Section ── */}
      <div style={{ background: 'var(--bg-white)', padding: '72px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
          className="gallery-about-grid"
          >
            {/* Left: text */}
            <div>
              <span className="section-tag">Welcome to GoodNight Inn</span>
              <h2 style={{
                fontFamily: 'var(--font-disp)',
                fontSize: 'clamp(26px, 3.5vw, 38px)',
                fontWeight: '500', color: 'var(--text)',
                lineHeight: '1.25', margin: '10px 0 20px',
              }}>
                A Place That Feels Like <em className="accent-em">Home</em>
              </h2>

              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.9', marginBottom: '18px' }}>
                Nestled in the heart of Port Colborne along the scenic Welland Canal corridor,
                GoodNight Inn has been welcoming families, couples, and travellers since 2005.
                From the moment you arrive, you'll notice the difference that comes with
                family-managed hospitality — spotless rooms, genuinely warm service, and
                an attention to detail that no chain hotel can replicate.
              </p>

              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.9', marginBottom: '18px' }}>
                Each of our rooms is thoughtfully appointed with everything you need for a
                restful stay: plush bedding, a flat-screen TV, coffee maker, private bathroom,
                and year-round air conditioning and heating. The décor is clean and contemporary,
                designed to make you feel at ease whether you're here for one night or an extended stay.
              </p>

              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.9', marginBottom: '28px' }}>
                Step outside and you'll find our outdoor pool — a favourite among guests all
                summer long — free on-site parking, and a location that puts Nickel Beach,
                Niagara Falls, and the Niagara wine country all within easy driving distance.
                After a day of exploring, there's no better feeling than returning to a clean,
                quiet room and a friendly face at the front desk.
              </p>

              {/* Stats row */}
              <div style={{
                display: 'flex', gap: '28px', flexWrap: 'wrap',
                paddingTop: '24px', borderTop: '1px solid var(--border)',
              }}>
                {[
                  ['2005', 'Est.'],
                  ['4.9★', 'Rating'],
                  ['24/7', 'Support'],
                  ['365', 'Days Open'],
                ].map(([val, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'var(--font-disp)', fontSize: '24px', fontWeight: '500', color: 'var(--text)' }}>{val}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: feature pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: '🧼', title: 'Spotlessly Clean',     desc: 'Every room is deep-cleaned and inspected before your arrival — no exceptions.' },
                { icon: '🏊', title: 'Outdoor Pool',          desc: 'Complimentary for all guests throughout the summer season, towels provided.' },
                { icon: '🅿️', title: 'Free Parking',          desc: 'Generous on-site parking at no extra charge, day or night.' },
                { icon: '📶', title: 'High-Speed WiFi',       desc: 'Fast, reliable internet throughout the property — stream, work, stay connected.' },
                { icon: '☕', title: 'In-Room Coffee Maker',  desc: 'Start every morning right with a fresh brew from your own room.' },
                { icon: '🌙', title: '24/7 Front Desk',       desc: 'Someone is always here for you — whether it\'s noon or 3am.' },
              ].map((f) => (
                <div key={f.title} style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '1px' }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px' }}>{f.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      <div style={{ background: 'var(--bg)', padding: '72px 0 80px' }}>
        <div className="container">
          {/* Section header */}
          <div className="section-header" style={{ marginBottom: '40px' }}>
            <span className="section-tag">Photo Gallery</span>
            <h2 className="section-heading">
              See It <em className="accent-em">For Yourself</em>
            </h2>
            <p className="section-sub">
              Browse real photos of our rooms, amenities, and property — no filters, no surprises.
            </p>
            {!loading && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '6px' }}>
                {images.length} photo{images.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📷</div>
              <p>Loading photos...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && images.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
              <p style={{ fontSize: '15px' }}>Photos coming soon — check back shortly.</p>
            </div>
          )}

          {/* Grid */}
          {!loading && images.length > 0 && (
            <div
              ref={gridRef}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className={visible ? 'anim-in' : 'anim-hidden'}
                  onClick={() => setLightbox(img.src)}
                  style={{
                    transitionDelay: `${Math.min(i * 0.05, 0.5)}s`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'zoom-in',
                    position: 'relative',
                    aspectRatio: '4/3',
                    background: 'var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  className={`gallery-item ${visible ? 'anim-in' : 'anim-hidden'}`}
                >
                  <img
                    src={img.src}
                    alt={`GoodNight Inn — photo ${i + 1}`}
                    loading="lazy"
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                    className="gallery-img"
                  />
                  {/* Hover overlay */}
                  <div className="gallery-overlay" style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(37,99,235,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.3s',
                  }}>
                    <span style={{ fontSize: '28px', color: '#fff', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>🔍</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-section" style={{ padding: '60px 0' }}>
        <div className="cta-inner container">
          <div className="cta-badge">📍 664 Main St. W, Port Colborne</div>
          <h2 className="cta-heading">Like What You <em className="cta-em">See?</em></h2>
          <p className="cta-sub">Book direct for the best rate — no booking fees, no middleman, instant confirmation.</p>
          <div className="cta-actions">
            <a href="/#rooms" className="cta-btn-main">Browse Rooms →</a>
            <a href="tel:+18338551818" className="cta-btn-ghost">📞 1-833-855-1818</a>
          </div>
        </div>
        <div className="cta-circle cta-circle-1" />
        <div className="cta-circle cta-circle-2" />
      </div>

      {/* Lightbox */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {/* Inline hover CSS */}
      <style>{`
        .gallery-item:hover .gallery-img { transform: scale(1.06); }
        .gallery-item:hover .gallery-overlay { opacity: 1 !important; }
        @media (max-width: 768px) {
          .gallery-about-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  );
};

export default GalleryView;