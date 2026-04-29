/**
 * SeatUsageIndicator.jsx
 * Displays current seat usage as a labeled progress bar.
 *
 * Props:
 *   seatsUsed   {number}  Currently occupied seats
 *   seatLimit   {number}  Total seat limit for the plan
 *   plan        {string}  Plan name displayed below the bar
 *   onUpgrade   {fn}      Called when the upgrade link is clicked
 */

import React from 'react';

const PLAN_LABELS = {
  'practice-5':  'Practice-5 (5 seats)',
  'practice-10': 'Practice-10 (10 seats)',
  'practice-25': 'Practice-25 (25 seats)',
  'custom':      'Custom plan',
};

export default function SeatUsageIndicator({ seatsUsed = 0, seatLimit = 5, plan = 'practice-5', onUpgrade }) {
  const pct      = seatLimit > 0 ? Math.min((seatsUsed / seatLimit) * 100, 100) : 0;
  const isFull   = seatsUsed >= seatLimit;
  const barColor = isFull ? '#dc2626' : pct >= 80 ? '#d97706' : '#059669';
  const planLabel = PLAN_LABELS[plan] || plan;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>Team Seats</span>
        <span style={{ fontSize: 13, color: isFull ? '#dc2626' : '#6b7280', fontWeight: 600 }}>
          {seatsUsed} / {seatLimit} used
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: 99,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{planLabel}</span>
        {isFull && (
          <button
            onClick={onUpgrade}
            style={{
              fontSize: 12,
              color: '#4f46e5',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Upgrade plan →
          </button>
        )}
        {!isFull && (
          <span style={{ fontSize: 12, color: barColor, fontWeight: 600 }}>
            {seatLimit - seatsUsed} seat{seatLimit - seatsUsed !== 1 ? 's' : ''} available
          </span>
        )}
      </div>
    </div>
  );
}
