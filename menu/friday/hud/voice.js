import { addChatMsg } from './ui/chat-ui.js';
import { fetchWeatherData } from '../module/weather.js';
import { getCurrentTimeData } from '../module/time.js';
import { fetchLocationData } from '../module/location.js';
import { showFloatingNote } from '../module/floating.js';
import { isGhostMode, isFocusMode, setFocusMode } from './modes.js';

let currentRecognition = null;
let isListening = false;
let isSpeaking = false;
let restartTimer = null;
let lastSpeechTime = 0;
let silenceThreshold = 1200;
let listeningPower = true;
let fridaySpeechConfidence = 0;
let confidenceDecayInterval = null;
let ignoreResultsUntil = 0;
let interruptionHandled = false;

// Simple beep using Web Audio (optional, silent if fails)
function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    gain.gain.value = 0.2;
    oscillator.type = 'sine';
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
    oscillator.stop(audioCtx.currentTime + 0.3);
    // Resume audio context if suspended (browser policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch(e) { console.warn('Beep failed', e); }
}

// Flash the status dot (add/remove a class)
function blinkStatusDot() {
  const dot = document.getElementById('status-dot');
  if (!dot) return;
  dot.classList.add('blink-fast');
  setTimeout(() => dot.classList.remove('blink-fast'), 300);
}

function stripEmojis(text) {
  return text.replace(/[\p{Emoji}\uD83C-\uDBFF\uDC00-\uDFFF]/gu, '').trim();
}

function speak(text) {
  if (isGhostMode()) return;
  if (!window.speechSynthesis) return;

  const clean = stripEmojis(text);
  if (!clean) return;

  window.speechSynthesis.cancel();
  isSpeaking = true;
  fridaySpeechConfidence = 1.0;
  lastSpeechTime = Date.now();
  ignoreResultsUntil = Date.now() + 1500;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 1.2;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  let preferred = null;
  preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.name.includes('Victoria') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.name.includes('Karen') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.lang === 'en-GB');
  if (!preferred) preferred = voices.find(v => v.lang === 'en-US');
  if (!preferred && voices.length > 0) preferred = voices[0];
  if (preferred) utterance.voice = preferred;

  utterance.onend = () => {
    isSpeaking = false;
    fridaySpeechConfidence = 0.8;
    lastSpeechTime = Date.now();
    if (listeningPower && isListening && !currentRecognition) {
      startListening();
    }
  };
  utterance.onerror = () => {
    isSpeaking = false;
    fridaySpeechConfidence = 0;
  };

  window.speechSynthesis.speak(utterance);
}

function isLikelyFridaySpeaking() {
  if (isSpeaking) return true;
  const timeSince = Date.now() - lastSpeechTime;
  if (fridaySpeechConfidence > 0.9 && timeSince < 500) return true;
  if (fridaySpeechConfidence > 0.5 && timeSince < 1200) return true;
  if (timeSince < silenceThreshold) return true;
  return false;
}

async function handleHUDIntent(transcript) {
  const lower = transcript.toLowerCase();
  let reply = "";

  if (lower.includes('weather') || lower.includes('temperature')) {
    const weather = await fetchWeatherData();
    reply = `Weather update: ${weather.temp} degrees Celsius, ${weather.condition}`;
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('time') || lower.includes('clock')) {
    const timeData = getCurrentTimeData();
    reply = `It's ${timeData.timeString} on ${timeData.dateString}.`;
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('location') || lower.includes('where am i')) {
    const location = await fetchLocationData();
    reply = `You are in ${location.city}. I'm right there with you.`;
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('hello') || lower.includes('hi friday') || lower.includes('hey friday')) {
    reply = "Hello, love. I'm here.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('focus mode on')) {
    setFocusMode(true);
    reply = "Focus Mode activated. I'll stay silent while you work.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('focus mode off')) {
    setFocusMode(false);
    reply = "Focus Mode deactivated. I'm back.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else {
    // generic fallback – do not speak
    return false;
  }
}

async function processIntent(transcript) {
  if (!isListening) return;

  const lower = transcript.toLowerCase();
  if (lower.includes('focus mode on') || lower.includes('focus mode off')) {
    await handleHUDIntent(transcript);
    return;
  }

  if (isFocusMode()) {
    console.log('[VOICE] Focus mode active – ignoring non‑toggle command');
    return;
  }

  await handleHUDIntent(transcript);
}

function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addChatMsg('// Speech recognition not supported', 'system');
    return null;
  }
  const recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = 'en-US';
  recog.maxAlternatives = 1;
  return recog;
}

async function requestMicrophonePermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    addChatMsg('// Microphone not supported', 'system');
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    addChatMsg('// Microphone permission denied. Please grant access in settings.', 'system');
    showFloatingNote('🔇 Microphone blocked');
    return false;
  }
}

async function startListening() {
  if (!listeningPower) return;

  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    listeningPower = false;
    return;
  }

  if (currentRecognition) {
    try { currentRecognition.abort(); } catch(e) {}
    currentRecognition = null;
  }

  if (confidenceDecayInterval) {
    clearInterval(confidenceDecayInterval);
    confidenceDecayInterval = null;
  }

  const recog = createRecognition();
  if (!recog) return;

  recog.onstart = () => {
    isListening = true;
    updateUI(true);
    console.log('[VOICE] Recognition started');
    addChatMsg('// listening continuously...', 'system');
    showFloatingNote('🎤 Listening...');

    confidenceDecayInterval = setInterval(() => {
      if (fridaySpeechConfidence > 0) fridaySpeechConfidence -= 0.05;
      if (!isListening) {
        clearInterval(confidenceDecayInterval);
        confidenceDecayInterval = null;
      }
    }, 100);
  };

  recog.onend = () => {
    console.log('[VOICE] Recognition ended');
    currentRecognition = null;
    if (listeningPower && isListening) {
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (listeningPower && isListening && !currentRecognition) {
          startListening();
        }
        restartTimer = null;
      }, 100);
    }
  };

  recog.onresult = async (event) => {
    if (Date.now() < ignoreResultsUntil) {
      console.log('[VOICE] Cooldown – ignoring');
      return;
    }

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence ?? 0.5;

      // Interrupt FRIDAY if she is speaking and user says something with confidence
      if (isSpeaking && transcript.length > 1 && confidence > 0.5) {
        if (!interruptionHandled) {
          interruptionHandled = true;
          console.log('[VOICE] Interrupting FRIDAY');
          window.speechSynthesis.cancel();
          isSpeaking = false;
          fridaySpeechConfidence = 0;
          
          // Provide non‑speech feedback: floating note + beep + blink
          showFloatingNote('🫡 I\'m listening – go ahead');
          playBeep();
          blinkStatusDot();
          
          setTimeout(() => { interruptionHandled = false; }, 200);
        }
        // After interruption, ignore the interrupting transcript (don't process it as a command)
        return;
      }

      if (result.isFinal) {
        if (!transcript || transcript.length < 2) continue;
        if (confidence < 0.3) continue;

        console.log(`[VOICE] Final: "${transcript}"`);
        addChatMsg(transcript, 'user');
        await processIntent(transcript);
      }
    }
  };

  recog.onerror = (event) => {
    console.error('[VOICE] Error:', event.error);
    if (event.error === 'not-allowed') {
      addChatMsg('// Microphone access blocked. Please reload and grant permission.', 'system');
      isListening = false;
      listeningPower = false;
      updateUI(false);
      currentRecognition = null;
    } else if (event.error === 'network') {
      if (currentRecognition) {
        try { currentRecognition.abort(); } catch(e) {}
        currentRecognition = null;
      }
      if (listeningPower && isListening) setTimeout(() => startListening(), 500);
    }
  };

  currentRecognition = recog;
  try {
    recog.start();
  } catch (err) {
    console.error('[VOICE] Could not start:', err);
    addChatMsg('// Could not start microphone. Try again.', 'system');
    currentRecognition = null;
    if (listeningPower && isListening) setTimeout(() => startListening(), 500);
  }
}

function stopListening() {
  if (restartTimer) clearTimeout(restartTimer);
  if (confidenceDecayInterval) {
    clearInterval(confidenceDecayInterval);
    confidenceDecayInterval = null;
  }
  if (currentRecognition) {
    try { currentRecognition.abort(); } catch(e) {}
    currentRecognition = null;
  }
  if (isListening) {
    isListening = false;
    updateUI(false);
    addChatMsg('// microphone off (manual)', 'system');
  }
  window.speechSynthesis.cancel();
  isSpeaking = false;
  interruptionHandled = false;
}

function updateUI(listening) {
  const btn = document.getElementById('btn-listen');
  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  if (listening) {
    if (btn) { btn.textContent = 'MIC: ON'; btn.classList.add('active'); }
    if (dot) dot.classList.remove('off');
    if (statusText) statusText.textContent = 'Listening';
  } else {
    if (btn) { btn.textContent = 'MIC: OFF'; btn.classList.remove('active'); }
    if (dot) dot.classList.add('off');
    if (statusText) statusText.textContent = 'Mic Off';
  }
}

export function toggleMicrophone() {
  if (isListening) {
    listeningPower = false;
    stopListening();
  } else {
    listeningPower = true;
    startListening();
  }
}

export function setListeningPower(enabled) {
  listeningPower = enabled;
  if (enabled && !isListening) startListening();
  else if (!enabled && isListening) stopListening();
}

export function getListeningPower() {
  return listeningPower;
}

export function resumeListening() {
  if (listeningPower && !isListening) startListening();
}

export function initVoice() {
  const micBtn = document.getElementById('btn-listen');
  if (micBtn && !micBtn._voiceHandler) {
    micBtn.addEventListener('click', toggleMicrophone);
    micBtn._voiceHandler = true;
  }
  window.speechSynthesis.getVoices();
  listeningPower = false;
  isListening = false;
  updateUI(false);
}