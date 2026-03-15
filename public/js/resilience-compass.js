'use strict';

// Define the compass radius
const radius = 85; // Changed from 115 to 85

function drawCompass(ctx) {
    // Other drawing code...

    // Removed the solid navy background fill
    // ctx.fillStyle = '#0F172A';
    // ctx.fill();

    // The gradient glow
    const gradient = ctx.createRadialGradient(...);
    // Add gradient stops...
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(..., radius, 0, Math.PI * 2);
    ctx.fill();
}
// Additional code...