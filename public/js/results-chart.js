document.addEventListener("DOMContentLoaded", () => {

  const stored = localStorage.getItem("quizResults");
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
