/**
 * PrintExportButton.jsx
 * Reusable printer/export button that opens a PrintPreviewModal.
 *
 * Props:
 *   resourceType  {string}   — 'activity' | 'progress_report' | 'session_plan' | 'protocol' | 'family_report'
 *   resourceData  {object}   — the data to export (activity, plan, metrics, etc.)
 *   label         {string}   — button label (default: 'Print')
 *   variant       {string}   — 'primary' | 'secondary' | 'ghost' (default: 'ghost')
 *   className     {string}   — additional class names
 */

import React, { useState, lazy, Suspense } from 'react';

const PrintPreviewModal = lazy(() => import('./PrintPreviewModal.jsx'));

const BTN_STYLES = `
.peb-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .5rem 1rem;
  border-radius: 8px;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: background .15s, color .15s, border-color .15s, box-shadow .15s;
  white-space: nowrap;
}
.peb-btn:active { transform: scale(.97); }

.peb-btn--primary {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
.peb-btn--primary:hover {
  background: #4f46e5;
  border-color: #4f46e5;
  box-shadow: 0 2px 8px rgba(99,102,241,.25);
}

.peb-btn--secondary {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #374151;
}
.peb-btn--secondary:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #4338ca;
}

.peb-btn--ghost {
  background: transparent;
  border-color: #e2e8f0;
  color: #64748b;
}
.peb-btn--ghost:hover {
  background: #f1f5f9;
  border-color: #c7d2fe;
  color: #4f46e5;
}

[data-theme="dark"] .peb-btn--secondary {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
[data-theme="dark"] .peb-btn--secondary:hover {
  background: #1e2a40;
  border-color: #818cf8;
  color: #a5b4fc;
}
[data-theme="dark"] .peb-btn--ghost {
  border-color: #334155;
  color: #94a3b8;
}
[data-theme="dark"] .peb-btn--ghost:hover {
  background: #1e293b;
  border-color: #818cf8;
  color: #a5b4fc;
}
`;

export default function PrintExportButton({
  resourceType,
  resourceData,
  label = 'Print',
  variant = 'ghost',
  className = '',
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BTN_STYLES }} />

      <button
        className={`peb-btn peb-btn--${variant} ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-label={`${label} — opens print preview`}
        type="button"
      >
        <span aria-hidden="true">🖨</span>
        {label}
      </button>

      {open && (
        <Suspense fallback={null}>
          <PrintPreviewModal
            isOpen={open}
            onClose={() => setOpen(false)}
            resourceType={resourceType}
            resourceData={resourceData}
          />
        </Suspense>
      )}
    </>
  );
}
