import React, { useState } from 'react';
import { ACTIVITY_SETTINGS } from '../../constants/progressCircles.js';

/**
 * ActivityLogger — form for logging an activity completion from any setting.
 *
 * Props:
 *   circleId        {string}   Progress Circle ID
 *   onSuccess       {Function} Called after successful submission
 *   onCancel        {Function} Called when the user cancels
 *   getAccessToken  {Function} Returns a Promise<string> with the bearer token
 */
export default function ActivityLogger({ circleId, onSuccess, onCancel, getAccessToken }) {
  const [activityId, setActivityId] = useState('');
  const [setting,    setSetting]    = useState('');
  const [dimension,  setDimension]  = useState('');
  const [xpAwarded,  setXpAwarded]  = useState(0);
  const [notes,      setNotes]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const DIMENSIONS = ['relational', 'cognitive', 'somatic', 'emotional', 'spiritual', 'agentic'];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activityId.trim()) {
      setError('Activity ID is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/progress-circles/${circleId}/activities`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          activityId: activityId.trim(),
          setting:    setting   || undefined,
          dimension:  dimension || undefined,
          xpAwarded:  Number(xpAwarded) || 0,
          notes:      notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log activity.');
      onSuccess && onSuccess(data.activity);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Log Activity</h3>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', color: '#b91c1c', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Activity ID *</label>
        <input
          style={inputStyle}
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          placeholder="e.g. breathing-exercise-1"
          required
        />
      </div>

      <div>
        <label style={labelStyle}>Setting</label>
        <select style={inputStyle} value={setting} onChange={(e) => setSetting(e.target.value)}>
          <option value="">Select setting…</option>
          {ACTIVITY_SETTINGS.map((s) => (
            <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Dimension</label>
        <select style={inputStyle} value={dimension} onChange={(e) => setDimension(e.target.value)}>
          <option value="">Select dimension…</option>
          {DIMENSIONS.map((d) => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>XP Awarded</label>
        <input
          style={inputStyle}
          type="number"
          min={0}
          max={500}
          value={xpAwarded}
          onChange={(e) => setXpAwarded(e.target.value)}
          placeholder="0"
        />
      </div>

      <div>
        <label style={labelStyle}>Notes (private)</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes visible only to you and those with note-viewing permission…"
          maxLength={1000}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: '#4f46e5', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Logging…' : 'Log Activity'}
        </button>
      </div>
    </form>
  );
}
