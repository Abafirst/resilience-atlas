'use strict';

/**
 * team-plan-builder.js — Team action plan UI for the Teams tier dashboard.
 *
 * Features:
 *  - Create action plan items per dimension
 *  - Mark items as in-progress or completed
 *  - Delete items
 *  - Persist to backend via /api/orgs-advanced/:id/settings/action-plan
 *
 * Depends on: teams-enhanced.css, auth token in localStorage
 * Exposed as window.TeamPlanBuilder
 */
(function (window) {

  const TOKEN_KEY = 'resilience_auth_token';
  const ORG_KEY   = 'resilience_org_id';

  const DIMENSIONS = [
    { key: 'relational', label: 'Relational-Connective' },
    { key: 'cognitive',  label: 'Cognitive-Narrative' },
    { key: 'somatic',    label: 'Somatic-Regulative' },
    { key: 'emotional',  label: 'Emotional-Adaptive' },
    { key: 'spiritual',  label: 'Spiritual-Reflective' },
    { key: 'agentic',    label: 'Agentic-Generative' },
  ];

  let _orgId     = null;
  let _plans     = [];
  let _container = null;
  let _modal     = null;

  // ── Bootstrap ─────────────────────────────────────────────────────────────────

  function init(containerId, orgId) {
    _orgId     = orgId || localStorage.getItem(ORG_KEY);
    _container = document.getElementById(containerId);

    if (!_container) {
      console.warn('[TeamPlanBuilder] Container not found:', containerId);
      return;
    }

    _renderShell();
    loadPlans();
  }

  // ── API Helpers ───────────────────────────────────────────────────────────────

  function authHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type':  'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function apiCall(method, path, body) {
    const res = await fetch(`/api/orgs-advanced/${_orgId}${path}`, {
      method,
      headers:  authHeaders(),
      body:     body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Load & Render Plans ───────────────────────────────────────────────────────

  async function loadPlans() {
    if (!_orgId) {
      _renderEmpty('No organization linked. Please log in.');
      return;
    }

    _renderLoading();

    try {
      const data = await apiCall('GET', '/settings');
      _plans = (data.settings && data.settings.actionPlans) || [];
      _renderPlans();
    } catch (err) {
      console.warn('[TeamPlanBuilder] Load failed:', err.message);
      _renderEmpty(`Could not load plans: ${err.message}`);
    }
  }

  function _renderLoading() {
    if (!_container) return;
    _container.innerHTML = `
      <div class="teams-loading">
        <div class="teams-spinner"></div>
        <span>Loading action plans…</span>
      </div>
    `;
  }

  function _renderEmpty(msg) {
    if (!_container) return;
    _container.innerHTML = `
      <div class="teams-empty">
        <div class="teams-empty__icon">📋</div>
        <div class="teams-empty__title">No action plans yet</div>
        <p class="text-sm text-muted">${escHtml(msg || 'Add your first goal using the button above.')}</p>
      </div>
    `;
  }

  function _renderShell() {
    if (!_container) return;
    _container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="teams-card__title" style="margin:0">Team Action Plans</h3>
        <button class="btn btn--primary btn--sm" id="tpb-add-btn" type="button">
          + Add Goal
        </button>
      </div>
      <div id="tpb-list-wrap"></div>
      <div id="tpb-modal-wrap"></div>
    `;

    document.getElementById('tpb-add-btn').addEventListener('click', () => openModal(null));
  }

  function _renderPlans() {
    const wrap = document.getElementById('tpb-list-wrap');
    if (!wrap) return;

    if (_plans.length === 0) {
      wrap.innerHTML = `
        <div class="teams-empty">
          <div class="teams-empty__icon">📋</div>
          <div class="teams-empty__title">No action plans yet</div>
          <p class="text-sm text-muted">Click "Add Goal" to create your first team objective.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <ul class="plan-list" role="list">
        ${_plans.map(_renderPlanItem).join('')}
      </ul>
    `;

    // Bind status toggle and delete buttons
    _plans.forEach((plan) => {
      const statusBtn = document.getElementById(`tpb-status-${plan._id}`);
      if (statusBtn) {
        statusBtn.addEventListener('click', () => cycleStatus(plan._id, plan.status));
      }

      const editBtn = document.getElementById(`tpb-edit-${plan._id}`);
      if (editBtn) {
        editBtn.addEventListener('click', () => openModal(plan));
      }

      const delBtn = document.getElementById(`tpb-del-${plan._id}`);
      if (delBtn) {
        delBtn.addEventListener('click', () => deletePlan(plan._id));
      }
    });
  }

  function _renderPlanItem(plan) {
    const statusClass = plan.status === 'completed'
      ? 'plan-item__status--completed'
      : plan.status === 'in_progress'
      ? 'plan-item__status--in_progress'
      : '';

    const statusIcon = plan.status === 'completed' ? '✓'
      : plan.status === 'in_progress' ? '●' : '';

    const dim = DIMENSIONS.find((d) => d.key === plan.dimension);
    const dimLabel = dim ? dim.label : plan.dimension;

    const targetText = plan.targetDate
      ? `Target: ${new Date(plan.targetDate).toLocaleDateString()}`
      : '';

    return `
      <li class="plan-item" role="listitem">
        <button 
          class="plan-item__status ${statusClass}"
          id="tpb-status-${escAttr(plan._id)}"
          title="Cycle status"
          aria-label="Status: ${escAttr(plan.status)}. Click to change."
          type="button"
        >${statusIcon}</button>
        <div class="plan-item__body">
          <div class="plan-item__dim">${escHtml(dimLabel)}</div>
          <div class="plan-item__goal">${escHtml(plan.goal)}</div>
          <div class="plan-item__meta">
            ${plan.owner ? `<span>Owner: ${escHtml(plan.owner)}</span>` : ''}
            ${targetText ? `<span>${escHtml(targetText)}</span>` : ''}
            <span class="text-sm" style="text-transform:capitalize">${escHtml(plan.status.replace('_', ' '))}</span>
          </div>
        </div>
        <div class="plan-item__actions">
          <button class="btn btn--ghost btn--sm" id="tpb-edit-${escAttr(plan._id)}" type="button" aria-label="Edit goal">✎</button>
          <button class="btn btn--danger btn--sm" id="tpb-del-${escAttr(plan._id)}" type="button" aria-label="Delete goal">✕</button>
        </div>
      </li>
    `;
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────

  function openModal(plan) {
    const isEdit = !!plan;
    const wrap   = document.getElementById('tpb-modal-wrap');
    if (!wrap) return;

    const dimOptions = DIMENSIONS.map((d) =>
      `<option value="${escAttr(d.key)}" ${plan && plan.dimension === d.key ? 'selected' : ''}>
        ${escHtml(d.label)}
       </option>`
    ).join('');

    const statusOptions = ['not_started', 'in_progress', 'completed'].map((s) =>
      `<option value="${escAttr(s)}" ${plan && plan.status === s ? 'selected' : ''}>
        ${s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
       </option>`
    ).join('');

    wrap.innerHTML = `
      <div class="teams-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tpb-modal-title" id="tpb-modal">
        <div class="teams-modal">
          <div class="teams-modal__header">
            <h3 class="teams-modal__title" id="tpb-modal-title">${isEdit ? 'Edit' : 'Add'} Action Plan Goal</h3>
            <button class="teams-modal__close" id="tpb-modal-close" type="button" aria-label="Close">✕</button>
          </div>
          <form id="tpb-modal-form">
            <div class="teams-form-row">
              <div class="teams-form-group">
                <label for="tpb-dim">Dimension</label>
                <select id="tpb-dim" required>${dimOptions}</select>
              </div>
              <div class="teams-form-group">
                <label for="tpb-status">Status</label>
                <select id="tpb-status">${statusOptions}</select>
              </div>
            </div>
            <div class="teams-form-group" style="margin-bottom:1rem">
              <label for="tpb-goal">Goal *</label>
              <textarea id="tpb-goal" rows="3" required placeholder="Describe the team goal for this dimension…">${escHtml((plan && plan.goal) || '')}</textarea>
            </div>
            <div class="teams-form-row">
              <div class="teams-form-group">
                <label for="tpb-owner">Owner</label>
                <input type="text" id="tpb-owner" placeholder="Name or role" value="${escAttr((plan && plan.owner) || '')}">
              </div>
              <div class="teams-form-group">
                <label for="tpb-target">Target Date</label>
                <input type="date" id="tpb-target" value="${plan && plan.targetDate ? new Date(plan.targetDate).toISOString().split('T')[0] : ''}">
              </div>
            </div>
            <div class="teams-form-group">
              <label for="tpb-notes">Notes</label>
              <textarea id="tpb-notes" rows="2" placeholder="Additional context or notes…">${escHtml((plan && plan.notes) || '')}</textarea>
            </div>
            <div id="tpb-modal-err" class="text-danger text-sm" style="min-height:1.25rem;margin-top:0.5rem"></div>
          </form>
          <div class="teams-modal__footer">
            <button class="btn btn--ghost" id="tpb-modal-cancel" type="button">Cancel</button>
            <button class="btn btn--primary" id="tpb-modal-save" type="button">
              ${isEdit ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('tpb-modal-close').addEventListener('click', closeModal);
    document.getElementById('tpb-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('tpb-modal-save').addEventListener('click', () => savePlan(plan));

    // Close on backdrop click
    document.getElementById('tpb-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // Focus first field
    setTimeout(() => {
      const el = document.getElementById('tpb-dim');
      if (el) el.focus();
    }, 50);
  }

  function closeModal() {
    const wrap = document.getElementById('tpb-modal-wrap');
    if (wrap) wrap.innerHTML = '';
  }

  async function savePlan(existingPlan) {
    const errEl = document.getElementById('tpb-modal-err');
    const saveBtn = document.getElementById('tpb-modal-save');

    const body = {
      dimension:  document.getElementById('tpb-dim').value,
      goal:       document.getElementById('tpb-goal').value.trim(),
      owner:      document.getElementById('tpb-owner').value.trim(),
      targetDate: document.getElementById('tpb-target').value || null,
      notes:      document.getElementById('tpb-notes').value.trim(),
      status:     document.getElementById('tpb-status').value,
    };

    if (!body.goal) {
      if (errEl) errEl.textContent = 'Goal is required.';
      return;
    }

    if (saveBtn) saveBtn.disabled = true;

    try {
      if (existingPlan) {
        await apiCall('PUT', `/settings/action-plan/${existingPlan._id}`, body);
      } else {
        await apiCall('POST', '/settings/action-plan', body);
      }
      closeModal();
      await loadPlans();
    } catch (err) {
      if (errEl) errEl.textContent = err.message;
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  // ── Status Cycling ────────────────────────────────────────────────────────────

  async function cycleStatus(planId, currentStatus) {
    const nextStatus = {
      not_started:  'in_progress',
      in_progress:  'completed',
      completed:    'not_started',
    }[currentStatus] || 'not_started';

    try {
      await apiCall('PUT', `/settings/action-plan/${planId}`, { status: nextStatus });
      await loadPlans();
    } catch (err) {
      console.warn('[TeamPlanBuilder] Status update failed:', err.message);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async function deletePlan(planId) {
    if (!window.confirm('Remove this action plan goal?')) return;

    try {
      await apiCall('DELETE', `/settings/action-plan/${planId}`);
      await loadPlans();
    } catch (err) {
      console.warn('[TeamPlanBuilder] Delete failed:', err.message);
      window.alert('Failed to delete: ' + err.message);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  window.TeamPlanBuilder = {
    init,
    loadPlans,
  };

})(window);
