/**
 * SpecialtyComingSoonModal.jsx
 * Modal for collecting waitlist interest for a "Coming Soon" IATLAS specialty field.
 *
 * Props:
 *   specialty {object}  – Specialty definition from IATLAS_SPECIALTIES
 *   onClose   {func}    – Called when the modal should be dismissed
 */

import React, { useState, useEffect, useRef } from 'react';

const INTERESTED_OPTIONS = [
  { value: 'protocols', label: 'Protocols' },
  { value: 'assessments', label: 'Assessments' },
  { value: 'worksheets', label: 'Worksheets' },
  { value: 'session-plans', label: 'Session Plans' },
];

export default function SpecialtyComingSoonModal({ specialty, onClose }) {
  const { id, name, icon, features } = specialty;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    interestedIn: [],
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | duplicate | error
  const [errorMsg, setErrorMsg] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    if (cardRef.current) cardRef.current.focus();
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleInterest = (value) => {
    setFormData((prev) => ({
      ...prev,
      interestedIn: prev.interestedIn.includes(value)
        ? prev.interestedIn.filter((v) => v !== value)
        : [...prev.interestedIn, value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/iatlas/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          specialty: id,
          organization: formData.organization.trim(),
          interestedIn: formData.interestedIn,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch (_) {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div
      className="specialty-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="specialty-modal-title"
      onClick={handleBackdropClick}
    >
      <div
        className="specialty-modal-card"
        ref={cardRef}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <button
          className="specialty-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          &#x2715;
        </button>

        <div className="specialty-modal-icon" aria-hidden="true">
          <img src={icon} alt="" width={48} height={48} />
        </div>

        <span className="specialty-modal-badge">Coming Soon</span>

        <h2 className="specialty-modal-title" id="specialty-modal-title">
          {name}
        </h2>

        {status === 'success' ? (
          <div className="specialty-modal-success" role="status" aria-live="polite">
            <div className="specialty-modal-success-icon" aria-hidden="true">🎉</div>
            <p className="specialty-modal-success-text">
              You're on the waitlist! We'll notify you as soon as <strong>{name}</strong> launches.
            </p>
            <button className="specialty-modal-btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="specialty-modal-desc">
              Be the first to know when field-specific IATLAS curriculum for{' '}
              <strong>{name}</strong> launches. Join the waitlist and we'll notify you directly.
            </p>

            <div className="specialty-modal-features">
              <p className="specialty-modal-features-label">Planned content includes:</p>
              <ul className="specialty-modal-features-list">
                {features.slice(0, 4).map((f) => (
                  <li key={f} className="specialty-modal-feature-item">
                    <span aria-hidden="true">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <form
              className="specialty-modal-form"
              onSubmit={handleSubmit}
              aria-label={`Waitlist form for ${name}`}
              noValidate
            >
              <div className="specialty-modal-field">
                <label htmlFor="specialty-modal-name">Your name</label>
                <input
                  id="specialty-modal-name"
                  type="text"
                  placeholder="Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  autoComplete="name"
                />
              </div>

              <div className="specialty-modal-field">
                <label htmlFor="specialty-modal-email">
                  Email address <span aria-hidden="true">*</span>
                </label>
                <input
                  id="specialty-modal-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  required
                  aria-required="true"
                  autoComplete="email"
                />
              </div>

              <div className="specialty-modal-field">
                <label htmlFor="specialty-modal-org">Organization (optional)</label>
                <input
                  id="specialty-modal-org"
                  type="text"
                  placeholder="School / Clinic / Practice"
                  value={formData.organization}
                  onChange={(e) => setFormData((p) => ({ ...p, organization: e.target.value }))}
                  autoComplete="organization"
                />
              </div>

              <div className="specialty-modal-field">
                <p className="specialty-modal-interest-label">Interested in: (optional)</p>
                <div className="specialty-modal-interest-grid">
                  {INTERESTED_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="specialty-modal-interest-item">
                      <input
                        type="checkbox"
                        checked={formData.interestedIn.includes(value)}
                        onChange={() => toggleInterest(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {(status === 'duplicate') && (
                <p className="specialty-modal-msg-duplicate" role="alert">
                  You're already on the waitlist for {name}! We'll be in touch.
                </p>
              )}

              {status === 'error' && (
                <p className="specialty-modal-msg-error" role="alert">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="specialty-modal-btn-submit"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Submitting…' : 'Notify me when available'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
