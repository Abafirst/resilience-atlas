'use strict';

/**
 * pdf-progress.js — Real-time progress modal for async PDF report generation.
 *
 * Usage:
 *   PdfProgress.start({ overall, dominantType, scores, email })
 *     .then(hash => { /* PDF is ready, download triggered automatically * / })
 *     .catch(err => { /* user cancelled or timeout * / });
 *
 * The modal injects its own HTML/CSS the first time it is shown, so no
 * extra markup is required in the page.
 */

(function (global) {
  // ── Constants ───────────────────────────────────────────────────────────────

  var POLL_INTERVAL_MS = 500;        // Start polling every 500 ms
  var MAX_BACKOFF_MS   = 5000;       // Cap exponential backoff at 5 s
  var TIMEOUT_MS       = 5 * 60 * 1000; // Abort after 5 minutes

  // ── State ───────────────────────────────────────────────────────────────────

  var _resolve   = null;
  var _reject    = null;
  var _pollTimer = null;
  var _startTime = null;
  var _hash      = null;
  var _backoff   = POLL_INTERVAL_MS;
  var _cancelled = false;

  // ── Auth helper ─────────────────────────────────────────────────────────────

  function _getAuth0Token() {
    try {
      var raw = typeof localStorage !== 'undefined' && localStorage.getItem('@@auth0spajs@@');
      if (!raw) return '';
      var parsed = JSON.parse(raw);
      var firstKey = Object.keys(parsed)[0];
      if (!firstKey) return '';
      return (parsed[firstKey][0] && parsed[firstKey][0].body && parsed[firstKey][0].body.access_token) || '';
    } catch (e) {
      return '';
    }
  }

  function _getAuthHeaders() {
    var token = _getAuth0Token();
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  // Inject modal HTML + CSS once.
  function ensureModal() {
    if ($('pdfProgressModal')) return;

    var style = document.createElement('style');
    style.textContent = [
      '.pdf-modal-backdrop {',
      '  position: fixed; inset: 0; background: rgba(0,0,0,.55);',
      '  display: flex; align-items: center; justify-content: center;',
      '  z-index: 9999; opacity: 0; transition: opacity .25s;',
      '}',
      '.pdf-modal-backdrop.visible { opacity: 1; }',
      '.pdf-modal {',
      '  background: #fff; border-radius: 16px; padding: 2rem 2.25rem;',
      '  max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,.25);',
      '  text-align: center;',
      '}',
      '.pdf-modal h2 { margin: 0 0 .5rem; font-size: 1.25rem; color: #1e293b; }',
      '.pdf-modal .pdf-modal-msg { color: #475569; margin: 0 0 1.25rem; font-size: .95rem; min-height: 1.4em; }',
      '.pdf-progress-track {',
      '  background: #e2e8f0; border-radius: 999px; height: 10px; overflow: hidden; margin-bottom: .5rem;',
      '}',
      '.pdf-progress-fill {',
      '  height: 100%; border-radius: 999px;',
      '  background: linear-gradient(90deg, #6366f1, #8b5cf6);',
      '  width: 0%; transition: width .4s ease;',
      '}',
      '.pdf-progress-pct { font-size: .8rem; color: #64748b; margin-bottom: 1.25rem; }',
      '.pdf-eta { font-size: .8rem; color: #94a3b8; margin-bottom: 1.5rem; }',
      '.pdf-modal-actions { display: flex; gap: .75rem; justify-content: center; }',
      '.pdf-modal-actions button {',
      '  padding: .5rem 1.25rem; border-radius: 8px; border: none; cursor: pointer;',
      '  font-size: .9rem; font-weight: 600; transition: opacity .15s;',
      '}',
      '.pdf-modal-actions button:hover { opacity: .85; }',
      '.btn-pdf-cancel { background: #f1f5f9; color: #475569; }',
      '.btn-pdf-retry  { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }',
      '.pdf-modal.success .pdf-modal-icon { font-size: 2.5rem; margin-bottom: .5rem; }',
      '.pdf-modal.error  .pdf-modal-icon { font-size: 2.5rem; margin-bottom: .5rem; }',
    ].join('\n');
    document.head.appendChild(style);

    var backdrop = document.createElement('div');
    backdrop.id = 'pdfProgressModal';
    backdrop.className = 'pdf-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'pdfModalTitle');
    backdrop.innerHTML = [
      '<div class="pdf-modal" id="pdfModalBox">',
      '  <div class="pdf-modal-icon" id="pdfModalIcon" aria-hidden="true"></div>',
      '  <h2 id="pdfModalTitle">Generating Your Report</h2>',
      '  <p class="pdf-modal-msg" id="pdfModalMsg" aria-live="polite">Preparing…</p>',
      '  <div class="pdf-progress-track"><div class="pdf-progress-fill" id="pdfProgressFill"></div></div>',
      '  <p class="pdf-progress-pct" id="pdfProgressPct" aria-live="polite">0%</p>',
      '  <p class="pdf-eta" id="pdfEta" aria-live="polite"></p>',
      '  <div class="pdf-modal-actions">',
      '    <button class="btn-pdf-cancel" id="btnPdfCancel" type="button">Cancel</button>',
      '    <button class="btn-pdf-retry"  id="btnPdfRetry"  type="button" style="display:none">Retry</button>',
      '  </div>',
      '</div>',
    ].join('');
    document.body.appendChild(backdrop);

    $('btnPdfCancel').addEventListener('click', _cancel);
    $('btnPdfRetry').addEventListener('click', _retryHandler);
  }

  // ── Modal UI helpers ─────────────────────────────────────────────────────────

  function showModal() {
    ensureModal();
    var el = $('pdfProgressModal');
    el.style.display = 'flex';
    // Force reflow for transition.
    void el.offsetWidth; // eslint-disable-line no-void
    el.classList.add('visible');
  }

  function hideModal() {
    var el = $('pdfProgressModal');
    if (!el) return;
    el.classList.remove('visible');
    setTimeout(function () { el.style.display = 'none'; }, 280);
  }

  function setProgress(pct, msg, eta) {
    var fill = $('pdfProgressFill');
    var pctEl = $('pdfProgressPct');
    var msgEl = $('pdfModalMsg');
    var etaEl = $('pdfEta');
    if (fill)  fill.style.width = Math.min(pct, 100) + '%';
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (msgEl) msgEl.textContent = msg || '';
    if (etaEl) {
      etaEl.textContent = (eta && eta > 0)
        ? 'Est. ' + eta + 's remaining'
        : '';
    }
  }

  function showError(msg) {
    var box  = $('pdfModalBox');
    var icon = $('pdfModalIcon');
    var title = $('pdfModalTitle');
    if (box)   box.classList.add('error');
    if (icon)  icon.textContent = '⚠️';
    if (title) title.textContent = 'Generation Failed';
    setProgress(0, msg || 'Something went wrong. Please try again.', 0);
    var cancel = $('btnPdfCancel');
    var retry  = $('btnPdfRetry');
    if (cancel) cancel.textContent = 'Close';
    if (retry)  retry.style.display = 'inline-block';
  }

  function showSuccess() {
    var box   = $('pdfModalBox');
    var icon  = $('pdfModalIcon');
    var title = $('pdfModalTitle');
    var eta   = $('pdfEta');
    if (box)   box.classList.add('success');
    if (icon)  icon.textContent = '✅';
    if (title) title.textContent = 'Report Ready!';
    setProgress(100, 'Your PDF is downloading…', 0);
    if (eta)   eta.textContent = '';
    var cancel = $('btnPdfCancel');
    var retry  = $('btnPdfRetry');
    if (cancel) cancel.style.display = 'none';
    if (retry)  retry.style.display  = 'none';
  }

  function resetModal() {
    var box   = $('pdfModalBox');
    var icon  = $('pdfModalIcon');
    var title = $('pdfModalTitle');
    var cancel = $('btnPdfCancel');
    var retry  = $('btnPdfRetry');
    if (box) {
      box.classList.remove('error', 'success');
    }
    if (icon)  icon.textContent = '';
    if (title) title.textContent = 'Generating Your Report';
    if (cancel) { cancel.textContent = 'Cancel'; cancel.style.display = 'inline-block'; }
    if (retry)  retry.style.display = 'none';
    setProgress(0, 'Preparing…', null);
  }

  // ── Polling ──────────────────────────────────────────────────────────────────

  function _poll(hash, params) {
    if (_cancelled) return;

    var elapsed = Date.now() - _startTime;
    if (elapsed > TIMEOUT_MS) {
      _cleanup();
      showError('Report generation timed out after 5 minutes. Please try again.');
      if (_reject) _reject(new Error('Timeout'));
      return;
    }

    fetch('/api/report/status?hash=' + encodeURIComponent(hash), { headers: _getAuthHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (_cancelled) return;

        if (!data || !data.status) {
          _scheduleNextPoll(hash, params);
          return;
        }

        setProgress(data.progress || 0, data.message, data.estimatedSeconds);

        if (data.status === 'ready') {
          showSuccess();
          _cleanup();
          // Trigger the PDF download.
          _downloadPdf(hash);
          // Auto-close modal after a brief moment.
          setTimeout(function () {
            hideModal();
            if (_resolve) _resolve(hash);
          }, 1800);
          return;
        }

        if (data.status === 'failed') {
          _cleanup();
          showError(data.error || 'Report generation failed.');
          if (_reject) _reject(new Error(data.error || 'failed'));
          return;
        }

        // Still pending or processing — keep polling with backoff.
        _scheduleNextPoll(hash, params);
      })
      .catch(function () {
        if (!_cancelled) _scheduleNextPoll(hash, params);
      });
  }

  function _scheduleNextPoll(hash, params) {
    _pollTimer = setTimeout(function () {
      _poll(hash, params);
    }, _backoff);
    // Exponential backoff capped at MAX_BACKOFF_MS.
    _backoff = Math.min(_backoff * 1.4, MAX_BACKOFF_MS);
  }

  // ── PDF download trigger ─────────────────────────────────────────────────────

  function _downloadPdf(hash) {
    var headers = _getAuthHeaders();
    var email = _lastParams && _lastParams.email ? String(_lastParams.email).trim() : '';
    var dlUrl = '/api/report/download?hash=' + encodeURIComponent(hash) +
      (email ? '&email=' + encodeURIComponent(email) : '');
    fetch(dlUrl, { headers: headers })
      .then(function (r) {
        if (!r.ok) throw new Error('Download failed (' + r.status + ')');
        return r.blob();
      })
      .then(function (blob) {
        var url  = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href     = url;
        link.download = 'resilience-atlas-report.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      })
      .catch(function (err) {
        showError(err.message || 'Failed to download report.');
      });
  }

  // ── Control ──────────────────────────────────────────────────────────────────

  function _cleanup() {
    if (_pollTimer) {
      clearTimeout(_pollTimer);
      _pollTimer = null;
    }
  }

  function _cancel() {
    _cancelled = true;
    _cleanup();
    hideModal();
    if (_reject) _reject(new Error('cancelled'));
  }

  // Stored params so retry can re-use them.
  var _lastParams = null;

  function _retryHandler() {
    if (_lastParams) {
      PdfProgress.start(_lastParams).catch(function () {});
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  var PdfProgress = {
    /**
     * Start async PDF generation and show the progress modal.
     *
     * @param {{overall: string|number, dominantType: string, scores: string, email: string}} params
     * @returns {Promise<string>} Resolves with hash when PDF is ready and downloaded.
     */
    start: function (params) {
      _lastParams = params;
      _cancelled  = false;
      _backoff    = POLL_INTERVAL_MS;
      _startTime  = Date.now();
      _resolve    = null;
      _reject     = null;

      resetModal();
      showModal();

      var p = new Promise(function (resolve, reject) {
        _resolve = resolve;
        _reject  = reject;
      });

      // Build the generate URL.
      var url = '/api/report/generate'
        + '?overall='      + encodeURIComponent(params.overall || '')
        + '&dominantType=' + encodeURIComponent(params.dominantType || '')
        + '&scores='       + encodeURIComponent(params.scores || '')
        + (params.email ? '&email=' + encodeURIComponent(params.email) : '');

      setProgress(0, 'Starting report generation…', null);

      fetch(url, { headers: _getAuthHeaders() })
        .then(function (r) {
          if (r.status === 402) {
            return r.json().then(function (body) {
              throw Object.assign(new Error(body.error || 'Upgrade required'), { upgradeRequired: true });
            });
          }
          if (!r.ok) {
            return r.json().then(function (body) {
              throw new Error(body.error || 'Failed to start generation');
            });
          }
          return r.json();
        })
        .then(function (data) {
          if (_cancelled) return;
          _hash = data.hash;
          setProgress(5, 'Report queued…', data.estimatedSeconds);
          _poll(data.hash, params);
        })
        .catch(function (err) {
          if (err.upgradeRequired) {
            hideModal();
            if (_reject) _reject(err);
          } else {
            showError(err.message);
            if (_reject) _reject(err);
          }
        });

      return p;
    },
  };

  global.PdfProgress = PdfProgress;
})(typeof window !== 'undefined' ? window : global);
