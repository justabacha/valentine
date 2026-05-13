import { addChatMsg } from './ui/chat-ui.js';
import { fetchWeatherData } from '../module/weather.js';
import { getCurrentTimeData } from '../module/time.js';
import { fetchLocationData } from '../module/location.js';
import { showFloatingNote } from '../module/floating.js';
import { isFocusMode, setFocusMode } from './modes.js';

let currentRecognition = null;
let isListening = false;
let isProcessing = false;      // to avoid overlapping intents
let pendingIntent = null;      // store intent while focus mode is active

// Intent handler (returns true if intent matched)
async function handleHUDIntent(transcript) {
  const lower = transcript.toLowerCase();
  if (lower.includes('weather') || lower.includes('temperature')) {
    const weather = await fetchWeatherData();
    addChatMsg(`Weather: ${weather.temp}°C, ${weather.condition}. ${weather.icon}`, 'friday');
    return true;
  }
  else if (lower.includes('time') || lower.includes('clock')) {
    const timeData = getCurrentTimeData();
    addChatMsg(`It's ${timeData.timeString} on ${timeData.dateString}.`, 'friday');
    return true;
  }
  else if (lower.includes('location') || lower.includes('where am i')) {
    const location = await fetchLocationData();
    addChatMsg(`You are in ${location.city}. I'm right there with you.`, 'friday');
    return true;
  }
  else if (lower.includes('hello') || lower.includes('hi friday')) {
    addChatMsg("Hello, love. I'm here.", 'friday');
    return true;
  }
  else if (lower.includes('change theme')) {
    addChatMsg("Changing theme ...", 'friday');
    // Simulate heavy task
    await new Promise(r => setTimeout(r, 1500));
    addChatMsg("Theme changed successfully.", 'friday');
    return true;
  }
  else if (lower.includes('focus mode on')) {
    setFocusMode(true);
    addChatMsg("Focus Mode activated. I'll handle one thing at a time.", 'friday');
    return true;
  }
  else if (lower.includes('focus mode off')) {
    setFocusMode(false);
    addChatMsg("Focus Mode deactivated. I'm fully responsive.", 'friday');
    // If there was a pending intent, process it now
    if (pendingIntent) {
      const pending = pendingIntent;
      pendingIntent = null;
      handleHUDIntent(pending);
    }
    return true;
  }
  else {
    // generic fallback – but in continuous mode, maybe just ignore or give a gentle reply
    addChatMsg("I'm here. Just speak naturally.", 'friday');
    return false;
  }
}

// Process intent respecting Focus Mode
async function processIntent(transcript) {
  if (isProcessing) return;
  
  if (isFocusMode() && pendingIntent) {
    // Already have a pending intent; drop this one or queue? For simplicity, ignore new ones.
    addChatMsg("// Focus Mode active. Please wait for current task to finish.", 'system');
    return;
  }
  
  if (isFocusMode()) {
    // Queue this intent and process immediately (but block new ones until done)
    pendingIntent = transcript;
    isProcessing = true;
    await handleHUDIntent(transcript);
    isProcessing = false;
    pendingIntent = null;
  } else {
    // Normal mode: process immediately
    await handleHUDIntent(transcript);
  }
}

// Create recognition instance (continuous mode)
function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addChatMsg('// Speech recognition not supported by your browser', 'system');
    return null;
  }
  const recog = new SpeechRecognition();
  recog.continuous = true;        // stay listening
  recog.interimResults = false;
  recog.lang = 'en-US';
  recog.maxAlternatives = 1;
  return recog;
}

// Start listening (continuous)
async function startListening() {
  // Check permission
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    addChatMsg('// Your browser does not support microphone access', 'system');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // we only need permission
  } catch (err) {
    addChatMsg('// Microphone permission denied. Please grant access and reload.', 'system');
    showFloatingNote('🔇 Microphone blocked');
    return;
  }

  if (currentRecognition) {
    try { currentRecognition.abort(); } catch(e) {}
    currentRecognition = null;
  }

  const recog = createRecognition();
  if (!recog) return;

  recog.onstart = () => {
    isListening = true;
    updateUI(true);
    addChatMsg('// listening...', 'system');
    showFloatingNote('🎤 Listening...');
  };

  recog.onend = () => {
    // In continuous mode, this only happens if user stops it or error.
    if (isListening) {
      // Possibly restart? For now we just update UI.
      isListening = false;
      updateUI(false);
      addChatMsg('// microphone stopped', 'system');
    }
    currentRecognition = null;
  };

  recog.onresult = async (event) => {
    // Get the latest transcript (last result)
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    addChatMsg(transcript, 'user');
    await processIntent(transcript);
    // Do NOT stop listening – stay on.
  };

  recog.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    let msg = '';
    if (event.error === 'not-allowed') msg = 'Microphone access blocked.';
    else if (event.error === 'no-speech') msg = 'No speech detected.';
    else msg = `Error: ${event.error}`;
    addChatMsg(`// ${msg}`, 'system');
    // If error is fatal, stop trying
    if (event.error === 'not-allowed') {
      if (isListening) {
        isListening = false;
        updateUI(false);
      }
      currentRecognition = null;
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
  if (currentRecognition) {
    try { currentRecognition.stop(); } catch(e) {}
    currentRecognition = null;
  }
  if (isListening) {
    isListening = false;
    updateUI(false);
    addChatMsg('// microphone off (manual)', 'system');
  }
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
  // Optionally auto-start? No – let user click mic.
}