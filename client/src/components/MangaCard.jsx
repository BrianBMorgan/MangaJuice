import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMangaTitle, getCoverUrl, getCoverRelationship, formatStatus } from '../api/mangadex';
import { BookOpen, Star } from 'lucide-react';

export default function MangaCard({ manga }) {
  const [imgError, setImgError] = useState(false);
  const title = getMangaTitle(manga);
  const coverFile = getCoverRelationship(manga);
  const status = manga.attributes?.status;
  const year = manga.attributes?.year;
  const tags = manga.attributes?.tags?.slice(0, 3) || [];

  const coverUrl = coverFile && !imgError
    ? getCoverUrl(manga.id, coverFile, '256')
    : null;

  const statusClass = `tag tag-status-${status || 'unknown'}`;

  return (
    <Link to={`/manga/${manga.id}`} style={styles.card}>
      {/* Cover */}
      <div style={styles.coverWrap}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            style={styles.cover}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div style={styles.coverPlaceholder}>
            <BookOpen size={32} color="#5a5a7a" />
          </div>
        )}
        {/* Status badge */}
        <div style={styles.statusBadge}>
          <span className={statusClass}>{formatStatus(status)}</span>
        </div>
      </div>

      {/* Info */}
      <div style={styles.info}>
        <h3 style={styles.title} title={title}>{title}</h3>
        {year && <p style={styles.year}>{year}</p>}
        <div style={styles.tags}>
          {tags.map(tag => (
            <span key={tag.id} className="tag tag-genre">
              {tag.attributes?.name?.en || 'Genre'}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    animation: 'fadeIn 0.3s ease',
  },
  coverWrap: {
    position: 'relative',
    paddingTop: '142%',
    background: 'var(--bg-secondary)',
    overflow: 'hidden',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  coverPlaceholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-secondary)',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  info: {
    padding: '10px 12px 12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.4,
    color: 'var(--text-primary)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  year: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 4,
  },
};
