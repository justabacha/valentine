// settings.js
import { injectSettingsModal, closeSettingsModal } from './settings-ui.js';
import { applyGlobalTheme, applyWishlistTheme, openPreview, closePreview, applyFromPreview, hideChoicePopup } from './settings-actions.js';

let selectedThemeType = null;
let selectedThemeName = null;

function bindEvents() {
    // Close modal
    const closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);

    // Theme card clicks
    document.querySelectorAll('.settings-modal-overlay .theme-item').forEach(card => {
        card.addEventListener('click', (e) => {
            const grid = card.closest('.theme-grid');
            if (!grid) return;
            selectedThemeType = grid.dataset.themeType;
            selectedThemeName = card.dataset.themeName;
            const choicePopup = document.getElementById('choice-card');
            if (choicePopup) choicePopup.classList.remove('hidden');
        });
    });

    // Choice popup buttons
    const applyBtn = document.getElementById('btn-apply');
    const viewBtn = document.getElementById('btn-view');
    const cancelBtn = document.querySelector('.close-choice');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            if (selectedThemeType === 'global') applyGlobalTheme(selectedThemeName);
            else if (selectedThemeType === 'wishlist') applyWishlistTheme(selectedThemeName);
            hideChoicePopup();
            closeSettingsModal();
        });
    }
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            openPreview(selectedThemeType, selectedThemeName);
            hideChoicePopup();
        });
    }
    if (cancelBtn) cancelBtn.addEventListener('click', hideChoicePopup);

    // Preview close & apply
    const closePreviewBtn = document.getElementById('close-preview-btn');
    if (closePreviewBtn) closePreviewBtn.addEventListener('click', closePreview);
    document.querySelectorAll('.apply-inside-btn').forEach(btn => {
        btn.addEventListener('click', applyFromPreview);
    });

    // Click outside popup to close
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('choice-card');
        if (popup && !popup.classList.contains('hidden')) {
            if (!popup.contains(e.target) && !e.target.closest('.theme-item')) {
                hideChoicePopup();
            }
        }
    });
}

export function initSettings(gearElement) {
    if (!gearElement) return;
    gearElement.addEventListener('click', (e) => {
        e.preventDefault();
        injectSettingsModal();
        bindEvents();
    });
}

export function loadSavedTheme() {
    const saved = localStorage.getItem('global_theme');
    if (saved && saved !== 'default') applyGlobalTheme(saved);
}