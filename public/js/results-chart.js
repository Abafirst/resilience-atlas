document.addEventListener("DOMContentLoaded", () => {
const stored = localStorage.getItem("resilience_results");
  if (!stored) {
    console.warn("No quiz results found in localStorage");
    return;
  }

  const results = JSON.parse(stored);

  if (!results.scores) {
    console.warn("Results object missing scores");
    return;
  }

  const labels = Object.keys(results.scores);
  const values = Object.values(results.scores);

  const canvas = document.getElementById("resilienceRadar");
  if (!canvas) {
    console.warn("Radar chart canvas not found");
    return;
  }

  const ctx = canvas.getContext("2d");

  const brandColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--blue') || "#4F46E5";

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: "Your Resilience Profile",
        data: values,
        backgroundColor: "rgba(79,70,229,0.2)",
        borderColor: brandColor,
        pointBackgroundColor: brandColor,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1200
      },
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            stepSize: 20,
            backdropColor: "transparent"
          },
          grid: {
            circular: true
          },
          pointLabels: {
            font: {
              size: 14
            }
          }
        }
      }
    }
  });

});
/**
 * results-chart.js
 * Renders a professional Chart.js radar chart visualization of resilience
 * dimension scores. Auto-loads from localStorage.resilience_results and
 * displays The Resilience Atlas Map.
 */

(function() {
  'use strict';

  // Chart color palette aligned with brand
  const CHART_CONFIG = {
    primaryColor:     '#1565C0',
    backgroundColor:  'rgba(21, 101, 192, 0.15)',
    borderColor:      '#1565C0',
    pointColor:       '#1565C0',
    gridColor:        'rgba(21, 101, 192, 0.1)'
  };

  /**
   * Initialize and render the resilience radar chart.
   */
  function initializeChart() {
    const resultsJson = localStorage.getItem('resilience_results');
    if (!resultsJson) {
      console.warn('[ResilienceChart] No quiz results found in localStorage');
      return;
    }

    let results;
    try {
      results = JSON.parse(resultsJson);
    } catch (err) {
      console.error('[ResilienceChart] Failed to parse quiz results:', err);
      return;
    }

    if (!results.scores || typeof results.scores !== 'object') {
      console.warn('[ResilienceChart] Invalid results structure');
      return;
    }

    // Extract dimension labels and percentage values.
    // Scores may be stored as { raw, max, percentage } objects or plain numbers.
    const labels = Object.keys(results.scores);
    const values = Object.values(results.scores).map(function(s) {
      if (typeof s === 'object' && s !== null && typeof s.percentage === 'number') {
        return Math.round(s.percentage);
      }
      return typeof s === 'number' ? Math.round(s) : 0;
    });

    if (labels.length === 0) {
      console.warn('[ResilienceChart] No score data available');
      return;
    }

    var canvasElement = document.getElementById('resilienceRadar');
    if (!canvasElement) {
      console.warn('[ResilienceChart] Canvas element #resilienceRadar not found');
      return;
    }

    var ctx = canvasElement.getContext('2d');

    // eslint-disable-next-line no-undef
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Your Resilience Profile',
            data: values,
            backgroundColor: CHART_CONFIG.backgroundColor,
            borderColor:     CHART_CONFIG.borderColor,
            borderWidth:     3,
            pointBackgroundColor: CHART_CONFIG.pointColor,
            pointBorderColor:    '#fff',
            pointBorderWidth:    2,
            pointRadius:         5,
            pointHoverRadius:    7,
            fill:    true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font:           { size: 13, weight: '500' },
              color:          '#212121',
              padding:        20,
              usePointStyle:  true,
              pointStyle:     'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(33, 33, 33, 0.9)',
            padding:         12,
            titleFont:       { size: 13, weight: '600' },
            bodyFont:        { size: 12 },
            cornerRadius:    6,
            displayColors:   true,
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed.r + '%';
              }
            }
          }
        },
        scales: {
          r: {
            min:         0,
            max:         100,
            beginAtZero: true,
            ticks: {
              stepSize:       20,
              font:           { size: 11 },
              color:          '#757575',
              backdropColor:  'transparent',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              circular:   true,
              color:      CHART_CONFIG.gridColor,
              lineWidth:  1
            },
            pointLabels: {
              font:    { size: 12, weight: '500' },
              color:   '#212121',
              padding: 12
            }
          }
        },
        animation: {
          duration: 1000,
          easing:   'easeInOutQuart'
        }
      }
    });
  }

  // Initialize when DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChart);
  } else {
    initializeChart();
  }

  // Expose for manual re-initialization if needed.
  window.ResilienceChart = { render: initializeChart };

})();
 d16ce3e551d5da4c988c83f9762daf5e928d9b3f
