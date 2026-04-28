/**
 * ActivityVideoPlayer.jsx
 * Video player component for IATLAS activity demonstrations.
 * Shows a "Video Coming Soon" placeholder when no videoUrl is provided.
 */

import React, { useState, useRef } from 'react';

const STYLES = `
  .avp-container {
    border-radius: 12px;
    overflow: hidden;
    background: #0f172a;
    position: relative;
    aspect-ratio: 16 / 9;
    width: 100%;
  }

  .avp-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .75rem;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    color: #f1f5f9;
    text-align: center;
    padding: 1.5rem;
  }

  .avp-placeholder-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(255,255,255,.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .avp-placeholder-title {
    font-size: 1rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
  }

  .avp-placeholder-sub {
    font-size: .8rem;
    color: #94a3b8;
    margin: 0;
    max-width: 280px;
  }

  .avp-placeholder-badge {
    padding: .3rem .85rem;
    border-radius: 20px;
    background: rgba(255,255,255,.1);
    font-size: .75rem;
    font-weight: 600;
    color: #94a3b8;
    border: 1px solid rgba(255,255,255,.15);
  }

  .avp-thumbnail {
    position: absolute;
    inset: 0;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }

  .avp-play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,.3);
    cursor: pointer;
    transition: background .15s;
  }
  .avp-play-overlay:hover { background: rgba(0,0,0,.45); }

  .avp-play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    border: none;
    cursor: pointer;
    transition: transform .15s;
  }
  .avp-play-btn:hover { transform: scale(1.1); }

  .avp-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .avp-meta {
    margin-top: .75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: .5rem;
  }

  .avp-title { font-size: .9rem; font-weight: 700; color: #0f172a; }
  .dark-mode .avp-title { color: #f1f5f9; }

  .avp-chips { display: flex; gap: .4rem; flex-wrap: wrap; }
  .avp-chip {
    padding: .2rem .6rem;
    border-radius: 12px;
    font-size: .72rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
  }
  .dark-mode .avp-chip { background: #334155; color: #94a3b8; }
`;

/**
 * ActivityVideoPlayer
 *
 * Props:
 *   videoUrl    {string|null} — Video URL (MP4, YouTube, Vimeo). Null shows placeholder.
 *   thumbnailUrl {string|null} — Thumbnail image URL
 *   title       {string}      — Activity title
 *   dimension   {string}      — Dimension name
 *   duration    {string}      — Video duration string
 *   ageGroups   {string[]}    — Age groups this video covers
 *   captionsUrl {string|null} — SRT/VTT captions URL
 */
export default function ActivityVideoPlayer({
  videoUrl    = null,
  thumbnailUrl = null,
  title       = 'Activity Demonstration',
  dimension   = '',
  duration    = '',
  ageGroups   = [],
  captionsUrl  = null,
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = () => {
    setPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div>
        <div className="avp-container">
          {!videoUrl ? (
            // Placeholder — video not yet available
            <div className="avp-placeholder" role="img" aria-label={`Video coming soon for ${title}`}>
              <div className="avp-placeholder-icon" aria-hidden="true"><img src="/icons/video.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
              <p className="avp-placeholder-title">Video Coming Soon</p>
              <p className="avp-placeholder-sub">
                A demonstration video for <strong>{title}</strong> is being produced and will be available soon.
              </p>
              <span className="avp-placeholder-badge">In Production</span>
            </div>
          ) : !playing ? (
            // Thumbnail + play button
            <>
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt={`Thumbnail for ${title}`}
                  className="avp-thumbnail"
                />
              )}
              {!thumbnailUrl && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b, #0f172a)' }} />
              )}
              <div
                className="avp-play-overlay"
                onClick={handlePlay}
                role="button"
                tabIndex={0}
                aria-label={`Play video: ${title}`}
                onKeyDown={e => e.key === 'Enter' && handlePlay()}
              >
                <button className="avp-play-btn" aria-hidden="true">▶</button>
              </div>
            </>
          ) : (
            // Playing video
            <video
              ref={videoRef}
              className="avp-video"
              controls
              autoPlay
              aria-label={`Demonstration video for ${title}`}
            >
              <source src={videoUrl} type="video/mp4" />
              {captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English" default />}
              Your browser does not support HTML5 video.
            </video>
          )}
        </div>

        <div className="avp-meta">
          <span className="avp-title">{title}</span>
          <div className="avp-chips">
            {dimension && <span className="avp-chip">{dimension}</span>}
            {duration && <span className="avp-chip">⏱ {duration}</span>}
            {ageGroups.map(ag => (
              <span key={ag} className="avp-chip">{ag.replace('ages-', 'Ages ').replace('-', '–')}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
