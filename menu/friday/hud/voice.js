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
let silenceThreshold = 800; // ms - wait before accepting new user input after FRIDAY stops speaking
let listeningPower = true; // NEW: listening power control to keep mic alive

// Strip ONLY digits and special characters that might cause issues, keep letters and punctuation
function stripProblematicChars(text) {
  // Remove numbers and problematic unicode that cause voice synthesis issues
  return text.replace(/\d+/g, '').trim();
}

// Speak reply (respect Ghost Mode, set speaking flag)
function speak(text) {
  if (isGhostMode()) {
    // In ghost mode, just add to chat but don't speak
    return;
  }
  if (!window.speechSynthesis) return;
  
  const clean = stripProblematicChars(text);
  if (!clean) return;
  
  // Cancel any ongoing speech to avoid overlap
  window.speechSynthesis.cancel();
  isSpeaking = true;
  lastSpeechTime = Date.now();
  
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 1.2;
  utterance.volume = 1.0;
  
  // Select best voice for phone/desktop - prefer natural-sounding voices
  const voices = window.speechSynthesis.getVoices();
  let preferred = null;
  
  // Priority 1: Google voices (best quality across platforms)
  preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
  
  // Priority 2: Natural-sounding system voices
  if (!preferred) {
    preferred = voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en'));
  }
  if (!preferred) {
    preferred = voices.find(v => v.name.includes('Victoria') && v.lang.startsWith('en'));
  }
  if (!preferred) {
    preferred = voices.find(v => v.name.includes('Karen') && v.lang.startsWith('en'));
  }
  
  // Priority 3: Any en-GB voice
  if (!preferred) {
    preferred = voices.find(v => v.lang === 'en-GB');
  }
  
  // Priority 4: Any en-US voice
  if (!preferred) {
    preferred = voices.find(v => v.lang === 'en-US');
  }
  
  // Fallback: use first available voice
  if (!preferred && voices.length > 0) {
    preferred = voices[0];
  }
  
  if (preferred) {
    utterance.voice = preferred;
  }
  
  utterance.onend = () => {
    isSpeaking = false;
    lastSpeechTime = Date.now();
    // Keep listening power on after FRIDAY finishes speaking
    if (listeningPower && isListening && !currentRecognition) {
      startListening();
    }
  };
  
  utterance.onerror = () => {
    isSpeaking = false;
    lastSpeechTime = Date.now();
  };
  
  window.speechSynthesis.speak(utterance);
}

// Check if audio is likely FRIDAY speaking (use energy detection + timing)
function isLikelyFridaySpeaking() {
  // If less than threshold time has passed since we started speaking, it's us
  const timeSinceSpeechStart = Date.now() - lastSpeechTime;
  return isSpeaking || timeSinceSpeechStart < silenceThreshold;
}

// Intent handler
async function handleHUDIntent(transcript) {
  const lower = transcript.toLowerCase();
  let reply = "";

  if (lower.includes('weather') || lower.includes('temperature')) {
    const weather = await fetchWeatherData();
    reply = `Weather update: ${weather.temp} degrees Celsius, ${weather.condition}`;
    addChatMsg(`${reply}`, 'friday');
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
    reply = "I'm here. Just speak naturally.";
    addChatMsg(reply, 'friday');
    speak(reply);
    return false;
  }
}

// Process intent (respect Focus Mode and prevent self-listening)
async function processIntent(transcript) {
  if (!isListening) return;
  
  // Don't process if it's likely FRIDAY speaking
  if (isLikelyFridaySpeaking()) {
    console.log('[VOICE] Ignoring transcript - detected as FRIDAY speech');
    return;
  }
  
  // Don't process if in focus mode (keep listening silently)
  if (isFocusMode()) {
    console.log('[VOICE] Focus mode active - not processing intent');
    return;
  }
  
  await handleHUDIntent(transcript);
  // Continue listening - NO auto-stop
}

// Create recognition instance (continuous)
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
    addChatMsg('// Microphone permission denied. Please grant access in settings.', 'system');
    showFloatingNote('🔇 Microphone blocked');
    return false;
  }
}

// Start continuous listening with listening power
async function startListening() {
  if (!listeningPower) {
    console.log('[VOICE] Listening power is OFF');
    return;
  }
  
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    listeningPower = false;
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
    console.log('[VOICE] Recognition started - listening');
    addChatMsg('// listening continuously...', 'system');
    showFloatingNote('🎤 Listening...');
  };

  recog.onend = () => {
    console.log('[VOICE] Recognition ended - checking if we should restart');
    currentRecognition = null;
    
    // NEW: Use listening power to decide if we restart
    if (listeningPower && isListening) {
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (listeningPower && isListening && !currentRecognition) {
          console.log('[VOICE] Restarting recognition (listening power active)');
          startListening();
        }
        restartTimer = null;
      }, 300); // Faster restart on mobile
    }
  };

  recog.onresult = async (event) => {
    // NEW: Enhanced check - don't process if FRIDAY is speaking
    if (isLikelyFridaySpeaking()) {
      console.log('[VOICE] Ignoring results - FRIDAY is speaking');
      return;
    }
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript.trim();
        
        // Don't process empty transcripts or very short noise
        if (!transcript || transcript.length < 2) {
          continue;
        }
        
        console.log('[VOICE] Final transcript:', transcript);
        addChatMsg(transcript, 'user');
        await processIntent(transcript);
      }
    }
  };

  recog.onerror = (event) => {
    console.error('[VOICE] Speech error:', event.error);
    
    if (event.error === 'not-allowed') {
      addChatMsg('// Microphone access blocked. Please reload and grant permission.', 'system');
      isListening = false;
      listeningPower = false;
      updateUI(false);
      currentRecognition = null;
    } 
    else if (event.error === 'no-speech') {
      // Continue listening on no-speech
      console.log('[VOICE] No speech detected, continuing to listen');
    } 
    else if (event.error === 'network') {
      // Network error - attempt restart
      console.log('[VOICE] Network error, restarting');
      if (currentRecognition) {
        try { currentRecognition.abort(); } catch(e) {}
        currentRecognition = null;
      }
      if (listeningPower && isListening) {
        setTimeout(() => startListening(), 500);
      }
    }
    else {
      addChatMsg(`// Speech error: ${event.error}`, 'system');
      if (currentRecognition) {
        try { currentRecognition.abort(); } catch(e) {}
        currentRecognition = null;
      }
      if (listeningPower && isListening) {
        setTimeout(() => startListening(), 500);
      }
    }
  };

  currentRecognition = recog;
  try {
    recog.start();
  } catch (err) {
    console.error('[VOICE] Could not start microphone:', err);
    addChatMsg('// Could not start microphone. Try again.', 'system');
    currentRecognition = null;
    if (listeningPower && isListening) {
      setTimeout(() => startListening(), 500);
    }
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
    if (btn) { 
      btn.textContent = 'MIC: ON'; 
      btn.classList.add('active'); 
    }
    if (dot) dot.classList.remove('off');
    if (statusText) statusText.textContent = 'Listening';
  } else {
    if (btn) { 
      btn.textContent = 'MIC: OFF'; 
      btn.classList.remove('active'); 
    }
    if (dot) dot.classList.add('off');
    if (statusText) statusText.textContent = 'Mic Off';
  }
}

export function toggleMicrophone() {
  if (isListening) {
    listeningPower = false; // Turn off listening power when manually stopping
    stopListening();
  } else {
    listeningPower = true; // Turn on listening power when manually starting
    startListening();
  }
}

// NEW: Function to toggle listening power externally (used by other modules)
export function setListeningPower(enabled) {
  listeningPower = enabled;
  if (enabled && !isListening) {
    startListening();
  } else if (!enabled && isListening) {
    stopListening();
  }
}

// NEW: Get current listening power state
export function getListeningPower() {
  return listeningPower;
}

// NEW: Can be called after focus mode completes
export function resumeListening() {
  if (listeningPower && !isListening) {
    startListening();
  }
}

export function initVoice() {
  const micBtn = document.getElementById('btn-listen');
  if (micBtn && !micBtn._voiceHandler) {
    micBtn.addEventListener('click', toggleMicrophone);
    micBtn._voiceHandler = true;
  }
  // Preload voices
  window.speechSynthesis.getVoices();
  
  // Make sure listening power defaults to OFF unless user enables it
  listeningPower = false;
  isListening = false;
  updateUI(false);
}