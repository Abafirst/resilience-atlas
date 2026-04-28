/**
 * ChildProfileDetail.jsx
 * Individual child profile detail view.
 * Shows all profile information with the option to open the edit modal.
 *
 * Props:
 *   profile        — the ChildProfile object to display
 *   onEdit()       — open the edit modal for this profile
 *   onBack()       — navigate back to the profile list
 */

import React from 'react';
import EditProfileModal from './EditProfileModal.jsx';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';

const AGE_LABELS = {
  '5-7':   'Ages 5–7',
  '8-10':  'Ages 8–10',
  '11-14': 'Ages 11–14',
  '15-18': 'Ages 15–18',
};

const GENDER_LABELS = {
  'male':              'Male',
  'female':            'Female',
  'non-binary':        'Non-binary',
  'prefer-not-to-say': 'Prefer not to say',
};

const SUPPORT_LABELS = {
  'low':       'Low — minimal support',
  'moderate':  'Moderate support',
  'high':      'High support',
  'intensive': 'Intensive support',
};

const STYLES = `
.cpd-root {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1.25rem 4rem;
}

/* ── Back link ── */
.cpd-back {
  display: inline-flex; align-items: center; gap: .35rem;
  background: none; border: none; cursor: pointer;
  color: #6366f1; font-size: .88rem; font-weight: 700;
  padding: .3rem 0; margin-bottom: 1.25rem; transition: opacity .15s;
}
.cpd-back:hover { opacity: .75; }
.dark-mode .cpd-back { color: #818cf8; }

/* ── Hero card ── */
.cpd-hero {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 20px; padding: 2rem 1.75rem;
  display: flex; align-items: center; gap: 1.5rem;
  margin-bottom: 1.5rem; flex-wrap: wrap;
}
.cpd-hero-avatar { font-size: 4rem; line-height: 1; flex-shrink: 0; }
.cpd-hero-info { flex: 1; min-width: 0; }
.cpd-hero-name { font-size: 1.6rem; font-weight: 900; color: #fff; margin: 0 0 .25rem; }
.cpd-hero-meta { font-size: .88rem; color: rgba(255,255,255,.8); margin: 0; }
.cpd-edit-btn {
  padding: .6rem 1.2rem; background: rgba(255,255,255,.2);
  border: 1.5px solid rgba(255,255,255,.4); border-radius: 10px;
  color: #fff; font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: background .15s; flex-shrink: 0;
}
.cpd-edit-btn:hover { background: rgba(255,255,255,.3); }

/* ── Section cards ── */
.cpd-section {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px;
  padding: 1.5rem; margin-bottom: 1rem;
}
.dark-mode .cpd-section { background: #1e293b; border-color: #334155; }
.cpd-section-title {
  font-size: .95rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem;
  display: flex; align-items: center; gap: .5rem;
}
.dark-mode .cpd-section-title { color: #f1f5f9; }

/* ── Info grid ── */
.cpd-info-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem;
}
.cpd-info-item {}
.cpd-info-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: .2rem; }
.cpd-info-value { font-size: .92rem; font-weight: 600; color: #0f172a; }
.dark-mode .cpd-info-value { color: #f1f5f9; }
.cpd-info-empty { font-size: .88rem; color: #94a3b8; font-style: italic; }

/* ── Chip list ── */
.cpd-chips { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .4rem; }
.cpd-chip {
  background: #eef2ff; color: #4338ca; border-radius: 20px;
  padding: .3rem .75rem; font-size: .82rem; font-weight: 600;
}
.dark-mode .cpd-chip { background: #1e1b4b; color: #a5b4fc; }

/* ── Text block ── */
.cpd-text-block {
  font-size: .9rem; color: #374151; line-height: 1.6;
  background: #f8fafc; border-radius: 10px; padding: .75rem;
}
.dark-mode .cpd-text-block { background: #0f172a; color: #cbd5e1; }

/* ── Progress badge ── */
.cpd-progress-row { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .5rem; }
.cpd-stat-badge {
  display: flex; flex-direction: column; align-items: center;
  background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: .75rem 1rem; flex: 1; min-width: 100px;
}
.dark-mode .cpd-stat-badge { background: #0f172a; border-color: #334155; }
.cpd-stat-value { font-size: 1.5rem; font-weight: 900; color: #6366f1; }
.dark-mode .cpd-stat-value { color: #818cf8; }
.cpd-stat-label { font-size: .72rem; color: #94a3b8; margin-top: .1rem; text-align: center; }

/* ── Quick actions ── */
.cpd-actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 1.5rem; }
.cpd-action-btn {
  flex: 1; padding: .7rem 1rem; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; border-radius: 12px; font-size: .9rem; font-weight: 700;
  cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center;
  gap: .4rem; transition: opacity .15s;
}
.cpd-action-btn:hover { opacity: .9; }
.cpd-action-btn-sec {
  flex: 1; padding: .7rem 1rem; background: none; border: 1.5px solid #e2e8f0;
  color: #374151; border-radius: 12px; font-size: .9rem; font-weight: 700;
  cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center;
  gap: .4rem; transition: all .15s;
}
.cpd-action-btn-sec:hover { background: #f8fafc; }
.dark-mode .cpd-action-btn-sec { border-color: #334155; color: #cbd5e1; }
.dark-mode .cpd-action-btn-sec:hover { background: #0f172a; }
`;

function InfoItem({ label, value, empty = 'Not specified' }) {
  return (
    <div className="cpd-info-item">
      <div className="cpd-info-label">{label}</div>
      {value
        ? <div className="cpd-info-value">{value}</div>
        : <div className="cpd-info-empty">{empty}</div>
      }
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="cpd-section">
      <h3 className="cpd-section-title">
        {icon && <img src={icon} alt="" aria-hidden="true" className="icon icon-sm" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ChildProfileDetail({ profile, onEdit, onBack }) {
  const { activeProfileId, switchProfile } = useProfiles();
  const [showEditModal, setShowEditModal] = React.useState(false);

  const isActive = profile.profileId === activeProfileId;

  const dob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const metaParts = [];
  if (dob) {
    const dobPart = age != null ? `Born ${dob} (${age} yrs)` : `Born ${dob}`;
    metaParts.push(dobPart);
  } else if (profile.ageGroup) {
    metaParts.push(AGE_LABELS[profile.ageGroup] || profile.ageGroup);
  }
  if (profile.gender) metaParts.push(GENDER_LABELS[profile.gender] || profile.gender);
  if (isActive) metaParts.push('● Active profile');

  const progress = profile.progress || {};
  const totalXP = progress.totalXP || 0;
  const level   = progress.level   || 1;
  const completedCount = Object.keys(progress.completedActivities || {}).length;

  function handleEditClose() {
    setShowEditModal(false);
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="cpd-root">
        <button className="cpd-back" onClick={onBack} aria-label="Back to all profiles">
          ← All Profiles
        </button>

        {/* ── Hero ── */}
        <div className="cpd-hero">
          <div className="cpd-hero-avatar" aria-hidden="true"><img src={profile.avatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
          <div className="cpd-hero-info">
            <h2 className="cpd-hero-name">{profile.name}</h2>
            {metaParts.length > 0 && (
              <p className="cpd-hero-meta">{metaParts.join('  ·  ')}</p>
            )}
          </div>
          <button
            className="cpd-edit-btn"
            onClick={() => setShowEditModal(true)}
            aria-label={`Edit ${profile.name}'s profile`}
          >
            <img src="/icons/writing.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Edit
          </button>
        </div>

        {/* ── Progress stats ── */}
        <Section icon="/icons/org-leaderboards.svg" title="Progress Overview">
          <div className="cpd-progress-row">
            <div className="cpd-stat-badge">
              <span className="cpd-stat-value">{level}</span>
              <span className="cpd-stat-label">Current Level</span>
            </div>
            <div className="cpd-stat-badge">
              <span className="cpd-stat-value">{totalXP}</span>
              <span className="cpd-stat-label">Total XP</span>
            </div>
            <div className="cpd-stat-badge">
              <span className="cpd-stat-value">{completedCount}</span>
              <span className="cpd-stat-label">Activities Done</span>
            </div>
            <div className="cpd-stat-badge">
              <span className="cpd-stat-value">{(progress.badges || []).length}</span>
              <span className="cpd-stat-label">Badges Earned</span>
            </div>
          </div>
        </Section>

        {/* ── Basic info ── */}
        <Section icon="/icons/journal.svg" title="Basic Information">
          <div className="cpd-info-grid">
            <InfoItem label="Date of Birth" value={dob} />
            <InfoItem label="Age" value={age != null ? `${age} years old` : null} />
            <InfoItem label="Age Group" value={AGE_LABELS[profile.ageGroup] || profile.ageGroup} />
            <InfoItem label="Gender" value={GENDER_LABELS[profile.gender] || profile.gender} />
          </div>
        </Section>

        {/* ── Clinical details ── */}
        <Section icon="/icons/clinical.svg" title="Clinical Details">
          {(!profile.clinical ||
            (!profile.clinical.diagnoses?.length &&
             !profile.clinical.goals?.length &&
             !profile.clinical.strengths &&
             !profile.clinical.challenges &&
             !profile.clinical.supportLevel)) ? (
            <p className="cpd-info-empty">No clinical information added yet.</p>
          ) : (
            <>
              {profile.clinical.diagnoses?.length > 0 && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Diagnoses</div>
                  <div className="cpd-chips">
                    {profile.clinical.diagnoses.map(d => (
                      <span key={d} className="cpd-chip">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.clinical.goals?.length > 0 && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Current Goals</div>
                  <div className="cpd-chips">
                    {profile.clinical.goals.map(g => (
                      <span key={g} className="cpd-chip">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.clinical.supportLevel && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Support Level</div>
                  <div className="cpd-info-value">
                    {SUPPORT_LABELS[profile.clinical.supportLevel] || profile.clinical.supportLevel}
                  </div>
                </div>
              )}
              {profile.clinical.strengths && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Strengths</div>
                  <div className="cpd-text-block">{profile.clinical.strengths}</div>
                </div>
              )}
              {profile.clinical.challenges && (
                <div className="cpd-field">
                  <div className="cpd-info-label">Challenges</div>
                  <div className="cpd-text-block">{profile.clinical.challenges}</div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* ── Preferences ── */}
        <Section icon="/icons/goal.svg" title="Preferences">
          {(!profile.preferences ||
            (!profile.preferences.activities?.length &&
             !profile.preferences.sensoryPreferences &&
             !profile.preferences.communicationStyle &&
             !profile.preferences.learningPreferences)) ? (
            <p className="cpd-info-empty">No preferences added yet.</p>
          ) : (
            <>
              {profile.preferences.activities?.length > 0 && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Preferred Activities</div>
                  <div className="cpd-chips">
                    {profile.preferences.activities.map(a => (
                      <span key={a} className="cpd-chip">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.preferences.sensoryPreferences && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Sensory Preferences</div>
                  <div className="cpd-text-block">{profile.preferences.sensoryPreferences}</div>
                </div>
              )}
              {profile.preferences.communicationStyle && (
                <div className="cpd-field" style={{ marginBottom: '1rem' }}>
                  <div className="cpd-info-label">Communication Style</div>
                  <div className="cpd-text-block">{profile.preferences.communicationStyle}</div>
                </div>
              )}
              {profile.preferences.learningPreferences && (
                <div className="cpd-field">
                  <div className="cpd-info-label">Learning Preferences</div>
                  <div className="cpd-text-block">{profile.preferences.learningPreferences}</div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* ── Quick actions ── */}
        <div className="cpd-actions">
          <a href="/iatlas/kids" className="cpd-action-btn">
            Start Activities
          </a>
          {!isActive && (
            <button
              className="cpd-action-btn-sec"
              onClick={() => switchProfile(profile.profileId)}
            >
              ↩ Set as Active
            </button>
          )}
          <button
            className="cpd-action-btn-sec"
            onClick={() => setShowEditModal(true)}
          >
            <img src="/icons/writing.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Edit Profile
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={handleEditClose}
          onUpdated={() => { handleEditClose(); if (onEdit) onEdit(); }}
          onDeleted={() => { handleEditClose(); if (onBack) onBack(); }}
        />
      )}
    </>
  );
}
