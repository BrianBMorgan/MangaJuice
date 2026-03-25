import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Zap } from 'lucide-react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Zap size={18} color="#e94560" fill="#e94560" />
          </div>
          <span style={styles.logoText}>Manga<span style={{ color: '#e94560' }}>Juice</span></span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={styles.searchWrap}>
            <Search size={16} color="#9090b0" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search manga, titles, genres..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>

        {/* Nav links */}
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/search" style={styles.link}>Browse</Link>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'rgba(13, 13, 20, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    WebkitBackdropFilter: 'blur(12px)',
  },
  inner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    width: 32,
    height: 32,
    background: 'rgba(233,69,96,0.15)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(233,69,96,0.3)',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 900,
    color: '#f0f0f5',
    letterSpacing: '-0.5px',
  },
  searchForm: {
    flex: 1,
    display: 'flex',
    gap: 8,
    maxWidth: 600,
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 36px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#f0f0f5',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Nunito, sans-serif',
  },
  searchBtn: {
    padding: '8px 18px',
    background: '#e94560',
    color: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Nunito, sans-serif',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  links: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  link: {
    padding: '6px 14px',
    borderRadius: 8,
    color: '#9090b0',
    fontSize: 14,
    fontWeight: 600,
    transition: 'color 0.2s, background 0.2s',
    textDecoration: 'none',
  },
};
