import React from 'react';

export default function LegacyPage({ src, title }) {
  return (
    <iframe
      src={src}
      title={title}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      allowFullScreen
    />
  );
}
