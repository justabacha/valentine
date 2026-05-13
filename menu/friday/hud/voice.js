import { addChatMsg } from './ui/chat-ui.js';
import { fetchWeatherData } from '../module/weather.js';
import { getCurrentTimeData } from '../module/time.js';
import { fetchLocationData } from '../module/location.js';
import { showFloatingNote } from '../module/floating.js';
import { isFocusMode, isGhostMode, setFocusMode } from './modes.js';

let currentRecognition = null;
let isListening = false;
let isProcessing = false;
let pendingIntent = null;
let isSpeaking = false;           // prevent self‑trigger
let restartTimer = null;

// Strip emojis and other non‑text characters for speech
function stripEmojis(text) {
  return text.replace(/[\p{Emoji}\uD83C-\uDBFF\uDC00-\uDFFF]+/gu, '').trim();
}

// Speak text (if Ghost Mode OFF)
function speak(text) {
  if (isGhostMode()) return;
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech to avoid overlapping
  window.speechSynthesis.cancel();
  
  const cleanText = stripEmojis(text);
  if (!cleanText) return;
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  // Try to select a natural voice
  const voices = window.speechSynthesis.getVoices();
  let preferred = voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
                  voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                  voices.find(v => v.lang === 'en-GB') ||
                  voices.find(v => v.lang === 'en-US');
  if (preferred) utterance.voice = preferred;
  
  isSpeaking = true;
  utterance.onend = () => {
    isSpeaking = false;
    // After speaking, ensure recognition is still running (restart if needed)
    ensureRecognitionRunning();
  };
  utterance.onerror = () => { isSpeaking = false; };
  
  window.speechSynthesis.speak(utterance);
}

// Ensure recognition is alive (especially for mobile where continuous may fail)
function ensureRecognitionRunning() {
  if (!isListening) return;
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (isListening && (!currentRecognition || !currentRecognition.started)) {
      // Restart recognition
      startListening(true); // silent restart
    }
    restartTimer = null;
  }, 500);
}

// Intent handler – returns reply text
async function handleHUDIntent(transcript) {
  const lower = transcript.toLowerCase();
  let reply = "";

  if (lower.includes('weather') || lower.includes('temperature')) {
    const weather = await fetchWeatherData();
    reply = `Weather update: ${weather.temp}°C, ${weather.condition}`;
    addChatMsg(`${reply} ${weather.icon}`, 'friday');
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
  else if (lower.includes('hello') || lower.includes('hi friday')) {
    reply = "Hello, love. I'm here.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('change theme')) {
    reply = "Changing theme ...";
    addChatMsg(reply, 'friday');
    speak(reply);
    await new Promise(r => setTimeout(r, 1500));
    reply = "Theme changed successfully.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('focus mode on')) {
    setFocusMode(true);
    reply = "Focus Mode activated. I'll handle one thing at a time.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('focus mode off')) {
    setFocusMode(false);
    reply = "Focus Mode deactivated. I'm fully responsive.";
    addChatMsg(reply, 'friday');
    speak(reply);
    if (pendingIntent) {
      const pending = pendingIntent;
      pendingIntent = null;
      handleHUDIntent(pending);
    }
    return true;
  }
  else {
    reply = "I'm here. Just speak naturally.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return false;
  }
}

async function processIntent(transcript) {
  if (isProcessing) return;
  if (isFocusMode() && pendingIntent) {
    addChatMsg("// Focus Mode active. Please wait.", 'system');
    return;
  }
  if (isFocusMode()) {
    pendingIntent = transcript;
    isProcessing = true;
    await handleHUDIntent(transcript);
    isProcessing = false;
    pendingIntent = null;
  } else {
    await handleHUDIntent(transcript);
  }
}

function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addChatMsg('// Speech recognition not supported', 'system');
    return null;
  }
  const recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = false;
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
    addChatMsg('// Microphone permission denied. Please grant access.', 'system');
    showFloatingNote('🔇 Microphone blocked');
    return false;
  }
}

async function startListening(silent = false) {
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) return;

  if (currentRecognition) {
    try { currentRecognition.abort(); } catch(e) {}
    currentRecognition = null;
  }

  const recog = createRecognition();
  if (!recog) return;

  recog.onstart = () => {
    isListening = true;
    updateUI(true);
    if (!silent) addChatMsg('// listening...', 'system');
    showFloatingNote('🎤 Listening...');
  };

  recog.onend = () => {
    // If we're still supposed to be listening, restart (mobile fallback)
    if (isListening) {
      ensureRecognitionRunning();
    } else {
      updateUI(false);
      if (!silent) addChatMsg('// microphone stopped', 'system');
    }
    currentRecognition = null;
  };

  recog.onresult = async (event) => {
    if (isSpeaking) return; // ignore self‑speech
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    addChatMsg(transcript, 'user');
    await processIntent(transcript);
    // No auto‑stop, keep listening
  };

  recog.onerror = (event) => {
    console.error('Speech error', event.error);
    let msg = '';
    if (event.error === 'not-allowed') msg = 'Microphone access blocked.';
    else if (event.error === 'no-speech') msg = 'No speech detected.';
    else msg = `Error: ${event.error}`;
    addChatMsg(`// ${msg}`, 'system');
    if (event.error === 'not-allowed') {
      if (isListening) {
        isListening = false;
        updateUI(false);
      }
      currentRecognition = null;
    } else {
      // try to restart
      ensureRecognitionRunning();
    }
  };

  currentRecognition = recog;
  try {
    recog.start();
  } catch (err) {
    addChatMsg('// Could not start microphone. Try again.', 'system');
    currentRecognition = null;
  }
}

function stopListening() {
  if (restartTimer) clearTimeout(restartTimer);
  if (currentRecognition) {
    try { currentRecognition.stop(); } catch(e) {}
    currentRecognition = null;
  }
  if (isListening) {
    isListening = false;
    updateUI(false);
    addChatMsg('// microphone off (manual)', 'system');
  }
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  isSpeaking = false;
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
    stopListening();
  } else {
    startListening();
  }
}

export function initVoice() {
  const micBtn = document.getElementById('btn-listen');
  if (micBtn && !micBtn._voiceHandler) {
    micBtn.addEventListener('click', toggleMicrophone);
    micBtn._voiceHandler = true;
  }
}