import { initializeFridaySession } from './session.js';
import { initializeChat } from './chat.js';
import { initializeDrawer } from './drawer.js';
import { initializePresence } from './presence.js';
import { initializeFloatingSystem } from './floating.js';
import { initializeParticles } from './particles.js';
import { initializeThemeSystem } from './theme.js';

// ========================================
// SPLASH SCREEN HELPERS
// ========================================
function updateSplashStatus(text, percent) {
    const statusEl = document.getElementById('splashStatus');
    const progressBar = document.querySelector('.progress-bar');
    if (statusEl) statusEl.innerText = text;
    if (progressBar) progressBar.style.width = `${percent}%`;
}

function generateStars() {
    const starsContainer = document.querySelector('.splash-stars');
    if (!starsContainer) return;
    // Clear any existing content
    starsContainer.innerHTML = '';
    const starCount = 120;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 2 + 0.5;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.backgroundColor = 'white';
        star.style.borderRadius = '50%';
        star.style.opacity = Math.random() * 0.7 + 0.2;
        star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate`;
        starsContainer.appendChild(star);
    }
}

// ========================================
// MAIN ENTRY POINT
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    const MIN_SPLASH_MS = 3000;
    const splashStart = Date.now();

    // Generate stars immediately
    generateStars();

    updateSplashStatus("restoring session...", 10);

    const sessionReady = await initializeFridaySession();
    if (!sessionReady) return;

    updateSplashStatus("loading memories & timeline", 40);

    initializeDrawer();
    const chatReady = initializeChat();   // returns promise after history loads
    initializePresence();
    initializeFloatingSystem();
    initializeThemeSystem();

    const canvas = document.getElementById('particle-canvas');
    if (canvas) initializeParticles(canvas);

    updateSplashStatus("preparing your atmosphere", 70);

    await chatReady;

    updateSplashStatus("almost there...", 90);

    // Ensure minimum splash duration
    const elapsed = Date.now() - splashStart;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

    setTimeout(() => {
        updateSplashStatus("ready", 100);
        const splash = document.getElementById('fridaySplash');
        if (splash) {
            splash.classList.add('hide');
            // Remove from DOM after fade
            setTimeout(() => {
                if (splash && splash.parentNode) splash.remove();
            }, 800);
        }
    }, remaining);
});