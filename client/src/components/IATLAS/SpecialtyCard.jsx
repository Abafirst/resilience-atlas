/**
 * SpecialtyCard.jsx
 * Card component for a "Coming Soon" specialty field on the IATLAS Curriculum page.
 *
 * Props:
 *   specialty     {object}  – Specialty definition from IATLAS_SPECIALTIES
 *   onJoinWaitlist {func}   – Called when the "Coming Soon — Join Waitlist" button is clicked
 */

import React from 'react';

// Tags shown on each card — derived from the first 4 features of the specialty
const MAX_TAGS = 4;

export default function SpecialtyCard({ specialty, onJoinWaitlist }) {
  const { icon, name, description, features, pricing } = specialty;
  const tags = features.slice(0, MAX_TAGS);

  return (
    <div className="iatlas-specialty-card">
      <div className="iatlas-specialty-icon" aria-hidden="true">
        <img src={icon} alt="" />
      </div>
      <h3 className="iatlas-specialty-title">{name}</h3>
      <p className="iatlas-specialty-desc">{description}</p>
      <div className="iatlas-specialty-features">
        {tags.map((tag) => (
          <span key={tag} className="iatlas-specialty-tag">{tag}</span>
        ))}
      </div>
      <p className="iatlas-specialty-pricing">{pricing}</p>
      <button
        className="iatlas-btn-specialty"
        onClick={onJoinWaitlist}
        aria-label={`Join waitlist for ${name}`}
      >
        Coming Soon — Join Waitlist
      </button>
    </div>
  );
}
