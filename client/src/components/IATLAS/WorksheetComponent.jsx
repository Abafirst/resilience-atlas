/**
 * WorksheetComponent.jsx
 * Renders interactive fillable worksheets for IATLAS skill modules.
 * Responses are saved to localStorage keyed by skillId.
 */

import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'iatlas_worksheet_';

function getStorageKey(skillId) {
  return STORAGE_KEY_PREFIX + skillId;
}

function loadSavedResponses(skillId) {
  try {
    const raw = localStorage.getItem(getStorageKey(skillId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResponses(skillId, responses) {
  try {
    localStorage.setItem(getStorageKey(skillId), JSON.stringify(responses));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

const WORKSHEET_STYLES = `
  .ws-root {
    font-family: inherit;
  }

  .ws-saved-banner {
    display: flex;
    align-items: center;
    gap: .5rem;
    background: #d1fae5;
    color: #065f46;
    border-radius: 8px;
    padding: .5rem .9rem;
    font-size: .82rem;
    font-weight: 600;
    margin-bottom: 1rem;
    opacity: 1;
    transition: opacity .4s;
  }

  .ws-saved-banner.ws-fade {
    opacity: 0;
  }

  .ws-field {
    margin-bottom: 1.25rem;
  }

  .ws-label {
    display: block;
    font-size: .875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: .4rem;
  }

  .dark-mode .ws-label {
    color: #d1d5db;
  }

  .ws-input,
  .ws-textarea {
    width: 100%;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    padding: .6rem .8rem;
    font-size: .9rem;
    color: #1f2937;
    background: #ffffff;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
    font-family: inherit;
    resize: vertical;
    line-height: 1.5;
  }

  .dark-mode .ws-input,
  .dark-mode .ws-textarea {
    background: #1e293b;
    color: #f1f5f9;
    border-color: #334155;
  }

  .ws-input:focus,
  .ws-textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.15);
  }

  .dark-mode .ws-input:focus,
  .dark-mode .ws-textarea:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129,140,248,.15);
  }

  .ws-textarea {
    min-height: 90px;
  }

  .ws-actions {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }

  .ws-btn-save {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: .6rem 1.2rem;
    font-size: .875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s;
  }

  .ws-btn-save:hover {
    background: #4338ca;
  }

  .ws-btn-clear {
    background: transparent;
    color: #6b7280;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    padding: .6rem 1.2rem;
    font-size: .875rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color .15s, color .15s;
  }

  .ws-btn-clear:hover {
    border-color: #9ca3af;
    color: #374151;
  }

  .dark-mode .ws-btn-clear {
    border-color: #475569;
    color: #94a3b8;
  }

  .ws-suggestions {
    margin-bottom: 1rem;
  }

  .ws-suggestions-label {
    font-size: .8rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: .5rem;
  }

  .ws-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
  }

  .ws-chip {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 100px;
    padding: .2rem .6rem;
    font-size: .78rem;
    font-weight: 500;
    cursor: default;
    user-select: none;
  }

  .dark-mode .ws-chip {
    background: #1e293b;
    color: #94a3b8;
    border-color: #334155;
  }
`;

export default function WorksheetComponent({ skillId, fields, valueSuggestions }) {
  const [responses, setResponses] = useState(() => loadSavedResponses(skillId));
  const [showSaved, setShowSaved] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const fadeTimer = React.useRef(null);

  // Reload if skillId changes (e.g., navigating between skills)
  useEffect(() => {
    setResponses(loadSavedResponses(skillId));
  }, [skillId]);

  const handleChange = useCallback((fieldId, value) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = useCallback(() => {
    saveResponses(skillId, responses);
    setShowSaved(true);
    setFadeOut(false);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShowSaved(false), 400);
    }, 2000);
  }, [skillId, responses]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear all responses for this worksheet? This cannot be undone.')) {
      setResponses({});
      saveResponses(skillId, {});
    }
  }, [skillId]);

  if (!fields || fields.length === 0) return null;

  return (
    <div className="ws-root">
      <style dangerouslySetInnerHTML={{ __html: WORKSHEET_STYLES }} />

      {showSaved && (
        <div className={`ws-saved-banner${fadeOut ? ' ws-fade' : ''}`} role="status" aria-live="polite">
          ✓ Responses saved
        </div>
      )}

      {valueSuggestions && valueSuggestions.length > 0 && (
        <div className="ws-suggestions">
          <div className="ws-suggestions-label">Example values to consider:</div>
          <div className="ws-chip-list">
            {valueSuggestions.map(v => (
              <span key={v} className="ws-chip">{v}</span>
            ))}
          </div>
        </div>
      )}

      {fields.map(field => (
        <div key={field.id} className="ws-field">
          <label className="ws-label" htmlFor={`ws-${skillId}-${field.id}`}>
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={`ws-${skillId}-${field.id}`}
              className="ws-textarea"
              placeholder={field.placeholder || ''}
              value={responses[field.id] || ''}
              onChange={e => handleChange(field.id, e.target.value)}
              rows={4}
            />
          ) : (
            <input
              id={`ws-${skillId}-${field.id}`}
              type="text"
              className="ws-input"
              placeholder={field.placeholder || ''}
              value={responses[field.id] || ''}
              onChange={e => handleChange(field.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className="ws-actions">
        <button type="button" className="ws-btn-save" onClick={handleSave}>
          Save Responses
        </button>
        <button type="button" className="ws-btn-clear" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
