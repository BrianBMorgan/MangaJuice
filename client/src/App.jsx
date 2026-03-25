import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import MangaDetail from './pages/MangaDetail';
import Reader from './pages/Reader';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/read/:chapterId" element={<Reader />} />
        </Routes>
      </main>
    </div>
  );
}
