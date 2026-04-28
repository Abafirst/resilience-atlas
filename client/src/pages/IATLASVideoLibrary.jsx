/**
 * IATLASVideoLibrary.jsx
 * Video library page for IATLAS activity demonstrations.
 * Shows video cards — those without a recorded URL show a "Content in Production"
 * placeholder with a waitlist sign-up form.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import ActivityVideoPlayer from '../components/IATLAS/ActivityVideoPlayer.jsx';

const DEMO_VIDEOS = [
  { id: 'vl-1', title: '5-4-3-2-1 Grounding', dimension: 'somatic-regulative', dimensionLabel: 'Somatic-Regulative', ageGroups: ['ages-8-10', 'ages-11-14'], duration: '3:45', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-2', title: 'Box Breathing',        dimension: 'somatic-regulative', dimensionLabel: 'Somatic-Regulative', ageGroups: ['ages-5-7', 'ages-8-10'],   duration: '2:30', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-3', title: 'Treasure Map',          dimension: 'agentic-generative', dimensionLabel: 'Agentic-Generative', ageGroups: ['ages-5-7', 'ages-8-10'],  duration: '5:00', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-4', title: 'Emotion Wheel',         dimension: 'emotional-adaptive', dimensionLabel: 'Emotional-Adaptive', ageGroups: ['ages-8-10', 'ages-11-14'], duration: '6:15', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-5', title: 'Worry Transformer',     dimension: 'cognitive-narrative', dimensionLabel: 'Cognitive-Narrative', ageGroups: ['ages-8-10', 'ages-11-14'],duration: '4:50', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-6', title: 'Kindness Web',          dimension: 'relational-connective', dimensionLabel: 'Relational-Connective', ageGroups: ['ages-5-7', 'ages-8-10'], duration: '7:20', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-7', title: 'Gratitude Jar',         dimension: 'spiritual-existential', dimensionLabel: 'Spiritual-Existential', ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'], duration: '4:00', videoUrl: null, thumbnailUrl: null },
  { id: 'vl-8', title: 'Body Scan Adventure',   dimension: 'somatic-regulative', dimensionLabel: 'Somatic-Regulative', ageGroups: ['ages-5-7', 'ages-8-10'],   duration: '8:00', videoUrl: null, thumbnailUrl: null },
];

const DIM_FILTERS = [
  { key: 'all',                 label: 'All Dimensions' },
  { key: 'somatic-regulative',  label: 'Somatic' },
  { key: 'emotional-adaptive',  label: 'Emotional' },
  { key: 'agentic-generative',  label: 'Agentic' },
  { key: 'cognitive-narrative', label: 'Cognitive' },
  { key: 'relational-connective', label: 'Relational' },
  { key: 'spiritual-existential', label: 'Spiritual' },
];

const STYLES = `
  .vlib-page { background: #f8fafc; min-height: 100vh; }
  .dark-mode .vlib-page { background: #0f172a; }

  .vlib-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    padding: 3rem 1.5rem 2rem;
    text-align: center;
  }
  .vlib-hero-title { font-size: 2rem; font-weight: 900; margin: 0 0 .5rem; }
  .vlib-hero-sub { font-size: 1rem; color: #94a3b8; max-width: 560px; margin: 0 auto 1.25rem; }
  .vlib-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .4rem 1rem;
    border-radius: 20px;
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.2);
    font-size: .8rem;
    color: #94a3b8;
  }

  .vlib-body { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }

  .vlib-filters {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
    margin-bottom: 1.75rem;
  }
  .vlib-filter-btn {
    padding: .4rem .9rem;
    border-radius: 20px;
    border: 1.5px solid #e2e8f0;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #64748b;
    transition: all .15s;
  }
  .vlib-filter-btn.active {
    background: #0f172a;
    border-color: #0f172a;
    color: #fff;
  }
  .dark-mode .vlib-filter-btn { border-color: #334155; color: #94a3b8; }
  .dark-mode .vlib-filter-btn.active { background: #f1f5f9; border-color: #f1f5f9; color: #0f172a; }

  .vlib-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .vlib-card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
  .dark-mode .vlib-card { background: #1e293b; border-color: #334155; }

  .vlib-card-body { padding: .85rem 1rem; }
  .vlib-card-title { font-size: .92rem; font-weight: 700; color: #0f172a; margin: 0 0 .25rem; }
  .dark-mode .vlib-card-title { color: #f1f5f9; }

  .vlib-coming-soon-banner,
  .vlib-waitlist-banner {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 14px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #f1f5f9;
  }
  .vlib-csb-title { font-size: 1.3rem; font-weight: 700; margin: .75rem 0 .4rem; }
  .vlib-csb-sub { font-size: .88rem; color: #94a3b8; max-width: 480px; margin: 0 auto; }

  .vlib-guidelines {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    margin-top: 2rem;
  }
  .dark-mode .vlib-guidelines { background: #1e293b; border-color: #334155; }
  .vlib-gl-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 .75rem; }
  .dark-mode .vlib-gl-title { color: #f1f5f9; }
  .vlib-gl-list { padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: .35rem; }
  .vlib-gl-list li { font-size: .85rem; color: #475569; }
  .dark-mode .vlib-gl-list li { color: #94a3b8; }
`;

export default function IATLASVideoLibrary() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'

  const filtered = filter === 'all' ? DEMO_VIDEOS : DEMO_VIDEOS.filter(v => v.dimension === filter);

  const availableCount = DEMO_VIDEOS.filter(v => v.videoUrl).length;
  const totalCount     = DEMO_VIDEOS.length;

  async function handleWaitlistSubmit(e) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistState('submitting');
    try {
      const res = await fetch('/api/iatlas/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: waitlistEmail.trim(), source: 'video_library' }),
      });
      setWaitlistState(res.ok ? 'success' : 'error');
    } catch {
      setWaitlistState('error');
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="vlib-page">
        <SiteHeader />

        <div className="vlib-hero">
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🎥</div>
          <h1 className="vlib-hero-title">IATLAS Video Library</h1>
          <p className="vlib-hero-sub">
            Watch practitioners demonstrate IATLAS activities. Each video shows step-by-step instructions,
            age adaptations, and facilitation tips.
          </p>
          <span className="vlib-hero-badge">
            <span>📹</span>
            {availableCount > 0
              ? `${availableCount} of ${totalCount} videos available`
              : `${totalCount} videos in production`}
          </span>
        </div>

        <div className="vlib-body">

          {/* Waitlist banner — shown only when no videos are live yet */}
          {availableCount === 0 && (
            <div className="vlib-waitlist-banner">
              <div style={{ fontSize: '2rem' }}>🎬</div>
              <p className="vlib-csb-title">Activity Demonstration Videos Are Coming!</p>
              <p className="vlib-csb-sub">
                Our production team is recording high-quality demonstration videos for every IATLAS
                activity — with closed captions, age-group variations, and facilitation guidance.
                Be the first to know when they go live.
              </p>

              {waitlistState === 'success' ? (
                <p style={{ color: '#6ee7b7', fontWeight: 700, marginTop: '1rem' }}>
                  ✅ You're on the list! We'll email you when videos launch.
                </p>
              ) : (
                <form
                  onSubmit={handleWaitlistSubmit}
                  style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{
                      padding: '.55rem 1rem', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.25)',
                      background: 'rgba(255,255,255,.1)', color: '#f1f5f9', fontSize: '.88rem',
                      outline: 'none', minWidth: 220,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={waitlistState === 'submitting'}
                    style={{
                      padding: '.55rem 1.25rem', borderRadius: 8,
                      background: '#6366f1', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer',
                    }}
                  >
                    {waitlistState === 'submitting' ? 'Joining…' : 'Notify Me'}
                  </button>
                  {waitlistState === 'error' && (
                    <p style={{ width: '100%', color: '#fca5a5', fontSize: '.8rem', margin: '.25rem 0 0', textAlign: 'center' }}>
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              )}
            </div>
          )}

          <div className="vlib-filters" role="group" aria-label="Filter by dimension">
            {DIM_FILTERS.map(f => (
              <button
                key={f.key}
                className={`vlib-filter-btn${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>

          {selected && (
            <div style={{ marginBottom: '1.5rem' }}>
              <ActivityVideoPlayer
                videoUrl={selected.videoUrl}
                thumbnailUrl={selected.thumbnailUrl}
                title={selected.title}
                dimension={selected.dimensionLabel}
                duration={selected.duration}
                ageGroups={selected.ageGroups}
              />
              <button
                style={{ marginTop: '.75rem', fontSize: '.8rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => setSelected(null)}
                type="button"
              >
                ← Back to library
              </button>
            </div>
          )}

          <div className="vlib-grid">
            {filtered.map(video => (
              <div
                key={video.id}
                className="vlib-card"
                onClick={() => setSelected(video)}
                style={{ cursor: 'pointer' }}
              >
                <ActivityVideoPlayer
                  videoUrl={video.videoUrl}
                  thumbnailUrl={video.thumbnailUrl}
                  title={video.title}
                  dimension={video.dimensionLabel}
                  duration={video.duration}
                  ageGroups={video.ageGroups}
                />
                <div className="vlib-card-body">
                  <p className="vlib-card-title">{video.title}</p>
                  {!video.videoUrl && (
                    <span style={{
                      display: 'inline-block', fontSize: '.7rem', fontWeight: 700,
                      background: '#fef3c7', color: '#92400e',
                      padding: '.15rem .5rem', borderRadius: 20, marginTop: '.25rem',
                    }}>
                      In Production
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="vlib-guidelines">
            <p className="vlib-gl-title">📋 Video Production Specifications</p>
            <ul className="vlib-gl-list">
              <li>Length: 2–5 minutes per video</li>
              <li>Format: MP4, 1080p, 16:9 aspect ratio</li>
              <li>Required: Closed captions (SRT file) for all videos</li>
              <li>Structure: Intro (15s) → Materials (20s) → Demonstration (2–4min) → Variations (30s) → Closing (15s)</li>
              <li>Diverse representation of facilitators and children across all videos</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
