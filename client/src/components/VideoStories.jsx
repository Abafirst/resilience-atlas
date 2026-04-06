import React, { useState, useEffect, useCallback } from 'react';
import { KIDS_VIDEO_STORIES, VIDEO_AGE_FILTERS } from '../data/kidsVideoStories';

/* ── Video Modal ── */
function VideoModal({ video, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="video-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Watch: ${video.title}`}
      onClick={handleBackdropClick}
    >
      <div className="video-modal-inner">
        <button
          className="video-modal-close"
          onClick={onClose}
          aria-label="Close video"
        >
          &#x2715;
        </button>
        <p className="video-modal-title">{video.title}</p>
        <p className="video-modal-meta">{video.subtitle}</p>
        <div className="video-embed-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            title={video.title}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="video-modal-desc">{video.description}</p>
      </div>
    </div>
  );
}

/* ── VideoStories Section ── */
export default function VideoStories() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);
  const closeVideo = useCallback(() => setActiveVideo(null), []);

  const filteredVideos =
    activeFilter === 'all'
      ? KIDS_VIDEO_STORIES
      : KIDS_VIDEO_STORIES.filter((v) => v.ageGroup === activeFilter);

  return (
    <>
      {activeVideo && <VideoModal video={activeVideo} onClose={closeVideo} />}

      <section
        className="video-stories-section"
        id="video-stories"
        aria-labelledby="video-stories-heading"
      >
        <div className="section-inner">
          <div
            className="section-header"
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <span className="section-label">Video Stories</span>
            <h2 id="video-stories-heading">Watch a Resilience Story</h2>
            <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
              Watch and learn how young people just like you use resilience skills to face real challenges.
            </p>
          </div>

          {/* Age-group filter tabs */}
          <div className="video-age-filters" role="group" aria-label="Filter by age group">
            {VIDEO_AGE_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                className={`video-age-tab${activeFilter === id ? ' active' : ''}`}
                onClick={() => setActiveFilter(id)}
                aria-pressed={activeFilter === id}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Video grid */}
          {filteredVideos.length > 0 ? (
            <div className="video-grid">
              {filteredVideos.map((video) => (
                <div key={video.id} className="video-card">
                  <button
                    className="video-thumbnail-btn"
                    onClick={() => setActiveVideo(video)}
                    aria-label={`Watch ${video.title}`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                      alt={video.title}
                      className="video-thumbnail"
                    />
                    <span className="video-play-icon" aria-hidden="true">&#9654;</span>
                  </button>
                  <div className="video-card-body">
                    <p className="video-card-subtitle">{video.subtitle}</p>
                    <h3 className="video-card-title">{video.title}</h3>
                    <p className="video-card-desc">{video.description}</p>
                    <div className="video-card-meta">
                      <span className="video-meta-tag">{video.duration}</span>
                      <span className="video-meta-tag">{video.ageLabel}</span>
                      <span className="video-meta-tag video-dimension-tag">{video.dimension}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="video-empty-msg">No videos available for this age group yet. Check back soon!</p>
          )}
        </div>
      </section>
    </>
  );
}
