/**
 * MetricCard.jsx
 * Reusable metric display card for the Analytics Dashboard.
 *
 * Props:
 *   title      {string}  Metric label
 *   value      {string|number}  Primary metric value
 *   subtitle   {string}  Optional secondary text
 *   icon       {string}  Icon path (e.g. '/icons/fire.svg') or legacy emoji character
 *   color      {string}  Accent color (CSS color)
 *   trend      {number}  Optional % change (positive = up, negative = down)
 *   tooltip    {string}  Descriptive tooltip text
 */

import React, { useState } from 'react';

const STYLES = `
.mc-root {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  position: relative;
  overflow: hidden;
  transition: box-shadow .2s, transform .2s;
}
.mc-root:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  transform: translateY(-1px);
}
[data-theme="dark"] .mc-root {
  background: #1e293b;
  border-color: #334155;
}
.mc-accent-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  border-radius: 16px 0 0 16px;
}
.mc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.mc-icon {
  font-size: 1.5rem;
  line-height: 1;
}
.mc-tooltip-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: .85rem;
  padding: 0;
  line-height: 1;
}
.mc-tooltip-btn:hover { color: #64748b; }
.mc-tooltip-popup {
  position: absolute;
  top: .5rem; right: 2.5rem;
  background: #1e293b;
  color: #f8fafc;
  font-size: .78rem;
  padding: .5rem .75rem;
  border-radius: 8px;
  max-width: 200px;
  z-index: 10;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0,0,0,.25);
}
.mc-value {
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  padding-left: .25rem;
}
[data-theme="dark"] .mc-value { color: #f1f5f9; }
.mc-title {
  font-size: .78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #64748b;
  padding-left: .25rem;
}
[data-theme="dark"] .mc-title { color: #94a3b8; }
.mc-subtitle {
  font-size: .8rem;
  color: #94a3b8;
  padding-left: .25rem;
}
.mc-trend {
  display: inline-flex;
  align-items: center;
  gap: .2rem;
  font-size: .78rem;
  font-weight: 600;
  padding: .15rem .5rem;
  border-radius: 999px;
  margin-top: .25rem;
  margin-left: .25rem;
  width: fit-content;
}
.mc-trend-up   { background: #d1fae5; color: #065f46; }
.mc-trend-down { background: #fee2e2; color: #991b1b; }
.mc-trend-flat { background: #f1f5f9; color: #475569; }
[data-theme="dark"] .mc-trend-up   { background: #064e3b; color: #a7f3d0; }
[data-theme="dark"] .mc-trend-down { background: #7f1d1d; color: #fca5a5; }
[data-theme="dark"] .mc-trend-flat { background: #1e293b; color: #94a3b8; }
`;

export default function MetricCard({ title, value, subtitle, icon, color = '#6366f1', trend, tooltip }) {
  const [showTip, setShowTip] = useState(false);

  const trendClass = trend > 0 ? 'mc-trend mc-trend-up'
    : trend < 0 ? 'mc-trend mc-trend-down'
    : 'mc-trend mc-trend-flat';

  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="mc-root" role="region" aria-label={`${title}: ${value}`}>
        <div className="mc-accent-bar" style={{ background: color }} aria-hidden="true" />

        <div className="mc-header">
          <span className="mc-icon" aria-hidden="true">
            {typeof icon === 'string' && icon.startsWith('/')
              ? <img src={icon} alt="" aria-hidden="true" style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }} />
              : icon}
          </span>
          {tooltip && (
            <div style={{ position: 'relative' }}>
              <button
                className="mc-tooltip-btn"
                aria-label={`Help: ${title}`}
                onClick={() => setShowTip(v => !v)}
                onBlur={() => setShowTip(false)}
              >
                ⓘ
              </button>
              {showTip && (
                <div className="mc-tooltip-popup" role="tooltip">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mc-title">{title}</div>
        <div className="mc-value">{value ?? '—'}</div>

        {subtitle && <div className="mc-subtitle">{subtitle}</div>}

        {trend !== undefined && (
          <div className={trendClass} aria-label={`Trend: ${trend > 0 ? '+' : ''}${trend}%`}>
            <span aria-hidden="true">{trendArrow}</span>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </>
  );
}
