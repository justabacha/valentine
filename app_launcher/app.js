import { state } from './state.js';
import { checkGate, handleGateInput } from './auth.js';
import { handleImageUpload, saveSetup, openSettings } from './profile.js';
import { setDynamicGreeting, updateDate, generateVibe, startVibeParade, downloadCard } from './vibe.js';
import { supabaseClient } from './config.js'; 

// 🌍 expose functions to HTML (VERY IMPORTANT)
window.checkGate = checkGate;
window.handleGateInput = handleGateInput;
window.handleImageUpload = handleImageUpload;
window.saveSetup = saveSetup;
window.openSettings = openSettings;
window.startVibeParade = startVibeParade;
window.downloadCard = downloadCard;

// Service Worker block 
/***************************************************************************/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log("Vibe Service Worker Registered 🦾");

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version detected and installed, auto-reloading to apply heat!
            console.log("New version found! Reloading...");
            window.location.reload();
          }
        });
      });
    }).catch((err) => console.log("SW Failed:", err));
  });
}
/***************************************************************************/

export function launchApp() {
    const lockscreen = document.getElementById('lockscreen');
    if (lockscreen) {
        lockscreen.style.opacity = "0";
        setTimeout(() => lockscreen.style.display = "none", 500);
        const menu = document.getElementById('vibe-menu-root'); if (menu) menu.style.display = "block";
    }

    const headerAvatar = document.getElementById('header-avatar-circle');
    if (headerAvatar && state.userProfile?.avatar) {
        headerAvatar.style.backgroundImage = `url('${state.userProfile.avatar}')`;
        headerAvatar.style.backgroundSize = "cover";
    }

    updateDate();
    generateVibe();

    if (state.userProfile?.persona) {
        setDynamicGreeting(state.userProfile.persona);
    } else {
        setDynamicGreeting('Phesty');
    }
}

// SESSION LOGIC
document.addEventListener('DOMContentLoaded', async () => {

    document.getElementById('gate-overlay').classList.add('hidden');
    document.getElementById('lockscreen').style.display = "none";

    const savedPersona = localStorage.getItem('vibe_persona');

    if (savedPersona) {
        state.currentPersonaId = `${savedPersona}_official`;
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', state.currentPersonaId)
            .single();

        if (data && !error) {
            state.userProfile = {
                displayName: data.display_name,
                avatar: data.avatar_url,
                persona: data.persona
            };

            launchApp();
            return;
        }
    }
    
    // show gate if no session
    document.getElementById('gate-overlay').classList.remove('hidden');
    console.log("No session. Gate is now active, blud.");
});

let deferredPrompt;
const installModal = document.getElementById('install-modal');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installModal) installModal.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installModal.style.display = 'none';
    });
}

const closeBtn = document.getElementById('close-modal');
if (closeBtn) {
    closeBtn.addEventListener('click', () => { installModal.style.display = 'none'; });
}