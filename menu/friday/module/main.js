import { initializeFridaySession } from './session.js';
import { initializeChat } from './chat.js';
import { initializeDrawer } from './drawer.js';
import { showStarkModal } from './modal.js';
import { initializePresence } from './presence.js';
import { initializeFloatingSystem } from './floating.js';
import { initializeParticles } from './particles.js';
import { initializeThemeSystem } from './theme.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const sessionReady = await initializeFridaySession();

    if (!sessionReady) return;

    console.log("FRIDAY systems online ✨");

    initializeDrawer();
    initializeChat();
    initializePresence();
    initializeFloatingSystem();
    initializeThemeSystem();
    
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        initializeParticles(canvas);
    }
});