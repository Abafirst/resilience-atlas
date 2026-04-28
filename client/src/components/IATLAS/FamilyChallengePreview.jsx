/**
 * FamilyChallengePreview.jsx
 * Shows up to 3 upcoming / featured Family Challenges as a preview card grid.
 * Used inside ParentDashboard to give parents a quick entry point.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FAMILY_CHALLENGES } from '../../data/iatlas/familyChallenges.js';
import { isFamilyChallengeCompleted } from '../../hooks/useFamilyProgress.js';

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

const STYLES = `
  .fcp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: .75rem;
  }

  .fcp-card {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: .9rem 1rem;
    text-decoration: none;
    color: inherit;
    transition: box-shadow .15s, transform .15s;
    display: flex;
    flex-direction: column;
    gap: .4rem;
  }

  .dark-mode .fcp-card {
    background: #1e293b;
    border-color: #334155;
  }

  .fcp-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,.1);
    transform: translateY(-2px);
  }

  .fcp-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .fcp-dim-badge {
    font-size: .68rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .15rem .5rem;
    color: #ffffff;
    text-transform: capitalize;
  }

  .fcp-done-badge {
    font-size: .7rem;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    border-radius: 20px;
    padding: .15rem .5rem;
  }

  .fcp-title {
    font-size: .9rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }

  .dark-mode .fcp-title {
    color: #f1f5f9;
  }

  .fcp-desc {
    font-size: .78rem;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }

  .fcp-meta {
    font-size: .72rem;
    color: #94a3b8;
    display: flex;
    gap: .75rem;
    margin-top: .1rem;
  }

  .fcp-xp {
    font-size: .75rem;
    font-weight: 700;
    color: #6366f1;
    margin-top: auto;
  }
`;

export default function FamilyChallengePreview() {
  // Show first 3 challenges
  const preview = FAMILY_CHALLENGES.slice(0, 3);

  return (
    <>
      <style>{STYLES}</style>
      <div className="fcp-grid">
        {preview.map((challenge) => {
          const done  = isFamilyChallengeCompleted(challenge.id);
          const color = DIMENSION_COLORS[challenge.dimension] || '#6366f1';
          const icon  = DIMENSION_ICONS[challenge.dimension]  || '/icons/compass.svg';

          return (
            <Link
              key={challenge.id}
              to={`/iatlas/family/challenges/${challenge.id}`}
              className="fcp-card"
              aria-label={`${challenge.title} — ${done ? 'Completed' : 'Start challenge'}`}
            >
              <div className="fcp-card-top">
                <span
                  className="fcp-dim-badge"
                  style={{ background: color }}
                >
                  <img src={icon} alt="" aria-hidden="true" className="icon icon-sm" /> {challenge.dimension.replace(/-/g, ' ')}
                </span>
                {done && <span className="fcp-done-badge">✓ Done</span>}
              </div>

              <p className="fcp-title">{challenge.title}</p>
              <p className="fcp-desc">{challenge.description}</p>

              <div className="fcp-meta">
                <span>⏱ {challenge.duration}</span>
                <span>{challenge.participants}</span>
              </div>
              <span className="fcp-xp">+{challenge.xpReward} XP</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
