// main.js
import { dom } from './dom.js';
import { showFloatingNote, initDrawer } from './ui.js';
import { initChat, initChatHistory } from './chat.js';
import { renderMemoryList } from './memory.js';
import { SoftParticles } from './particles.js';
import { loadMessages, loadMemories } from './db.js';

let userProfile = null;

// Get user profile from localStorage (set by main app)
function loadUserProfile() {
    const stored = localStorage.getItem('friday_user_profile');
    if (stored) {
        try {
            userProfile = JSON.parse(stored);
            return true;
        } catch(e) { console.error(e); }
    }
    return false;
}

async function initialize() {
    if (!loadUserProfile()) {
        showFloatingNote('Please log in from the main app first.');
        return;
    }

    // Set drawer avatar if available
    if (dom.drawerAvatar && userProfile.avatar_url) {
        dom.drawerAvatar.style.backgroundImage = `url('${userProfile.avatar_url}')`;
        dom.drawerAvatar.style.backgroundSize = "cover";
    }

    // Load data from Supabase and render
    const messages = await loadMessages();
    const memories = await loadMemories();

    // Clear static content
    document.querySelectorAll('#chatArea .message').forEach(msg => msg.remove());
    if (dom.memoryList) dom.memoryList.innerHTML = '';

    initDrawer();
    await renderMemoryList(memories); // we'll modify memory.js to accept data
    await initChatHistory(messages);
    initChat();
}

initialize();

// Voice button (coming soon)
document.getElementById('goToVoice')?.addEventListener('click', (e) => {
    e.preventDefault();
    showFloatingNote("🧠 FRIDAY Brain – coming soon");
});

// Theme switching (unchanged)
document.querySelectorAll('.theme-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const theme = chip.getAttribute('data-theme');
        if (theme) document.body.setAttribute('data-theme', theme);
        showFloatingNote(`🎨 Switched to ${chip.innerText}`);
        if (dom.drawerOverlay.classList.contains('active')) dom.drawerOverlay.classList.remove('active');
        if (window.particleSystem) window.particleSystem.updateThemeHint?.();
    });
});

// Weather & presence (keep your existing code – unchanged)
async function fetchWeatherAndTime() { /* your existing function */ }
fetchWeatherAndTime();
setInterval(fetchWeatherAndTime, 1800000);

// Floating thoughts (unchanged)
const thoughts = ["💧 Drink water, diva", "✨ You disappeared today — missed you", "🌟 Proud of you btw"];
setInterval(() => {
    const randomMsg = thoughts[Math.floor(Math.random() * thoughts.length)];
    showFloatingNote(randomMsg);
}, 14000);

// Particles
if (dom.canvas) window.particleSystem = new SoftParticles(dom.canvas);
setTimeout(() => showFloatingNote("✨ FRIDAY is ready"), 1000);