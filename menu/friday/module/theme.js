import { closeDrawer } from './drawer.js';

// ========================================
// INITIALIZER
// ========================================
export function initializeThemeSystem() {
    loadSavedTheme();
    setupThemeChips();
    console.log("Theme engine online 🎨");
}

// ========================================
// APPLY THEME
// ========================================
export function applyTheme(theme) {
    if (!theme) return;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('friday_theme', theme);
}

// ========================================
// LOAD SAVED THEME
// ========================================
export function loadSavedTheme() {
    const saved = localStorage.getItem('friday_theme');
    if (saved) {
        applyTheme(saved);
    }
}

// ========================================
// CHIP HANDLERS (with drawer close)
// ========================================
function setupThemeChips() {
    const chips = document.querySelectorAll('.theme-chip');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const theme = chip.getAttribute('data-theme');
            applyTheme(theme);
            showThemeFeedback(chip.innerText);
            closeDrawer();  // ✅ drawer closes after theme change
        });
    });
}

// ========================================
// FEEDBACK POPUP (floating note)
// ========================================
function showThemeFeedback(label) {
    const event = new CustomEvent('friday:float', {
        detail: `🎨 Switched to ${label} · atmosphere melted`
    });
    window.dispatchEvent(event);
}