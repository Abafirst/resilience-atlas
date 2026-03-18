/* public/js/growth-charts.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Growth chart helpers for the Assessment History / Timeline page.
 *
 * Requires Chart.js (loaded before this file in the HTML).
 * Exported as a plain IIFE / global `GrowthCharts` object.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function (global) {
    'use strict';

    var DIMS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];

    var DIM_COLOURS = {
        emotional: 'rgba(231, 76, 60,  0.8)',
        mental:    'rgba(52,  152, 219, 0.8)',
        physical:  'rgba(46,  204, 113, 0.8)',
        social:    'rgba(155, 89,  182, 0.8)',
        spiritual: 'rgba(241, 196, 15,  0.8)',
        financial: 'rgba(230, 126, 34,  0.8)',
    };

    var OVERALL_COLOUR = 'rgba(74, 158, 202, 1)';

    /** Map from canvas id → Chart instance (for destruction on re-render). */
    var _chartInstances = {};

    function destroyChart(canvasId) {
        if (_chartInstances[canvasId]) {
            _chartInstances[canvasId].destroy();
            delete _chartInstances[canvasId];
        }
    }

    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    // ── Overall score trend (line chart) ──────────────────────────────────────

    /**
     * Render the overall score trend line chart.
     *
     * @param {string}   canvasId  - id of <canvas> element
     * @param {object[]} points    - [{ date, score }, ...] oldest-first
     */
    function renderOverallTrend(canvasId, points) {
        destroyChart(canvasId);
        var canvas = document.getElementById(canvasId);
        if (!canvas || !points || points.length < 2) return;

        var labels = points.map(function (p) {
            return new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        var data = points.map(function (p) { return p.score; });

        _chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Overall Score',
                    data: data,
                    borderColor:     OVERALL_COLOUR,
                    backgroundColor: 'rgba(74, 158, 202, 0.15)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.3,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) { return 'Score: ' + ctx.parsed.y + '%'; },
                        },
                    },
                },
                scales: {
                    y: {
                        min: 0, max: 100,
                        title: { display: true, text: 'Score (%)' },
                    },
                },
            },
        });
    }

    // ── Dimension growth bar chart ────────────────────────────────────────────

    /**
     * Render a bar chart showing per-dimension growth (latest vs oldest).
     *
     * @param {string}   canvasId   - id of <canvas> element
     * @param {object}   trends     - { emotional:[{date,score}], ... }
     */
    function renderGrowthBars(canvasId, trends) {
        destroyChart(canvasId);
        var canvas = document.getElementById(canvasId);
        if (!canvas || !trends) return;

        var labels  = [];
        var deltas  = [];
        var colours = [];

        DIMS.forEach(function (d) {
            var pts = trends[d];
            if (!pts || pts.length < 2) return;
            var delta = pts[pts.length - 1].score - pts[0].score;
            labels.push(capitalize(d));
            deltas.push(delta);
            colours.push(delta >= 0 ? 'rgba(46, 204, 113, 0.8)' : 'rgba(231, 76, 60, 0.8)');
        });

        if (labels.length === 0) return;

        _chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Change',
                    data: deltas,
                    backgroundColor: colours,
                    borderRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                var v = ctx.parsed.y;
                                return 'Change: ' + (v >= 0 ? '+' : '') + v + ' pts';
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Points Change' },
                    },
                },
            },
        });
    }

    // ── Dimension radar chart ─────────────────────────────────────────────────

    /**
     * Render a radar chart comparing two assessments.
     *
     * @param {string} canvasId
     * @param {object} current   - assessment with .scores
     * @param {object} [previous] - optional previous assessment
     */
    function renderRadar(canvasId, current, previous) {
        destroyChart(canvasId);
        var canvas = document.getElementById(canvasId);
        if (!canvas || !current) return;

        var labels = DIMS.map(capitalize);
        var curData = DIMS.map(function (d) { return (current.scores && current.scores[d]) || 0; });

        var datasets = [{
            label: 'Current',
            data: curData,
            borderColor: OVERALL_COLOUR,
            backgroundColor: 'rgba(74, 158, 202, 0.2)',
            pointBackgroundColor: OVERALL_COLOUR,
            borderWidth: 2,
        }];

        if (previous) {
            var prevData = DIMS.map(function (d) { return (previous.scores && previous.scores[d]) || 0; });
            datasets.push({
                label: 'Previous',
                data: prevData,
                borderColor: 'rgba(149, 165, 166, 0.9)',
                backgroundColor: 'rgba(149, 165, 166, 0.1)',
                pointBackgroundColor: 'rgba(149, 165, 166, 0.9)',
                borderDash: [5, 3],
                borderWidth: 2,
            });
        }

        _chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'radar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        min: 0, max: 100,
                        ticks: { stepSize: 20 },
                    },
                },
                plugins: {
                    legend: { display: !!previous },
                },
            },
        });
    }

    // ── Dimension multi-line trend ────────────────────────────────────────────

    /**
     * Render all 6 dimension trends on a single line chart.
     *
     * @param {string} canvasId
     * @param {object} trends  - { emotional: [{date,score}], ... }
     */
    function renderDimensionTrends(canvasId, trends) {
        destroyChart(canvasId);
        var canvas = document.getElementById(canvasId);
        if (!canvas || !trends) return;

        var overallPts = (trends.overall || []);
        if (overallPts.length < 2) return;

        var labels = overallPts.map(function (p) {
            return new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        var datasets = DIMS.map(function (d) {
            var pts = trends[d] || [];
            return {
                label: capitalize(d),
                data: pts.map(function (p) { return p.score; }),
                borderColor: DIM_COLOURS[d] || '#999',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3,
            };
        });

        _chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                },
                scales: {
                    y: { min: 0, max: 100, title: { display: true, text: 'Score (%)' } },
                },
            },
        });
    }

    // ── Public API ────────────────────────────────────────────────────────────

    global.GrowthCharts = {
        renderOverallTrend:    renderOverallTrend,
        renderGrowthBars:      renderGrowthBars,
        renderRadar:           renderRadar,
        renderDimensionTrends: renderDimensionTrends,
        destroy:               destroyChart,
    };

}(typeof window !== 'undefined' ? window : global));
