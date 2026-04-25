/**
 * StatsCard.jsx
 * Reusable stat card component for gamification stats display.
 */

import React from 'react';

const STYLES = `
  .sc-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    gap: 4px;
    min-width: 0;
    box-sizing: border-box;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  .sc-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    transform: translateY(-1px);
  }

  .sc-icon {
    width: 24px;
    height: 24px;
    line-height: 1;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
  }

  .sc-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .sc-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sc-subtitle {
    font-size: 0.72rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  .sc-accent-bar {
    display: block;
    width: 28px;
    height: 3px;
    border-radius: 999px;
    margin-top: 8px;
    background: #e2e8f0;
  }

  /* Dark mode */
  .dark-mode .sc-card {
    background: #1e293b;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .dark-mode .sc-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  .dark-mode .sc-value { color: #f1f5f9; }
  .dark-mode .sc-label { color: #94a3b8; }
  .dark-mode .sc-subtitle { color: #64748b; }
  .dark-mode .sc-accent-bar { background: #334155; }

  /* Mobile */
  @media (max-width: 640px) {
    .sc-card { padding: 12px; }
    .sc-value { font-size: 1.3rem; }
    .sc-icon { width: 20px; height: 20px; }
  }
`;

export default function StatsCard({ icon, label, value, color, subtitle }) {
  return (
    <div className="sc-card">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {icon && (
        <div className="sc-icon" aria-hidden="true">
          {typeof icon === 'string' && icon.startsWith('/')
            ? <img src={icon} alt="" width={24} height={24} />
            : icon}
        </div>
      )}
      <div className="sc-value" style={color ? { color } : undefined}>
        {value !== undefined && value !== null ? value : '—'}
      </div>
      {label && <div className="sc-label">{label}</div>}
      {subtitle && <div className="sc-subtitle">{subtitle}</div>}
      <span className="sc-accent-bar" style={color ? { background: color } : undefined} />
    </div>
  );
}
