/**
 * ComingSoonModal.jsx
 * Reusable "Coming Soon" payment-gating modal for IATLAS content.
 *
 * Props:
 *   title   {string}  – Modal headline
 *   message {string}  – Body copy
 *   onClose {func}    – Called when the user dismisses the modal
 */

import React, { useEffect, useRef } from 'react';

const MODAL_STYLES = `
  .iatlas-coming-modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .iatlas-coming-modal-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem 1.5rem;
    max-width: 440px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    text-align: center;
    position: relative;
  }

  .dark-mode .iatlas-coming-modal-card {
    background: #1e293b;
  }

  .iatlas-coming-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    background: #fef3c7;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .iatlas-coming-badge {
    display: inline-block;
    background: #1e293b;
    color: #f1f5f9;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 999px;
    padding: 0.25rem 0.75rem;
    margin-bottom: 0.75rem;
  }

  .dark-mode .iatlas-coming-badge {
    background: #334155;
  }

  .iatlas-coming-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 0.5rem;
  }

  .dark-mode .iatlas-coming-title {
    color: #f1f5f9;
  }

  .iatlas-coming-message {
    font-size: 0.9rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .dark-mode .iatlas-coming-message {
    color: #94a3b8;
  }

  .iatlas-coming-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .iatlas-coming-btn-primary {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;
    display: inline-block;
  }

  .iatlas-coming-btn-primary:hover {
    background: #4338ca;
  }

  .iatlas-coming-btn-secondary {
    background: transparent;
    color: #64748b;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.7rem 1.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: border-color 0.15s, color 0.15s;
    display: inline-block;
  }

  .iatlas-coming-btn-secondary:hover {
    border-color: #4f46e5;
    color: #4f46e5;
  }

  .dark-mode .iatlas-coming-btn-secondary {
    color: #94a3b8;
    border-color: #334155;
  }

  .iatlas-coming-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
    padding: 0.25rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 0.15s;
  }

  .iatlas-coming-close:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  .dark-mode .iatlas-coming-close:hover {
    background: #334155;
    color: #f1f5f9;
  }
`;

export default function IATLASComingSoonModal({ title, message, onClose }) {
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MODAL_STYLES }} />
      <div
        className="iatlas-coming-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="iatlas-coming-modal-title"
        onClick={handleBackdropClick}
      >
        <div
          className="iatlas-coming-modal-card"
          ref={cardRef}
          tabIndex={-1}
          style={{ outline: 'none' }}
        >
          <button
            className="iatlas-coming-close"
            onClick={onClose}
            aria-label="Close"
          >
            &#x2715;
          </button>

          <div className="iatlas-coming-icon" aria-hidden="true">🔒</div>

          <span className="iatlas-coming-badge">Coming Soon</span>

          <h2 className="iatlas-coming-title" id="iatlas-coming-modal-title">
            {title}
          </h2>

          <p className="iatlas-coming-message">{message}</p>

          <div className="iatlas-coming-actions">
            <a
              href="#iatlas-waitlist"
              className="iatlas-coming-btn-primary"
              onClick={onClose}
            >
              Join Waitlist
            </a>
            <button
              className="iatlas-coming-btn-secondary"
              onClick={onClose}
            >
              View Free Content
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
