import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getManga, getChapters, getMangaTitle, getMangaDescription, getCoverUrl, getCoverRelationship, getAuthorName, formatStatus } from '../api/mangadex';
import Spinner from '../components/Spinner';
import { BookOpen, User, Calendar, Tag, ChevronDown, ChevronUp, Play } from 'lucide-react';

export default function MangaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterTotal, setChapterTotal] = useState(0);
  const [chapterOffset, setChapterOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getManga(id);
        setManga(data.data);
        loadChapters(0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const loadChapters = async (offset = 0) => {
    setChaptersLoading(true);
    try {
      const data = await getChapters(id, { limit: 100, offset });
      if (offset === 0) {
        setChapters(data.data || []);
      } else {
        setChapters(prev => [...prev, ...(data.data || [])]);
      }
      setChapterTotal(data.total || 0);
      setChapterOffset(offset);
    } catch (e) {
      console.error(e);
    } finally {
      setChaptersLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Spinner size={48} />
    </div>
  );

  if (!manga) return <div style={{ textAlign: 'center', padding: 80, color: '#9090b0' }}>Manga not found.</div>;

  const title = getMangaTitle(manga);
  const description = getMangaDescription(manga);
  const coverFile = getCoverRelationship(manga);
  const coverUrl = coverFile && !imgError ? getCoverUrl(manga.id, coverFile, '512') : null;
  const author = getAuthorName(manga);
  const status = manga.attributes?.status;
  const year = manga.attributes?.year;
  const tags = manga.attributes?.tags || [];
  const firstChapter = chapters[0];

  const truncatedDesc = description.length > 400 && !descExpanded
    ? description.slice(0, 400) + '...'
    : description;

  return (
    <div style={styles.page}>
      {/* Banner blur bg */}
      {coverUrl && (
        <div style={{ ...styles.bannerBg, backgroundImage: `url(${coverUrl})` }} />
      )}

      <div style={styles.container}>
        {/* Top section */}
        <div style={styles.topSection}>
          {/* Cover */}
          <div style={styles.coverWrap}>
            {coverUrl ? (
              <img src={coverUrl} alt={title} style={styles.cover} onError={() => setImgError(true)} />
            ) : (
              <div style={styles.coverPlaceholder}>
                <BookOpen size={48} color="#5a5a7a" />
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={styles.meta}>
            <h1 style={styles.title}>{title}</h1>

            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <User size={14} color="#9090b0" />
                <span>{author}</span>
              </div>
              {year && (
                <div style={styles.metaItem}>
                  <Calendar size={14} color="#9090b0" />
                  <span>{year}</span>
                </div>
              )}
              <span className={`tag tag-status-${status}`}>{formatStatus(status)}</span>
            </div>

            {/* Tags */}
            <div style={styles.tagsRow}>
              {tags.slice(0, 8).map(tag => (
                <span key={tag.id} className="tag tag-genre">{tag.attributes?.name?.en}</span>
              ))}
            </div>

            {/* Description */}
            <div style={styles.descWrap}>
              <p style={styles.desc}>{truncatedDesc}</p>
              {description.length > 400 && (
                <button style={styles.descToggle} onClick={() => setDescExpanded(!descExpanded)}>
                  {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
                </button>
              )}
            </div>

            {/* CTA */}
            {firstChapter && (
              <button onClick={() => navigate(`/read/${firstChapter.id}`)} style={styles.readBtn}>
                <Play size={18} fill="white" />
                Start Reading — Chapter 1
              </button>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div style={styles.chaptersSection}>
          <h2 style={styles.sectionTitle}>
            <BookOpen size={18} />
            Chapters
            <span style={styles.chapterCount}>{chapterTotal} total</span>
          </h2>
          <div style={styles.chapterList}>
            {chapters.map(ch => {
              const chNum = ch.attributes?.chapter;
              const chTitle = ch.attributes?.title;
              const group = ch.relationships?.find(r => r.type === 'scanlation_group');
              const groupName = group?.attributes?.name || 'Unknown Group';
              const updatedAt = ch.attributes?.updatedAt ? new Date(ch.attributes.updatedAt).toLocaleDateString() : '';

              return (
                <Link key={ch.id} to={`/read/${ch.id}`} style={styles.chapterRow}>
                  <div style={styles.chapterLeft}>
                    <span style={styles.chapterNum}>Chapter {chNum || '?'}</span>
                    {chTitle && <span style={styles.chapterTitle}>{chTitle}</span>}
                  </div>
                  <div style={styles.chapterRight}>
                    <span style={styles.groupName}>{groupName}</span>
                    <span style={styles.chapterDate}>{updatedAt}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          {chapters.length < chapterTotal && (
            <button onClick={() => loadChapters(chapterOffset + 100)} style={styles.loadMore} disabled={chaptersLoading}>
              {chaptersLoading ? <Spinner size={16} /> : `Load more chapters (${chapterTotal - chapters.length} remaining)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' },
  bannerBg: { position: 'fixed', top: 0, left: 0, right: 0, height: 400, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(60px) brightness(0.15)', zIndex: 0 },
  container: { position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' },
  topSection: { display: 'flex', gap: 40, marginBottom: 56, flexWrap: 'wrap' },
  coverWrap: { flexShrink: 0, width: 220, height: 320, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' },
  cover: { width: '100%', height: '100%', objectFit: 'cover' },
  coverPlaceholder: { width: '100%', height: '100%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 },
  title: { fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, lineHeight: 1.2, color: '#f0f0f5', letterSpacing: '-0.5px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9090b0', fontWeight: 600 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  descWrap: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' },
  desc: { fontSize: 14, color: '#9090b0', lineHeight: 1.7 },
  descToggle: { marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: '#e94560', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', padding: 0 },
  readBtn: { display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: '#e94560', color: '#fff', borderRadius: 10, fontWeight: 800, fontSize: 15, fontFamily: 'Nunito, sans-serif', boxShadow: '0 0 24px rgba(233,69,96,0.4)', border: 'none', cursor: 'pointer', width: 'fit-content', marginTop: 4 },
  chaptersSection: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' },
  sectionTitle: { fontSize: 20, fontWeight: 800, color: '#f0f0f5', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  chapterCount: { fontSize: 13, color: '#5a5a7a', fontWeight: 600, marginLeft: 4 },
  chapterList: { display: 'flex', flexDirection: 'column', gap: 2 },
  chapterRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', textDecoration: 'none', color: 'inherit', transition: 'all 0.15s', gap: 12 },
  chapterLeft: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  chapterNum: { fontSize: 14, fontWeight: 700, color: '#e94560', flexShrink: 0 },
  chapterTitle: { fontSize: 13, color: '#9090b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chapterRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  groupName: { fontSize: 12, color: '#5a5a7a', fontWeight: 600 },
  chapterDate: { fontSize: 12, color: '#5a5a7a' },
  loadMore: { marginTop: 16, width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, color: '#9090b0', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
};
