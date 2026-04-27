/**
 * WaitlistForm.jsx
 * Inline form for joining the waitlist for a coming-soon IATLAS tier
 * (currently: Practice and Enterprise).
 *
 * Props:
 *   tier       {string}  — The tier key to join the waitlist for (e.g. 'practice')
 *   onSuccess  {func}    — Called after a successful waitlist submission
 */

import React, { useState } from 'react';
import { submitWaitlistEntry } from '../../api/iatlas.js';

export default function WaitlistForm({ tier, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    organization: '',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | duplicate | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      const result = await submitWaitlistEntry({
        tier,
        email: formData.email.trim(),
        name: formData.name.trim(),
        organization: formData.organization.trim(),
      });

      if (result.alreadyJoined) {
        setStatus('duplicate');
      } else {
        setStatus('success');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to join waitlist. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="iatlas-waitlist-form-success" role="status" aria-live="polite">
        <span aria-hidden="true">✅</span>
        <p>You're on the waitlist! We'll notify you when this tier launches.</p>
      </div>
    );
  }

  if (status === 'duplicate') {
    return (
      <div className="iatlas-waitlist-form-success" role="status" aria-live="polite">
        <span aria-hidden="true">✅</span>
        <p>You're already on the waitlist for this tier. We'll be in touch!</p>
      </div>
    );
  }

  return (
    <form
      className="iatlas-waitlist-form"
      onSubmit={handleSubmit}
      aria-label="Join tier waitlist"
      noValidate
    >
      <div className="iatlas-waitlist-field">
        <label htmlFor="wl-name">Name *</label>
        <input
          id="wl-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          placeholder="Your name"
          autoComplete="name"
        />
      </div>

      <div className="iatlas-waitlist-field">
        <label htmlFor="wl-email">Email *</label>
        <input
          id="wl-email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          placeholder="your@email.com"
          autoComplete="email"
        />
      </div>

      <div className="iatlas-waitlist-field">
        <label htmlFor="wl-org">Organization (optional)</label>
        <input
          id="wl-org"
          type="text"
          value={formData.organization}
          onChange={(e) => setFormData((p) => ({ ...p, organization: e.target.value }))}
          placeholder="Your practice, school, or company"
          autoComplete="organization"
        />
      </div>

      {status === 'error' && (
        <p className="iatlas-waitlist-error" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        className="iatlas-unlock-btn-primary"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Joining…' : 'Join Waitlist'}
      </button>
    </form>
  );
}
