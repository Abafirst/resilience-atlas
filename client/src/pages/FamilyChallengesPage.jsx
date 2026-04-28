/**
 * FamilyChallengesPage.jsx
 * Browsable catalog of all Family Challenge activities.
 *
 * Route: /iatlas/family/challenges
 * Access: Family tier ($39.99/mo) and above via hasCaregiverAccess()
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import {
  FAMILY_CHALLENGES,
  FAMILY_CHALLENGE_DIMENSIONS,
  getFamilyChallengesByDimension,
} from '../data/iatlas/familyChallenges.js';
import { hasCaregiverAccess } from '../utils/iatlasGating.js';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import { isFamilyChallengeCompleted } from '../hooks/useFamilyProgress.js';

const DIMENSION_COLORS = {
  'agentic-generative':    '#6366f1',
  'somatic-regulative':    '#10b981',
  'cognitive-narrative':   '#f59e0b',
  'relational-connective': '#ec4899',
  'emotional-adaptive':    '#f97316',
  'spiritual-existential': '#8b5cf6',
};

const DIMENSION_ICONS = {
  'agentic-generative':    '/icons/agentic-generative.svg',
  'somatic-regulative':    '/icons/somatic-regulative.svg',
  'cognitive-narrative':   '/icons/cognitive-narrative.svg',
  'relational-connective': '/icons/relational-connective.svg',
  'emotional-adaptive':    '/icons/emotional-adaptive.svg',
  'spiritual-existential': '/icons/spiritual-reflective.svg',
};

const DIFFICULTY_LABELS = {
  foundation: { label: 'Foundation', color: '#10b981' },
  building:   { label: 'Building',   color: '#f59e0b' },
  mastery:    { label: 'Mastery',    color: '#ef4444' },
};

const PAGE_STYLES = `
  .fcp-page {
    background: #f8fafc;
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  .dark-mode .fcp-page {
    background: #0f172a;
  }

  .fcp-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* ── Breadcrumb ── */
  .fcp-breadcrumb {
    padding: 1.25rem 0 .5rem;
    font-size: .8rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: .4rem;
    flex-wrap: wrap;
  }

  .fcp-breadcrumb a {
    color: #6366f1;
    text-decoration: none;
    font-weight: 600;
  }

  .fcp-breadcrumb a:hover {
    text-decoration: underline;
  }

  /* ── Hero ── */
  .fcp-hero {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 20px;
    padding: 2rem 1.75rem;
    margin: 1rem 0 1.75rem;
    color: #ffffff;
  }

  .fcp-hero-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    opacity: .8;
    margin: 0 0 .4rem;
  }

  .fcp-hero-title {
    font-size: 1.8rem;
    font-weight: 900;
    margin: 0 0 .5rem;
    line-height: 1.1;
  }

  .fcp-hero-desc {
    font-size: .95rem;
    opacity: .9;
    margin: 0 0 1.25rem;
    max-width: 600px;
  }

  .fcp-hero-stats {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .fcp-hero-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .fcp-hero-stat-value {
    font-size: 1.6rem;
    font-weight: 900;
    line-height: 1;
  }

  .fcp-hero-stat-label {
    font-size: .72rem;
    opacity: .8;
    margin-top: .2rem;
  }

  /* ── Dimension filter ── */
  .fcp-filter-row {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .fcp-filter-btn {
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    border-radius: 20px;
    padding: .4rem .85rem;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
    color: #475569;
  }

  .dark-mode .fcp-filter-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .fcp-filter-btn.active {
    background: #6366f1;
    border-color: #6366f1;
    color: #ffffff;
  }

  .fcp-filter-btn:hover:not(.active) {
    background: #f1f5f9;
    border-color: #6366f1;
  }

  .dark-mode .fcp-filter-btn:hover:not(.active) {
    background: #334155;
  }

  /* ── Challenge grid ── */
  .fcp-challenges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .fcp-challenge-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow .15s, transform .15s;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .dark-mode .fcp-challenge-card {
    background: #1e293b;
    border-color: #334155;
  }

  .fcp-challenge-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.12);
    transform: translateY(-3px);
  }

  .fcp-challenge-card.locked {
    opacity: .7;
    cursor: pointer;
  }

  .fcp-card-top {
    height: 6px;
  }

  .fcp-card-body {
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: .45rem;
    flex: 1;
  }

  .fcp-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .5rem;
  }

  .fcp-card-title {
    font-size: .95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.25;
  }

  .dark-mode .fcp-card-title {
    color: #f1f5f9;
  }

  .fcp-card-done {
    font-size: .68rem;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    border-radius: 20px;
    padding: .2rem .6rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .fcp-card-desc {
    font-size: .82rem;
    color: #64748b;
    margin: 0;
    line-height: 1.45;
  }

  .fcp-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    font-size: .72rem;
    color: #94a3b8;
    margin-top: .1rem;
  }

  .fcp-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: .5rem;
  }

  .fcp-card-dim-badge {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    font-size: .68rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .15rem .5rem;
    color: #ffffff;
    text-transform: capitalize;
    width: fit-content;
  }

  .fcp-card-diff {
    font-size: .7rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .15rem .5rem;
    color: #ffffff;
  }

  .fcp-card-xp {
    font-size: .78rem;
    font-weight: 700;
    color: #6366f1;
  }

  .fcp-card-lock {
    font-size: .72rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  /* ── Empty state ── */
  .fcp-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #94a3b8;
  }

  .fcp-empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: .75rem;
  }
`;

const DIMENSION_FALLBACK_EMOJIS = {
  'agentic-generative':    '🚀',
  'somatic-regulative':    '🌿',
  'cognitive-narrative':   '🧠',
  'relational-connective': '🤝',
  'emotional-adaptive':    '💛',
  'spiritual-existential': '✨',
};

function SafeIcon({ src, fallbackEmoji = '📌', alt = '', style = {}, className = '' }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <span aria-hidden="true" style={{ fontSize: style.width || 14, lineHeight: 1, ...style }}>
        {fallbackEmoji}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={!alt || undefined}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

function ChallengeCard({ challenge, onClick, locked }) {
  const done  = isFamilyChallengeCompleted(challenge.id);
  const color = DIMENSION_COLORS[challenge.dimension] || '#6366f1';
  const diff  = DIFFICULTY_LABELS[challenge.difficulty] || DIFFICULTY_LABELS.foundation;
  const icon  = DIMENSION_ICONS[challenge.dimension]  || '/icons/compass.svg';

  return (
    <div
      className={`fcp-challenge-card${locked ? ' locked' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${challenge.title}${locked ? ' — locked, Family tier required' : ''}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <div className="fcp-card-top" style={{ background: color }} />
      <div className="fcp-card-body">
        <div className="fcp-card-header">
          <h3 className="fcp-card-title">{challenge.title}</h3>
          {done && <span className="fcp-card-done">✓ Done</span>}
        </div>

        <span
          className="fcp-card-dim-badge"
          style={{ background: color }}
        >
          <SafeIcon
            src={icon}
            fallbackEmoji={DIMENSION_FALLBACK_EMOJIS[challenge.dimension] || '🔷'}
            style={{ filter: 'brightness(0) invert(1)', width: '12px', height: '12px', verticalAlign: 'middle' }}
          />
          {' '}{challenge.dimension.replace(/-/g, ' ')}
        </span>

        <p className="fcp-card-desc">{challenge.description}</p>

        <div className="fcp-card-meta">
          <span><SafeIcon src="/icons/planning.svg" fallbackEmoji="⏱" style={{ width: 12, height: 12 }} /> {challenge.duration}</span>
          <span><SafeIcon src="/icons/network.svg" fallbackEmoji="👥" style={{ width: 12, height: 12 }} /> {challenge.participants}</span>
        </div>

        <div className="fcp-card-footer">
          <span
            className="fcp-card-diff"
            style={{ background: diff.color }}
          >
            {diff.label}
          </span>
          {locked
            ? <span className="fcp-card-lock"><SafeIcon src="/icons/lock.svg" fallbackEmoji="🔒" style={{ width: 12, height: 12 }} /> Family tier</span>
            : <span className="fcp-card-xp">+{challenge.xpReward} XP</span>
          }
        </div>
      </div>
    </div>
  );
}

export default function FamilyChallengesPage() {
  const [selectedDimension, setSelectedDimension] = useState('all');
  const [showUnlockModal,   setShowUnlockModal]   = useState(false);
  const hasAccess = hasCaregiverAccess();
  const navigate  = useNavigate();

  const filteredChallenges = getFamilyChallengesByDimension(selectedDimension);
  const completedCount = FAMILY_CHALLENGES.filter((c) => isFamilyChallengeCompleted(c.id)).length;

  function handleChallengeClick(challenge) {
    if (!hasAccess) {
      setShowUnlockModal(true);
      return;
    }
    navigate(`/iatlas/family/challenges/${challenge.id}`);
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to Family Challenges</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="fcp-page" id="main-content">
        <div className="fcp-wrap">

          {/* Breadcrumb */}
          <nav className="fcp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span aria-hidden="true">›</span>
            <Link to="/iatlas/family-dashboard">Family Dashboard</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Family Challenges</span>
          </nav>

          {/* Hero */}
          <div className="fcp-hero" role="banner">
            <p className="fcp-hero-label"><SafeIcon src="/icons/network.svg" fallbackEmoji="👥" style={{ width: 12, height: 12, verticalAlign: 'middle' }} /> Family Tier · Collaborative Activities</p>
            <h1 className="fcp-hero-title">Family Challenges</h1>
            <p className="fcp-hero-desc">
              Collaborative activities designed for parents and children to build resilience
              together. Complete challenges across all 6 dimensions to earn XP, badges, and
              Family Quest milestones.
            </p>
            <div className="fcp-hero-stats" role="region" aria-label="Challenge statistics">
              <div className="fcp-hero-stat">
                <span className="fcp-hero-stat-value">{FAMILY_CHALLENGES.length}</span>
                <span className="fcp-hero-stat-label">Challenges</span>
              </div>
              <div className="fcp-hero-stat">
                <span className="fcp-hero-stat-value">6</span>
                <span className="fcp-hero-stat-label">Dimensions</span>
              </div>
              <div className="fcp-hero-stat">
                <span className="fcp-hero-stat-value">{completedCount}</span>
                <span className="fcp-hero-stat-label">Completed</span>
              </div>
            </div>
          </div>

          {/* Dimension filter */}
          <div
            className="fcp-filter-row"
            role="group"
            aria-label="Filter by resilience dimension"
          >
            {FAMILY_CHALLENGE_DIMENSIONS.map((dim) => (
              <button
                key={dim.key}
                className={`fcp-filter-btn${selectedDimension === dim.key ? ' active' : ''}`}
                onClick={() => setSelectedDimension(dim.key)}
                aria-pressed={selectedDimension === dim.key}
              >
                {dim.icon} {dim.label}
              </button>
            ))}
          </div>

          {/* Challenge grid */}
          {filteredChallenges.length > 0 ? (
            <div className="fcp-challenges-grid">
              {filteredChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onClick={() => handleChallengeClick(challenge)}
                  locked={!hasAccess}
                />
              ))}
            </div>
          ) : (
            <div className="fcp-empty">
              <SafeIcon src="/icons/goal.svg" fallbackEmoji="🎯" style={{ width: 48, height: 48, display: 'block', margin: '0 auto .75rem' }} />
              <p>No challenges found for this dimension.</p>
            </div>
          )}

        </div>
      </main>

      {showUnlockModal && (
        <IATLASUnlockModal
          variant="caregiver"
          onClose={() => setShowUnlockModal(false)}
        />
      )}
    </>
  );
}
