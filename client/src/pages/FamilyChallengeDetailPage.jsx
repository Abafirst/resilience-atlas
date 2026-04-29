/**
 * FamilyChallengeDetailPage.jsx
 * Full-page view for a single Family Challenge.
 *
 * Route: /iatlas/family/challenges/:challengeId
 * Access: Family tier ($39.99/mo) and above via hasCaregiverAccess()
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import { getFamilyChallengeById } from '../data/iatlas/familyChallenges.js';
import { hasCaregiverAccess } from '../utils/iatlasGating.js';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import {
  isFamilyChallengeCompleted,
  saveFamilyChallengeCompletion,
} from '../hooks/useFamilyProgress.js';
import SafeIcon from '../components/common/SafeIcon.jsx';
import { DIMENSION_FALLBACK_EMOJIS } from '../data/iatlas/iatlasConstants.js';

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
  .fcd-page {
    background: #f8fafc;
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  .dark-mode .fcd-page {
    background: #0f172a;
  }

  .fcd-wrap {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* ── Breadcrumb ── */
  .fcd-breadcrumb {
    padding: 1.25rem 0 .5rem;
    font-size: .8rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: .4rem;
    flex-wrap: wrap;
  }

  .fcd-breadcrumb a {
    color: #6366f1;
    text-decoration: none;
    font-weight: 600;
  }

  .fcd-breadcrumb a:hover {
    text-decoration: underline;
  }

  /* ── Hero card ── */
  .fcd-hero {
    border-radius: 20px;
    overflow: hidden;
    margin: 1rem 0 1.75rem;
    box-shadow: 0 4px 20px rgba(0,0,0,.1);
  }

  .fcd-hero-banner {
    height: 10px;
  }

  .fcd-hero-body {
    background: #ffffff;
    padding: 1.75rem;
  }

  .dark-mode .fcd-hero-body {
    background: #1e293b;
  }

  .fcd-meta-row {
    display: flex;
    align-items: center;
    gap: .6rem;
    flex-wrap: wrap;
    margin-bottom: .8rem;
  }

  .fcd-dim-badge {
    font-size: .72rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .2rem .65rem;
    color: #ffffff;
  }

  .fcd-diff-badge {
    font-size: .72rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .2rem .65rem;
    color: #ffffff;
  }

  .fcd-done-badge {
    font-size: .72rem;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    border-radius: 20px;
    padding: .2rem .65rem;
  }

  .fcd-title {
    font-size: 1.65rem;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .dark-mode .fcd-title {
    color: #f1f5f9;
  }

  .fcd-desc {
    font-size: .95rem;
    color: #475569;
    margin: 0 0 1.25rem;
    line-height: 1.55;
  }

  .dark-mode .fcd-desc {
    color: #94a3b8;
  }

  .fcd-details-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }

  .dark-mode .fcd-details-row {
    border-top-color: #334155;
  }

  .fcd-detail {
    display: flex;
    flex-direction: column;
    gap: .2rem;
  }

  .fcd-detail-label {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #94a3b8;
  }

  .fcd-detail-value {
    font-size: .88rem;
    font-weight: 600;
    color: #0f172a;
  }

  .dark-mode .fcd-detail-value {
    color: #f1f5f9;
  }

  /* ── Content sections ── */
  .fcd-section {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
  }

  .dark-mode .fcd-section {
    background: #1e293b;
    border-color: #334155;
  }

  .fcd-section-title {
    font-size: .9rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .9rem;
    display: flex;
    align-items: center;
    gap: .45rem;
  }

  .dark-mode .fcd-section-title {
    color: #f1f5f9;
  }

  .fcd-instructions {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: .55rem;
  }

  .fcd-instruction-item {
    display: flex;
    align-items: flex-start;
    gap: .7rem;
    font-size: .88rem;
    color: #334155;
    line-height: 1.5;
  }

  .dark-mode .fcd-instruction-item {
    color: #cbd5e1;
  }

  .fcd-step-num {
    width: 22px;
    height: 22px;
    min-width: 22px;
    background: #6366f1;
    color: #ffffff;
    border-radius: 50%;
    font-size: .7rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: .1rem;
  }

  .fcd-parent-note {
    background: #fefce8;
    border-left: 4px solid #f59e0b;
    border-radius: 0 10px 10px 0;
    padding: .9rem 1rem;
    font-size: .85rem;
    color: #78350f;
    line-height: 1.55;
    margin: 0;
  }

  .dark-mode .fcd-parent-note {
    background: #1c1408;
    color: #fde68a;
  }

  .fcd-materials-list {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .fcd-material-chip {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: .25rem .75rem;
    font-size: .78rem;
    color: #475569;
    font-weight: 500;
  }

  .dark-mode .fcd-material-chip {
    background: #0f172a;
    border-color: #334155;
    color: #94a3b8;
  }

  .fcd-rewards-row {
    display: flex;
    align-items: center;
    gap: .75rem;
    flex-wrap: wrap;
  }

  .fcd-reward-xp {
    font-size: 1.5rem;
    font-weight: 900;
    color: #6366f1;
  }

  .fcd-reward-xp-label {
    font-size: .75rem;
    color: #64748b;
    margin-left: .2rem;
  }

  .fcd-reward-badge {
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 20px;
    padding: .2rem .7rem;
    font-size: .75rem;
    font-weight: 600;
    color: #92400e;
  }

  /* ── Complete button ── */
  .fcd-complete-btn {
    width: 100%;
    padding: .9rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #ffffff;
    border: none;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 800;
    cursor: pointer;
    transition: opacity .15s;
    margin-top: 1rem;
  }

  .fcd-complete-btn:hover {
    opacity: .9;
  }

  .fcd-complete-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .fcd-complete-success {
    text-align: center;
    padding: 1.5rem;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 14px;
    margin-top: 1rem;
  }

  .fcd-complete-success h3 {
    color: #15803d;
    margin: 0 0 .4rem;
    font-size: 1.1rem;
  }

  .fcd-complete-success p {
    color: #166534;
    font-size: .88rem;
    margin: 0;
  }

  .fcd-back-link {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    color: #6366f1;
    font-weight: 700;
    font-size: .85rem;
    text-decoration: none;
    margin-top: 1.5rem;
  }

  .fcd-back-link:hover {
    text-decoration: underline;
  }

  /* ── Not found ── */
  .fcd-not-found {
    text-align: center;
    padding: 4rem 1rem;
    color: #94a3b8;
  }
`;

export default function FamilyChallengeDetailPage() {
  const { challengeId } = useParams();
  const navigate        = useNavigate();
  const hasAccess       = hasCaregiverAccess();

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [completed,       setCompleted]       = useState(() => isFamilyChallengeCompleted(challengeId));
  const [justCompleted,   setJustCompleted]   = useState(false);

  const challenge = getFamilyChallengeById(challengeId);

  if (!challenge) {
    return (
      <>
        <style>{PAGE_STYLES}</style>
        <SiteHeader activePage="iatlas" />
        <main className="fcd-page">
          <div className="fcd-wrap">
            <div className="fcd-not-found">
              <p style={{ fontSize: '3rem' }}><SafeIcon src="/icons/info.svg" fallbackEmoji="ℹ️" style={{ width: 48, height: 48 }} /> </p>
              <p>Challenge not found.</p>
              <Link to="/iatlas/family/challenges" className="fcd-back-link">
                ‹ Back to Family Challenges
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const color = DIMENSION_COLORS[challenge.dimension] || '#6366f1';
  const icon  = DIMENSION_ICONS[challenge.dimension]  || '/icons/compass.svg';
  const diff  = DIFFICULTY_LABELS[challenge.difficulty] || DIFFICULTY_LABELS.foundation;

  function handleComplete() {
    if (!hasAccess) {
      setShowUnlockModal(true);
      return;
    }
    saveFamilyChallengeCompletion(challenge.id);
    setCompleted(true);
    setJustCompleted(true);
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to challenge details</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="fcd-page" id="main-content">
        <div className="fcd-wrap">

          {/* Breadcrumb */}
          <nav className="fcd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span aria-hidden="true">›</span>
            <Link to="/iatlas/family/challenges">Family Challenges</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{challenge.title}</span>
          </nav>

          {/* Hero */}
          <div className="fcd-hero">
            <div className="fcd-hero-banner" style={{ background: color }} />
            <div className="fcd-hero-body">
              <div className="fcd-meta-row">
                <span className="fcd-dim-badge" style={{ background: color }}>
                  <SafeIcon
                    src={icon}
                    fallbackEmoji={DIMENSION_FALLBACK_EMOJIS[challenge.dimension] || '🔷'}
                    style={{ verticalAlign: 'middle', marginRight: '0.35rem', width: 12, height: 12 }}
                  />
                  {challenge.dimension.replace(/-/g, ' ')}
                </span>
                <span className="fcd-diff-badge" style={{ background: diff.color }}>
                  {diff.label}
                </span>
                {completed && <span className="fcd-done-badge">✓ Completed</span>}
              </div>

              <h1 className="fcd-title">{challenge.title}</h1>
              <p className="fcd-desc">{challenge.description}</p>

              <div className="fcd-details-row">
                <div className="fcd-detail">
                  <span className="fcd-detail-label">Duration</span>
                  <span className="fcd-detail-value"><SafeIcon src="/icons/planning.svg" fallbackEmoji="⏱" style={{ width: 12, height: 12, verticalAlign: 'middle' }} /> {challenge.duration}</span>
                </div>
                <div className="fcd-detail">
                  <span className="fcd-detail-label">Participants</span>
                  <span className="fcd-detail-value"><SafeIcon src="/icons/network.svg" fallbackEmoji="👥" style={{ width: 12, height: 12, verticalAlign: 'middle' }} /> {challenge.participants}</span>
                </div>
                <div className="fcd-detail">
                  <span className="fcd-detail-label">Age Range</span>
                  <span className="fcd-detail-value">
                    {challenge.ageRange === 'all' ? 'All ages (5–18)' : challenge.ageRange}
                  </span>
                </div>
                <div className="fcd-detail">
                  <span className="fcd-detail-label">XP Reward</span>
                  <span className="fcd-detail-value" style={{ color: '#6366f1' }}>
                    +{challenge.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <section className="fcd-section" aria-labelledby="instructions-heading">
            <h2 className="fcd-section-title" id="instructions-heading"><SafeIcon src="/icons/journal.svg" fallbackEmoji="📝" style={{ width: 14, height: 14 }} /> How to Complete This Challenge
            </h2>
            <ol className="fcd-instructions">
              {challenge.instructions.map((step, i) => (
                <li key={i} className="fcd-instruction-item">
                  <span className="fcd-step-num" aria-hidden="true">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Parent note */}
          {challenge.parentNote && (
            <section className="fcd-section" aria-labelledby="parent-note-heading">
              <h2 className="fcd-section-title" id="parent-note-heading"><SafeIcon src="/icons/reflection.svg" fallbackEmoji="💭" style={{ width: 14, height: 14 }} /> Parent / Caregiver Note
              </h2>
              <p className="fcd-parent-note">{challenge.parentNote}</p>
            </section>
          )}

          {/* Materials */}
          {challenge.materials && challenge.materials.length > 0 && (
            <section className="fcd-section" aria-labelledby="materials-heading">
              <h2 className="fcd-section-title" id="materials-heading"><SafeIcon src="/icons/journal.svg" fallbackEmoji="📝" style={{ width: 14, height: 14 }} /> Materials Needed
              </h2>
              <ul className="fcd-materials-list">
                {challenge.materials.map((item) => (
                  <li key={item} className="fcd-material-chip">{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Rewards */}
          <section className="fcd-section" aria-labelledby="rewards-heading">
            <h2 className="fcd-section-title" id="rewards-heading"><SafeIcon src="/icons/trophy.svg" fallbackEmoji="🏆" style={{ width: 14, height: 14 }} /> Rewards
            </h2>
            <div className="fcd-rewards-row">
              <div>
                <span className="fcd-reward-xp">+{challenge.xpReward}</span>
                <span className="fcd-reward-xp-label">Family XP</span>
              </div>
              {challenge.badgesUnlocked?.map((badge) => (
                <span key={badge} className="fcd-reward-badge"><SafeIcon src="/icons/trophy.svg" fallbackEmoji="🏆" style={{ width: 14, height: 14 }} /> {badge.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </section>

          {/* Complete / success */}
          {justCompleted ? (
            <div className="fcd-complete-success" role="alert">
              <h3><SafeIcon src="/icons/trophy.svg" fallbackEmoji="🏆" style={{ width: 14, height: 14 }} /> Challenge Complete!</h3>
              <p>
                Amazing work! You've earned <strong>+{challenge.xpReward} Family XP</strong> and
                unlocked the <strong>{challenge.badgesUnlocked?.[0]?.replace(/-/g, ' ')}</strong> badge.
              </p>
              <Link
                to="/iatlas/family/challenges"
                style={{ display: 'inline-block', marginTop: '.75rem', color: '#15803d', fontWeight: 700, textDecoration: 'none', fontSize: '.9rem' }}
              >
                ← Browse More Challenges
              </Link>
            </div>
          ) : (
            <button
              className="fcd-complete-btn"
              onClick={handleComplete}
              disabled={completed}
              aria-label={completed ? 'Challenge already marked as complete' : 'Mark challenge as complete'}
            >
              {completed ? '✓ Completed' : 'Mark as Complete'}
            </button>
          )}

          <Link to="/iatlas/family/challenges" className="fcd-back-link">
            ‹ Back to Family Challenges
          </Link>

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
