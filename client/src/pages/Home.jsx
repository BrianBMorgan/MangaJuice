import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopularManga, searchManga } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Spinner from '../components/Spinner';
import { TrendingUp, Flame, BookOpen, Search } from 'lucide-react';

const FEATURED_GENRES = [
  { name: 'Action', tag: '391b0423-d847-456f-aff0-8b0cfc03066b' },
  { name: 'Romance', tag: 'fda96cdc-8d17-43ce-9e58-8e64b9a9a7e1' },
  { name: 'Fantasy', tag: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc' },
  { name: 'Sci-Fi', tag: '256c8bd9-4904-4360-bf4f-508a76d67183' },
  { name: 'Horror', tag: 'cdad7e68-1419-41dd-bdce-27753074a640' },
  { name: 'Comedy', tag: '4d32cc48-9f00-4cca-9b5a-a839f0764984' },
  { name: 'Mystery', tag: 'ee968100-4191-4968-93d3-f82d72be7e46' },
  { name: 'Slice of Life', tag: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9' },
];

export default function Home() {
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyUpdated, setRecentlyUpdated] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pop, recent] = await Promise.all([
          getPopularManga(),
          searchManga({ limit: 12, 'order[updatedAt]': 'desc', 'contentRating[]': ['safe', 'suggestive'] }),
        ]);
        setPopular(pop.data || []);
        setRecentlyUpdated(recent.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Spinner size={48} />
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <Flame size={14} color="#e94560" />
            <span>Ad-Free · No Trackers · Pure Manga</span>
          </div>
          <h1 style={styles.heroTitle}>
            Your Clean<br />
            <span style={{ color: '#e94560' }}>Manga Paradise</span>
          </h1>
          <p style={styles.heroSub}>
            Thousands of titles from MangaDex, delivered ad-free in a beautiful reader.
          </p>
          <Link to="/search" style={styles.heroBtn}>
            <Search size={16} />
            Browse All Manga
          </Link>
        </div>
        <div className="hero-decor" style={styles.heroDecor}>
          {['📖', '⚔️', '🌸', '🔥', '✨'].map((e, i) => (
            <div key={i} style={{ ...styles.heroEmoji, animationDelay: `${i * 0.4}s`, top: `${20 + i * 14}%`, right: `${4 + i * 5}%`, left: 'auto' }}>{e}</div>
          ))}
        </div>
      </div>

      <div style={styles.container}>
        {/* Genre pills */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}><BookOpen size={18} /> Browse by Genre</h2>
          <div style={styles.genreGrid}>
            {FEATURED_GENRES.map(g => (
              <Link key={g.tag} to={`/search?genres=${g.tag}&genreName=${g.name}`} style={styles.genrePill}>
                {g.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Popular */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}><TrendingUp size={18} /> Most Popular</h2>
            <Link to="/search?sort=popular" style={styles.viewAll}>View all →</Link>
          </div>
          <div style={styles.grid}>
            {popular.slice(0, 12).map(m => <MangaCard key={m.id} manga={m} />)}
          </div>
        </section>

        {/* Recently Updated */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}><Flame size={18} /> Recently Updated</h2>
            <Link to="/search?sort=recent" style={styles.viewAll}>View all →</Link>
          </div>
          <div style={styles.grid}>
            {recentlyUpdated.map(m => <MangaCard key={m.id} manga={m} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg-primary)', minHeight: '100vh' },
  hero: {
    background: 'linear-gradient(135deg, #0d0d14 0%, #16162a 50%, #1a0d1a 100%)',
    borderBottom: '1px solid var(--border)',
    padding: '60px 24px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: 1280,
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 14px',
    background: 'rgba(233,69,96,0.1)',
    border: '1px solid rgba(233,69,96,0.3)',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    color: '#e94560',
    marginBottom: 16,
    letterSpacing: '0.5px',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: 900,
    lineHeight: 1.1,
    color: '#f0f0f5',
    marginBottom: 16,
    letterSpacing: '-1px',
  },
  heroSub: {
    fontSize: 16,
    color: '#9090b0',
    marginBottom: 28,
    maxWidth: 480,
    lineHeight: 1.6,
  },
  heroBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: '#e94560',
    color: '#fff',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 15,
    textDecoration: 'none',
    transition: 'background 0.2s, transform 0.1s',
    boxShadow: '0 0 24px rgba(233,69,96,0.4)',
  },
  heroDecor: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
  },
  heroEmoji: {
    position: 'absolute',
    fontSize: 40,
    opacity: 0.1,
    animation: 'pulse 3s ease-in-out infinite',
  },
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '40px 24px',
  },
  section: { marginBottom: 56 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#f0f0f5',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  viewAll: {
    fontSize: 13,
    color: '#e94560',
    fontWeight: 700,
    textDecoration: 'none',
    marginBottom: 20,
  },
  genreGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  genrePill: {
    padding: '8px 20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 24,
    fontSize: 13,
    fontWeight: 700,
    color: '#9090b0',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
  },
};
