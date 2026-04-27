/**
 * SupportWidget.jsx — Floating priority support widget.
 *
 * Shown when a user is authenticated.  Complete and Enterprise tier users
 * see a "Priority Support" badge and receive tier-specific SLA messaging.
 *
 * Route: rendered globally in AppShell (App.jsx)
 */

import React, { useState } from 'react';
import { createSupportTicket } from '../../api/support.js';
import { getIATLASTier } from '../../utils/iatlasGating.js';

const PRIORITY_TIERS = ['complete', 'enterprise'];

const CATEGORIES = [
  { value: 'general',         label: 'General Question' },
  { value: 'technical',       label: 'Technical Issue' },
  { value: 'billing',         label: 'Billing' },
  { value: 'bug_report',      label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'account',         label: 'Account Issue' },
];

export default function SupportWidget() {
  const [isOpen,        setIsOpen]        = useState(false);
  const [formData,      setFormData]      = useState({
    category:    'general',
    subject:     '',
    description: '',
  });
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error,         setError]         = useState(null);

  const userTier         = getIATLASTier();
  const hasPrioritySupport = PRIORITY_TIERS.includes(userTier);

  function handleFieldChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createSupportTicket(formData);
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitSuccess(false);
        setFormData({ category: 'general', subject: '', description: '' });
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
  }

  const slaMessage = hasPrioritySupport
    ? (userTier === 'enterprise'
        ? 'Our team will respond within 2 hours.'
        : 'Our team will respond within 4 hours.')
    : 'Our team will respond within 24–48 hours.';

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`support-widget-trigger${hasPrioritySupport ? ' support-widget-trigger--priority' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Get Support"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg
          className="support-widget-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          width="20"
          height="20"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="support-widget-label">
          {hasPrioritySupport ? 'Priority Support' : 'Support'}
        </span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="support-widget-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Support"
        >
          <div className="support-widget-modal">
            {/* Header */}
            <div className="support-widget-header">
              <div className="support-widget-title-row">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  width="18"
                  height="18"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 className="support-widget-title">Get Support</h3>
                {hasPrioritySupport && (
                  <span className="support-priority-badge">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      width="12"
                      height="12"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Priority
                  </span>
                )}
              </div>
              <button
                className="support-widget-close"
                onClick={handleClose}
                aria-label="Close support panel"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  width="16"
                  height="16"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            {submitSuccess ? (
              <div className="support-widget-success">
                <svg
                  className="support-success-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="support-success-message">Ticket submitted successfully!</p>
                <p className="support-success-sla">{slaMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="support-widget-form" noValidate>
                {hasPrioritySupport && (
                  <p className="support-priority-notice">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      width="14"
                      height="14"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    {slaMessage}
                  </p>
                )}

                <div className="support-form-field">
                  <label htmlFor="support-category" className="support-form-label">
                    Category
                  </label>
                  <select
                    id="support-category"
                    className="support-form-select"
                    value={formData.category}
                    onChange={e => handleFieldChange('category', e.target.value)}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="support-form-field">
                  <label htmlFor="support-subject" className="support-form-label">
                    Subject
                  </label>
                  <input
                    id="support-subject"
                    type="text"
                    className="support-form-input"
                    value={formData.subject}
                    onChange={e => handleFieldChange('subject', e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="support-form-field">
                  <label htmlFor="support-description" className="support-form-label">
                    Description
                  </label>
                  <textarea
                    id="support-description"
                    className="support-form-textarea"
                    value={formData.description}
                    onChange={e => handleFieldChange('description', e.target.value)}
                    placeholder="Provide as much detail as possible…"
                    rows={5}
                    required
                    maxLength={5000}
                  />
                </div>

                {error && (
                  <p className="support-form-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="support-form-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
