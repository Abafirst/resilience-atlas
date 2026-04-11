/* =============================================================
   gamification-ui.js
   Resilience Atlas — Gamification Widgets
   Renders streak counter, points total, badge display,
   weekly challenge card, and leaderboard widget.
   All features are opt-in; no data is shown without a valid
   auth token.
   ============================================================= */

'use strict';

// ── Config ────────────────────────────────────────────────────────────────────

const GAMIFICATION_API = '/api/gamification';

// ── Utility helpers ───────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${GAMIFICATION_API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Streak Widget ─────────────────────────────────────────────────────────────

/**
 * Render a streak counter into the given container element.
 *
 * @param {HTMLElement} container
 * @param {object} progress  — GamificationProgress document
 */
function renderStreakWidget(container, progress) {
  const days    = progress.currentStreak?.days ?? 0;
  const longest = progress.longestStreak ?? 0;
  const flame   = days > 0 ? '🔥' : '💤';

  container.innerHTML = `
    <div class="gam-widget gam-streak" role="region" aria-label="Streak counter">
      <div class="gam-streak__icon" aria-hidden="true">${flame}</div>
      <div class="gam-streak__info">
        <span class="gam-streak__count">${escHtml(String(days))}</span>
        <span class="gam-streak__label">day streak</span>
      </div>
      <div class="gam-streak__best">
        Best: <strong>${escHtml(String(longest))}</strong> days
      </div>
    </div>`;
}

// ── Points Widget ─────────────────────────────────────────────────────────────

/**
 * Render total points and a progress bar toward the next reward.
 *
 * @param {HTMLElement} container
 * @param {object} progress
 */
function renderPointsWidget(container, progress) {
  const points    = progress.totalPoints ?? 0;
  const milestones = [25, 50, 100, 200, 500, 1000];
  const nextGoal  = milestones.find(m => m > points) || points + 100;
  const pct       = Math.min(Math.round((points / nextGoal) * 100), 100);

  container.innerHTML = `
    <div class="gam-widget gam-points" role="region" aria-label="Points total">
      <div class="gam-points__header">
        <span class="gam-points__icon" aria-hidden="true">⭐</span>
        <span class="gam-points__total">${escHtml(String(points))} pts</span>
      </div>
      <div class="gam-points__bar-wrap" aria-label="Progress to next reward: ${pct}%">
        <div class="gam-points__bar" style="width:${pct}%" role="progressbar"
             aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <div class="gam-points__goal">${escHtml(String(nextGoal - points))} pts to next reward</div>
    </div>`;
}

// ── Badges Widget ─────────────────────────────────────────────────────────────

/**
 * Render earned badges.
 *
 * @param {HTMLElement} container
 * @param {object} progress
 */
function renderBadgesWidget(container, progress) {
  const badges = progress.badges ?? [];
  if (badges.length === 0) {
    container.innerHTML = `
      <div class="gam-widget gam-badges" role="region" aria-label="Badges">
        <p class="gam-badges__empty">Complete your first practice to earn badges! 🌱</p>
      </div>`;
    return;
  }

  const badgeItems = badges
    .slice(-12)                                   // show latest 12
    .reverse()
    .map(b => `
      <li class="gam-badge gam-badge--${escHtml(b.rarity)}" title="${escHtml(b.name)}">
        <span class="gam-badge__icon" aria-hidden="true">${escHtml(b.icon || '🏅')}</span>
        <span class="gam-badge__name">${escHtml(b.name)}</span>
      </li>`)
    .join('');

  container.innerHTML = `
    <div class="gam-widget gam-badges" role="region" aria-label="Badges (${badges.length} earned)">
      <h3 class="gam-widget__title">Badges <span class="gam-badges__count">${escHtml(String(badges.length))}</span></h3>
      <ul class="gam-badges__list" aria-label="Earned badges">${badgeItems}</ul>
    </div>`;
}

// ── Weekly Challenge Widget ───────────────────────────────────────────────────

/**
 * Render the current weekly challenge card.
 *
 * @param {HTMLElement} container
 * @param {object} progress
 */
function renderChallengeWidget(container, progress) {
  const ch = progress.currentChallenge;

  if (!ch || !ch.dimension) {
    container.innerHTML = `
      <div class="gam-widget gam-challenge" role="region" aria-label="Weekly challenge">
        <h3 class="gam-widget__title">Weekly Challenge</h3>
        <p class="gam-challenge__empty">No active challenge this week.</p>
        <button class="gam-challenge__start btn btn--primary" id="gam-start-challenge">
          Start a Challenge 🎯
        </button>
      </div>`;
    container.querySelector('#gam-start-challenge').addEventListener('click', openChallengeModal);
    return;
  }

  const completed = ch.completedDays ?? 0;
  const total     = 3;
  const pips      = Array.from({ length: total }, (_, i) =>
    `<span class="gam-challenge__pip ${i < completed ? 'gam-challenge__pip--done' : ''}" aria-hidden="true">
      ${i < completed ? '✅' : '⬜'}
    </span>`
  ).join('');

  container.innerHTML = `
    <div class="gam-widget gam-challenge" role="region" aria-label="Weekly challenge: ${escHtml(ch.dimension)}">
      <h3 class="gam-widget__title">Weekly Challenge</h3>
      <div class="gam-challenge__dimension">${escHtml(ch.dimension)}</div>
      <div class="gam-challenge__difficulty gam-challenge__difficulty--${escHtml(ch.difficulty ?? 'medium')}">
        ${escHtml(ch.difficulty ?? 'medium')}
      </div>
      <div class="gam-challenge__progress" aria-label="Progress: ${completed} of ${total} days completed">
        ${pips}
        <span class="gam-challenge__fraction">${completed}/${total}</span>
      </div>
      <div class="gam-challenge__reward">🎁 Reward: +${escHtml(String(ch.reward ?? 10))} pts on completion</div>
    </div>`;
}

// ── Leaderboard Widget ────────────────────────────────────────────────────────

/**
 * Render the opt-in leaderboard.
 *
 * @param {HTMLElement} container
 * @param {Array}  entries
 * @param {string} period
 */
function renderLeaderboardWidget(container, entries, period) {
  if (!entries || entries.length === 0) {
    container.innerHTML = `
      <div class="gam-widget gam-leaderboard" role="region" aria-label="Leaderboard">
        <h3 class="gam-widget__title">Leaderboard</h3>
        <p class="gam-leaderboard__empty">No entries yet. Opt in to appear on the leaderboard.</p>
      </div>`;
    return;
  }

  const rows = entries.map(e => `
    <tr>
      <td class="gam-lb__rank">${escHtml(String(e.rank))}</td>
      <td class="gam-lb__name">${escHtml(e.username)}</td>
      <td class="gam-lb__points">${escHtml(String(e.totalPoints))}</td>
      <td class="gam-lb__streak">${escHtml(String(e.currentStreak))} 🔥</td>
    </tr>`).join('');

  const label = period === 'monthly' ? 'Monthly' : period === 'alltime' ? 'All-Time' : 'Weekly';

  container.innerHTML = `
    <div class="gam-widget gam-leaderboard" role="region" aria-label="${label} leaderboard">
      <h3 class="gam-widget__title">${label} Leaderboard</h3>
      <table class="gam-lb__table" aria-label="Leaderboard standings">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Points</th>
            <th scope="col">Streak</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Challenge modal ───────────────────────────────────────────────────────────

const VALID_DIMENSIONS = [
  'Cognitive-Narrative',
  'Emotional-Adaptive',
  'Relational-Connective',
  'Agentic-Generative',
  'Somatic-Regulative',
  'Spiritual-Reflective',
];

function openChallengeModal() {
  const existing = document.getElementById('gam-challenge-modal');
  if (existing) existing.remove();

  const dimOptions = VALID_DIMENSIONS
    .map(d => `<option value="${escHtml(d)}">${escHtml(d)}</option>`)
    .join('');

  const modal = document.createElement('div');
  modal.id = 'gam-challenge-modal';
  modal.className = 'gam-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Start a weekly challenge');
  modal.innerHTML = `
    <div class="gam-modal__backdrop"></div>
    <div class="gam-modal__box">
      <h2 class="gam-modal__title">Start Weekly Challenge 🎯</h2>
      <label class="gam-modal__label" for="gam-dim-select">Choose a dimension</label>
      <select id="gam-dim-select" class="gam-modal__select">${dimOptions}</select>
      <label class="gam-modal__label" for="gam-diff-select">Difficulty</label>
      <select id="gam-diff-select" class="gam-modal__select">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
      </select>
      <div class="gam-modal__actions">
        <button class="btn btn--primary" id="gam-modal-confirm">Start Challenge</button>
        <button class="btn btn--secondary" id="gam-modal-cancel">Cancel</button>
      </div>
      <p id="gam-modal-error" class="gam-modal__error" aria-live="polite"></p>
    </div>`;

  document.body.appendChild(modal);

  modal.querySelector('#gam-modal-cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('.gam-modal__backdrop').addEventListener('click', () => modal.remove());
  modal.querySelector('#gam-modal-confirm').addEventListener('click', async () => {
    const dimension  = modal.querySelector('#gam-dim-select').value;
    const difficulty = modal.querySelector('#gam-diff-select').value;
    const errEl      = modal.querySelector('#gam-modal-error');

    try {
      await apiFetch('/challenge', {
        method: 'POST',
        body:   JSON.stringify({ dimension, difficulty }),
      });
      modal.remove();
      initGamificationDashboard();      // Refresh all widgets
    } catch (err) {
      errEl.textContent = err.message || 'Failed to set challenge. Please try again.';
    }
  });
}

// ── Toast notification ────────────────────────────────────────────────────────

/**
 * Show a brief toast message (badge unlocked, streak milestone, etc.)
 *
 * @param {string} message
 * @param {'success'|'info'|'warning'} type
 */
function showGamificationToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `gam-toast gam-toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Main init ─────────────────────────────────────────────────────────────────

/**
 * Initialise all gamification widgets on the dashboard.
 * Looks for elements by data-gam-widget attribute.
 *
 * Expected HTML:
 *   <div data-gam-widget="streak"></div>
 *   <div data-gam-widget="points"></div>
 *   <div data-gam-widget="badges"></div>
 *   <div data-gam-widget="challenge"></div>
 *   <div data-gam-widget="leaderboard" data-period="weekly"></div>
 */
async function initGamificationDashboard() {
  const containers = document.querySelectorAll('[data-gam-widget]');
  if (containers.length === 0) return;

  let progress;
  try {
    const data = await apiFetch('/progress');
    progress = data.progress;
  } catch (err) {
    containers.forEach(c => {
      c.innerHTML = `<p class="gam-error">Could not load gamification data.</p>`;
    });
    return;
  }

  containers.forEach(container => {
    const type = container.dataset.gamWidget;
    switch (type) {
      case 'streak':
        renderStreakWidget(container, progress);
        break;
      case 'points':
        renderPointsWidget(container, progress);
        break;
      case 'badges':
        renderBadgesWidget(container, progress);
        break;
      case 'challenge':
        renderChallengeWidget(container, progress);
        break;
      case 'leaderboard': {
        const period = container.dataset.period || 'weekly';
        if (!progress.leaderboardOptIn) {
          container.innerHTML = `
            <div class="gam-widget gam-leaderboard" role="region">
              <h3 class="gam-widget__title">Leaderboard</h3>
              <p>Enable the leaderboard in your preferences to see your ranking.</p>
              <button class="btn btn--secondary" id="gam-lb-optin">Enable Leaderboard</button>
            </div>`;
          container.querySelector('#gam-lb-optin').addEventListener('click', async () => {
            try {
              await apiFetch('/preferences', {
                method: 'PUT',
                body:   JSON.stringify({ leaderboardOptIn: true }),
              });
              initGamificationDashboard();
            } catch (err) {
              showGamificationToast('Could not update preferences.', 'warning');
            }
          });
        } else {
          apiFetch(`/leaderboard?period=${period}`)
            .then(data => renderLeaderboardWidget(container, data.entries, period))
            .catch(() => {
              container.innerHTML = `<p class="gam-error">Could not load leaderboard. Please check your connection and try again.</p>`;
            });
        }
        break;
      }
      default:
        break;
    }
  });
}

// ── Public API (browser global) ───────────────────────────────────────────────

window.GamificationUI = {
  init:                  initGamificationDashboard,
  renderStreakWidget,
  renderPointsWidget,
  renderBadgesWidget,
  renderChallengeWidget,
  renderLeaderboardWidget,
  showGamificationToast,
  recordPractice: async (practiceId, dimension) => {
    const data = await apiFetch('/practice', {
      method: 'POST',
      body:   JSON.stringify({ practiceId, dimension }),
    });
    if (data.newBadges && data.newBadges.length > 0) {
      data.newBadges.forEach(name => showGamificationToast(`🏅 Badge unlocked: ${name}`, 'success'));
    }
    if (data.streakUpdated) {
      showGamificationToast(`🔥 ${data.currentStreak}-day streak!`, 'info');
    }
    return data;
  },
};

// Auto-init if the DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGamificationDashboard);
} else {
  initGamificationDashboard();
}
