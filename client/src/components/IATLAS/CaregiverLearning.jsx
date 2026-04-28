/**
 * CaregiverLearning.jsx
 * Topic-based Caregiver Learning curriculum browser.
 *
 * Views:
 *   categories → grid of 6 topic categories
 *   guides     → all modules in the selected category
 *   guide      → full reading view for one module
 *
 * Features:
 *   - Grid layout of curriculum categories
 *   - Click category → see all guides in that category
 *   - Click guide → full guide page with formatted content
 *   - Bookmark/save favourite guides (localStorage)
 *   - "Completed" tracking (localStorage)
 *   - Print-friendly view
 *   - Family tier gate via `hasAccess` prop
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CAREGIVER_CURRICULUM,
  getModulesByCategory,
  isModuleCompleted,
  markModuleCompleted,
  isModuleBookmarked,
  toggleModuleBookmark,
  getCompletedModuleIds,
  getBookmarkedModuleIds,
} from '../../data/iatlas/caregiverCurriculum.js';

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  /* ── Category grid ── */
  .cl-categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .cl-category-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow .15s, transform .15s;
    text-align: left;
    font-family: inherit;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .dark-mode .cl-category-card {
    background: #1e293b;
    border-color: #334155;
  }

  .cl-category-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.12);
    transform: translateY(-3px);
  }

  .cl-category-card.locked {
    opacity: .7;
    cursor: pointer;
  }

  .cl-cat-banner {
    height: 6px;
  }

  .cl-cat-body {
    padding: 1.25rem 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    gap: .6rem;
    flex: 1;
  }

  .cl-cat-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .5rem;
  }

  .cl-cat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .cl-cat-icon img {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
  }

  .cl-cat-title {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.25;
  }

  .dark-mode .cl-cat-title {
    color: #f1f5f9;
  }

  .cl-cat-desc {
    font-size: .8rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .dark-mode .cl-cat-desc {
    color: #94a3b8;
  }

  .cl-cat-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: .5rem;
    font-size: .75rem;
    color: #94a3b8;
  }

  .cl-cat-count {
    font-weight: 600;
  }

  .cl-cat-progress {
    display: flex;
    align-items: center;
    gap: .35rem;
    font-size: .72rem;
    font-weight: 700;
    color: #15803d;
  }

  /* ── Section header / back ── */
  .cl-section-back {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    background: none;
    border: none;
    color: #6366f1;
    font-size: .875rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    padding: .3rem 0 .75rem;
  }

  .cl-section-back:hover {
    text-decoration: underline;
  }

  .dark-mode .cl-section-back {
    color: #a5b4fc;
  }

  .cl-section-heading {
    font-size: 1.3rem;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 .35rem;
  }

  .dark-mode .cl-section-heading {
    color: #f1f5f9;
  }

  .cl-section-desc {
    font-size: .875rem;
    color: #64748b;
    margin: 0 0 1.25rem;
    line-height: 1.5;
  }

  .dark-mode .cl-section-desc {
    color: #94a3b8;
  }

  /* ── Module card ── */
  .cl-modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .cl-module-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow .15s, transform .15s;
    text-align: left;
    font-family: inherit;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .dark-mode .cl-module-card {
    background: #1e293b;
    border-color: #334155;
  }

  .cl-module-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.12);
    transform: translateY(-3px);
  }

  .cl-module-card.locked {
    opacity: .7;
    cursor: pointer;
  }

  .cl-mod-banner {
    height: 4px;
  }

  .cl-mod-body {
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: .4rem;
    flex: 1;
  }

  .cl-mod-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .5rem;
  }

  .cl-mod-title {
    font-size: .95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.25;
  }

  .dark-mode .cl-mod-title {
    color: #f1f5f9;
  }

  .cl-mod-badges {
    display: flex;
    gap: .3rem;
    flex-shrink: 0;
  }

  .cl-mod-badge-done {
    font-size: .65rem;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    border-radius: 20px;
    padding: .2rem .5rem;
    white-space: nowrap;
  }

  .cl-mod-badge-bookmark {
    font-size: .65rem;
    font-weight: 700;
    color: #6366f1;
    background: #eef2ff;
    border-radius: 20px;
    padding: .2rem .5rem;
    white-space: nowrap;
  }

  .cl-mod-ages {
    display: flex;
    flex-wrap: wrap;
    gap: .3rem;
  }

  .cl-mod-age-chip {
    font-size: .68rem;
    font-weight: 600;
    border-radius: 20px;
    padding: .15rem .5rem;
    background: #f1f5f9;
    color: #475569;
  }

  .dark-mode .cl-mod-age-chip {
    background: #0f172a;
    color: #94a3b8;
  }

  .cl-mod-takeaway-preview {
    margin: .1rem 0 0;
    padding: 0 0 0 1rem;
    font-size: .78rem;
    color: #64748b;
    line-height: 1.45;
  }

  .dark-mode .cl-mod-takeaway-preview {
    color: #94a3b8;
  }

  .cl-mod-takeaway-preview li {
    margin-bottom: .1rem;
  }

  .cl-mod-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: .5rem;
    font-size: .72rem;
    color: #94a3b8;
  }

  .cl-mod-duration {
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  .cl-mod-lock {
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  /* ── Guide detail ── */
  .cl-guide-wrap {
    max-width: 720px;
    margin: 0 auto;
  }

  .cl-guide-hero {
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 1.75rem;
  }

  .cl-guide-hero-banner {
    height: 8px;
  }

  .cl-guide-hero-body {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 16px 16px;
    padding: 1.5rem 1.75rem;
  }

  .dark-mode .cl-guide-hero-body {
    background: #1e293b;
    border-color: #334155;
  }

  .cl-guide-cat-badge {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-size: .72rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .2rem .6rem;
    color: #ffffff;
    margin-bottom: .75rem;
  }

  .cl-guide-cat-badge img {
    width: 12px;
    height: 12px;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  .cl-guide-title {
    font-size: 1.6rem;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .dark-mode .cl-guide-title {
    color: #f1f5f9;
  }

  .cl-guide-meta {
    display: flex;
    flex-wrap: wrap;
    gap: .6rem;
    font-size: .78rem;
    color: #64748b;
    margin-bottom: .75rem;
  }

  .dark-mode .cl-guide-meta {
    color: #94a3b8;
  }

  .cl-guide-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin-top: .75rem;
    padding-top: .75rem;
    border-top: 1px solid #e2e8f0;
  }

  .dark-mode .cl-guide-actions {
    border-top-color: #334155;
  }

  .cl-guide-action-btn {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    color: #475569;
    border-radius: 8px;
    padding: .4rem .85rem;
    font-size: .78rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .12s, border-color .12s;
  }

  .dark-mode .cl-guide-action-btn {
    background: #0f172a;
    border-color: #334155;
    color: #94a3b8;
  }

  .cl-guide-action-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .dark-mode .cl-guide-action-btn:hover {
    background: #1e293b;
  }

  .cl-guide-action-btn.done {
    background: #f0fdf4;
    border-color: #86efac;
    color: #15803d;
  }

  .cl-guide-action-btn.bookmarked {
    background: #eef2ff;
    border-color: #a5b4fc;
    color: #4f46e5;
  }

  /* ── Guide content ── */
  .cl-guide-section {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
  }

  .dark-mode .cl-guide-section {
    background: #1e293b;
    border-color: #334155;
  }

  .cl-guide-section-title {
    font-size: .88rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .9rem;
    display: flex;
    align-items: center;
    gap: .4rem;
  }

  .dark-mode .cl-guide-section-title {
    color: #f1f5f9;
  }

  .cl-intro-para {
    font-size: .9rem;
    color: #334155;
    line-height: 1.7;
    margin: 0 0 .75rem;
  }

  .dark-mode .cl-intro-para {
    color: #cbd5e1;
  }

  .cl-intro-para:last-child {
    margin-bottom: 0;
  }

  .cl-content-text {
    font-size: .88rem;
    color: #334155;
    line-height: 1.75;
    margin: 0;
    white-space: pre-wrap;
  }

  .dark-mode .cl-content-text {
    color: #cbd5e1;
  }

  .cl-takeaways-list {
    margin: 0;
    padding: 0 0 0 1.2rem;
    display: flex;
    flex-direction: column;
    gap: .45rem;
  }

  .cl-takeaways-list li {
    font-size: .88rem;
    color: #334155;
    line-height: 1.55;
  }

  .dark-mode .cl-takeaways-list li {
    color: #cbd5e1;
  }

  .cl-action-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: .65rem;
  }

  .cl-action-item {
    display: flex;
    align-items: flex-start;
    gap: .7rem;
    font-size: .88rem;
    color: #334155;
    line-height: 1.55;
  }

  .dark-mode .cl-action-item {
    color: #cbd5e1;
  }

  .cl-action-num {
    width: 22px;
    height: 22px;
    min-width: 22px;
    background: #4f46e5;
    color: #ffffff;
    border-radius: 50%;
    font-size: .7rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: .1rem;
  }

  .cl-related-list {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cl-related-chip {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: .3rem .75rem;
    font-size: .78rem;
    color: #475569;
    font-weight: 500;
  }

  .dark-mode .cl-related-chip {
    background: #0f172a;
    border-color: #334155;
    color: #94a3b8;
  }

  .cl-evidence-text {
    font-size: .82rem;
    color: #64748b;
    line-height: 1.65;
    margin: 0;
    font-style: italic;
  }

  .dark-mode .cl-evidence-text {
    color: #94a3b8;
  }

  /* ── Upgrade gate ── */
  .cl-upgrade {
    text-align: center;
    padding: 3rem 1.5rem;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 20px;
    margin: 1.5rem 0;
  }

  .dark-mode .cl-upgrade {
    background: #1e293b;
    border-color: #334155;
  }

  .cl-upgrade-emoji {
    font-size: 2.5rem;
    display: block;
    margin-bottom: .75rem;
  }

  .cl-upgrade-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .5rem;
  }

  .dark-mode .cl-upgrade-title {
    color: #f1f5f9;
  }

  .cl-upgrade-sub {
    font-size: .875rem;
    color: #64748b;
    margin: 0 0 1.25rem;
    max-width: 440px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.55;
  }

  .cl-upgrade-btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #4f46e5;
    color: #fff;
    border-radius: 10px;
    padding: .7rem 1.4rem;
    font-weight: 700;
    text-decoration: none;
    font-size: .875rem;
  }

  .cl-upgrade-btn:hover {
    background: #4338ca;
  }

  /* ── Stats bar ── */
  .cl-stats-bar {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
  }

  .dark-mode .cl-stats-bar {
    background: #1e293b;
    border-color: #334155;
  }

  .cl-stat {
    display: flex;
    flex-direction: column;
  }

  .cl-stat-value {
    font-size: 1.4rem;
    font-weight: 900;
    color: #0f172a;
    line-height: 1;
  }

  .dark-mode .cl-stat-value {
    color: #f1f5f9;
  }

  .cl-stat-label {
    font-size: .72rem;
    color: #94a3b8;
    margin-top: .2rem;
  }

  /* ── Print ── */
  @media print {
    .cl-guide-actions,
    .cl-section-back,
    .cl-stats-bar,
    .cl-categories-grid,
    .cl-modules-grid {
      display: none !important;
    }
    .cl-guide-wrap {
      max-width: 100%;
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORIES = Object.values(CAREGIVER_CURRICULUM);
const TOTAL_MODULES = CATEGORIES.reduce((n, c) => n + c.modules.length, 0);

const AGE_GROUP_LABELS = {
  'ages-5-7':   '5–7',
  'ages-8-10':  '8–10',
  'ages-11-14': '11–14',
  'ages-15-18': '15–18',
};

function renderContent(text) {
  // Convert **bold** markers to <strong> inline
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FallbackIcon({ emoji, size = 16 }) {
  return <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>;
}

function SafeIcon({ src, fallbackEmoji = '📌', alt = '', className = '', style = {} }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return <FallbackIcon emoji={fallbackEmoji} size={style.width || 16} />;
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

function CategoryCard({ category, onClick, locked }) {
  const completedCount = getModulesByCategory(category.id)
    .filter((m) => isModuleCompleted(m.id)).length;
  const total = category.modules.length;

  return (
    <button
      className={`cl-category-card${locked ? ' locked' : ''}`}
      onClick={onClick}
      aria-label={`${category.title}${locked ? ' — locked, Family tier required' : ''}`}
    >
      <div className="cl-cat-banner" style={{ background: category.color }} />
      <div className="cl-cat-body">
        <div className="cl-cat-header">
          <div className="cl-cat-icon" style={{ background: category.color }}>
            <SafeIcon src={category.icon} fallbackEmoji="📚" style={{ width: 18, height: 18 }} />
          </div>
          {locked && (
            <SafeIcon src="/icons/lock.svg" fallbackEmoji="🔒" style={{ width: 16, height: 16, opacity: .5 }} />
          )}
        </div>
        <h3 className="cl-cat-title">{category.title}</h3>
        <p className="cl-cat-desc">{category.description}</p>
        <div className="cl-cat-footer">
          <span className="cl-cat-count">{total} guide{total !== 1 ? 's' : ''}</span>
          {completedCount > 0 && !locked && (
            <span className="cl-cat-progress">
              ✓ {completedCount}/{total} completed
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ModuleCard({ module, category, onClick, locked }) {
  const done       = isModuleCompleted(module.id);
  const bookmarked = isModuleBookmarked(module.id);

  return (
    <button
      className={`cl-module-card${locked ? ' locked' : ''}`}
      onClick={onClick}
      aria-label={`${module.title}${locked ? ' — locked, Family tier required' : ''}`}
    >
      <div className="cl-mod-banner" style={{ background: category.color }} />
      <div className="cl-mod-body">
        <div className="cl-mod-header">
          <h3 className="cl-mod-title">{module.title}</h3>
          <div className="cl-mod-badges">
            {done       && <span className="cl-mod-badge-done">✓ Done</span>}
            {bookmarked && <span className="cl-mod-badge-bookmark">🔖</span>}
          </div>
        </div>

        <div className="cl-mod-ages" aria-label="Age groups">
          {module.ageGroups.map((ag) => (
            <span key={ag} className="cl-mod-age-chip">Ages {AGE_GROUP_LABELS[ag] || ag}</span>
          ))}
        </div>

        <ul className="cl-mod-takeaway-preview" aria-label="Key takeaways preview">
          {module.keyTakeaways.slice(0, 2).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>

        <div className="cl-mod-footer">
          <span className="cl-mod-duration">
            <SafeIcon src="/icons/planning.svg" fallbackEmoji="⏱" style={{ width: 12, height: 12 }} />
            {' '}{module.duration}
          </span>
          {locked && (
            <span className="cl-mod-lock">
              <SafeIcon src="/icons/lock.svg" fallbackEmoji="🔒" style={{ width: 12, height: 12 }} />
              {' '}Family tier
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function GuideDetail({ module, category, onBack, onUnlockClick, locked }) {
  const [done,       setDone]       = React.useState(() => isModuleCompleted(module.id));
  const [bookmarked, setBookmarked] = React.useState(() => isModuleBookmarked(module.id));

  function handleMarkDone() {
    if (locked) { onUnlockClick(); return; }
    markModuleCompleted(module.id);
    setDone(true);
  }

  function handleBookmark() {
    if (locked) { onUnlockClick(); return; }
    const isNowBookmarked = toggleModuleBookmark(module.id);
    setBookmarked(isNowBookmarked);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="cl-guide-wrap">
      <button className="cl-section-back" onClick={onBack} aria-label="Back to guides">
        ‹ Back to {category.title}
      </button>

      {/* Hero */}
      <div className="cl-guide-hero">
        <div className="cl-guide-hero-banner" style={{ background: category.color }} />
        <div className="cl-guide-hero-body">
          <span className="cl-guide-cat-badge" style={{ background: category.color }}>
            <SafeIcon src={category.icon} fallbackEmoji="📚" style={{ width: 12, height: 12 }} />
            {category.title}
          </span>

          <h2 className="cl-guide-title">{module.title}</h2>

          <div className="cl-guide-meta">
            <span>
              <SafeIcon src="/icons/planning.svg" fallbackEmoji="⏱" style={{ width: 12, height: 12, verticalAlign: 'middle' }} />
              {' '}{module.duration}
            </span>
            <span>Ages: {module.ageGroups.map((ag) => AGE_GROUP_LABELS[ag] || ag).join(', ')}</span>
          </div>

          <div className="cl-guide-actions" aria-label="Guide actions">
            <button
              className={`cl-guide-action-btn${done ? ' done' : ''}`}
              onClick={handleMarkDone}
              aria-pressed={done}
              aria-label={done ? 'Marked as completed' : 'Mark as completed'}
            >
              <SafeIcon src="/icons/checkmark.svg" fallbackEmoji="✓" style={{ width: 14, height: 14 }} />
              {done ? 'Completed' : 'Mark complete'}
            </button>

            <button
              className={`cl-guide-action-btn${bookmarked ? ' bookmarked' : ''}`}
              onClick={handleBookmark}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this guide'}
            >
              {bookmarked ? '🔖 Saved' : '🔖 Save'}
            </button>

            <button
              className="cl-guide-action-btn"
              onClick={handlePrint}
              aria-label="Print this guide"
            >
              <SafeIcon src="/icons/print.svg" fallbackEmoji="🖨" style={{ width: 14, height: 14 }} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section className="cl-guide-section" aria-labelledby="cl-intro-heading">
        <h3 className="cl-guide-section-title" id="cl-intro-heading">
          <SafeIcon src="/icons/story.svg" fallbackEmoji="📖" style={{ width: 16, height: 16 }} />
          Introduction
        </h3>
        {module.intro.map((para, i) => (
          <p key={i} className="cl-intro-para">{para}</p>
        ))}
      </section>

      {/* Core content */}
      <section className="cl-guide-section" aria-labelledby="cl-content-heading">
        <h3 className="cl-guide-section-title" id="cl-content-heading">
          <SafeIcon src="/icons/journal.svg" fallbackEmoji="📝" style={{ width: 16, height: 16 }} />
          Practical Strategies
        </h3>
        <p className="cl-content-text">{renderContent(module.content)}</p>
      </section>

      {/* Key takeaways */}
      <section className="cl-guide-section" aria-labelledby="cl-takeaways-heading">
        <h3 className="cl-guide-section-title" id="cl-takeaways-heading">
          <SafeIcon src="/icons/star.svg" fallbackEmoji="⭐" style={{ width: 16, height: 16 }} />
          Key Takeaways
        </h3>
        <ul className="cl-takeaways-list">
          {module.keyTakeaways.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>

      {/* Try this week */}
      <section className="cl-guide-section" aria-labelledby="cl-try-heading">
        <h3 className="cl-guide-section-title" id="cl-try-heading">
          <SafeIcon src="/icons/goal.svg" fallbackEmoji="🎯" style={{ width: 16, height: 16 }} />
          Try This Week
        </h3>
        <ol className="cl-action-list">
          {module.tryThisWeek.map((a, i) => (
            <li key={i} className="cl-action-item">
              <span className="cl-action-num" aria-hidden="true">{i + 1}</span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Related activities */}
      {module.relatedActivities?.length > 0 && (
        <section className="cl-guide-section" aria-labelledby="cl-related-heading">
          <h3 className="cl-guide-section-title" id="cl-related-heading">
            <SafeIcon src="/icons/compass.svg" fallbackEmoji="🧭" style={{ width: 16, height: 16 }} />
            Related IATLAS Activities
          </h3>
          <ul className="cl-related-list">
            {module.relatedActivities.map((a, i) => (
              <li key={i}>
                <span className="cl-related-chip">{a.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Evidence base */}
      {module.evidenceBase && (
        <section className="cl-guide-section" aria-labelledby="cl-evidence-heading">
          <h3 className="cl-guide-section-title" id="cl-evidence-heading">
            <SafeIcon src="/icons/reflection.svg" fallbackEmoji="🔬" style={{ width: 16, height: 16 }} />
            Evidence Base
          </h3>
          <p className="cl-evidence-text">{module.evidenceBase}</p>
        </section>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CaregiverLearning({ hasAccess = false, onUnlockClick }) {
  const [view,            setView]           = React.useState('categories');
  const [activeCategory,  setActiveCategory] = React.useState(null);
  const [activeModule,    setActiveModule]   = React.useState(null);

  const completedCount  = getCompletedModuleIds().length;
  const bookmarkedCount = getBookmarkedModuleIds().length;

  function handleCategoryClick(category) {
    if (!hasAccess) { onUnlockClick?.(); return; }
    setActiveCategory(category);
    setView('guides');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleModuleClick(module) {
    if (!hasAccess) { onUnlockClick?.(); return; }
    setActiveModule(module);
    setView('guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBackToCategories() {
    setView('categories');
    setActiveCategory(null);
    setActiveModule(null);
  }

  function handleBackToGuides() {
    setView('guides');
    setActiveModule(null);
  }

  return (
    <>
      <style>{STYLES}</style>

      {/* Stats bar (categories view) */}
      {view === 'categories' && (
        <div className="cl-stats-bar" role="region" aria-label="Curriculum statistics">
          <div className="cl-stat">
            <span className="cl-stat-value">{TOTAL_MODULES}</span>
            <span className="cl-stat-label">Guides</span>
          </div>
          <div className="cl-stat">
            <span className="cl-stat-value">{CATEGORIES.length}</span>
            <span className="cl-stat-label">Topics</span>
          </div>
          {hasAccess && (
            <>
              <div className="cl-stat">
                <span className="cl-stat-value">{completedCount}</span>
                <span className="cl-stat-label">Completed</span>
              </div>
              <div className="cl-stat">
                <span className="cl-stat-value">{bookmarkedCount}</span>
                <span className="cl-stat-label">Saved</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Upgrade gate */}
      {!hasAccess && (
        <div className="cl-upgrade" role="region" aria-label="Upgrade required">
          <span className="cl-upgrade-emoji" aria-hidden="true">🔒</span>
          <h2 className="cl-upgrade-title">Family Tier Required</h2>
          <p className="cl-upgrade-sub">
            The Caregiver Learning curriculum is available on the IATLAS Family plan ($39.99/mo) and above.
            Upgrade to access all {TOTAL_MODULES} evidence-based parent guides.
          </p>
          <Link to="/iatlas" className="cl-upgrade-btn">
            Upgrade to Family Plan
          </Link>
        </div>
      )}

      {/* ── Categories view ── */}
      {view === 'categories' && (
        <div className="cl-categories-grid" role="list">
          {CATEGORIES.map((category) => (
            <div key={category.id} role="listitem">
              <CategoryCard
                category={category}
                onClick={() => handleCategoryClick(category)}
                locked={!hasAccess}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Guides view ── */}
      {view === 'guides' && activeCategory && (
        <>
          <button className="cl-section-back" onClick={handleBackToCategories} aria-label="Back to all topics">
            ‹ All Topics
          </button>
          <h2 className="cl-section-heading">{activeCategory.title}</h2>
          <p className="cl-section-desc">{activeCategory.description}</p>
          <div className="cl-modules-grid" role="list">
            {getModulesByCategory(activeCategory.id).map((module) => (
              <div key={module.id} role="listitem">
                <ModuleCard
                  module={module}
                  category={activeCategory}
                  onClick={() => handleModuleClick(module)}
                  locked={!hasAccess}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Guide detail view ── */}
      {view === 'guide' && activeModule && activeCategory && (
        <GuideDetail
          module={activeModule}
          category={activeCategory}
          onBack={handleBackToGuides}
          onUnlockClick={onUnlockClick}
          locked={!hasAccess}
        />
      )}
    </>
  );
}
