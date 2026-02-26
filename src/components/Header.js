import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, login, logout, loading } = useContext(AuthContext);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) return null;

  const userLinks = [
    { label: 'Home',       href: '/'            },
    { label: 'Rooms',      href: '/#rooms'      },
    { label: 'Activities', href: '/activities'  },
    { label: 'Gallery',    href: '/gallery'     },
    { label: 'Contact',    href: '/contact'     },
  ];

  const adminLinks = [
    { label: 'Reservations', href: '/admin/reservation'       },
    { label: 'Rooms',        href: '/admin/rooms'             },
    { label: 'Pictures',     href: '/admin/picturemanagement' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  return (
    <>
      <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
        <div className="header-inner container">
          {/* Logo */}
          <a href="/" className="header-logo">
            <div className="logo-icon">🌙</div>
            <div className="logo-text">
              <span className="logo-name">GoodNight Inn</span>
              <span className="logo-sub">Port Colborne, ON</span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="header-nav">
            {links.map(({ label, href }) => (
              <a key={label} href={href} className="header-nav-link">
                {label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="header-actions">
            {user ? (
              <>
                <span className="header-user-name">{user.displayName?.split(' ')[0]}</span>
                <button onClick={logout} className="btn-header-ghost">Logout</button>
              </>
            ) : (
              <button onClick={login} className="btn-header-ghost">Login</button>
            )}
            <a href="tel:+18338551818" className="btn-header-primary">📞 Book Now</a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="header-burger"
            onClick={() => setMenuOpen(p => !p)}
            aria-label="Toggle menu"
          >
            <span className={`burger-line ${menuOpen ? 'burger-line--open-1' : ''}`} />
            <span className={`burger-line ${menuOpen ? 'burger-line--open-2' : ''}`} />
            <span className={`burger-line ${menuOpen ? 'burger-line--open-3' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'mobile-drawer--open' : ''}`}>
        <nav className="mobile-nav">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="mobile-nav-divider" />
          {user ? (
            <button onClick={() => { logout(); setMenuOpen(false); }} className="btn-primary mobile-nav-btn">
              Logout
            </button>
          ) : (
            <button onClick={() => { login(); setMenuOpen(false); }} className="btn-primary mobile-nav-btn">
              Login
            </button>
          )}
          <a href="tel:+18338551818" className="btn-primary mobile-nav-btn" onClick={() => setMenuOpen(false)}>
            📞 Call to Book
          </a>
        </nav>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
};

export default Header;
