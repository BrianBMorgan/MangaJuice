const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache
const PORT = process.env.PORT || 3001;

const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_UPLOADS = 'https://uploads.mangadex.org';

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 60000, max: 100 });
app.use('/api/', limiter);

// ── Search manga ──────────────────────────────────────────────────────────────
app.get('/api/manga/search', async (req, res) => {
  try {
    const { q, genres, status, contentRating = 'safe,suggestive', limit = 20, offset = 0 } = req.query;
    const cacheKey = `search:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const params = {
      limit,
      offset,
      'order[relevance]': 'desc',
      'includes[]': ['cover_art', 'author', 'artist'],
      'contentRating[]': contentRating.split(','),
    };

    if (q) params.title = q;
    if (status) params['status[]'] = status.split(',');
    if (genres) params['includedTags[]'] = genres.split(',');

    const response = await axios.get(`${MANGADEX_API}/manga`, { params });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get manga by ID ───────────────────────────────────────────────────────────
app.get('/api/manga/:id', async (req, res) => {
  try {
    const cacheKey = `manga:${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${MANGADEX_API}/manga/${req.params.id}`, {
      params: { 'includes[]': ['cover_art', 'author', 'artist', 'tag'] },
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get chapters for a manga ──────────────────────────────────────────────────
app.get('/api/manga/:id/chapters', async (req, res) => {
  try {
    const { translatedLanguage = 'en', limit = 100, offset = 0 } = req.query;
    const cacheKey = `chapters:${req.params.id}:${offset}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${MANGADEX_API}/manga/${req.params.id}/feed`, {
      params: {
        'translatedLanguage[]': translatedLanguage,
        'order[chapter]': 'asc',
        'includes[]': ['scanlation_group'],
        limit,
        offset,
      },
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get chapter pages ─────────────────────────────────────────────────────────
app.get('/api/chapter/:id/pages', async (req, res) => {
  try {
    const cacheKey = `pages:${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${MANGADEX_API}/at-home/server/${req.params.id}`);
    const { baseUrl, chapter } = response.data;

    const pages = chapter.data.map((filename, i) => ({
      index: i,
      url: `/api/image?url=${encodeURIComponent(`${baseUrl}/data/${chapter.hash}/${filename}`)}`,
      dataSaverUrl: `/api/image?url=${encodeURIComponent(`${baseUrl}/data-saver/${chapter.hash}/${chapter.dataSaver[i]}`)}`,
    }));

    const result = { pages, total: pages.length };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Image proxy (ad-free) ─────────────────────────────────────────────────────
app.get('/api/image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    const decoded = decodeURIComponent(url);
    // Only allow MangaDex CDN origins
    if (!decoded.startsWith('https://uploads.mangadex.org') && !decoded.includes('.mangadex.network')) {
      return res.status(403).json({ error: 'Blocked: non-MangaDex image source' });
    }

    const response = await axios.get(decoded, {
      responseType: 'stream',
      headers: { 'Referer': 'https://mangadex.org' },
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cover image proxy ─────────────────────────────────────────────────────────
app.get('/api/cover/:mangaId/:filename', async (req, res) => {
  try {
    const { mangaId, filename } = req.params;
    const { size = '256' } = req.query;
    const url = `${MANGADEX_UPLOADS}/covers/${mangaId}/${filename}.${size}.jpg`;

    const cached = cache.get(url);
    if (cached) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: { 'Referer': 'https://mangadex.org' },
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    res.status(404).json({ error: 'Cover not found' });
  }
});

// ── Popular/trending manga ────────────────────────────────────────────────────
app.get('/api/manga/popular', async (req, res) => {
  try {
    const cacheKey = 'popular';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${MANGADEX_API}/manga`, {
      params: {
        limit: 20,
        'order[followedCount]': 'desc',
        'includes[]': ['cover_art'],
        'contentRating[]': ['safe', 'suggestive'],
        'hasAvailableChapters': true,
      },
    });
    cache.set(cacheKey, response.data, 600); // 10 min for popular
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tags/genres list ──────────────────────────────────────────────────────────
app.get('/api/tags', async (req, res) => {
  try {
    const cached = cache.get('tags');
    if (cached) return res.json(cached);

    const response = await axios.get(`${MANGADEX_API}/manga/tag`);
    cache.set('tags', response.data, 3600); // 1 hour
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`MangaJuice server running on port ${PORT}`);
});
