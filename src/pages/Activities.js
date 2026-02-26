import React, { useEffect, useRef, useState, useCallback } from 'react';
import ScrollToTop from '../components/ScrollToTop';

// ─── Hero Carousel Slides ──────────────────────────────────────────────────────
const heroSlides = [
  {
    img: 'https://images.unsplash.com/photo-1564858090022-2a26cfc4e5e5?w=1600&q=80',
    label: 'Niagara Falls, ON',
    title: 'Horseshoe Falls',
    sub: 'The most powerful waterfall in North America — just 25 min away',
  },
  {
    img: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1600&q=80',
    label: 'Port Colborne, ON',
    title: 'Nickel Beach',
    sub: 'Sandy Lake Erie shores with water parks & stunning sunsets',
  },
  {
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    label: 'Niagara Region, ON',
    title: 'Wine Country',
    sub: '100+ award-winning wineries along the Niagara Escarpment',
  },
  {
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    label: 'Niagara Falls, ON',
    title: 'Niagara City Cruises',
    sub: 'Get face-to-face with the falls on Canada\'s iconic boat tour',
  },
  {
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80',
    label: 'Niagara-on-the-Lake, ON',
    title: 'Historic Old Town',
    sub: 'A beautifully preserved 19th-century town full of charm & ice wine',
  },
];

// ─── Activities Data ───────────────────────────────────────────────────────────
const categories = [
  { id: 'local',   label: 'Port Colborne', tag: 'Right Outside Your Door', heading: 'Explore Port Colborne',    sub: 'Walking distance or a short drive — these local gems are minutes from GoodNight Inn.' },
  { id: 'niagara', label: 'Niagara Falls',  tag: '~25 Min Drive',           heading: 'Niagara Falls Attractions', sub: 'The world-famous falls and all its iconic experiences are just 25 minutes away.' },
  { id: 'region',  label: 'Niagara Region', tag: 'Day Trips',               heading: 'Niagara Region Day Trips',  sub: 'Wine country, historic towns, beaches and nature trails all within easy reach.' },
];

const activities = {
  local: [
    {
      name: 'Nickel Beach',
      location: 'Port Colborne, ON',
      dist: '10 min',
      desc: 'A stunning sandy Lake Erie beach with a floating obstacle course (Splashtown Niagara), picnic areas, volleyball courts, mini putt, and watersport rentals. Perfect for families all summer.',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=75',
      tags: ['Beach','Family','Summer'],
      link: 'https://www.portcolborne.ca/en/recreation-and-leisure/nickel-beach.aspx',
      linkLabel: 'Visit Nickel Beach',
    },
    {
      name: 'Lock 8 Gateway Park',
      location: 'Port Colborne, ON',
      dist: '5 min',
      desc: 'Watch massive international freighters navigate the Welland Canal lock from a view platform. Includes a playground, picnic shelter, and interpretive signage about how the locks work.',
      img: 'https://images.unsplash.com/photo-1605106702734-205df224ecce?w=600&q=75',
      tags: ['Landmark','Free','Family'],
      link: 'https://www.portcolborne.ca/en/recreation-and-leisure/lock-8-gateway-park.aspx',
      linkLabel: 'Explore Lock 8',
    },
    {
      name: 'Port Colborne Historical Museum',
      location: '280 King St, Port Colborne',
      dist: '5 min',
      desc: 'Explore century-old buildings, marine artifacts, and the 1869 Georgian Revival Williams Home. Features ever-changing exhibits on the Welland Canal and the city\'s maritime heritage.',
      img: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&q=75',
      tags: ['Museum','History','Culture'],
      link: 'https://www.portcolbornemuseum.ca/',
      linkLabel: 'Visit the Museum',
    },
    {
      name: 'Splashtown Niagara',
      location: 'Nickel Beach, Port Colborne',
      dist: '10 min',
      desc: 'An exciting floating obstacle course on Lake Erie for all ages. Challenging inflatable obstacles on the water, life jackets provided, and staff on hand — massive fun for kids and adults.',
      img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=75',
      tags: ['Water Sports','Adventure','Family'],
      link: 'https://splashtownniagara.com/',
      linkLabel: 'Book Splashtown',
    },
    {
      name: 'Sugarloaf Harbour Marina',
      location: 'Port Colborne, ON',
      dist: '5 min',
      desc: 'A lively waterfront marina perfect for boating, waterfront dining, and sunset strolls. One of the most scenic spots in the city with stunning Lake Erie views.',
      img: 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=600&q=75',
      tags: ['Marina','Waterfront','Dining'],
      link: 'https://www.sugarloafmarina.com/',
      linkLabel: 'Visit the Marina',
    },
    {
      name: 'Welland Canals Parkway Trail',
      location: 'Port Colborne to St. Catharines',
      dist: 'Nearby',
      desc: 'A 45 km scenic trail following the Welland Canal. Popular for cycling and walking with stunning canal views, passing through Thorold, Welland, and Port Colborne.',
      img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=75',
      tags: ['Cycling','Walking','Scenic'],
      link: 'https://niagaraparks.com/visit/attractions/welland-canals-trail/',
      linkLabel: 'Trail Info',
    },
    {
      name: 'HH Knoll Lakeview Park',
      location: 'Port Colborne, ON',
      dist: '10 min',
      desc: 'Beautiful park with walking trails, picnic spots, a playground, and panoramic views of Lake Erie. Perfect for a sunset stroll, family picnic, or a quiet afternoon outdoors.',
      img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=75',
      tags: ['Park','Free','Scenic'],
      link: 'https://www.portcolborne.ca/en/recreation-and-leisure/parks.aspx',
      linkLabel: 'Park Details',
    },
    {
      name: 'Canal Days Marine Heritage Festival',
      location: 'Port Colborne Waterfront',
      dist: 'Walking',
      desc: 'Held every August long weekend, this beloved 4-day waterfront festival celebrates Port Colborne\'s maritime history with live music, food, crafts, ship tours, and fireworks.',
      img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=75',
      tags: ['Festival','Annual','Culture'],
      link: 'https://www.canaldays.ca/',
      linkLabel: 'Canal Days Info',
    },
  ],
  niagara: [
    {
      name: 'Niagara City Cruises',
      location: '5920 Niagara Pkwy',
      dist: '25 min',
      desc: 'Canada\'s only Niagara Falls boat tour. The 20-minute Voyage to the Falls gets you face-to-face with the iconic Horseshoe Falls. Rain ponchos provided. Open May–November.',
      img: 'https://images.unsplash.com/photo-1564858090022-2a26cfc4e5e5?w=600&q=75',
      tags: ['Iconic','Must-Do','Seasonal'],
      link: 'https://www.cityexperiences.com/niagara-ca/city-cruises/niagara/',
      linkLabel: 'Book a Cruise',
    },
    {
      name: 'Journey Behind the Falls',
      location: 'Table Rock, Niagara Falls',
      dist: '25 min',
      desc: 'Descend 150 feet through bedrock tunnels to portals directly behind the Horseshoe Falls. Two outdoor observation decks give a drenching close-up view. Open year-round.',
      img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75',
      tags: ['Iconic','Year-Round','Must-Do'],
      link: 'https://www.niagaraparks.com/visit/attractions/journey-behind-the-falls/',
      linkLabel: 'Get Tickets',
    },
    {
      name: 'Skylon Tower',
      location: '5200 Robinson St',
      dist: '25 min',
      desc: 'A 520-ft tower with a 360° observation deck offering panoramic views of all three waterfalls, Lake Ontario, and even Toronto on a clear day. Revolving dining room available.',
      img: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=600&q=75',
      tags: ['Views','Dining','Year-Round'],
      link: 'https://www.skylon.com/',
      linkLabel: 'Skylon Tower',
    },
    {
      name: 'Niagara Parks Power Station',
      location: 'Niagara Falls, ON',
      dist: '25 min',
      desc: 'An immersive underground experience inside a century-old hydroelectric powerhouse. Descend 200 feet into the tailrace tunnel with spectacular LED light installations.',
      img: 'https://images.unsplash.com/photo-1495954380655-01609180eda3?w=600&q=75',
      tags: ['Unique','History','Year-Round'],
      link: 'https://www.niagaraparks.com/visit/attractions/niagara-parks-power-station/',
      linkLabel: 'Explore Power Station',
    },
    {
      name: 'Whirlpool Aero Car',
      location: 'Niagara Pkwy',
      dist: '30 min',
      desc: 'Ride an antique cable car 250 feet above the Niagara Whirlpool on a 3,500 ft journey built in 1916. Breathtaking views of the gorge, rapids, and surrounding cliffs.',
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75',
      tags: ['Unique','Seasonal','Views'],
      link: 'https://www.niagaraparks.com/visit/attractions/whirlpool-aero-car/',
      linkLabel: 'Aero Car Info',
    },
    {
      name: 'White Water Walk',
      location: 'Niagara Pkwy',
      dist: '30 min',
      desc: 'A 1,000 ft boardwalk skirting Class 6 White Water Rapids in the Niagara Gorge. Descend 230 feet through a tunnel to towering cliffs dating back 410 million years.',
      img: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&q=75',
      tags: ['Nature','Walking','Seasonal'],
      link: 'https://www.niagaraparks.com/visit/attractions/white-water-walk/',
      linkLabel: 'White Water Walk',
    },
    {
      name: 'Falls Illumination & Fireworks',
      location: 'Niagara Falls, ON',
      dist: '25 min',
      desc: 'Every evening from dusk to 1am, the falls are lit in brilliant colours. Friday and Saturday nights include fireworks at 10pm from Victoria Day to Canadian Thanksgiving. Completely free.',
      img: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=600&q=75',
      tags: ['Free','Nightly','Romantic'],
      link: 'https://www.niagaraparks.com/visit/attractions/falls-illumination/',
      linkLabel: 'Illumination Info',
    },
    {
      name: 'Niagara Helicopters',
      location: '3731 Victoria Ave',
      dist: '30 min',
      desc: 'A once-in-a-lifetime helicopter tour over all three waterfalls, the Niagara Whirlpool, Botanical Gardens, and vineyards. Available almost year-round.',
      img: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&q=75',
      tags: ['Premium','Aerial','Year-Round'],
      link: 'https://www.niagarahelicopters.com/',
      linkLabel: 'Book a Flight',
    },
  ],
  region: [
    {
      name: 'Niagara-on-the-Lake',
      location: 'Niagara-on-the-Lake, ON',
      dist: '40 min',
      desc: 'A beautifully preserved 19th-century town famous for its wineries, ice wine, the Shaw Festival theatre, and the stunning Niagara River Parkway Trail.',
      img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=75',
      tags: ['Wine','Heritage','Romantic'],
      link: 'https://www.niagaraonthelake.com/',
      linkLabel: 'Plan Your Visit',
    },
    {
      name: 'Butterfly Conservatory',
      location: 'Niagara Falls, ON',
      dist: '35 min',
      desc: 'The world\'s largest free-flying indoor butterfly conservatory with over 2,000 exotic butterflies from 45 species fluttering freely around you. Open year-round.',
      img: 'https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=600&q=75',
      tags: ['Nature','Year-Round','Family'],
      link: 'https://www.niagaraparks.com/visit/attractions/butterfly-conservatory/',
      linkLabel: 'Visit Conservatory',
    },
    {
      name: 'Murals of Welland',
      location: 'Welland, ON',
      dist: '15 min',
      desc: 'Over 30 stunning large-scale murals painted on buildings throughout downtown Welland telling the story of the city\'s industrial and cultural heritage. A free self-guided walking tour.',
      img: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&q=75',
      tags: ['Art','Free','Culture'],
      link: 'https://www.welland.ca/MuralsOfWelland',
      linkLabel: 'Murals Map',
    },
    {
      name: 'Short Hills Provincial Park',
      location: 'Pelham, ON',
      dist: '35 min',
      desc: 'Niagara\'s largest provincial park with over 25 km of trails through Carolinian forests, waterfalls, and creeks. A favourite for hiking and birdwatching in all four seasons.',
      img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=75',
      tags: ['Hiking','Nature','Year-Round'],
      link: 'https://www.ontarioparks.com/park/shorthills',
      linkLabel: 'Park Details',
    },
    {
      name: 'Niagara Wine Region',
      location: 'Niagara Peninsula, ON',
      dist: '30–45 min',
      desc: 'Ontario\'s premier wine destination with 100+ wineries along the Niagara Escarpment. Tour award-winning estates, sample VQA wines and world-famous ice wine.',
      img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=75',
      tags: ['Wine','Food','Scenic'],
      link: 'https://winesofniagara.com/',
      linkLabel: 'Winery Guide',
    },
    {
      name: 'Old Fort Erie',
      location: 'Fort Erie, ON',
      dist: '30 min',
      desc: 'A restored British fort from the War of 1812 with costumed interpreters, cannon firings, and fascinating exhibits. Offers stunning views across the Niagara River to Buffalo, NY.',
      img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=75',
      tags: ['History','Seasonal','Family'],
      link: 'https://niagaraparks.com/visit/attractions/old-fort-erie/',
      linkLabel: 'Fort Erie Info',
    },
  ],
};

// ─── Hero Carousel ─────────────────────────────────────────────────────────────
const HeroCarousel = () => {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((index) => {
    if (transitioning || index === active) return;
    setPrev(active);
    setActive(index);
    setTransitioning(true);
    setTimeout(() => { setPrev(null); setTransitioning(false); }, 800);
  }, [active, transitioning]);

  const next = useCallback(() => goTo((active + 1) % heroSlides.length), [active, goTo]);
  const prevSlide = useCallback(() => goTo((active - 1 + heroSlides.length) % heroSlides.length), [active, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(() => next(), 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  return (
    <div style={{ position: 'relative', height: '560px', overflow: 'hidden', background: '#111' }}>
      {heroSlides.map((slide, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${slide.img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'opacity 0.9s ease, transform 1.2s ease',
          opacity: i === active ? 1 : 0,
          transform: i === active ? 'scale(1.04)' : 'scale(1)',
          zIndex: i === active ? 2 : i === prev ? 1 : 0,
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.2) 100%)', zIndex: 3 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: '700', letterSpacing: '2.5px', textTransform: 'uppercase', padding: '5px 16px', borderRadius: '100px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.25)' }}>
          📍 {heroSlides[active].label}
        </div>
        <h1 style={{ fontFamily: 'var(--font-disp)', fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: '500', color: '#fff', lineHeight: '1.1', marginBottom: '14px', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
          {heroSlides[active].title}
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '480px', lineHeight: '1.6' }}>
          {heroSlides[active].sub}
        </p>
      </div>
      {['prev','next'].map((dir) => (
        <button key={dir} onClick={dir === 'prev' ? prevSlide : next}
          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [dir === 'prev' ? 'left' : 'right']: '20px', zIndex: 5, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          {dir === 'prev' ? '‹' : '›'}
        </button>
      ))}
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, display: 'flex', gap: '10px', alignItems: 'center' }}>
        {heroSlides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === active ? '32px' : '8px', height: '8px', borderRadius: i === active ? '4px' : '50%', background: i === active ? '#fff' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', transition: 'all 0.35s ease', padding: 0 }} />
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '24px', right: '28px', zIndex: 5, color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
        {String(active + 1).padStart(2,'0')} / {String(heroSlides.length).padStart(2,'0')}
      </div>
    </div>
  );
};

// ─── Pill ──────────────────────────────────────────────────────────────────────
const Pill = ({ label }) => (
  <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '100px', background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid var(--blue-mid)' }}>
    {label}
  </span>
);

// ─── Activity Card ─────────────────────────────────────────────────────────────
const ActivityCard = ({ activity, index, visible }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={visible ? 'anim-in' : 'anim-hidden'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transitionDelay: `${index * 0.07}s`,
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius-lg)',
        border: `1.5px solid ${hovered ? 'var(--blue-mid)' : 'var(--border)'}`,
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '185px', overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
        <img
          src={activity.img}
          alt={activity.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)', pointerEvents: 'none' }} />
        {/* Distance badge */}
        <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', fontSize: '11px', fontWeight: '700', color: 'var(--blue)', padding: '3px 10px', borderRadius: '100px' }}>
          {activity.dist}
        </span>
        {/* Name overlay at bottom */}
        <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
          <h3 style={{ fontFamily: 'var(--font-disp)', fontSize: '18px', fontWeight: '500', color: '#fff', lineHeight: '1.2', textShadow: '0 1px 6px rgba(0,0,0,0.4)', margin: 0 }}>
            {activity.name}
          </h3>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>📍 {activity.location}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8', flex: 1 }}>{activity.desc}</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {activity.tags.map(t => <Pill key={t} label={t} />)}
        </div>
      </div>

      {/* Link button */}
      <div style={{ padding: '0 18px 18px' }}>
        <a
          href={activity.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', background: hovered ? 'var(--blue-dark,#1d4ed8)' : 'var(--blue)',
            color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '600',
            textDecoration: 'none', transition: 'background 0.2s',
          }}
        >
          {activity.linkLabel} →
        </a>
      </div>
    </div>
  );
};

// ─── Category Section ──────────────────────────────────────────────────────────
const Section = ({ cat }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ marginBottom: '72px' }}>
      <div className={`section-header ${visible ? 'anim-in' : 'anim-hidden'}`} style={{ textAlign: 'left', marginBottom: '32px' }}>
        <span className="section-tag">{cat.tag}</span>
        <h2 className="section-heading">{cat.heading}</h2>
        <p className="section-sub">{cat.sub}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
        {activities[cat.id].map((a, i) => (
          <ActivityCard key={a.name} activity={a} index={i} visible={visible} />
        ))}
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
const Activities = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredCats = activeTab === 'all' ? categories : categories.filter(c => c.id === activeTab);
  const totalCount = activeTab === 'all' ? Object.values(activities).flat().length : (activities[activeTab]?.length || 0);

  const tabs = [
    { id: 'all',     label: '🗺️ All' },
    { id: 'local',   label: '📍 Port Colborne' },
    { id: 'niagara', label: '💧 Niagara Falls' },
    { id: 'region',  label: '🚗 Region' },
  ];

  return (
    <section>
      <ScrollToTop />
      <HeroCarousel />

      {/* Sticky tab bar */}
      <div style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 'var(--nav-h)', zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '14px 18px', border: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '14px', whiteSpace: 'nowrap', fontWeight: activeTab === tab.id ? '700' : '500', color: activeTab === tab.id ? 'var(--blue)' : 'var(--text-muted)', borderBottom: activeTab === tab.id ? '2px solid var(--blue)' : '2px solid transparent', cursor: 'pointer', transition: 'color 0.2s' }}>
              {tab.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
              {totalCount} attractions
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: 'var(--bg)', padding: '60px 0 80px' }}>
        <div className="container">
          {filteredCats.map(cat => <Section key={cat.id} cat={cat} />)}
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section" style={{ padding: '60px 0' }}>
        <div className="cta-inner container">
          <div className="cta-badge">📍 664 Main St. W, Port Colborne</div>
          <h2 className="cta-heading">The Perfect Base for <em className="cta-em">Every Adventure</em></h2>
          <p className="cta-sub">Stay at GoodNight Inn and explore everything the Niagara region has to offer — then come home to a clean, comfortable room.</p>
          <div className="cta-actions">
            <a href="/#rooms" className="cta-btn-main">See Our Rooms →</a>
            <a href="tel:+18338551818" className="cta-btn-ghost">📞 1-833-855-1818</a>
          </div>
        </div>
        <div className="cta-circle cta-circle-1" />
        <div className="cta-circle cta-circle-2" />
      </div>
    </section>
  );
};

export default Activities;