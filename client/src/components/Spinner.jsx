import React from 'react';

export default function Spinner({ size = 32, color = '#e94560' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid rgba(255,255,255,0.1)`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}
