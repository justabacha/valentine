import { addChatMsg } from './ui/chat-ui.js';
import { fetchWeatherData } from '../module/weather.js';
import { getCurrentTimeData } from '../module/time.js';
import { fetchLocationData } from '../module/location.js';
import { showFloatingNote } from '../module/floating.js';

let currentRecognition = null;
let isListening = false;

// Helper: request microphone permission explicitly (triggers browser prompt)
async function requestMicrophonePermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    addChatMsg('// Your browser does not support microphone access', 'system');
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // release immediately, we only need permission
    return true;
  } catch (err) {
    console.error('Microphone permission denied', err);
    addChatMsg('// Microphone permission denied. Please grant access and reload.', 'system');
    showFloatingNote('🔇 Microphone blocked – check browser settings');
    return false;
  }
}

// Intent handler
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
  else {
    addChatMsg("I'm listening, always. How can I help?", 'friday');
    return false;
  }
}

// Create a new recognition instance
function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addChatMsg('// Speech recognition not supported by your browser', 'system');
    return null;
  }
  const recog = new SpeechRecognition();
  recog.continuous = false;
  recog.interimResults = false;
  recog.lang = 'en-US';
  recog.maxAlternatives = 1;
  return recog;
}

// Start listening
async function startListening() {
  // First, ensure we have permission
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    updateUI(false);
    return;
  }

  // Clean up any existing recognition
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
    if (isListening) {
      // Natural end (after one utterance) – we stop listening mode
      isListening = false;
      updateUI(false);
      addChatMsg('// listening stopped', 'system');
      showFloatingNote('🎤 Microphone off');
    }
    currentRecognition = null;
  };

  recog.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    addChatMsg(transcript, 'user');
    await handleHUDIntent(transcript);
    // After handling, stop listening (manual mode – one utterance per click)
    stopListening();
  };

  recog.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    let errorMsg = '';
    if (event.error === 'not-allowed') errorMsg = 'Microphone access blocked. Please grant permission.';
    else if (event.error === 'no-speech') errorMsg = 'No speech detected. Try again.';
    else errorMsg = `Error: ${event.error}`;
    addChatMsg(`// ${errorMsg}`, 'system');
    if (isListening) {
      isListening = false;
      updateUI(false);
    }
    currentRecognition = null;
  };

  currentRecognition = recog;
  try {
    recog.start();
  } catch (err) {
    console.error('Failed to start recognition', err);
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
}