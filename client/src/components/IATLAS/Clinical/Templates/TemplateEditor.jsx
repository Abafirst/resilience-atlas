/**
 * TemplateEditor.jsx
 * Edit an existing session template.
 * Wraps TemplateBuilder in edit mode with unsaved-changes detection.
 *
 * Props:
 *   template     {object}    — template to edit (required)
 *   onSave       {function}  — called with the updated template after save
 *   onCancel     {function}  — called when the user cancels
 *   getTokenFn   {function}  — Auth0 getAccessTokenSilently
 *   userTier     {string}    — current user's subscription tier
 */

import React, { useState, useEffect, useCallback } from 'react';
import TemplateBuilder from './TemplateBuilder.jsx';

function formatDate(val) {
  if (!val) return 'Unknown';
  try {
    return new Date(val).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

export default function TemplateEditor({ template, onSave, onCancel, getTokenFn, userTier }) {
  const [isDirty, setIsDirty] = useState(false);

  // Intercept the browser unload event to warn about unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Wrap onSave so we can mark the form as clean after a successful save.
  const handleSave = useCallback((saved) => {
    setIsDirty(false);
    if (onSave) onSave(saved);
  }, [onSave]);

  // Warn before cancelling with unsaved changes.
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('You have unsaved changes. Discard them?');
      if (!confirmed) return;
    }
    if (onCancel) onCancel();
  }, [isDirty, onCancel]);

  if (!template) {
    return <p style={{ color: '#6b7280' }}>No template selected for editing.</p>;
  }

  return (
    <div>
      {/* Metadata header */}
      <div style={styles.meta}>
        <span style={styles.metaItem}>
          Last updated: <strong>{formatDate(template.updatedAt)}</strong>
        </span>
        {isDirty && <span style={styles.dirtyBadge}>Unsaved changes</span>}
      </div>

      {/* Delegate to TemplateBuilder with onChange notification */}
      <DirtyTrackingBuilder
        template={template}
        onSave={handleSave}
        onCancel={handleCancel}
        getTokenFn={getTokenFn}
        userTier={userTier}
        onDirtyChange={setIsDirty}
      />
    </div>
  );
}

/**
 * Thin wrapper around TemplateBuilder that intercepts any change and marks
 * the form as dirty so the TemplateEditor can warn on navigation.
 *
 * This is implemented by cloning the children from TemplateBuilder through a
 * context — but since TemplateBuilder doesn't expose an onChange prop, the
 * simplest approach is to set dirty on the first interaction via a wrapper div.
 */
function DirtyTrackingBuilder({ template, onSave, onCancel, getTokenFn, userTier, onDirtyChange }) {
  const handleInteraction = useCallback(() => {
    onDirtyChange(true);
  }, [onDirtyChange]);

  const handleSave = useCallback((saved) => {
    onDirtyChange(false);
    if (onSave) onSave(saved);
  }, [onSave, onDirtyChange]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div onInput={handleInteraction} onChange={handleInteraction}>
      <TemplateBuilder
        template={template}
        onSave={handleSave}
        onCancel={onCancel}
        getTokenFn={getTokenFn}
        userTier={userTier}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  meta:        { display: 'flex', alignItems: 'center', gap: 16, marginBottom: '0.75rem', fontSize: '0.8rem', color: '#6b7280', padding: '0.5rem 0' },
  metaItem:    { display: 'inline-flex', alignItems: 'center', gap: 4 },
  dirtyBadge:  { display: 'inline-block', padding: '2px 10px', background: '#fef3c7', color: '#92400e', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem' },
};
