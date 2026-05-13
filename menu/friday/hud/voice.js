import { addChatMsg } from './ui/chat-ui.js';
import { fetchWeatherData } from '../module/weather.js';
import { getCurrentTimeData } from '../module/time.js';
import { fetchLocationData } from '../module/location.js';
import { showFloatingNote } from '../module/floating.js';
import { isGhostMode, isFocusMode, setFocusMode } from './modes.js';

let currentRecognition = null;
let isListening = false;
let isSpeaking = false;
let isFillerSpeaking = false;          // FIX 2: guards filler against self-interruption
let restartTimer = null;
let lastSpeechTime = 0;
let silenceThreshold = 1200;           // ms before accepting new user input after FRIDAY speaks
let listeningPower = true;
let fridaySpeechConfidence = 0;
let confidenceDecayInterval = null;    // store interval ID for cleanup

// Strip ONLY emojis, keep letters, numbers, punctuation
function stripEmojis(text) {
  return text.replace(/[\p{Emoji}\uD83C-\uDBFF\uDC00-\uDFFF]/gu, '').trim();
}

// Speak reply (respect Ghost Mode)
// FIX 2: accepts optional isFiller flag so interruption logic ignores its own output
function speak(text, isFiller = false) {
  if (isGhostMode()) return;
  if (!window.speechSynthesis) return;

  const clean = stripEmojis(text);
  if (!clean) return;

  window.speechSynthesis.cancel();
  isSpeaking = true;
  if (isFiller) isFillerSpeaking = true;
  fridaySpeechConfidence = 1.0;
  lastSpeechTime = Date.now();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 1.2;
  utterance.volume = 1.0;

  // Select best voice
  const voices = window.speechSynthesis.getVoices();
  let preferred = null;

  // Priority 1: Google voices (best quality)
  preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
  // Priority 2: macOS natural voices
  if (!preferred) preferred = voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.name.includes('Victoria') && v.lang.startsWith('en'));
  if (!preferred) preferred = voices.find(v => v.name.includes('Karen') && v.lang.startsWith('en'));
  // Priority 3: Microsoft voices (Windows)
  if (!preferred) preferred = voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith('en'));
  // Priority 4: Any en-GB or en-US voice
  if (!preferred) preferred = voices.find(v => v.lang === 'en-GB');
  if (!preferred) preferred = voices.find(v => v.lang === 'en-US');
  // Fallback: first available
  if (!preferred && voices.length > 0) preferred = voices[0];

  if (preferred) utterance.voice = preferred;

  utterance.onend = () => {
    isSpeaking = false;
    isFillerSpeaking = false;          // FIX 2: clear filler flag when done
    fridaySpeechConfidence = 0.8;
    lastSpeechTime = Date.now();
    if (listeningPower && isListening && !currentRecognition) {
      startListening();
    }
  };
  utterance.onerror = () => {
    isSpeaking = false;
    isFillerSpeaking = false;          // FIX 2: clear on error too
    fridaySpeechConfidence = 0;
  };

  window.speechSynthesis.speak(utterance);
}

// FIX 3: Removed isLikelyFridaySpeaking() block from processIntent.
// This helper is kept only for the onresult self-detection guard used in FIX 2.
function isLikelyFridaySpeaking() {
  if (isSpeaking) return true;
  const timeSince = Date.now() - lastSpeechTime;
  if (fridaySpeechConfidence > 0.9 && timeSince < 500) return true;
  if (fridaySpeechConfidence > 0.5 && timeSince < 1200) return true;
  if (timeSince < silenceThreshold) return true;
  return false;
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

// FIX 3: Removed the isLikelyFridaySpeaking() early-return guard.
// FRIDAY now processes intent even while she's talking — the Polite Pivot in
// onresult handles the graceful transition before we ever reach here.
async function processIntent(transcript) {
  if (!isListening) return;

  const lower = transcript.toLowerCase();
  // Allow focus mode commands to bypass the focus lock
  if (lower.includes('focus mode on') || lower.includes('focus mode off')) {
    await handleHUDIntent(transcript);
    return;
  }

  if (isFocusMode()) {
    console.log('[VOICE] Focus mode active – ignoring non-toggle command');
    return;
  }

  await handleHUDIntent(transcript);
  // Continue listening – no auto-stop
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
  recog.interimResults = true;         // FIX 1: real-time partial transcripts enabled
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

  // Clean up existing recognition
  if (currentRecognition) {
    try { currentRecognition.abort(); } catch(e) {}
    currentRecognition = null;
  }

  // Stop any previous confidence decay interval
  if (confidenceDecayInterval) {
    clearInterval(confidenceDecayInterval);
    confidenceDecayInterval = null;
  }

  const recog = createRecognition();
  if (!recog) return;

  recog.onstart = () => {
    isListening = true;
    updateUI(true);
    console.log('[VOICE] Recognition started - listening');
    addChatMsg('// listening continuously...', 'system');
    showFloatingNote('🎤 Listening...');

    // Gradual confidence decay while listening
    confidenceDecayInterval = setInterval(() => {
      if (fridaySpeechConfidence > 0) {
        fridaySpeechConfidence -= 0.05;
      }
      if (!isListening) {
        clearInterval(confidenceDecayInterval);
        confidenceDecayInterval = null;
      }
    }, 100);
  };

  recog.onend = () => {
    console.log('[VOICE] Recognition ended - checking restart');
    currentRecognition = null;
    if (listeningPower && isListening) {
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {                  // FIX 4: 300ms → 100ms
        if (listeningPower && isListening && !currentRecognition) {
          console.log('[VOICE] Restarting recognition');
          startListening();
        }
        restartTimer = null;
      }, 100);
    }
  };

  recog.onresult = async (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.trim();

      // FIX 2: Polite Pivot — if FRIDAY is mid-speech and user speaks (interim or final),
      // cancel her output and acknowledge naturally. Guard against the filler triggering itself.
      if (isSpeaking && !isFillerSpeaking && transcript.length > 1) {
        console.log('[VOICE] Interruption detected — pivoting politely');
        window.speechSynthesis.cancel();
        isSpeaking = false;
        fridaySpeechConfidence = 0;

        const fillers = [
          "Yeah, go on...",
          "Sorry, talk to me.",
          "I'm listening.",
          "Go ahead.",
        ];
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        addChatMsg(filler, 'friday');
        speak(filler, true);           // isFiller = true — won't re-trigger this block
        return;                        // skip further processing this cycle
      }

      // Only process final results for intent routing
      if (event.results[i].isFinal) {
        const confidence = event.results[i][0].confidence ?? 0.5;

        if (!transcript || transcript.length < 2) {
          console.log('[VOICE] Skipping empty/short transcript');
          continue;
        }

        if (confidence < 0.3) {
          console.log(`[VOICE] Ignoring low confidence (${confidence}): "${transcript}"`);
          continue;
        }

        console.log(`[VOICE] Final transcript (conf: ${confidence}): "${transcript}"`);
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
    } else if (event.error === 'no-speech') {
      // continue listening
    } else if (event.error === 'network') {
      if (currentRecognition) {
        try { currentRecognition.abort(); } catch(e) {}
        currentRecognition = null;
      }
      if (listeningPower && isListening) {
        setTimeout(() => startListening(), 500);
      }
    } else {
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
  isFillerSpeaking = false;            // FIX 2: clean up on full stop
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
  window.speechSynthesis.getVoices(); // preload
  listeningPower = false;
  isListening = false;
  updateUI(false);
}