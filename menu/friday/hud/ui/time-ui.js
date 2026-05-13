import { getCurrentTimeData } from '../../module/time.js';

let uptimeStart = Date.now();

function updateTime() {
  const now = new Date();
  const h = now.getHours(), m = String(now.getMinutes()).padStart(2,'0'), s = String(now.getSeconds()).padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  document.getElementById('time-display').textContent = `${h12}:${m}:${s}`;
  document.getElementById('day-display').textContent = now.toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase();
  document.getElementById('lp-month').textContent = now.toLocaleDateString(undefined, { month: 'long' }).toLowerCase();
  document.getElementById('lp-day').textContent = now.getDate();
}

function updateUptime() {
  const s = Math.floor((Date.now() - uptimeStart) / 1000);
  const mm = String(Math.floor(s/60)).padStart(2,'0');
  const ss = String(s % 60).padStart(2,'0');
  const el = document.getElementById('uptime-val');
  if (el) el.textContent = `${mm}:${ss}`;
}

export function initTimeUI() {
  updateTime();
  setInterval(updateTime, 1000);
  updateUptime();
  setInterval(updateUptime, 1000);
}