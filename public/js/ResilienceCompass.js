/* ============================================================
   ResilienceCompass.js — SVG compass visualization component
   for The Resilience Atlas

   Renders an interactive SVG compass that shows the direction
   and magnitude of change between assessments.

   Compass mapping (aligned with the Atlas concept):
     North  → Mental   (cognitive growth)
     East   → Social   (relational expansion)
     South  → Physical (somatic grounding)
     West   → Emotional + Spiritual integration
   ============================================================ */

'use strict';

(function (global) {

    // ── Constants ──────────────────────────────────────────────────────────────

    const COMPASS_LABELS = {
        N:  'Mental Growth',
        NE: 'Cognitive + Social',
        E:  'Social Expansion',
        SE: 'Social + Physical',
        S:  'Physical Grounding',
        SW: 'Physical + Emotional',
        W:  'Emotional Integration',
        NW: 'Emotional + Mental',
    };

    const BEARING_ANGLES = {
        N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
    };

    const MAGNITUDE_COLORS = [
        '#4a9eca', // 0 — minimal
        '#4a9eca',
        '#5caacc',
        '#6eb8cc',
        '#7fc4c0',
        '#8fd0a8',  // 5 — moderate
        '#a0d890',
        '#b0dc78',
        '#c8d860',
        '#e0c848',
        '#f0a020',  // 10 — strong
    ];

    // ── SVG helpers ────────────────────────────────────────────────────────────

    function svgEl(tag, attrs, children) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                el.setAttribute(k, attrs[k]);
            }
        }
        if (children) {
            children.forEach(function (child) {
                if (typeof child === 'string') {
                    el.textContent = child;
                } else if (child) {
                    el.appendChild(child);
                }
            });
        }
        return el;
    }

    function svgText(x, y, text, attrs) {
        var defaults = { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central' };
        return svgEl('text', Object.assign(defaults, attrs || {}), [text]);
    }

    // ── Compass rendering ──────────────────────────────────────────────────────

    /**
     * Render a ResilienceCompass into a container element.
     *
     * @param {HTMLElement} container - DOM element to render into
     * @param {Object} opts
     * @param {string}  opts.direction   - Compass bearing: N, NE, E, SE, S, SW, W, NW
     * @param {number}  opts.magnitude   - Change magnitude 0–10
     * @param {Object}  opts.changes     - Per-dimension change values
     * @param {Object}  opts.currentScores - Current assessment scores
     */
    function renderCompass(container, opts) {
        if (!container) return;

        opts = opts || {};
        var direction    = opts.direction    || 'N';
        var magnitude    = opts.magnitude    || 0;
        var changes      = opts.changes      || {};
        var bearing      = BEARING_ANGLES[direction] || 0;
        var arrowColor   = MAGNITUDE_COLORS[Math.min(10, Math.max(0, Math.round(magnitude)))];

        var W = 320;
        var H = 320;
        var cx = W / 2;
        var cy = H / 2;
        var outerR = 130;
        var innerR = 100;

        var svg = svgEl('svg', {
            xmlns:   'http://www.w3.org/2000/svg',
            viewBox: '0 0 ' + W + ' ' + H,
            width:   '100%',
            height:  '100%',
            role:    'img',
            'aria-label': 'Resilience evolution compass pointing ' + direction,
        });

        // ── Background circle ────────────────────────────────────────────────
        svg.appendChild(svgEl('circle', {
            cx: cx, cy: cy, r: outerR + 20,
            fill: '#0f2942', stroke: '#1e4060', 'stroke-width': '1',
        }));

        // ── Grid rings ───────────────────────────────────────────────────────
        [outerR, innerR, outerR * 0.55].forEach(function (r) {
            svg.appendChild(svgEl('circle', {
                cx: cx, cy: cy, r: r,
                fill: 'none', stroke: '#1e4060', 'stroke-width': '1',
            }));
        });

        // ── Cardinal axis lines ──────────────────────────────────────────────
        var axes = [0, 45, 90, 135];
        axes.forEach(function (deg) {
            var rad = (deg * Math.PI) / 180;
            svg.appendChild(svgEl('line', {
                x1: cx + outerR * Math.cos(rad - Math.PI / 2),
                y1: cy + outerR * Math.sin(rad - Math.PI / 2),
                x2: cx - outerR * Math.cos(rad - Math.PI / 2),
                y2: cy - outerR * Math.sin(rad - Math.PI / 2),
                stroke: '#1e4060', 'stroke-width': deg % 90 === 0 ? '1.5' : '0.75',
            }));
        });

        // ── Cardinal direction labels ────────────────────────────────────────
        var cardinalDirs = {
            N: { x: cx,         y: cy - outerR - 14, label: 'N', sub: 'Mental'    },
            E: { x: cx + outerR + 14, y: cy,          label: 'E', sub: 'Social'    },
            S: { x: cx,         y: cy + outerR + 14, label: 'S', sub: 'Physical'  },
            W: { x: cx - outerR - 14, y: cy,          label: 'W', sub: 'Emotional' },
        };

        Object.values(cardinalDirs).forEach(function (d) {
            svg.appendChild(svgText(d.x, d.y, d.label, {
                'font-family': 'Georgia, serif',
                'font-size':   '16',
                'font-weight': 'bold',
                fill:          '#4a9eca',
            }));
            svg.appendChild(svgText(d.x, d.y + 14, d.sub, {
                'font-family': 'Arial, sans-serif',
                'font-size':   '9',
                fill:          '#a8c4d8',
            }));
        });

        // ── Intercardinal labels (NE, SE, SW, NW) ───────────────────────────
        var intercardinals = [
            { dir: 'NE', angle: -45  },
            { dir: 'SE', angle:  45  },
            { dir: 'SW', angle:  135 },
            { dir: 'NW', angle: -135 },
        ];
        intercardinals.forEach(function (ic) {
            var rad = (ic.angle * Math.PI) / 180;
            var lx  = cx + (outerR + 12) * Math.sin(rad);
            var ly  = cy - (outerR + 12) * Math.cos(rad);
            svg.appendChild(svgText(lx, ly, ic.dir, {
                'font-family': 'Arial, sans-serif',
                'font-size':   '11',
                fill:          '#6a8ca8',
            }));
        });

        // ── Arrow (direction of change) ──────────────────────────────────────
        if (magnitude > 0) {
            var arrowLength = innerR * 0.8 * (magnitude / 10);
            var arrowRad    = (bearing * Math.PI) / 180;

            var ax = cx + arrowLength * Math.sin(arrowRad);
            var ay = cy - arrowLength * Math.cos(arrowRad);

            // Shaft
            svg.appendChild(svgEl('line', {
                x1: cx, y1: cy,
                x2: ax, y2: ay,
                stroke:           arrowColor,
                'stroke-width':   '4',
                'stroke-linecap': 'round',
            }));

            // Arrowhead
            var headSize = 10;
            var perpRad  = arrowRad + Math.PI / 2;
            var hx1 = ax - headSize * Math.sin(arrowRad) + headSize * 0.5 * Math.cos(perpRad);
            var hy1 = ay + headSize * Math.cos(arrowRad) + headSize * 0.5 * Math.sin(perpRad);
            var hx2 = ax - headSize * Math.sin(arrowRad) - headSize * 0.5 * Math.cos(perpRad);
            var hy2 = ay + headSize * Math.cos(arrowRad) - headSize * 0.5 * Math.sin(perpRad);

            svg.appendChild(svgEl('polygon', {
                points: ax + ',' + ay + ' ' + hx1 + ',' + hy1 + ' ' + hx2 + ',' + hy2,
                fill:   arrowColor,
            }));
        }

        // ── Center dot ───────────────────────────────────────────────────────
        svg.appendChild(svgEl('circle', {
            cx: cx, cy: cy, r: 5,
            fill: '#ffffff',
        }));

        // ── Direction label at the bottom ────────────────────────────────────
        var dirLabel   = direction;
        var compassDesc = COMPASS_LABELS[direction] || direction;

        svg.appendChild(svgText(cx, H - 22, dirLabel, {
            'font-family': 'Georgia, serif',
            'font-size':   '18',
            'font-weight': 'bold',
            fill:          arrowColor,
        }));
        svg.appendChild(svgText(cx, H - 6, compassDesc, {
            'font-family': 'Arial, sans-serif',
            'font-size':   '10',
            fill:          '#a8c4d8',
        }));

        // ── Magnitude label ──────────────────────────────────────────────────
        if (magnitude > 0) {
            svg.appendChild(svgText(cx, cy + outerR * 0.55 + 14, 'Magnitude: ' + magnitude + '/10', {
                'font-family': 'Arial, sans-serif',
                'font-size':   '10',
                fill:          '#a8c4d8',
            }));
        } else {
            svg.appendChild(svgText(cx, cy + outerR * 0.55 + 14, 'Stable', {
                'font-family': 'Arial, sans-serif',
                'font-size':   '11',
                fill:          '#6a8ca8',
            }));
        }

        container.innerHTML = '';
        container.appendChild(svg);
    }

    // ── Tooltip table for dimension changes ────────────────────────────────────

    /**
     * Render a dimension changes summary table below the compass.
     *
     * @param {HTMLElement} container - Element to render into
     * @param {Object} changes        - { emotional: n, mental: n, ... }
     */
    function renderChangesTable(container, changes) {
        if (!container || !changes) return;

        var dims = [
            { key: 'emotional', label: 'Emotional'  },
            { key: 'mental',    label: 'Mental'     },
            { key: 'physical',  label: 'Physical'   },
            { key: 'social',    label: 'Social'     },
            { key: 'spiritual', label: 'Spiritual'  },
            { key: 'financial', label: 'Financial'  },
        ];

        var table = document.createElement('table');
        table.className = 'compass-changes-table';
        table.setAttribute('aria-label', 'Dimension changes since last assessment');

        var tbody = document.createElement('tbody');
        dims.forEach(function (d) {
            var val = changes[d.key];
            if (val === null || val === undefined) return;

            var tr   = document.createElement('tr');
            var tdLabel = document.createElement('td');
            var tdVal   = document.createElement('td');

            tdLabel.textContent = d.label;
            tdLabel.className   = 'compass-dim-label';

            var arrow = val > 0 ? '↑' : val < 0 ? '↓' : '→';
            var cls   = val > 0 ? 'change-up' : val < 0 ? 'change-down' : 'change-stable';
            tdVal.textContent = arrow + ' ' + (val > 0 ? '+' : '') + val + ' pts';
            tdVal.className   = 'compass-dim-change ' + cls;

            tr.appendChild(tdLabel);
            tr.appendChild(tdVal);
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    global.ResilienceCompass = {
        render:       renderCompass,
        renderChanges: renderChangesTable,
    };

}(typeof window !== 'undefined' ? window : this));
