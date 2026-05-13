const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('center-svg');
const CX = 300, CY = 300;

function pt(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function initRings() {
  // Tick marks
  const tickG = document.getElementById('outer-ticks');
  for (let i = 0; i < 120; i++) {
    const ang = i * 3, isLong = i % 5 === 0;
    const r1 = isLong ? 255 : 258, r2 = 265;
    const [x1,y1] = pt(CX,CY,r1,ang);
    const [x2,y2] = pt(CX,CY,r2,ang);
    const line = document.createElementNS(SVG_NS,'line');
    line.setAttribute('x1',x1); line.setAttribute('y1',y1);
    line.setAttribute('x2',x2); line.setAttribute('y2',y2);
    line.setAttribute('stroke', isLong ? '#00b8d4' : '#0097a7');
    line.setAttribute('stroke-width', isLong ? '1.5' : '0.5');
    line.setAttribute('opacity', isLong ? '0.8' : '0.4');
    tickG.appendChild(line);
  }

  // Segments
  const segG = document.getElementById('seg-ring');
  const NUM_SEGS = 16;
  const SEG_ANG = 360 / NUM_SEGS;
  const SEG_GAP = 3;
  const segLabels = ['HOME','MSGS','PHOTOS','WISH','FRI','','SIGNAL','CORE','NET','DPS','','','','','',''];
  for (let i = 0; i < NUM_SEGS; i++) {
    const startA = i * SEG_ANG + SEG_GAP/2;
    const endA = (i+1) * SEG_ANG - SEG_GAP/2;
    const r = 250, thick = 10;
    const [sx,sy] = pt(CX,CY,r,startA);
    const [ex,ey] = pt(CX,CY,r,endA);
    const [sx2,sy2] = pt(CX,CY,r-thick,startA);
    const [ex2,ey2] = pt(CX,CY,r-thick,endA);
    const la = (endA - startA) > 180 ? 1 : 0;
    const d = `M${sx},${sy} A${r},${r} 0 ${la},1 ${ex},${ey} L${ex2},${ey2} A${r-thick},${r-thick} 0 ${la},0 ${sx2},${sy2} Z`;
    const path = document.createElementNS(SVG_NS,'path');
    path.setAttribute('d', d);
    const fill = i%4===0 ? 'rgba(0,183,212,0.25)' : i%2===0 ? 'rgba(0,183,212,0.12)' : 'rgba(0,150,167,0.08)';
    path.setAttribute('fill', fill);
    path.setAttribute('stroke','#00b8d4');
    path.setAttribute('stroke-width','0.5');
    path.setAttribute('opacity','0.9');
    segG.appendChild(path);
    if (segLabels[i]) {
      const midA = (startA + endA)/2;
      const [lx,ly] = pt(CX,CY, r - thick/2 - 1, midA);
      const txt = document.createElementNS(SVG_NS,'text');
      txt.setAttribute('x',lx); txt.setAttribute('y',ly);
      txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
      txt.setAttribute('class','seg-label');
      txt.setAttribute('transform', `rotate(${midA}, ${lx}, ${ly})`);
      txt.textContent = segLabels[i];
      segG.appendChild(txt);
    }
  }

  // LED ring
  const ledG = document.getElementById('led-ring');
  for (let i = 0; i < 48; i++) {
    const ang = i * (360 / 48);
    const [x,y] = pt(CX,CY,196, ang);
    const c = document.createElementNS(SVG_NS,'circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y);
    c.setAttribute('r','3.5');
    const bright = Math.random() > 0.3;
    c.setAttribute('fill', bright ? '#fff' : '#00b8d4');
    c.setAttribute('opacity', bright ? '0.95' : '0.4');
    ledG.appendChild(c);
  }

  // Ring labels
  const rlG = document.getElementById('ring-labels');
  const ringLabelData = [
    {a:-30, r:232, t:'HOME'}, {a:0, r:232, t:'MSGS'}, {a:30, r:232, t:'PHOTOS'},
    {a:60, r:232, t:'WISH'}, {a:90, r:232, t:'FRI'}, {a:120, r:232, t:'DPS'},
    {a:150, r:232, t:'ACTIVE'}, {a:180, r:232, t:'SYNC'}, {a:270, r:232, t:'UPTIME'},
    {a:300, r:232, t:'NEURAL'}, {a:330, r:232, t:'SIGNAL'}
  ];
  ringLabelData.forEach(d => {
    const [x,y] = pt(CX,CY,d.r,d.a);
    const txt = document.createElementNS(SVG_NS,'text');
    txt.setAttribute('x',x); txt.setAttribute('y',y);
    txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
    txt.setAttribute('class','seg-label');
    txt.setAttribute('transform', `rotate(${d.a}, ${x}, ${y})`);
    txt.textContent = d.t;
    rlG.appendChild(txt);
  });
}