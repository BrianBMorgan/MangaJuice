import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChapterPages } from '../api/mangadex';
import Spinner from '../components/Spinner';
import { ChevronLeft, ChevronRight, ArrowLeft, Settings, Columns, AlignJustify, ZoomIn, ZoomOut, BookOpen } from 'lucide-react';

const MODES = { VERTICAL: 'vertical', SINGLE: 'single', DOUBLE: 'double' };

export default function Reader() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState(MODES.VERTICAL);
  const [zoom, setZoom] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [loadedPages, setLoadedPages] = useState({});
  const containerRef = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getChapterPages(chapterId);
        setPages(data.pages || []);
        setTotal(data.total || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chapterId]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (mode !== MODES.VERTICAL) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, total, mode]);

  const nextPage = () => setCurrentPage(p => Math.min(total - 1, p + (mode === MODES.DOUBLE ? 2 : 1)));
  const prevPage = () => setCurrentPage(p => Math.max(0, p - (mode === MODES.DOUBLE ? 2 : 1)));

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (mode === MODES.VERTICAL) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const getPageUrl = (page) => dataSaver ? page.dataSaverUrl : page.url;

  const handlePageLoad = (index) => {
    setLoadedPages(prev => ({ ...prev, [index]: true }));
  };

  if (loading) return (
    <div style={styles.loadScreen}>
      <Spinner size={56} />
      <p style={{ color: '#9090b0', marginTop: 16, fontSize: 14 }}>Loading chapter pages...</p>
    </div>
  );

  if (pages.length === 0) return (
    <div style={styles.loadScreen}>
      <BookOpen size={48} color="#5a5a7a" />
      <p style={{ color: '#9090b0', marginTop: 16 }}>No pages found for this chapter.</p>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>Go Back</button>
    </div>
  );

  return (
    <div style={styles.reader} onMouseMove={handleMouseMove} ref={containerRef}>
      {/* Top bar */}
      <div style={{ ...styles.topBar, opacity: showControls ? 1 : 0, transform: showControls ? 'translateY(0)' : 'translateY(-100%)' }}>
        <button onClick={() => navigate(-1)} style={styles.iconBtn}>
          <ArrowLeft size={18} />
        </button>
        <div style={styles.pageIndicator}>
          {mode !== MODES.VERTICAL && (
            <>
              <button onClick={prevPage} disabled={currentPage === 0} style={{ ...styles.iconBtn, opacity: currentPage === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={18} />
              </button>
              <span style={styles.pageNum}>{currentPage + 1} / {total}</span>
              <button onClick={nextPage} disabled={currentPage >= total - 1} style={{ ...styles.iconBtn, opacity: currentPage >= total - 1 ? 0.4 : 1 }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        <div style={styles.topActions}>
          {/* Mode buttons */}
          <button onClick={() => setMode(MODES.VERTICAL)} style={{ ...styles.modeBtn, background: mode === MODES.VERTICAL ? 'rgba(233,69,96,0.2)' : 'transparent', color: mode === MODES.VERTICAL ? '#e94560' : '#9090b0', borderColor: mode === MODES.VERTICAL ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
            <AlignJustify size={14} />
            Scroll
          </button>
          <button onClick={() => setMode(MODES.SINGLE)} style={{ ...styles.modeBtn, background: mode === MODES.SINGLE ? 'rgba(233,69,96,0.2)' : 'transparent', color: mode === MODES.SINGLE ? '#e94560' : '#9090b0', borderColor: mode === MODES.SINGLE ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
            <BookOpen size={14} />
            Single
          </button>
          <button onClick={() => setMode(MODES.DOUBLE)} style={{ ...styles.modeBtn, background: mode === MODES.DOUBLE ? 'rgba(233,69,96,0.2)' : 'transparent', color: mode === MODES.DOUBLE ? '#e94560' : '#9090b0', borderColor: mode === MODES.DOUBLE ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.1)' }}>
            <Columns size={14} />
            Double
          </button>

          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={styles.iconBtn}><ZoomOut size={16} /></button>
          <span style={{ color: '#9090b0', fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={styles.iconBtn}><ZoomIn size={16} /></button>

          {/* Data saver */}
          <button onClick={() => setDataSaver(d => !d)} style={{ ...styles.modeBtn, background: dataSaver ? 'rgba(83,130,255,0.2)' : 'transparent', color: dataSaver ? '#5382ff' : '#9090b0', borderColor: dataSaver ? 'rgba(83,130,255,0.4)' : 'rgba(255,255,255,0.1)', fontSize: 11 }}>
            {dataSaver ? '⚡ Data Saver ON' : '⚡ Data Saver'}
          </button>
        </div>
      </div>

      {/* Pages */}
      {mode === MODES.VERTICAL && (
        <div style={styles.verticalContainer}>
          {pages.map((page, i) => (
            <div key={i} style={{ ...styles.verticalPage, width: `${zoom}%`, maxWidth: 900 }}>
              {!loadedPages[i] && <div style={styles.pageSkeleton} className="skeleton" />}
              <img
                src={getPageUrl(page)}
                alt={`Page ${i + 1}`}
                style={{ ...styles.pageImg, display: loadedPages[i] ? 'block' : 'none' }}
                onLoad={() => handlePageLoad(i)}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {mode === MODES.SINGLE && (
        <div style={styles.singleContainer} onClick={(e) => {
          const x = e.clientX / window.innerWidth;
          if (x > 0.5) nextPage(); else prevPage();
        }}>
          <div style={{ maxWidth: `${zoom}%`, margin: '0 auto', position: 'relative' }}>
            {!loadedPages[currentPage] && <div style={styles.pageSkeleton} className="skeleton" />}
            <img
              key={currentPage}
              src={getPageUrl(pages[currentPage])}
              alt={`Page ${currentPage + 1}`}
              style={{ ...styles.pageImgFit, display: loadedPages[currentPage] ? 'block' : 'none' }}
              onLoad={() => handlePageLoad(currentPage)}
            />
          </div>
          {/* Tap zones */}
          <div style={styles.tapLeft} onClick={prevPage} />
          <div style={styles.tapRight} onClick={nextPage} />
        </div>
      )}

      {mode === MODES.DOUBLE && (
        <div style={styles.doubleContainer}>
          {[0, 1].map(offset => {
            const idx = currentPage + offset;
            if (idx >= pages.length) return <div key={offset} style={{ flex: 1 }} />;
            return (
              <div key={offset} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!loadedPages[idx] && <div style={styles.pageSkeleton} className="skeleton" />}
                <img
                  key={idx}
                  src={getPageUrl(pages[idx])}
                  alt={`Page ${idx + 1}`}
                  style={{ ...styles.pageImgFit, maxHeight: 'calc(100vh - 80px)', display: loadedPages[idx] ? 'block' : 'none' }}
                  onLoad={() => handlePageLoad(idx)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom bar for non-vertical */}
      {mode !== MODES.VERTICAL && (
        <div style={{ ...styles.bottomBar, opacity: showControls ? 1 : 0 }}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${((currentPage + 1) / total) * 100}%` }} />
          </div>
          <div style={styles.bottomNav}>
            <button onClick={prevPage} disabled={currentPage === 0} style={{ ...styles.navBtn, opacity: currentPage === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={20} /> Previous
            </button>
            <span style={styles.pageNum}>{currentPage + 1} / {total}</span>
            <button onClick={nextPage} disabled={currentPage >= total - 1} style={{ ...styles.navBtn, opacity: currentPage >= total - 1 ? 0.4 : 1 }}>
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  reader: { background: '#080810', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', userSelect: 'none' },
  loadScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080810', gap: 8 },
  topBar: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 16px', height: 56, gap: 12, transition: 'opacity 0.3s, transform 0.3s' },
  iconBtn: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5', cursor: 'pointer', flexShrink: 0 },
  modeBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', height: 30, flexShrink: 0 },
  pageIndicator: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  topActions: { display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  pageNum: { fontSize: 13, color: '#9090b0', fontWeight: 700 },

  verticalContainer: { paddingTop: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingBottom: 60 },
  verticalPage: { position: 'relative', margin: '0 auto' },
  pageImg: { width: '100%', height: 'auto', display: 'block' },

  singleContainer: { paddingTop: 56, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 'calc(100vh - 56px)', padding: '56px 0 80px' },
  pageImgFit: { maxWidth: '100%', maxHeight: 'calc(100vh - 140px)', width: 'auto', height: 'auto', display: 'block', margin: '0 auto' },
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', cursor: 'w-resize', zIndex: 10 },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', cursor: 'e-resize', zIndex: 10 },

  doubleContainer: { paddingTop: 56, flex: 1, display: 'flex', alignItems: 'center', gap: 2, padding: '56px 8px 80px', minHeight: '100vh' },

  pageSkeleton: { width: '100%', height: '500px', borderRadius: 4 },

  bottomBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '8px 24px 12px', zIndex: 200, transition: 'opacity 0.3s' },
  progressBar: { height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#e94560', borderRadius: 2, transition: 'width 0.3s ease' },
  bottomNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' },
  backBtn: { marginTop: 16, padding: '10px 20px', background: '#e94560', color: '#fff', borderRadius: 8, fontWeight: 700, fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' },
};
