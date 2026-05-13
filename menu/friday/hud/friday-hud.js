// ===== TIME =====
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ORDINALS = ['','1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH','9TH','10TH','11TH','12TH','13TH','14TH','15TH','16TH','17TH','18TH','19TH','20TH','21ST','22ND','23RD','24TH','25TH','26TH','27TH','28TH','29TH','30TH','31ST'];

function updateTime() {
  const now = new Date();
  const h = now.getHours(), m = String(now.getMinutes()).padStart(2,'0'), s = String(now.getSeconds()).padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  document.getElementById('time-display').textContent = `${h12}:${m}:${s}`;
  document.getElementById('day-display').textContent  = DAYS[now.getDay()].toLowerCase();
  document.getElementById('lp-month').textContent = MONTHS[now.getMonth()].toLowerCase();
  document.getElementById('lp-day').textContent   = now.getDate();
}
updateTime();
setInterval(updateTime, 1000);

// Uptime counter
const startTime = Date.now();
function updateUptime() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const mm = String(Math.floor(s/60)).padStart(2,'0');
  const ss = String(s % 60).padStart(2,'0');
  const el = document.getElementById('uptime-val');
  if (el) el.textContent = `${mm}:${ss}`;
}
setInterval(updateUptime, 1000);

// ===== AVATAR from localStorage =====
(function loadAvatar() {
  try {
    const src = localStorage.getItem('friday_avatar') || localStorage.getItem('avatar') || localStorage.getItem('userAvatar');
    if (src) {
      const img = document.getElementById('avatar-img');
      img.setAttribute('href', src);
      img.setAttribute('opacity', '1');
      // hide silhouette
      document.querySelectorAll('#left-panel circle[fill="#00b8d4"], #left-panel ellipse[fill="#00b8d4"]').forEach(el => el.setAttribute('opacity','0'));
    }
  } catch(e) {}
})();

// ===== MIC / LISTEN TOGGLE =====
let listening = false;
function toggleListen() {
  listening = !listening;
  const btn  = document.getElementById('btn-listen');
  const dot  = document.getElementById('status-dot');
  const txt  = document.getElementById('status-text');
  if (listening) {
    btn.textContent = 'MIC: ON';
    btn.classList.add('active');
    dot.classList.remove('off');
    txt.textContent = 'Listening';
    addChatMsg('// microphone activated — I hear you.', 'system');
  } else {
    btn.textContent = 'MIC: OFF';
    btn.classList.remove('active');
    dot.classList.add('off');
    txt.textContent = 'Mic Off';
    addChatMsg('// microphone off.', 'system');
  }
}

// ===== MODE TOGGLES =====
const modes = { focus: true, ghost: true };
function toggleMode(mode) {
  modes[mode] = !modes[mode];
  const btn  = document.getElementById('btn-' + mode);
  const pill = document.getElementById('pill-' + mode);
  const on   = modes[mode];
  if (btn)  { btn.classList.toggle('active', on); }
  if (pill) { pill.classList.toggle('active', on); }
  const label = mode === 'focus' ? 'Focus Mode' : 'Ghost Mode';
  addChatMsg(`// ${label} ${on ? 'activated' : 'deactivated'}.`, 'system');
}

// ===== CHAT FEED =====
function addChatMsg(text, type) {
  const feed = document.getElementById('chat-feed');
  const div  = document.createElement('div');
  div.className = 'chat-msg ' + (type || 'friday');
  if (type !== 'system') {
    const label = document.createElement('span');
    label.className = 'msg-label';
    label.textContent = 'FRI > ';
    div.appendChild(label);
  }
  div.appendChild(document.createTextNode(text));
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

// ===== WEATHER (real data via Open-Meteo — no API key needed) =====
async function fetchWeather() {
  try {
    // 1. Get location via IP geolocation
    const geoRes  = await fetch('https://ipapi.co/json/');
    const geoData = await geoRes.json();
    const lat = geoData.latitude, lon = geoData.longitude;
    const city = geoData.city || 'Unknown';

    document.getElementById('w-location').textContent = city.toUpperCase();

    // 2. Open-Meteo weather API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m,visibility,weathercode&timezone=auto&forecast_days=1`;
    const wRes  = await fetch(url);
    const wData = await wRes.json();

    const cur   = wData.current_weather;
    const hr    = wData.hourly;
    const now   = new Date();
    const hIdx  = now.getHours();

    const temp     = Math.round(cur.temperature);
    const wind     = Math.round(cur.windspeed);
    const feels    = Math.round(hr.apparent_temperature[hIdx]);
    const humidity = hr.relativehumidity_2m[hIdx];
    const vis      = Math.round((hr.visibility[hIdx] || 0) / 1000);
    const code     = cur.weathercode;

    const condMap = {
      0:'Clear Sky',1:'Mainly Clear',2:'Partly Cloudy',3:'Overcast',
      45:'Foggy',48:'Icy Fog',
      51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',
      61:'Light Rain',63:'Rain',65:'Heavy Rain',
      71:'Light Snow',73:'Snow',75:'Heavy Snow',
      80:'Rain Showers',81:'Showers',82:'Heavy Showers',
      95:'Thunderstorm',96:'Hail Storm',99:'Severe Hail'
    };
    const condition = condMap[code] || `Code ${code}`;

    document.getElementById('w-temp').textContent      = temp;
    document.getElementById('w-condition').textContent = condition;
    document.getElementById('w-feels').textContent     = `${feels}°C`;
    document.getElementById('w-wind').textContent      = `${wind} km/h`;
    document.getElementById('w-humidity').textContent  = `${humidity}%`;
    document.getElementById('w-vis').textContent       = `${vis} km`;

    addChatMsg(`Weather: ${condition}, ${temp}°C in ${city}. Feels ${feels}°C.`, 'friday');
  } catch(e) {
    document.getElementById('w-condition').textContent = 'Unavailable';
    document.getElementById('w-location').textContent  = 'No Signal';
  }
}
fetchWeather();

// ===== SVG RING BUILDING =====
const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('center-svg');
const CX = 300, CY = 300;

function pt(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Tick marks
const tickG = document.getElementById('outer-ticks');
for (let i = 0; i < 120; i++) {
  const ang = i * 3, isLong = i % 5 === 0;
  const r1 = isLong ? 255 : 258, r2 = 265;
  const [x1,y1] = pt(CX,CY,r1,ang), [x2,y2] = pt(CX,CY,r2,ang);
  const line = document.createElementNS(SVG_NS,'line');
  line.setAttribute('x1',x1); line.setAttribute('y1',y1);
  line.setAttribute('x2',x2); line.setAttribute('y2',y2);
  line.setAttribute('stroke', isLong ? '#00b8d4' : '#0097a7');
  line.setAttribute('stroke-width', isLong ? '1.5' : '0.5');
  line.setAttribute('opacity', isLong ? '0.8' : '0.4');
  tickG.appendChild(line);
}

// Segment outer ring
const segG = document.getElementById('seg-ring');
const NUM_SEGS = 16, SEG_ANG = 360/NUM_SEGS, SEG_GAP = 3;
const segLabels = ['HOME','MSGS','PHOTOS','WISH','FRI','','SIGNAL','CORE','NET','DPS','','','','','',''];
for (let i = 0; i < NUM_SEGS; i++) {
  const startA = i * SEG_ANG + SEG_GAP/2, endA = (i+1)*SEG_ANG - SEG_GAP/2;
  const r = 250, thick = 10;
  const [sx,sy] = pt(CX,CY,r,startA), [ex,ey] = pt(CX,CY,r,endA);
  const [sx2,sy2] = pt(CX,CY,r-thick,startA), [ex2,ey2] = pt(CX,CY,r-thick,endA);
  const la = (endA - startA) > 180 ? 1 : 0;
  const d = `M${sx},${sy} A${r},${r} 0 ${la},1 ${ex},${ey} L${ex2},${ey2} A${r-thick},${r-thick} 0 ${la},0 ${sx2},${sy2} Z`;
  const path = document.createElementNS(SVG_NS,'path');
  path.setAttribute('d',d);
  const fill = i%4===0?'rgba(0,183,212,0.25)':i%2===0?'rgba(0,183,212,0.12)':'rgba(0,150,167,0.08)';
  path.setAttribute('fill',fill); path.setAttribute('stroke','#00b8d4'); path.setAttribute('stroke-width','0.5'); path.setAttribute('opacity','0.9');
  segG.appendChild(path);
  if (segLabels[i]) {
    const midA = (startA+endA)/2, [lx,ly] = pt(CX,CY,r-thick/2-1,midA);
    const txt = document.createElementNS(SVG_NS,'text');
    txt.setAttribute('x',lx); txt.setAttribute('y',ly);
    txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
    txt.setAttribute('class','seg-label');
    txt.setAttribute('transform',`rotate(${midA}, ${lx}, ${ly})`);
    txt.textContent = segLabels[i];
    segG.appendChild(txt);
  }
}

// LED ring
const ledG = document.getElementById('led-ring');
for (let i = 0; i < 48; i++) {
  const [x,y] = pt(CX,CY,196, i*(360/48));
  const c = document.createElementNS(SVG_NS,'circle');
  c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r','3.5');
  const bright = Math.random() > 0.3;
  c.setAttribute('fill', bright ? '#fff' : '#00b8d4');
  c.setAttribute('opacity', bright ? '0.95' : '0.4');
  ledG.appendChild(c);
}

// Ring labels
const rlG = document.getElementById('ring-labels');
[{a:-30,r:232,t:'HOME'},{a:0,r:232,t:'MSGS'},{a:30,r:232,t:'PHOTOS'},{a:60,r:232,t:'WISH'},
 {a:90,r:232,t:'FRI'},{a:120,r:232,t:'DPS'},{a:150,r:232,t:'ACTIVE'},{a:180,r:232,t:'SYNC'},
 {a:270,r:232,t:'UPTIME'},{a:300,r:232,t:'NEURAL'},{a:330,r:232,t:'SIGNAL'}
].forEach(d => {
  const [x,y] = pt(CX,CY,d.r,d.a);
  const txt = document.createElementNS(SVG_NS,'text');
  txt.setAttribute('x',x); txt.setAttribute('y',y);
  txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
  txt.setAttribute('class','seg-label');
  txt.setAttribute('transform',`rotate(${d.a}, ${x}, ${y})`);
  txt.textContent = d.t;
  rlG.appendChild(txt);
});

// ===== CANVAS ANIMATION =====
const canvas = document.getElementById('center-canvas');
function resizeCanvas() {
  const hud = document.getElementById('center-hud');
  canvas.width = hud.offsetWidth; canvas.height = hud.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let sweepAngle = 0, ledPhase = 0;
function drawCanvas() {
  resizeCanvas();
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, cx = w/2, cy = h/2, scale = w/600;
  ctx.clearRect(0,0,w,h);
  const r = 196 * scale;
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0,0,r,(sweepAngle-90-40)*Math.PI/180,(sweepAngle-90+5)*Math.PI/180);
  ctx.lineWidth = 8*scale; ctx.strokeStyle = 'rgba(0,229,255,0.5)'; ctx.stroke();
  const NUM = 48;
  for (let i = 0; i < NUM; i++) {
    const ang = (i*360/NUM + ledPhase) % 360;
    const a = (ang-90)*Math.PI/180;
    const x = r*Math.cos(a), y = r*Math.sin(a);
    const distToSweep = Math.abs(((ang-sweepAngle)%360+360)%360);
    const glowFactor = distToSweep < 60 ? Math.max(0, 1-distToSweep/60) : 0;
    const baseAlpha = 0.4 + (i%3===0?0.3:0);
    const alpha = Math.min(1, baseAlpha + glowFactor*0.6);
    const radius = (2+glowFactor*3)*scale;
    ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2);
    if (glowFactor > 0) {
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 15*glowFactor;
    } else {
      ctx.fillStyle = `rgba(0,200,220,${alpha})`; ctx.shadowBlur = 0;
    }
    ctx.fill(); ctx.shadowBlur = 0;
  }
  const r2 = 118*scale;
  ctx.beginPath();
  ctx.arc(0,0,r2,(-sweepAngle*2-90)*Math.PI/180,(-sweepAngle*2-90+30)*Math.PI/180);
  ctx.lineWidth = 3*scale; ctx.strokeStyle = 'rgba(0,229,255,0.6)';
  ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
  sweepAngle = (sweepAngle+0.8) % 360;
  ledPhase   = (ledPhase+0.3)  % 360;
  requestAnimationFrame(drawCanvas);
}
drawCanvas();