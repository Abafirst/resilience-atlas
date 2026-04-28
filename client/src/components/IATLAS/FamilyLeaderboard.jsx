/**
 * FamilyLeaderboard.jsx
 * Displays combined family resilience progress across all child profiles.
 * Shows total family XP, challenge counts, and individual member contributions.
 *
 * Route: used inside ParentDashboard and FamilyDashboard
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useFamilyProgress } from '../../hooks/useFamilyProgress.js';

const STYLES = `
  .fl-root {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 16px;
    padding: 1.5rem;
    color: #ffffff;
  }

  .fl-title {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .fl-total-xp {
    display: flex;
    align-items: baseline;
    gap: .4rem;
    margin-bottom: 1rem;
  }

  .fl-xp-value {
    font-size: 2.2rem;
    font-weight: 900;
    line-height: 1;
  }

  .fl-xp-label {
    font-size: .8rem;
    opacity: .8;
    font-weight: 600;
  }

  .fl-stats-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .75rem;
    margin-bottom: 1.25rem;
  }

  .fl-stat {
    background: rgba(255,255,255,.15);
    border-radius: 10px;
    padding: .75rem;
    text-align: center;
  }

  .fl-stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 900;
    line-height: 1.1;
  }

  .fl-stat-label {
    display: block;
    font-size: .72rem;
    opacity: .85;
    margin-top: .2rem;
  }

  .fl-members-title {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    opacity: .75;
    margin: 0 0 .6rem;
  }

  .fl-member-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .5rem .6rem;
    background: rgba(255,255,255,.12);
    border-radius: 8px;
    margin-bottom: .4rem;
  }

  .fl-member-info {
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .fl-member-avatar {
    font-size: 1.3rem;
    line-height: 1;
  }

  .fl-member-name {
    font-size: .85rem;
    font-weight: 600;
  }

  .fl-member-xp {
    font-size: .82rem;
    font-weight: 700;
    background: rgba(255,255,255,.2);
    border-radius: 20px;
    padding: .15rem .6rem;
  }

  .fl-cta {
    display: block;
    margin-top: 1rem;
    background: #ffffff;
    color: #6366f1;
    border-radius: 10px;
    padding: .6rem 1rem;
    font-weight: 700;
    font-size: .85rem;
    text-align: center;
    text-decoration: none;
    transition: opacity .15s;
  }

  .fl-cta:hover {
    opacity: .9;
  }

  .fl-empty {
    text-align: center;
    opacity: .7;
    font-size: .85rem;
    padding: .5rem 0;
  }
`;

export default function FamilyLeaderboard() {
  const { familyMembers, totalFamilyXP, challengesCompleted, familyChallengesCompleted } =
    useFamilyProgress();

  return (
    <>
      <style>{STYLES}</style>
      <div className="fl-root">
        <h3 className="fl-title">
          <img src="/icons/star.svg" alt="" aria-hidden="true" className="icon icon-sm" />
          Family Resilience Score
        </h3>

        {/* Total XP */}
        <div className="fl-total-xp">
          <span className="fl-xp-value">{totalFamilyXP.toLocaleString()}</span>
          <span className="fl-xp-label">Total Family XP</span>
        </div>

        {/* Stats */}
        <div className="fl-stats-row">
          <div className="fl-stat">
            <span className="fl-stat-value">{challengesCompleted}</span>
            <span className="fl-stat-label">Kids Activities</span>
          </div>
          <div className="fl-stat">
            <span className="fl-stat-value">{familyChallengesCompleted}</span>
            <span className="fl-stat-label">Family Challenges</span>
          </div>
        </div>

        {/* Member contributions */}
        {familyMembers.length > 0 ? (
          <>
            <p className="fl-members-title">Member Contributions</p>
            {familyMembers.map((member) => (
              <div key={member.profileId} className="fl-member-row">
                <div className="fl-member-info">
                  <span className="fl-member-avatar" aria-hidden="true">
                    <img src={member.avatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </span>
                  <span className="fl-member-name">{member.name}</span>
                </div>
                <span className="fl-member-xp">{member.xp} XP</span>
              </div>
            ))}
          </>
        ) : (
          <p className="fl-empty">Add child profiles to track family progress.</p>
        )}

        <Link to="/iatlas/family/challenges" className="fl-cta">
          View Family Challenges →
        </Link>
      </div>
    </>
  );
}
