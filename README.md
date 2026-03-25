# MangaJuice 🍹

An ad-free anime manga reader powered by the [MangaDex API](https://api.mangadex.org). Clean, fast, no trackers.

## Features

- **Search & Browse** — Full-text search with genre, status, and content rating filters
- **Ad-Free Reader** — All images proxied through our backend; no ad scripts, no trackers
- **3 Reading Modes** — Vertical scroll, single page, or double-page spread
- **Data Saver Mode** — Lower resolution images for slower connections
- **Keyboard Navigation** — Arrow keys for page-by-page reading
- **Chapter List** — Full chapter list with scanlation group info
- **Responsive** — Works on desktop and mobile

## Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express (proxy server)
- **API**: MangaDex public API (no key required)
- **Cache**: In-memory (NodeCache, 5 min TTL)

## Getting Started

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Run dev (starts both server on :3001 and client on :5173)
npm run dev
```

Then visit `http://localhost:5173`.

## Architecture

```
mangajuice/
├── server/
│   └── index.js        # Express proxy — handles MangaDex API + image proxy
├── client/
│   ├── src/
│   │   ├── api/        # MangaDex API helpers
│   │   ├── components/ # Navbar, MangaCard, Spinner
│   │   ├── pages/      # Home, Search, MangaDetail, Reader
│   │   └── styles/     # Global CSS (dark theme)
│   └── vite.config.js
└── package.json
```

## Why a proxy server?

The proxy serves two purposes:
1. **CORS** — MangaDex API doesn't allow direct browser requests from all origins
2. **Ad-free images** — Images served through our proxy strip all ad injection points; only whitelisted MangaDex CDN URLs are allowed through

## Legal

MangaJuice uses the [MangaDex public API](https://api.mangadex.org/docs/), which is free and open. Content is sourced from MangaDex's licensed and community-uploaded library. This app does not host any manga content itself.
