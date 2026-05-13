import { addChatMsg } from './ui/chat-ui.js';
import { toggleMicrophone } from './voice.js';

let focusMode = true;
let ghostMode = true;

function updateModeUI() {
  const focusBtn = document.getElementById('btn-focus');
  const ghostBtn = document.getElementById('btn-ghost');
  const focusPill = document.getElementById('pill-focus');
  const ghostPill = document.getElementById('pill-ghost');
  
  if (focusBtn) focusBtn.classList.toggle('active', focusMode);
  if (ghostBtn) ghostBtn.classList.toggle('active', ghostMode);
  if (focusPill) focusPill.classList.toggle('active', focusMode);
  if (ghostPill) ghostPill.classList.toggle('active', ghostMode);
}

function toggleFocus() {
  focusMode = !focusMode;
  updateModeUI();
  addChatMsg(`// Focus Mode ${focusMode ? 'activated' : 'deactivated'}`, 'system');
}

function toggleGhost() {
  ghostMode = !ghostMode;
  updateModeUI();
  addChatMsg(`// Ghost Mode ${ghostMode ? 'activated' : 'deactivated'}`, 'system');
}

// Exported setters
export function setFocusMode(enabled) {
  focusMode = enabled;
  updateModeUI();
}

export function setGhostMode(enabled) {
  ghostMode = enabled;
  updateModeUI();
}

export function isFocusMode() { return focusMode; }
export function isGhostMode() { return ghostMode; }

export function initModes() {
  const focusBtn = document.getElementById('btn-focus');
  const ghostBtn = document.getElementById('btn-ghost');
  const focusPill = document.getElementById('pill-focus');
  const ghostPill = document.getElementById('pill-ghost');
  
  if (focusBtn) focusBtn.addEventListener('click', toggleFocus);
  if (ghostBtn) ghostBtn.addEventListener('click', toggleGhost);
  if (focusPill) focusPill.addEventListener('click', toggleFocus);
  if (ghostPill) ghostPill.addEventListener('click', toggleGhost);
  
  const micBtn = document.getElementById('btn-listen');
  if (micBtn && !micBtn._modeHandler) {
    micBtn.addEventListener('click', toggleMicrophone);
    micBtn._modeHandler = true;
  }
  
  updateModeUI();
}