import { state } from '../../../app_launcher/state.js';
import { supabaseClient } from '../../../app_launcher/config.js';
import { initializeParticles } from '../module/particles.js';
import { initializeThemeSystem } from '../module/theme.js';
import { showFloatingNote } from '../module/floating.js';

import { initTimeUI } from './ui/time-ui.js';
import { initWeatherUI } from './ui/weather-ui.js';
import { addChatMsg } from './ui/chat-ui.js';
import { initRings } from './rings.js';
import { initCanvasAnimation } from './canvas-anim.js';
import { initModes } from './modes.js';
import { initVoice } from './voice.js';

// Load avatar from localStorage or Supabase
async function loadAvatar() {
  const avatarImg = document.getElementById('avatar-img');
  if (!avatarImg) return;
  
  let avatarUrl = null;

  // 1. Check localStorage first (fast)
  avatarUrl = localStorage.getItem('friday_avatar') || localStorage.getItem('avatar') || localStorage.getItem('userAvatar');
  
  // 2. If not, try to fetch from Supabase using saved persona
  if (!avatarUrl) {
    const savedPersona = localStorage.getItem('vibe_persona');
    if (savedPersona) {
      const personaId = `${savedPersona}_official`;
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('avatar_url')
          .eq('id', personaId)
          .single();
        if (!error && data?.avatar_url) {
          avatarUrl = data.avatar_url;
          localStorage.setItem('friday_avatar', avatarUrl); // cache
        }
      } catch (err) {
        console.warn('Could not fetch avatar from Supabase', err);
      }
    }
  }

  if (avatarUrl) {
    avatarImg.setAttribute('href', avatarUrl);
    avatarImg.setAttribute('opacity', '1');
    // hide the placeholder silhouette
    document.querySelectorAll('#left-panel circle[fill="#00b8d4"], #left-panel ellipse[fill="#00b8d4"]').forEach(el => el.setAttribute('opacity','0'));
  } else {
    console.log('No avatar found, using placeholder');
  }
}

// Main entry
document.addEventListener('DOMContentLoaded', async () => {
  addChatMsg('// HUD initialised — tap mic to speak', 'system');
  
  await loadAvatar();   // wait for avatar to load
  
  initTimeUI();
  initWeatherUI();
  initRings();
  initCanvasAnimation();
  
  // Optional: particles (if you have a canvas with id 'particle-canvas' in HTML)
  const canvasElem = document.getElementById('particle-canvas');
  if (canvasElem) initializeParticles(canvasElem);
  
  initializeThemeSystem();
  initModes();
  initVoice();
  
  showFloatingNote('✨ HUD online · tap mic to speak');
});