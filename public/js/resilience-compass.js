// Complete canvas compass rendering code

const canvas = document.getElementById('radarCanvas');
const context = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 600;

const dimensions = ['Relational', 'Cognitive-Narrative', 'Somatic-Regulative', 'Emotional-Adaptive', 'Spiritual-Existential', 'Agentic-Generative'];
const dataValues = [0.8, 0.6, 0.4, 0.7, 0.5, 0.9]; // Example data points

function drawHexagon(x, y, radius, index) {
    context.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const xPos = x + radius * Math.cos(angle);
        const yPos = y + radius * Math.sin(angle);
        context.lineTo(xPos, yPos);
    }
    context.closePath();
    context.fillStyle = `hsl(${index * 60}, 100%, 50%)`;
    context.fill();
}

function drawGrid() {
    for (let i = 1; i <= 5; i++) {
        const radius = (i / 5) * 200;
        drawHexagon(300, 300, radius, i);
    }
}

function drawAxis() {
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    for (let i = 0; i < dimensions.length; i++) {
        const angle = (Math.PI / 3) * i;
        const x = 300 + 200 * Math.cos(angle);
        const y = 300 + 200 * Math.sin(angle);
        context.moveTo(300, 300);
        context.lineTo(x, y);
        context.stroke();

        // Draw labels
        context.fillText(dimensions[i], x, y);
    }
}

function drawDataPoints() {
    dataValues.forEach((value, index) => {
        const angle = (Math.PI / 3) * index;
        const radius = (value / 1) * 200;
        const x = 300 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);
        context.beginPath();
        context.arc(x, y, 5, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    });
}

function drawNeedle() {
    const maxIndex = dataValues.indexOf(Math.max(...dataValues));
    const angle = (Math.PI / 3) * maxIndex;
    const radius = 200;
    const x = 300 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);
    context.beginPath();
    context.moveTo(300, 300);
    context.lineTo(x, y);
    context.strokeStyle = 'blue';
    context.lineWidth = 3;
    context.stroke();
}

function drawCompass() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawAxis();
    drawDataPoints();
    drawNeedle();
}

drawCompass();