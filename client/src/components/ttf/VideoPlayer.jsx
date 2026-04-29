import React from 'react';

/**
 * Thin wrapper around an embedded video (YouTube/Vimeo).
 * Renders an iframe if the URL is recognized, otherwise a plain link.
 */
export default function VideoPlayer({ url, title = 'Video', transcript = '' }) {
  const [showTranscript, setShowTranscript] = React.useState(false);

  if (!url) {
    return (
      <div style={{ padding: 32, background: '#f9fafb', borderRadius: 10, textAlign: 'center', color: '#9ca3af' }}>
        <p style={{ margin: 0 }}>Video coming soon.</p>
      </div>
    );
  }

  const embedSrc = getEmbedUrl(url);

  return (
    <div>
      {embedSrc ? (
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
          <iframe
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
          ▶ Watch Video
        </a>
      )}

      {transcript && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowTranscript(v => !v)}
            style={{
              background: 'none', border: '1px solid #e5e7eb',
              borderRadius: 6, padding: '6px 12px',
              fontSize: 13, cursor: 'pointer', color: '#6b7280',
            }}
          >
            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
          </button>
          {showTranscript && (
            <div style={{
              marginTop: 12, padding: 16, background: '#f9fafb',
              borderRadius: 8, fontSize: 14, color: '#374151',
              lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getEmbedUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // YouTube — allow youtube.com, www.youtube.com, youtu.be
    if (host === 'youtube.com' || host === 'www.youtube.com') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    // Vimeo — allow vimeo.com, www.vimeo.com, player.vimeo.com
    if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
