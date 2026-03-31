import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const TYPE_STYLES = {
  success: { background: '#059669', color: '#fff' },
  info:    { background: '#2563eb', color: '#fff' },
  warning: { background: '#d97706', color: '#fff' },
  error:   { background: '#dc2626', color: '#fff' },
};

const s = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    pointerEvents: 'none',
  },
  toast: (type) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 18px',
    borderRadius: 10,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    fontSize: 14,
    fontWeight: 600,
    minWidth: 240,
    maxWidth: 360,
    pointerEvents: 'auto',
    animation: 'gamToastIn 0.25s ease',
    ...(TYPE_STYLES[type] || TYPE_STYLES.info),
  }),
  dismiss: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.7,
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
  },
};

const KEYFRAMES = `
  @keyframes gamToastIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

/**
 * Renders a stack of toast notifications using a React portal.
 *
 * Props:
 *   toasts       — array of { id, message, type }
 *   onDismiss    — (id) => void
 */
export default function GamificationToast({ toasts, onDismiss }) {
  useEffect(() => {
    // Inject keyframe animation once
    if (!document.getElementById('gam-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'gam-toast-styles';
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  if (!toasts || toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div style={s.container} aria-live="polite" aria-atomic="false">
      {toasts.map(t => (
        <div key={t.id} style={s.toast(t.type)} role="status">
          <span>{t.message}</span>
          <button
            style={s.dismiss}
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
