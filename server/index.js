const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 300 });
const PORT = process.env.PORT || 3001;

const MANGADEX_API = 'https://api.mangadex.org';
const MANGADEX_UPLOADS = 'https://uploads.mangadex.org';

app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60000, max: 200 });
app.use('/api/', limiter);

// Axios instance that serializes arrays as repeated keys: key[]=a&key[]=b
const mdx = axios.create({
  baseURL: MANGADEX_API,
  paramsSerializer: (params) => {
    const parts = [];
    for (const [key, val] of Object.entries(params)) {
      if (Array.isArray(val)) {
        val.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
      } else if (val !== undefined && val !== null) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    }
    return parts.join('&');
  },
});

// ── Popular/trending — MUST be before /api/manga/:id ──────────────────────────
app.get('/api/manga/popular', async (req, res) => {
  try {
    const cacheKey = 'popular';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await mdx.get('/manga', {
      params: {
        limit: 20,
        'order[followedCount]': 'desc',
        'includes[]': ['cover_art'],
        'contentRating[]': ['safe', 'suggestive'],
        hasAvailableChapters: 'true',
      },
    });
    cache.set(cacheKey, response.data, 600);
    res.json(response.data);
  } catch (err) {
    console.error('popular error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Search manga — MUST be before /api/manga/:id ───────────────────────────────
app.get('/api/manga/search', async (req, res) => {
  try {
    const {
      q, genres, status,
      limit = 20, offset = 0,
    } = req.query;

    // Support contentRating as comma-string or array
    let ratings = req.query.contentRating || req.query['contentRating[]'] || 'safe,suggestive';
    if (!Array.isArray(ratings)) ratings = ratings.split(',');

    const cacheKey = `search:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const params = {
      limit,
      offset,
      'order[followedCount]': 'desc',
      'includes[]': ['cover_art', 'author', 'artist'],
      'contentRating[]': ratings,
      hasAvailableChapters: 'true',
    };

    if (q && q.trim()) params.title = q.trim();
    if (status) params['status[]'] = Array.isArray(status) ? status : status.split(',');
    if (genres) params['includedTags[]'] = Array.isArray(genres) ? genres : genres.split(',');

    const response = await mdx.get('/manga', { params });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error('search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get manga by ID ───────────────────────────────────────────────────────────
app.get('/api/manga/:id', async (req, res) => {
  try {
    const cacheKey = `manga:${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await mdx.get(`/manga/${req.params.id}`, {
      params: { 'includes[]': ['cover_art', 'author', 'artist', 'tag'] },
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error('manga detail error:', err.message);
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

    const response = await mdx.get(`/manga/${req.params.id}/feed`, {
      params: {
        'translatedLanguage[]': [translatedLanguage],
        'order[chapter]': 'asc',
        'includes[]': ['scanlation_group'],
        limit,
        offset,
      },
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error('chapters error:', err.message);
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
    console.error('pages error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Image proxy (ad-free) ─────────────────────────────────────────────────────
app.get('/api/image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    const decoded = decodeURIComponent(url);
    if (!decoded.startsWith('https://uploads.mangadex.org') && !decoded.includes('.mangadex.network')) {
      return res.status(403).json({ error: 'Blocked: non-MangaDex image source' });
    }

    const response = await axios.get(decoded, {
      responseType: 'stream',
      headers: { Referer: 'https://mangadex.org' },
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

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: { Referer: 'https://mangadex.org' },
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    res.status(404).json({ error: 'Cover not found' });
  }
});

// ── Tags/genres list ──────────────────────────────────────────────────────────
app.get('/api/tags', async (req, res) => {
  try {
    const cached = cache.get('tags');
    if (cached) return res.json(cached);

    const response = await axios.get(`${MANGADEX_API}/manga/tag`);
    cache.set('tags', response.data, 3600);
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
