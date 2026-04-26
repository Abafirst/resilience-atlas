/**
 * ParentDashboard.jsx
 * Parent-facing view of child's IATLAS Kids progress.
 * Includes summary stats, recent activity, celebration notes,
 * certificate printer, and recommended next activities.
 */

import React, { useState, useCallback } from 'react';

import useKidsProgress   from '../../../hooks/useKidsProgress.js';
import useKidsBadges     from '../../../hooks/useKidsBadges.js';
import useKidsStreaks     from '../../../hooks/useKidsStreaks.js';
import { useProfiles }   from '../../../contexts/ProfileContext.jsx';

import CertificatePrinter from './CertificatePrinter.jsx';
import StreakFlame        from './StreakFlame.jsx';

import {
  loadKidsJSON,
  saveKidsJSON,
  KIDS_STORAGE_KEYS,
  addKidsStars,
  getTotalActivitiesPerAgeGroup,
  getCompletedCountPerAgeGroup,
} from '../../../utils/kidsProgressHelpers.js';
import { STAR_RULES, AGE_GROUP_LABELS } from '../../../data/kidsGamification.js';
import { KIDS_ACTIVITIES } from '../../../data/kidsActivities.js';

/** Icon map keyed by normalized dimension key */
const DIM_ICON_MAP = {
  'emotional-adaptive':    '/icons/emotional-adaptive.svg',
  'somatic-regulative':    '/icons/somatic-regulative.svg',
  'relational-connective': '/icons/relational-connective.svg',
  'agentic-generative':    '/icons/agentic-generative.svg',
  'spiritual-reflective':  '/icons/spiritual-reflective.svg',
  'cognitive-narrative':   '/icons/cognitive-narrative.svg',
};

const STYLES = `
  .pd-root {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  .pd-header {
    margin-bottom: 1.5rem;
  }

  .pd-header-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .35rem;
  }

  .dark-mode .pd-header-title {
    color: #f1f5f9;
  }

  .pd-header-sub {
    font-size: .85rem;
    color: #64748b;
    margin: 0;
  }

  /* ── Stats grid ── */
  .pd-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .75rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 560px) {
    .pd-stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .pd-stat-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem .85rem;
    text-align: center;
  }

  .dark-mode .pd-stat-card {
    background: #1e293b;
    border-color: #334155;
  }

  .pd-stat-icon {
    width: 28px;
    height: 28px;
    margin: 0 auto .4rem;
    display: block;
  }

  .pd-stat-value {
    font-size: 1.5rem;
    font-weight: 900;
    color: #0f172a;
    line-height: 1;
    margin-bottom: .25rem;
  }

  .dark-mode .pd-stat-value {
    color: #f1f5f9;
  }

  .pd-stat-label {
    font-size: .7rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* ── Card sections ── */
  .pd-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .dark-mode .pd-card {
    background: #1e293b;
    border-color: #334155;
  }

  .pd-section-title {
    font-size: .95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .9rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .dark-mode .pd-section-title {
    color: #f1f5f9;
  }

  .pd-section-icon {
    width: 20px;
    height: 20px;
  }

  /* ── Activity feed ── */
  .pd-feed {
    display: flex;
    flex-direction: column;
    gap: .55rem;
  }

  .pd-feed-item {
    display: flex;
    align-items: flex-start;
    gap: .65rem;
    padding: .6rem .75rem;
    background: #f8fafc;
    border-radius: 10px;
    font-size: .82rem;
    color: #374151;
  }

  .dark-mode .pd-feed-item {
    background: #0f172a;
    color: #cbd5e1;
  }

  .pd-feed-icon {
    width: 18px;
    height: 18px;
    margin-top: .1rem;
    flex-shrink: 0;
  }

  .pd-feed-text {
    flex: 1;
    line-height: 1.4;
  }

  .pd-feed-time {
    font-size: .68rem;
    color: #94a3b8;
    flex-shrink: 0;
    margin-top: .1rem;
  }

  /* ── Celebration note form ── */
  .pd-note-form {
    display: flex;
    flex-direction: column;
    gap: .65rem;
  }

  .pd-note-textarea {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: .65rem .85rem;
    font-size: .85rem;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    outline: none;
    transition: border-color .15s;
    background: #ffffff;
    color: #0f172a;
    box-sizing: border-box;
  }

  .dark-mode .pd-note-textarea {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  .pd-note-textarea:focus {
    border-color: #6366f1;
  }

  .pd-note-submit {
    background: #059669;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: .6rem 1.25rem;
    font-size: .85rem;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: .4rem;
    transition: background .15s;
  }

  .pd-note-submit:hover {
    background: #047857;
  }

  .pd-note-submit:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .pd-note-success {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .82rem;
    color: #059669;
    font-weight: 600;
  }

  .pd-note-history {
    display: flex;
    flex-direction: column;
    gap: .45rem;
    margin-top: .5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .pd-note-item {
    background: #f0fdf4;
    border-left: 3px solid #22c55e;
    border-radius: 0 8px 8px 0;
    padding: .5rem .75rem;
    font-size: .8rem;
    color: #166534;
    line-height: 1.45;
  }

  .dark-mode .pd-note-item {
    background: #052e16;
    border-left-color: #16a34a;
    color: #86efac;
  }

  .pd-note-date {
    font-size: .65rem;
    color: #94a3b8;
    margin-top: .15rem;
  }

  /* ── Recommended activities ── */
  .pd-rec-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: .65rem;
  }

  .pd-rec-item {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: .75rem .85rem;
    font-size: .8rem;
    color: #374151;
  }

  .dark-mode .pd-rec-item {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
  }

  .pd-rec-item-title {
    font-weight: 700;
    margin: 0 0 .2rem;
    color: #0f172a;
  }

  .dark-mode .pd-rec-item-title {
    color: #f1f5f9;
  }

  .pd-rec-dim {
    font-size: .7rem;
    color: #64748b;
  }

  /* ── Age group progress bars ── */
  .pd-age-progress {
    display: flex;
    flex-direction: column;
    gap: .6rem;
  }

  .pd-age-row {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .pd-age-label {
    font-size: .78rem;
    font-weight: 600;
    color: #475569;
    width: 85px;
    flex-shrink: 0;
  }

  .dark-mode .pd-age-label {
    color: #94a3b8;
  }

  .pd-age-bar-wrap {
    flex: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 10px;
    overflow: hidden;
  }

  .dark-mode .pd-age-bar-wrap {
    background: #334155;
  }

  .pd-age-bar-fill {
    height: 100%;
    border-radius: 10px;
    transition: width .5s ease;
  }

  .pd-age-count {
    font-size: .72rem;
    color: #64748b;
    min-width: 50px;
    text-align: right;
    flex-shrink: 0;
  }

  .dark-mode .pd-age-count {
    color: #94a3b8;
  }
`;

const AGE_GROUPS = [
  { id: 'age-5-7',   label: 'Ages 5–7',   color: '#f59e0b' },
  { id: 'age-8-10',  label: 'Ages 8–10',  color: '#10b981' },
  { id: 'age-11-14', label: 'Ages 11–14', color: '#6366f1' },
  { id: 'age-15-18', label: 'Ages 15–18', color: '#8b5cf6' },
];

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function timeAgo(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 2)    return 'just now';
    if (mins < 60)   return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)    return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

export default function ParentDashboard({ onBack }) {
  // Use the active profile's progress (profile-namespaced storage keys).
  const { activeProfile } = useProfiles();
  const { progress, totalStars, levelInfo, getParentNoteCount, refresh, storageKeys } = useKidsProgress(activeProfile?.profileId);
  const { allBadges, earnedCount } = useKidsBadges();
  const { current: streakCurrent, longest: streakLongest } = useKidsStreaks();

  const [noteText,      setNoteText]      = useState('');
  const [noteSuccess,   setNoteSuccess]   = useState(false);
  const [showCerts,     setShowCerts]     = useState(false);

  // Parent notes
  const notes = loadKidsJSON(storageKeys.PARENT_NOTES, []);
  const parentNoteCount = notes.length;

  // Recent activities (from progress)
  const recentActivities = Object.values(progress)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 8);

  // Age group completion progress
  const totalsByAge    = getTotalActivitiesPerAgeGroup();
  const completedByAge = getCompletedCountPerAgeGroup(progress);

  // Recommended: find incomplete activities in the most-active age group
  const mostActiveAgeGroup = Object.entries(completedByAge)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'age-5-7';

  const completedIds = new Set(Object.keys(progress));
  const recommendations = (KIDS_ACTIVITIES[mostActiveAgeGroup] || [])
    .filter(act => {
      const id = `${mostActiveAgeGroup}/${act.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      return !completedIds.has(id);
    })
    .slice(0, 6);

  // Earned certificate IDs
  const earnedCerts = [];
  const adventureData = loadKidsJSON(storageKeys.ADVENTURES, {});
  if (Object.keys(adventureData).some(id => adventureData[id]?.completedAt)) {
    earnedCerts.push('adventure-complete');
  }
  if (AGE_GROUPS.some(ag => {
    const total     = totalsByAge[ag.id] || 0;
    const completed = completedByAge[ag.id] || 0;
    return total > 0 && completed >= total;
  })) {
    earnedCerts.push('age-graduate');
  }
  if (levelInfo.level >= 5) earnedCerts.push('resilience-hero');

  const handleAddNote = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    const updatedNotes = [
      { text: trimmed, createdAt: new Date().toISOString() },
      ...notes,
    ];
    saveKidsJSON(storageKeys.PARENT_NOTES, updatedNotes);
    addKidsStars(STAR_RULES.PARENT_NOTE, storageKeys);
    refresh();
    setNoteText('');
    setNoteSuccess(true);
    setTimeout(() => setNoteSuccess(false), 3000);
  }, [noteText, notes, refresh]);

  const totalCompleted = Object.keys(progress).length;

  return (
    <>
      <style>{STYLES}</style>
      <div className="pd-root">

        {/* Header */}
        <div className="pd-header">
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6366f1',
                fontWeight: 700,
                fontSize: '.85rem',
                padding: '0 0 .75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '.3rem',
              }}
              aria-label="Back to kids dashboard"
            >
              ‹ Back
            </button>
          )}
          <h2 className="pd-header-title">Parent Dashboard</h2>
          <p className="pd-header-sub">
            {activeProfile
              ? <>Viewing <strong>{activeProfile.avatar} {activeProfile.name}</strong>'s resilience journey.</>
              : 'Track your child\'s resilience journey, celebrate milestones, and print certificates.'
            }
          </p>
        </div>

        {/* Summary stats */}
        <div className="pd-stats-grid" role="region" aria-label="Summary statistics">
          <div className="pd-stat-card">
            <img src="/icons/checkmark.svg" alt="" aria-hidden="true" className="pd-stat-icon" />
            <div className="pd-stat-value">{totalCompleted}</div>
            <div className="pd-stat-label">Activities</div>
          </div>
          <div className="pd-stat-card">
            <img src="/icons/star.svg" alt="" aria-hidden="true" className="pd-stat-icon" />
            <div className="pd-stat-value">{totalStars}</div>
            <div className="pd-stat-label">Stars</div>
          </div>
          <div className="pd-stat-card">
            <img src="/icons/badges.svg" alt="" aria-hidden="true" className="pd-stat-icon" />
            <div className="pd-stat-value">{earnedCount}</div>
            <div className="pd-stat-label">Badges</div>
          </div>
          <div className="pd-stat-card">
            <img src="/icons/trophy.svg" alt="" aria-hidden="true" className="pd-stat-icon" />
            <div className="pd-stat-value">{levelInfo.level}</div>
            <div className="pd-stat-label">Level</div>
          </div>
        </div>

        {/* Level info */}
        <div className="pd-card" role="region" aria-label="Level progress">
          <h3 className="pd-section-title">
            <img src={levelInfo.icon} alt="" aria-hidden="true" className="pd-section-icon" />
            Current Level
          </h3>
          <p style={{ margin: '0 0 .5rem', fontWeight: 700, color: levelInfo.color, fontSize: '1.05rem' }}>
            Level {levelInfo.level}: {levelInfo.title}
          </p>
          <p style={{ margin: '0 0 .75rem', fontSize: '.82rem', color: '#64748b' }}>{levelInfo.message}</p>
          <StreakFlame current={streakCurrent} longest={streakLongest} showLongest />
        </div>

        {/* Age group progress */}
        <div className="pd-card" role="region" aria-label="Progress by age group">
          <h3 className="pd-section-title">
            <img src="/icons/compass.svg" alt="" aria-hidden="true" className="pd-section-icon" />
            Progress by Age Group
          </h3>
          <div className="pd-age-progress">
            {AGE_GROUPS.map(ag => {
              const total     = totalsByAge[ag.id]    || 0;
              const completed = completedByAge[ag.id] || 0;
              const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={ag.id} className="pd-age-row">
                  <span className="pd-age-label">{ag.label}</span>
                  <div
                    className="pd-age-bar-wrap"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${ag.label}: ${pct}% complete`}
                  >
                    <div
                      className="pd-age-bar-fill"
                      style={{ width: `${pct}%`, background: ag.color }}
                    />
                  </div>
                  <span className="pd-age-count">{completed}/{total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="pd-card" role="region" aria-label="Recent activity">
          <h3 className="pd-section-title">
            <img src="/icons/streaks.svg" alt="" aria-hidden="true" className="pd-section-icon" />
            Recent Activity
          </h3>
          {recentActivities.length > 0 ? (
            <div className="pd-feed">
              {recentActivities.map((record) => (
                <div key={record.activityId} className="pd-feed-item">
                  <img
                    src={DIM_ICON_MAP[record.dimension] || '/icons/compass.svg'}
                    alt=""
                    aria-hidden="true"
                    className="pd-feed-icon"
                  />
                  <div className="pd-feed-text">
                    <strong>{record.activityId?.split('/')[1]?.replace(/-/g, ' ') || 'Activity'}</strong>
                    {' — '}
                    <span style={{ textTransform: 'capitalize' }}>{record.dimension?.replace(/-/g, ' ')}</span>
                    {' — '}
                    {AGE_GROUP_LABELS[record.ageGroup] || record.ageGroup}
                    {record.starsEarned ? ` (+${record.starsEarned} stars)` : ''}
                  </div>
                  <span className="pd-feed-time">{timeAgo(record.completedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '.85rem' }}>
              No activities completed yet. Encourage your child to try their first activity!
            </p>
          )}
        </div>

        {/* Celebration note form */}
        <div className="pd-card" role="region" aria-label="Add celebration note">
          <h3 className="pd-section-title">
            <img src="/icons/story.svg" alt="" aria-hidden="true" className="pd-section-icon" />
            Celebration Notes
          </h3>
          <p style={{ fontSize: '.82rem', color: '#475569', marginBottom: '.85rem' }}>
            Leave a message celebrating your child's effort. Each note gives them +{STAR_RULES.PARENT_NOTE} bonus stars!
          </p>
          <div className="pd-note-form">
            <textarea
              className="pd-note-textarea"
              placeholder="E.g. 'I'm so proud of you for practicing breathing today!'"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              aria-label="Celebration note text"
              rows={3}
            />
            {noteSuccess && (
              <p className="pd-note-success" aria-live="assertive">
                <img src="/icons/success.svg" alt="" aria-hidden="true" width={16} height={16} />
                Note added! +{STAR_RULES.PARENT_NOTE} stars awarded.
              </p>
            )}
            <button
              className="pd-note-submit"
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              aria-label="Submit celebration note"
            >
              <img src="/icons/success.svg" alt="" aria-hidden="true" width={15} height={15} style={{ filter: 'invert(1)' }} />
              Add Note (+{STAR_RULES.PARENT_NOTE} stars)
            </button>
          </div>

          {/* Note history */}
          {notes.length > 0 && (
            <div className="pd-note-history" aria-label="Previous celebration notes">
              {notes.map((note, i) => (
                <div key={i} className="pd-note-item">
                  <p style={{ margin: 0 }}>{note.text}</p>
                  <p className="pd-note-date">{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended next activities */}
        {recommendations.length > 0 && (
          <div className="pd-card" role="region" aria-label="Recommended activities">
            <h3 className="pd-section-title">
              <img src="/icons/agentic-generative.svg" alt="" aria-hidden="true" className="pd-section-icon" />
              Recommended Next ({AGE_GROUP_LABELS[mostActiveAgeGroup]})
            </h3>
            <p style={{ fontSize: '.82rem', color: '#64748b', marginBottom: '.85rem' }}>
              Activities your child hasn't tried yet.
            </p>
            <div className="pd-rec-grid">
              {recommendations.map((act) => (
                <div key={act.title} className="pd-rec-item">
                  <p className="pd-rec-item-title">{act.title}</p>
                  <span className="pd-rec-dim">{act.dimension}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Printable certificates */}
        <div className="pd-card" role="region" aria-label="Certificates">
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: 0,
            }}
            aria-expanded={showCerts}
            onClick={() => setShowCerts(v => !v)}
          >
            <h3 className="pd-section-title" style={{ margin: 0, pointerEvents: 'none' }}>
              <img src="/icons/trophy.svg" alt="" aria-hidden="true" className="pd-section-icon" />
              Printable Certificates
            </h3>
            <span aria-hidden="true" style={{ color: '#6366f1', fontSize: '1.1rem' }}>
              {showCerts ? '▲' : '▼'}
            </span>
          </button>

          {showCerts && (
            <div style={{ marginTop: '1rem' }}>
              <CertificatePrinter earnedCertificates={earnedCerts} />
            </div>
          )}
        </div>

        {/* Tips for parents */}
        <div
          className="pd-card"
          style={{ background: '#f0fdf4', borderColor: '#86efac' }}
          role="region"
          aria-label="Tips for parents"
        >
          <h3 className="pd-section-title" style={{ color: '#15803d' }}>
            <img src="/icons/relational-connective.svg" alt="" aria-hidden="true" className="pd-section-icon" />
            Tips for Parents
          </h3>
          <ul style={{ margin: 0, padding: '0 0 0 1.1rem', fontSize: '.83rem', color: '#166534', lineHeight: 1.7 }}>
            <li>Do activities alongside your child — resilience is contagious.</li>
            <li>Celebrate effort, not perfection. Trying an activity earns stars too!</li>
            <li>Use the celebration notes feature to reinforce specific moments of growth.</li>
            <li>Keep sessions short (5–15 minutes) for younger children.</li>
            <li>Let your child choose which activity to do — autonomy boosts engagement.</li>
          </ul>
        </div>

      </div>
    </>
  );
}
