/**
 * XPNotification.jsx
 * Toast notification displayed when XP is earned.
 * Auto-dismisses after `duration` ms (default 3000).
 *
 * Usage:
 *   <XPNotification amount={35} reason="Activity completed!" onDismiss={() => setXP(null)} />
 */

import React, { useEffect, useRef } from 'react';

const STYLES = `
  @keyframes xp-slide-in {
    from { transform: translateY(32px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  @keyframes xp-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; transform: translateY(-8px); }
  }

  .xp-toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 1400;
    display: flex;
    align-items: center;
    gap: .7rem;
    background: #0f172a;
    color: #f1f5f9;
    border-radius: 14px;
    padding: .8rem 1.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,.25);
    font-size: .92rem;
    font-weight: 700;
    animation: xp-slide-in .3s cubic-bezier(.34,1.56,.64,1);
    max-width: 320px;
    pointer-events: none;
  }

  .dark-mode .xp-toast {
    background: #1e293b;
    box-shadow: 0 8px 32px rgba(0,0,0,.45);
  }

  .xp-toast.xp-toast--leaving {
    animation: xp-fade-out .3s ease forwards;
  }

  .xp-toast-star {
    font-size: 1.35rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .xp-toast-amount {
    color: #fbbf24;
    font-size: 1.1rem;
    font-weight: 900;
  }

  .xp-toast-reason {
    font-size: .82rem;
    color: #94a3b8;
    font-weight: 500;
    line-height: 1.3;
  }
`;

/**
 * XPNotification
 *
 * Props:
 *   amount    {number}   XP amount earned
 *   reason    {string}   Human-readable reason (e.g. "Activity Completed!")
 *   onDismiss {Function} Called after the toast auto-dismisses or is clicked
 *   duration  {number}   Auto-dismiss delay in ms (default 3000)
 */
export default function XPNotification({ amount = 0, reason = '', onDismiss, duration = 3000 }) {
  const [leaving, setLeaving] = React.useState(false);
  const timerRef    = useRef(null);
  const leaveRef    = useRef(null);
  const onDismissRef = useRef(onDismiss);

  // Keep the ref current without triggering the effect
  React.useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setLeaving(true);
      leaveRef.current = setTimeout(() => {
        if (onDismissRef.current) onDismissRef.current();
      }, 320);
    }, duration);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(leaveRef.current);
    };
  // duration is the only value that should restart the timer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  if (amount <= 0) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className={`xp-toast${leaving ? ' xp-toast--leaving' : ''}`}
        role="status"
        aria-live="polite"
        aria-label={`+${amount} XP earned`}
      >
        <span className="xp-toast-star" aria-hidden="true">⭐</span>
        <div>
          <span className="xp-toast-amount">+{amount} XP</span>
          {reason && <div className="xp-toast-reason">{reason}</div>}
        </div>
      </div>
    </>
  );
}
