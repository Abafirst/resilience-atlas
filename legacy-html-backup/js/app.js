/* =====================================================
   app.js — Global utilities for Resilience Assessment
   ===================================================== */

'use strict';

// ── API helpers ────────────────────────────────────────
const API = {
  /**
   * POST JSON to an endpoint and return the parsed response.
   * Throws an Error (with .message) on HTTP errors.
   */
  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const msg = data.error || data.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  },
};

// ── Loading spinner ────────────────────────────────────
const Spinner = {
  show(text = 'Processing…') {
    const overlay = document.getElementById('spinnerOverlay');
    const label   = document.getElementById('spinnerText');
    if (!overlay) return;
    if (label) label.textContent = text;
    overlay.classList.add('active');
  },
  hide() {
    const overlay = document.getElementById('spinnerOverlay');
    if (overlay) overlay.classList.remove('active');
  },
};

// ── Alert messages ─────────────────────────────────────
const Alert = {
  show(el, message, type = 'error') {
    if (!el) return;
    el.textContent = message;
    el.className = `alert alert-${type} visible`;
  },
  hide(el) {
    if (!el) return;
    el.className = 'alert';
  },
};

// ── Button loading state ───────────────────────────────
const BtnState = {
  loading(btn, label = '') {
    if (!btn) return;
    if (label) btn.setAttribute('data-original-label', btn.querySelector('.btn-label')?.textContent || '');
    btn.classList.add('loading');
    btn.disabled = true;
  },
  reset(btn) {
    if (!btn) return;
    btn.classList.remove('loading');
    btn.disabled = false;
    const lbl = btn.querySelector('.btn-label');
    if (lbl && btn.dataset.originalLabel) lbl.textContent = btn.dataset.originalLabel;
  },
};

// ── localStorage helpers ───────────────────────────────
const Store = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable */ }
  },
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

// ── Email validation ───────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Expose globals
window.API      = API;
window.Spinner  = Spinner;
window.Alert    = Alert;
window.BtnState = BtnState;
window.Store    = Store;
window.isValidEmail = isValidEmail;
