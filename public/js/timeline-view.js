/* public/js/timeline-view.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive timeline renderer for the Assessment History page.
 *
 * Exported as a plain IIFE so it works without a bundler.
 * Depends on: nothing (vanilla JS, no external libs).
 * Used by: public/atlas.html
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function (global) {
    'use strict';

    // ── Constants ─────────────────────────────────────────────────────────────

    var DIMS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];

    var MILESTONE_ICONS = {
        first_assessment:          '🏅',
        '3_month_streak':          '🔥',
        '100pt_improvement':       '💯',
        consistent_high_performer: '⭐',
    };

    var LEVEL_COLOURS = {
        high:   '#27ae60',
        medium: '#f39c12',
        low:    '#e74c3c',
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    function formatDate(dateStr) {
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDateTime(dateStr) {
        var d = new Date(dateStr);
        return d.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    function scoreLevel(score) {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    function levelColour(score) {
        return LEVEL_COLOURS[scoreLevel(score)] || '#4a9eca';
    }

    function growthArrow(delta) {
        if (delta > 0)  return '<span class="growth-arrow up"   aria-label="improved">▲ +' + delta + '</span>';
        if (delta < 0)  return '<span class="growth-arrow down" aria-label="declined">▼ ' + delta + '</span>';
        return '<span class="growth-arrow stable" aria-label="stable">— 0</span>';
    }

    function milestoneIcon(type) {
        if (MILESTONE_ICONS[type]) return MILESTONE_ICONS[type];
        if (type.startsWith('perfect_')) return '🎯';
        return '🏆';
    }

    function milestoneTitle(type) {
        var map = {
            first_assessment:          'First Assessment',
            '3_month_streak':          '3 Month Streak',
            '100pt_improvement':       '100 Point Improvement',
            consistent_high_performer: 'Consistent High Performer',
        };
        if (map[type]) return map[type];
        if (type.startsWith('perfect_')) {
            return 'Perfect Score — ' + capitalize(type.replace('perfect_', ''));
        }
        return type;
    }

    // ── Milestone badges ──────────────────────────────────────────────────────

    function renderMilestoneBadges(container, milestones) {
        if (!container) return;
        if (!milestones || milestones.length === 0) {
            container.innerHTML = '';
            return;
        }
        var html = '<div class="milestone-badges" role="list" aria-label="Milestones">';
        milestones.forEach(function (m) {
            var type  = (typeof m === 'string') ? m : m.type;
            var title = (typeof m === 'object' && m.title) ? m.title : milestoneTitle(type);
            html += '<span class="milestone-badge" role="listitem" title="' + title + '">'
                  + milestoneIcon(type) + ' ' + title
                  + '</span>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // ── Growth narrative ──────────────────────────────────────────────────────

    function renderNarrative(container, narrativeLines) {
        if (!container) return;
        if (!narrativeLines || narrativeLines.length === 0) {
            container.hidden = true;
            return;
        }
        var html = '<ul class="narrative-list">';
        narrativeLines.forEach(function (line) {
            html += '<li>' + escapeHtml(line) + '</li>';
        });
        html += '</ul>';
        container.innerHTML = html;
        container.hidden = false;
    }

    // ── Timeline card list ────────────────────────────────────────────────────

    /**
     * Render the vertical timeline list.
     *
     * @param {HTMLElement}  container    - <ul> element
     * @param {object[]}     assessments  - newest-first array
     * @param {Function}     onSelect     - called with (assessment, idx, all)
     */
    function renderTimeline(container, assessments, onSelect) {
        if (!container) return;
        container.innerHTML = '';

        if (!assessments || assessments.length === 0) return;

        assessments.forEach(function (a, idx) {
            var prev  = assessments[idx + 1] || null;
            var delta = prev ? (a.overall - prev.overall) : null;
            var isFirst = idx === assessments.length - 1;
            var colour  = levelColour(a.overall);

            var li = document.createElement('li');
            li.className = 'tl-item';
            li.setAttribute('tabindex', '0');
            li.setAttribute('role', 'button');
            li.setAttribute('aria-label', 'Assessment ' + formatDate(a.assessmentDate));
            li.dataset.id = a._id || String(idx);

            // Top-3 dimension names by score
            var top3 = DIMS
                .map(function (d) { return { dim: d, val: (a.scores && a.scores[d]) || 0 }; })
                .sort(function (x, y) { return y.val - x.val; })
                .slice(0, 3)
                .map(function (x) { return capitalize(x.dim); });

            var milestoneHtml = '';
            if (isFirst) {
                milestoneHtml = '<span class="tl-badge first-badge" title="First Assessment">🏅 First</span>';
            }

            li.innerHTML =
                '<div class="tl-dot" style="background:' + colour + ';" aria-hidden="true"></div>'
              + '<div class="tl-body">'
              +   '<div class="tl-header">'
              +     '<span class="tl-score" style="color:' + colour + ';">' + a.overall + '%</span>'
              +     (delta !== null ? growthArrow(delta) : '')
              +     milestoneHtml
              +   '</div>'
              +   '<div class="tl-type">' + escapeHtml(capitalize(a.dominantType)) + '</div>'
              +   '<div class="tl-date">' + formatDateTime(a.assessmentDate) + '</div>'
              +   '<div class="tl-top3">Top: ' + top3.map(escapeHtml).join(', ') + '</div>'
              + '</div>';

            function select() { if (onSelect) onSelect(a, idx, assessments); }
            li.addEventListener('click', select);
            li.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
            });

            container.appendChild(li);
        });
    }

    // ── Assessment detail card ────────────────────────────────────────────────

    /**
     * Render the detail panel for a selected assessment.
     *
     * @param {object} opts
     * @param {HTMLElement} opts.panel        - detail container element
     * @param {HTMLElement} opts.heading      - <h3> title element
     * @param {HTMLElement} opts.dateEl       - date/overall subtitle element
     * @param {HTMLElement} opts.scoresEl     - scores grid element
     * @param {HTMLElement} opts.noteEl       - <textarea> for user note
     * @param {object}      opts.assessment   - the selected assessment doc
     * @param {object|null} opts.previous     - the preceding assessment doc or null
     */
    function renderDetail(opts) {
        var panel      = opts.panel;
        var heading    = opts.heading;
        var dateEl     = opts.dateEl;
        var scoresEl   = opts.scoresEl;
        var noteEl     = opts.noteEl;
        var a          = opts.assessment;
        var prev       = opts.previous;

        if (!panel) return;

        if (heading) heading.textContent = 'Assessment — ' + formatDate(a.assessmentDate);
        if (dateEl)  dateEl.textContent  = 'Overall: ' + a.overall + '% | Dominant: ' + capitalize(a.dominantType);

        if (scoresEl) {
            scoresEl.innerHTML = '';
            DIMS.forEach(function (d) {
                var val   = (a.scores && a.scores[d]) || 0;
                var delta = prev ? (val - ((prev.scores && prev.scores[d]) || 0)) : null;
                var item  = document.createElement('div');
                item.className = 'detail-score-item';
                item.innerHTML =
                    '<div class="detail-score-label">' + capitalize(d) + '</div>'
                  + '<div class="detail-score-value" style="color:' + levelColour(val) + ';">' + val + '%</div>'
                  + (delta !== null ? '<div class="detail-score-delta">' + growthArrow(delta) + '</div>' : '');
                scoresEl.appendChild(item);
            });
        }

        if (noteEl) {
            noteEl.value = a.notes || '';
        }

        panel.classList.add('visible');
        panel.hidden = false;
    }

    // ── Security helper ───────────────────────────────────────────────────────

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── Public API ────────────────────────────────────────────────────────────

    global.TimelineView = {
        renderTimeline:      renderTimeline,
        renderDetail:        renderDetail,
        renderMilestoneBadges: renderMilestoneBadges,
        renderNarrative:     renderNarrative,
        capitalize:          capitalize,
        formatDate:          formatDate,
        formatDateTime:      formatDateTime,
        levelColour:         levelColour,
        growthArrow:         growthArrow,
        escapeHtml:          escapeHtml,
    };

}(typeof window !== 'undefined' ? window : global));
