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

// Strip ONLY emojis, keep letters, numbers, punctuation
function stripEmojis(text) {
  return text.replace(/[\p{Emoji}\uD83C-\uDBFF\uDC00-\uDFFF]/gu, '');
}

// Speak reply (respect Ghost Mode, set speaking flag)
function speak(text) {
  if (isGhostMode()) return;
  if (!window.speechSynthesis) return;
  const clean = stripEmojis(text);
  if (!clean) return;
  
  // Cancel any ongoing speech to avoid overlap
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  // Choose a clear voice (prefer Google or built‑in)
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
                    voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                    voices.find(v => v.lang === 'en-GB') ||
                    voices.find(v => v.lang === 'en-US');
  if (preferred) utterance.voice = preferred;
  
  isSpeaking = true;
  utterance.onend = () => {
    isSpeaking = false;
  };
  utterance.onerror = () => {
    isSpeaking = false;
  };
  window.speechSynthesis.speak(utterance);
}

// Intent handler (same as before)
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
  else if (lower.includes('focus mode on')) {
    setFocusMode(true);
    reply = "Focus Mode activated.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else if (lower.includes('focus mode off')) {
    setFocusMode(false);
    reply = "Focus Mode deactivated.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return true;
  }
  else {
    reply = "I'm here. Just speak naturally.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return false;
  }
}

// Process intent (respect Focus Mode)
async function processIntent(transcript) {
  if (!isListening) return;
  await handleHUDIntent(transcript);
  // No auto-stop – keep listening
}

// Create recognition instance (continuous)
function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addChatMsg('// Speech recognition not supported', 'system');
    return null;
  }
  const recog = new SpeechRecognition();
  recog.continuous = true;       // always listening
  recog.interimResults = false;
  recog.lang = 'en-US';
  recog.maxAlternatives = 1;
  return recog;
}

// Request microphone permission once
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

// Start continuous listening
async function startListening() {
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) return;

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
    addChatMsg('// listening continuously...', 'system');
    showFloatingNote('🎤 Listening...');
  };

  recog.onend = () => {
    // If we're still supposed to be listening, restart (important for mobile)
    if (isListening) {
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (isListening && !currentRecognition) {
          startListening();
        }
        restartTimer = null;
      }, 500);
    }
    currentRecognition = null;
  };

  recog.onresult = async (event) => {
    if (isSpeaking) return; // ignore own voice
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript;
        addChatMsg(transcript, 'user');
        await processIntent(transcript);
      }
    }
  };

  recog.onerror = (event) => {
    console.error('Speech error', event.error);
    if (event.error === 'not-allowed') {
      addChatMsg('// Microphone access blocked. Please reload and grant permission.', 'system');
      if (isListening) {
        isListening = false;
        updateUI(false);
      }
      currentRecognition = null;
    } else if (event.error === 'no-speech') {
      // ignore, continue listening
    } else {
      addChatMsg(`// Speech error: ${event.error}`, 'system');
      // attempt restart
      if (currentRecognition) {
        try { currentRecognition.abort(); } catch(e) {}
        currentRecognition = null;
      }
      if (isListening) {
        startListening();
      }
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
  // Preload voices (optional)
  window.speechSynthesis.getVoices();
}