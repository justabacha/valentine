/**
 * voice.js — FRIDAY Voice Engine (Kokoro only, no fallback)
 *
 * Features:
 *  - Continuous listening (always on)
 *  - Interruption detection (user speaks while FRIDAY is talking)
 *  - Post-speech cooldown to prevent self‑listening
 *  - All speech output via Kokoro TTS (no Web Speech)
 */

import { addChatMsg } from './ui/chat-ui.js';
import { fetchWeatherData } from '../module/weather.js';
import { getCurrentTimeData } from '../module/time.js';
import { fetchLocationData } from '../module/location.js';
import { showFloatingNote } from '../module/floating.js';
import { isGhostMode, isFocusMode, setFocusMode } from './modes.js';

// ─── State ─────────────────────────────────────────────────────────────────

let currentAudio = null;          // currently playing Audio element
let recognition = null;
let isListening = false;
let isSpeaking = false;
let listeningEnabled = false;     // master power switch
let ignoreUntil = 0;              // ignore STT results until this timestamp
let restartTimer = null;

// Interruption tracking
let interimStartTime = 0;
let lastInterimText = '';

const POST_SPEECH_BUFFER_MS = 1800;   // silence after speaking before accepting mic
const INTERRUPT_SUSTAIN_MS = 1500;    // ms of sustained interim speech to interrupt
const INTERRUPT_CONFIDENCE = 0.72;    // confidence threshold for interruption

// ─── Utilities ────────────────────────────────────────────────────────────

function stripEmojis(text) {
  return text.replace(/[\p{Emoji}\uD83C-\uDBFF\uDC00-\uDFFF]/gu, '').trim();
}

function blinkReactor() {
  const dot = document.getElementById('status-dot');
  if (!dot) return;
  dot.classList.add('blink');
  setTimeout(() => dot.classList.remove('blink'), 300);
}

function updateUI(listening) {
  const btn = document.getElementById('btn-listen');
  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  if (listening) {
    btn?.classList.add('active');
    if (btn) btn.textContent = 'MIC: ON';
    dot?.classList.remove('off');
    if (statusText) statusText.textContent = 'Listening';
  } else {
    btn?.classList.remove('active');
    if (btn) btn.textContent = 'MIC: OFF';
    dot?.classList.add('off');
    if (statusText) statusText.textContent = 'Mic Off';
  }
}

// ─── Kokoro TTS ───────────────────────────────────────────────────────────

async function speak(text) {
  if (isGhostMode()) return;

  const clean = stripEmojis(text);
  if (!clean) return;

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  isSpeaking = true;
  ignoreUntil = Date.now() + 60000; // temporary, will be updated when audio ends

  try {
    const response = await fetch('/api/kokoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    });

    if (!response.ok) throw new Error(`Kokoro error: ${response.status}`);

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      isSpeaking = false;
      ignoreUntil = Date.now() + POST_SPEECH_BUFFER_MS;

      // Auto‑restart recognition after cooldown
      if (listeningEnabled && isListening && !recognition) {
        setTimeout(() => startRecognition(), POST_SPEECH_BUFFER_MS + 50);
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      isSpeaking = false;
      ignoreUntil = Date.now() + POST_SPEECH_BUFFER_MS;
      addChatMsg('// Audio playback error.', 'system');
    };

    await audio.play();
  } catch (err) {
    console.error('Kokoro TTS failed:', err);
    isSpeaking = false;
    ignoreUntil = Date.now() + POST_SPEECH_BUFFER_MS;
    addChatMsg('// Voice synthesis failed.', 'system');
  }
}

// ─── Intent Handling ──────────────────────────────────────────────────────

async function handleIntent(transcript) {
  const lower = transcript.toLowerCase();

  // Focus mode toggles always pass through
  if (lower.includes('focus mode on')) {
    setFocusMode(true);
    const reply = "Focus Mode activated. I'll stay silent while you work.";
    addChatMsg(reply, 'friday');
    await speak(reply);
    return true;
  }
  if (lower.includes('focus mode off')) {
    setFocusMode(false);
    const reply = "Focus Mode deactivated. I'm back.";
    addChatMsg(reply, 'friday');
    await speak(reply);
    return true;
  }

  if (isFocusMode()) {
    console.log('[VOICE] Focus mode active – ignoring command');
    return true; // consume silently
  }

  // Weather
  if (lower.includes('weather') || lower.includes('temperature')) {
    const w = await fetchWeatherData();
    const reply = `Weather update: ${w.temp} degrees Celsius, ${w.condition}.`;
    addChatMsg(reply, 'friday');
    await speak(reply);
    return true;
  }

  // Time
  if (lower.includes('time') || lower.includes('clock')) {
    const t = getCurrentTimeData();
    const reply = `It's ${t.timeString} on ${t.dateString}.`;
    addChatMsg(reply, 'friday');
    await speak(reply);
    return true;
  }

  // Location
  if (lower.includes('location') || lower.includes('where am i')) {
    const loc = await fetchLocationData();
    const reply = `You are in ${loc.city}. I'm right there with you.`;
    addChatMsg(reply, 'friday');
    await speak(reply);
    return true;
  }

  // Greeting
  if (lower.includes('hello') || lower.includes('hi friday') || lower.includes('hey friday')) {
    const reply = "Hello, love. I'm here.";
    addChatMsg(reply, 'friday');
    await speak(reply);
    return true;
  }

  // No match
  return false;
}

async function processTranscript(transcript) {
  addChatMsg(transcript, 'user');
  const matched = await handleIntent(transcript);
  if (!matched) {
    const reply = "FRIDAY listening.";
    addChatMsg(reply, 'friday');
    await speak(reply);
  }
}

// ─── Speech Recognition ───────────────────────────────────────────────────

function buildRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addChatMsg('// Speech recognition not supported in this browser.', 'system');
    return null;
  }
  const recog = new SR();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = 'en-US';
  recog.maxAlternatives = 1;
  return recog;
}

async function requestMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    addChatMsg('// Microphone API not available.', 'system');
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    addChatMsg('// Microphone permission denied. Grant access in browser settings.', 'system');
    showFloatingNote('🔇 Microphone blocked');
    return false;
  }
}

async function startRecognition() {
  if (!listeningEnabled) return;

  if (recognition) {
    try { recognition.abort(); } catch {}
    recognition = null;
  }

  const hasPermission = await requestMicPermission();
  if (!hasPermission) {
    listeningEnabled = false;
    updateUI(false);
    return;
  }

  const recog = buildRecognition();
  if (!recog) return;

  recog.onstart = () => {
    isListening = true;
    updateUI(true);
    console.log('[VOICE] Recognition started');
    addChatMsg('// listening…', 'system');
    showFloatingNote('🎤 Listening…');
  };

  recog.onend = () => {
    console.log('[VOICE] Recognition ended');
    recognition = null;

    if (listeningEnabled && isListening && !isSpeaking) {
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        restartTimer = null;
        if (listeningEnabled && !recognition && !isSpeaking) {
          startRecognition();
        }
      }, 150);
    }
  };

  recog.onresult = async (event) => {
    if (Date.now() < ignoreUntil) {
      console.log('[VOICE] Cooldown – ignoring');
      return;
    }

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence ?? 0.5;

      if (!result.isFinal) {
        // Interruption detection
        if (isSpeaking && transcript.length > 2) {
          const isNewPhrase = transcript !== lastInterimText;
          if (isNewPhrase) {
            if (interimStartTime === 0) interimStartTime = Date.now();
            lastInterimText = transcript;
          }
          const sustainedMs = Date.now() - interimStartTime;
          if (sustainedMs >= INTERRUPT_SUSTAIN_MS && confidence >= INTERRUPT_CONFIDENCE) {
            console.log('[VOICE] Interruption confirmed after', sustainedMs, 'ms');
            // Stop any playing audio
            if (currentAudio) {
              currentAudio.pause();
              currentAudio = null;
            }
            isSpeaking = false;
            ignoreUntil = Date.now() + POST_SPEECH_BUFFER_MS;
            interimStartTime = 0;
            lastInterimText = '';
            addChatMsg('// Interrupted — listening.', 'system');
            blinkReactor();
            showFloatingNote('🔄 Interrupted — listening');
          }
        }
        continue;
      }

      // Final result – reset interruption tracking
      interimStartTime = 0;
      lastInterimText = '';

      if (!transcript || transcript.length < 2) continue;
      if (confidence < 0.30) {
        console.log('[VOICE] Low confidence final, discarding:', confidence);
        continue;
      }

      console.log(`[VOICE] Final (conf ${confidence.toFixed(2)}): "${transcript}"`);
      await processTranscript(transcript);
    }
  };

  recog.onerror = (event) => {
    console.error('[VOICE] Error:', event.error);
    if (event.error === 'not-allowed') {
      addChatMsg('// Microphone blocked. Reload and grant permission.', 'system');
      isListening = false;
      listeningEnabled = false;
      updateUI(false);
      recognition = null;
    } else if (event.error === 'network') {
      if (recognition) {
        try { recognition.abort(); } catch {}
        recognition = null;
      }
      if (listeningEnabled && isListening) setTimeout(() => startRecognition(), 600);
    }
  };

  recognition = recog;
  try {
    recog.start();
  } catch (err) {
    console.error('[VOICE] Could not start recognition:', err);
    addChatMsg('// Could not start microphone. Try again.', 'system');
    recognition = null;
    if (listeningEnabled) setTimeout(() => startRecognition(), 800);
  }
}

function stopRecognition() {
  if (restartTimer) clearTimeout(restartTimer);
  if (recognition) {
    try { recognition.abort(); } catch {}
    recognition = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  isListening = false;
  isSpeaking = false;
  interimStartTime = 0;
  lastInterimText = '';
  ignoreUntil = 0;
  updateUI(false);
  addChatMsg('// Microphone off.', 'system');
}

// ─── Public API ───────────────────────────────────────────────────────────

export function toggleMicrophone() {
  if (isListening) {
    listeningEnabled = false;
    stopRecognition();
  } else {
    listeningEnabled = true;
    startRecognition();
  }
}

export function setListeningPower(enabled) {
  listeningEnabled = enabled;
  if (enabled && !isListening) startRecognition();
  if (!enabled && isListening) stopRecognition();
}

export function getListeningPower() {
  return listeningEnabled;
}

export function resumeListening() {
  if (listeningEnabled && !isListening) startRecognition();
}

export function initVoice() {
  const micBtn = document.getElementById('btn-listen');
  if (micBtn && !micBtn._voiceHandler) {
    micBtn.addEventListener('click', toggleMicrophone);
    micBtn._voiceHandler = true;
  }
  listeningEnabled = false;
  isListening = false;
  updateUI(false);
}