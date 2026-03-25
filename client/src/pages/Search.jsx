import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchManga, getTags } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Spinner from '../components/Spinner';
import { Search as SearchIcon, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUSES = ['ongoing', 'completed', 'hiatus', 'cancelled'];
const CONTENT_RATINGS = [
  { value: 'safe', label: 'Safe' },
  { value: 'suggestive', label: 'Suggestive' },
];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', order: 'order[relevance]=desc' },
  { value: 'popular', label: 'Most Popular', order: 'order[followedCount]=desc' },
  { value: 'recent', label: 'Recently Updated', order: 'order[updatedAt]=desc' },
  { value: 'newest', label: 'Newest', order: 'order[createdAt]=desc' },
  { value: 'rating', label: 'Top Rated', order: 'order[rating]=desc' },
];
const LIMIT = 24;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState(['safe', 'suggestive']);
  const [selectedTags, setSelectedTags] = useState(
    searchParams.get('genres') ? [searchParams.get('genres')] : []
  );
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    getTags().then(data => {
      const genres = data.data?.filter(t => t.attributes?.group === 'genre') || [];
      setTags(genres);
    });
  }, []);

  const doSearch = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 0 : page;
    if (resetPage) setPage(0);
    setLoading(true);
    try {
      const sortOption = SORT_OPTIONS.find(s => s.value === sort);
      const orderParts = sortOption ? sortOption.order.split('=') : ['order[followedCount]', 'desc'];

      const params = {
        limit: LIMIT,
        offset: currentPage * LIMIT,
        'includes[]': ['cover_art'],
        'contentRating[]': selectedRatings,
      };

      if (query.trim()) params.title = query.trim();
      if (selectedStatus.length) params['status[]'] = selectedStatus;
      if (selectedTags.length) params['includedTags[]'] = selectedTags;
      params[orderParts[0]] = orderParts[1];
      params['hasAvailableChapters'] = true;

      const data = await searchManga(params);
      setResults(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, selectedStatus, selectedRatings, selectedTags, sort, page]);

  useEffect(() => { doSearch(true); }, [selectedStatus, selectedRatings, selectedTags, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(true);
  };

  const toggleStatus = (s) => setSelectedStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleRating = (r) => setSelectedRatings(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <form onSubmit={handleSearch} style={styles.searchRow}>
            <div style={styles.searchWrap}>
              <SearchIcon size={16} color="#9090b0" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                placeholder="Search manga titles..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.searchBtn}>Search</button>
            <button type="button" style={{ ...styles.filterBtn, background: showFilters ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.05)', borderColor: showFilters ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }} onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </form>

          {/* Sort */}
          <div style={styles.sortRow}>
            <span style={styles.sortLabel}>Sort by:</span>
            {SORT_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setSort(s.value)} style={{ ...styles.sortPill, background: sort === s.value ? 'rgba(233,69,96,0.2)' : 'transparent', color: sort === s.value ? '#e94560' : '#9090b0', borderColor: sort === s.value ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {/* Filters panel */}
        {showFilters && (
          <div style={styles.filtersPanel}>
            <div style={styles.filterGroup}>
              <h4 style={styles.filterLabel}>Status</h4>
              <div style={styles.filterPills}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => toggleStatus(s)} style={{ ...styles.pill, background: selectedStatus.includes(s) ? 'rgba(233,69,96,0.2)' : 'transparent', color: selectedStatus.includes(s) ? '#e94560' : '#9090b0', borderColor: selectedStatus.includes(s) ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.filterGroup}>
              <h4 style={styles.filterLabel}>Content Rating</h4>
              <div style={styles.filterPills}>
                {CONTENT_RATINGS.map(r => (
                  <button key={r.value} onClick={() => toggleRating(r.value)} style={{ ...styles.pill, background: selectedRatings.includes(r.value) ? 'rgba(233,69,96,0.2)' : 'transparent', color: selectedRatings.includes(r.value) ? '#e94560' : '#9090b0', borderColor: selectedRatings.includes(r.value) ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.filterGroup}>
              <h4 style={styles.filterLabel}>Genres</h4>
              <div style={styles.filterPills}>
                {tags.map(t => {
                  const name = t.attributes?.name?.en;
                  const sel = selectedTags.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTag(t.id)} style={{ ...styles.pill, background: sel ? 'rgba(233,69,96,0.2)' : 'transparent', color: sel ? '#e94560' : '#9090b0', borderColor: sel ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
            {(selectedStatus.length > 0 || selectedTags.length > 0) && (
              <button onClick={() => { setSelectedStatus([]); setSelectedTags([]); }} style={styles.clearBtn}>
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div style={styles.resultsHeader}>
          <span style={styles.resultCount}>{loading ? '...' : `${total.toLocaleString()} results`}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={48} />
          </div>
        ) : results.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 18, color: '#9090b0' }}>No results found.</p>
            <p style={{ fontSize: 14, color: '#5a5a7a', marginTop: 8 }}>Try a different search or adjust filters.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {results.map(m => <MangaCard key={m.id} manga={m} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button onClick={() => { setPage(p => Math.max(0, p - 1)); doSearch(); }} disabled={page === 0} style={{ ...styles.pageBtn, opacity: page === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
            <button onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); doSearch(); }} disabled={page >= totalPages - 1} style={{ ...styles.pageBtn, opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  header: { background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '20px 24px', position: 'sticky', top: 60, zIndex: 50 },
  headerInner: { maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  searchRow: { display: 'flex', gap: 8, alignItems: 'center' },
  searchWrap: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  input: { width: '100%', padding: '10px 12px 10px 40px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif' },
  searchBtn: { padding: '10px 20px', background: '#e94560', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, fontFamily: 'Nunito, sans-serif', flexShrink: 0 },
  filterBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: '1px solid', borderRadius: 8, color: '#9090b0', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif', flexShrink: 0 },
  sortRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sortLabel: { fontSize: 12, color: '#5a5a7a', fontWeight: 700 },
  sortPill: { padding: '4px 12px', border: '1px solid', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  container: { maxWidth: 1280, margin: '0 auto', padding: '24px 24px 60px' },
  filtersPanel: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  filterGroup: {},
  filterLabel: { fontSize: 11, fontWeight: 800, color: '#5a5a7a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 },
  filterPills: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pill: { padding: '4px 12px', border: '1px solid', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.15s' },
  clearBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#9090b0', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', width: 'fit-content' },
  resultsHeader: { marginBottom: 16 },
  resultCount: { fontSize: 13, color: '#5a5a7a', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 },
  empty: { textAlign: 'center', padding: '80px 0' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 48 },
  pageBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: '#f0f0f5', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  pageInfo: { fontSize: 13, color: '#9090b0', fontWeight: 600 },
};
