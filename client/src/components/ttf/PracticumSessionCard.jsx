import React from 'react';

const STATUS = {
  pending:  { label: 'Pending Review', bg: '#fef3c7', color: '#d97706' },
  approved: { label: 'Approved',       bg: '#d1fae5', color: '#059669' },
  revision: { label: 'Needs Revision', bg: '#fee2e2', color: '#dc2626' },
};

export default function PracticumSessionCard({ session, onViewFeedback }) {
  const { sessionNumber, submittedDate, videoUrl, reflectionNotes, supervisorFeedback, approved, needsRevision } = session;
  const statusKey = approved ? 'approved' : needsRevision ? 'revision' : 'pending';
  const st = STATUS[statusKey];

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
            Practicum Session {sessionNumber}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Submitted: {submittedDate ? new Date(submittedDate).toLocaleDateString() : '—'}
          </p>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: st.bg, color: st.color,
        }}>
          {st.label}
        </span>
      </div>

      {videoUrl && (
        <a
          href={videoUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#4f46e5' }}
        >
          ▶ View Session Video
        </a>
      )}

      {reflectionNotes && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Your Reflection
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            {reflectionNotes.length > 200 ? `${reflectionNotes.slice(0, 200)}…` : reflectionNotes}
          </p>
        </div>
      )}

      {supervisorFeedback && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Supervisor Feedback
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#0c4a6e', lineHeight: 1.6 }}>
            {supervisorFeedback}
          </p>
        </div>
      )}

      {supervisorFeedback && onViewFeedback && (
        <button
          onClick={() => onViewFeedback(session)}
          style={{
            marginTop: 12, background: 'none', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '7px 14px', fontSize: 13,
            cursor: 'pointer', color: '#4f46e5',
          }}
        >
          View Full Feedback
        </button>
      )}
    </div>
  );
}
