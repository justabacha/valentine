const canvas = document.getElementById('center-canvas');
let sweepAngle = 0, ledPhase = 0;
let animationId = null;

function resizeCanvas() {
  const hud = document.getElementById('center-hud');
  canvas.width = hud.offsetWidth;
  canvas.height = hud.offsetHeight;
}

function drawCanvas() {
  resizeCanvas();
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w/2, cy = h/2;
  const scale = w / 600;
  ctx.clearRect(0, 0, w, h);
  
  const r = 196 * scale;
  ctx.save();
  ctx.translate(cx, cy);
  
  // sweep arc
  ctx.beginPath();
  ctx.arc(0, 0, r, (sweepAngle - 90 - 40) * Math.PI/180, (sweepAngle - 90 + 5) * Math.PI/180);
  ctx.lineWidth = 8 * scale;
  ctx.strokeStyle = 'rgba(0,229,255,0.5)';
  ctx.stroke();
  
  // animated LED dots
  const NUM = 48;
  for (let i = 0; i < NUM; i++) {
    const ang = (i * 360 / NUM + ledPhase) % 360;
    const rad = (ang - 90) * Math.PI / 180;
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    const distToSweep = Math.abs(((ang - sweepAngle) % 360 + 360) % 360);
    const glowFactor = distToSweep < 60 ? Math.max(0, 1 - distToSweep/60) : 0;
    const baseAlpha = 0.4 + (i % 3 === 0 ? 0.3 : 0);
    const alpha = Math.min(1, baseAlpha + glowFactor * 0.6);
    const radius = (2 + glowFactor * 3) * scale;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (glowFactor > 0) {
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15 * glowFactor;
    } else {
      ctx.fillStyle = `rgba(0,200,220,${alpha})`;
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  // inner rotating indicator
  const r2 = 118 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, r2, (-sweepAngle*2 - 90) * Math.PI/180, (-sweepAngle*2 - 90 + 30) * Math.PI/180);
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = 'rgba(0,229,255,0.6)';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  ctx.restore();
  
  sweepAngle = (sweepAngle + 0.8) % 360;
  ledPhase = (ledPhase + 0.3) % 360;
  
  animationId = requestAnimationFrame(drawCanvas);
}

export function initCanvasAnimation() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (animationId) cancelAnimationFrame(animationId);
  drawCanvas();
}