/* ============================================================
   resilience-compass.js — Clean Compass Rose
   for The Resilience Atlas™
   ============================================================ */

'use strict';

(function(){

const dims = [
"Relational",
"Cognitive",
"Somatic",
"Emotional",
"Spiritual",
"Agentic"
];

const heroData = [78,65,58,72,82,69];
const sampleData = [85,60,52,70,80,64];

function drawCompass(id,data){

const canvas = document.getElementById(id);
if(!canvas) return;

const ctx = canvas.getContext("2d");

const size = canvas.getBoundingClientRect().width;
canvas.width = size;
canvas.height = size;

const cx = size/2;
const cy = size/2;
const R = size * 0.50;

ctx.clearRect(0,0,size,size);

const steps = dims.length;
const angleStep = (Math.PI*2)/steps;

//////////////////////////////////
// GRID RINGS
//////////////////////////////////

ctx.strokeStyle="rgba(255,255,255,.15)";
ctx.lineWidth=1;

for(let i=1;i<=4;i++){
ctx.beginPath();
ctx.arc(cx,cy,(R/4)*i,0,Math.PI*2);
ctx.stroke();
}

//////////////////////////////////
// AXES
//////////////////////////////////

for(let i=0;i<steps;i++){

const a = -Math.PI/2 + i*angleStep;

const x = cx + Math.cos(a)*R;
const y = cy + Math.sin(a)*R;

ctx.beginPath();
ctx.moveTo(cx,cy);
ctx.lineTo(x,y);
ctx.strokeStyle="rgba(255,255,255,.2)";
ctx.stroke();

}

//////////////////////////////////
// COMPASS TICKS
//////////////////////////////////

const compassPoints = ["N","E","S","W"];

for(let i=0;i<4;i++){

const a = -Math.PI/2 + i*(Math.PI/2);

const x = cx + Math.cos(a)*(R+14);
const y = cy + Math.sin(a)*(R+14);

ctx.fillStyle="rgba(255,255,255,.7)";
ctx.font="12px sans-serif";
ctx.textAlign="center";
ctx.textBaseline="middle";

ctx.fillText(compassPoints[i],x,y);

}

//////////////////////////////////
// DIMENSION LABELS
//////////////////////////////////

for(let i=0;i<steps;i++){

const a = -Math.PI/2 + i*angleStep;

const x = cx + Math.cos(a)*(R+28);
const y = cy + Math.sin(a)*(R+28);

ctx.fillStyle="rgba(255,255,255,.8)";
ctx.font="12px sans-serif";
ctx.textAlign="center";
ctx.textBaseline="middle";

ctx.fillText(dims[i],x,y);

}

//////////////////////////////////
// RADAR SHAPE
//////////////////////////////////

ctx.beginPath();

data.forEach((v,i)=>{

const a = -Math.PI/2 + i*angleStep;

const r = (v/100)*R;

const x = cx + Math.cos(a)*r;
const y = cy + Math.sin(a)*r;

if(i===0){
ctx.moveTo(x,y);
}else{
ctx.lineTo(x,y);
}

});

ctx.closePath();

const grad = ctx.createRadialGradient(cx,cy,10,cx,cy,R);

grad.addColorStop(0,"rgba(120,200,255,.5)");
grad.addColorStop(1,"rgba(210,140,255,.35)");

ctx.fillStyle=grad;
ctx.fill();

ctx.strokeStyle="rgba(150,180,255,.8)";
ctx.lineWidth=2;
ctx.stroke();

//////////////////////////////////
// CENTER HUB
//////////////////////////////////

ctx.beginPath();
ctx.arc(cx,cy,6,0,Math.PI*2);
ctx.fillStyle="#818cf8";
ctx.fill();

}

//////////////////////////////////
// INITIAL DRAW
//////////////////////////////////

window.addEventListener("load",function(){

drawCompass("heroRadar",heroData);
drawCompass("exampleRadar",sampleData);

setTimeout(()=>{
drawCompass("heroRadar",heroData);
drawCompass("exampleRadar",sampleData);
},100);

});

})();
