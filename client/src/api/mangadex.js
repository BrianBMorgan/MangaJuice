import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const searchManga = (params) => api.get('/manga/search', { params }).then(r => r.data);
export const getPopularManga = () => api.get('/manga/popular').then(r => r.data);
export const getManga = (id) => api.get(`/manga/${id}`).then(r => r.data);
export const getChapters = (id, params) => api.get(`/manga/${id}/chapters`, { params }).then(r => r.data);
export const getChapterPages = (id) => api.get(`/chapter/${id}/pages`).then(r => r.data);
export const getTags = () => api.get('/tags').then(r => r.data);

export const getCoverUrl = (mangaId, filename, size = '256') =>
  `/api/cover/${mangaId}/${filename}?size=${size}`;

export const getMangaTitle = (manga) => {
  const attrs = manga.attributes;
  return attrs.title.en || attrs.title['ja-ro'] || attrs.title.ja || Object.values(attrs.title)[0] || 'Unknown Title';
};

export const getMangaDescription = (manga) => {
  const attrs = manga.attributes;
  if (!attrs.description) return 'No description available.';
  return attrs.description.en || Object.values(attrs.description)[0] || 'No description available.';
};

export const getCoverRelationship = (manga) => {
  const rel = manga.relationships?.find(r => r.type === 'cover_art');
  return rel?.attributes?.fileName;
};

export const getAuthorName = (manga) => {
  const rel = manga.relationships?.find(r => r.type === 'author');
  return rel?.attributes?.name || 'Unknown Author';
};

export const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};
