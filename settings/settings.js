// settings.js
import { injectSettingsModal, closeSettingsModal } from './settings-ui.js';
import {
    applyGlobalTheme,
    applyPageTheme,
    openPreview,
    closePreview,
    applyFromPreview,
    hideChoicePopup,
    resetGlobalTheme,
    resetPageTheme
} from './settings-actions.js';
import { settingsState } from './settings-state.js';

let selectedThemeType = null;
let selectedThemeName = null;

function bindEvents() {
    const closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);

    document.querySelectorAll('.settings-modal-overlay .theme-item').forEach(card => {
        card.addEventListener('click', (e) => {
            const grid = card.closest('.theme-grid');
            if (!grid) return;
            const themeType = grid.dataset.themeType;
            const themeName = card.dataset.themeName;
            selectedThemeType = themeType;
            selectedThemeName = themeName;

            let isActive = false;
            if (themeType === 'global') {
                isActive = (settingsState.activeGlobalTheme === themeName);
            } else {
                const activeKey = `active${capitalize(themeType)}Theme`;
                isActive = (settingsState[activeKey] === themeName);
            }

            const applyBtn = document.getElementById('btn-apply');
            if (applyBtn) {
                if (isActive && themeName !== 'default') {
                    applyBtn.textContent = 'Revert to Default';
                    applyBtn.dataset.action = 'revert';
                } else {
                    applyBtn.textContent = 'Apply Theme';
                    applyBtn.dataset.action = 'apply';
                }
            }
            const choicePopup = document.getElementById('choice-card');
            if (choicePopup) choicePopup.classList.remove('hidden');
        });
    });

    const applyBtn = document.getElementById('btn-apply');
    const viewBtn = document.getElementById('btn-view');
    const cancelBtn = document.querySelector('.close-choice');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const action = applyBtn.dataset.action;
            if (action === 'revert') {
                if (selectedThemeType === 'global') {
                    resetGlobalTheme();
                } else {
                    resetPageTheme(selectedThemeType);
                }
            } else {
                if (selectedThemeType === 'global') {
                    applyGlobalTheme(selectedThemeName);
                } else {
                    applyPageTheme(selectedThemeType, selectedThemeName);
                }
            }
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

    const closePreviewBtn = document.getElementById('close-preview-btn');
    if (closePreviewBtn) closePreviewBtn.addEventListener('click', closePreview);
    document.querySelectorAll('.apply-inside-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyFromPreview();
            closeSettingsModal();
        });
    });

    document.addEventListener('click', (e) => {
        const popup = document.getElementById('choice-card');
        if (popup && !popup.classList.contains('hidden')) {
            if (!popup.contains(e.target) && !e.target.closest('.theme-item')) {
                hideChoicePopup();
            }
        }
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function initSettings(gearElement) {
    if (!gearElement) return;
    gearElement.addEventListener('click', async (e) => {
        e.preventDefault();
        await injectSettingsModal();
        bindEvents();
    });
}

export async function loadSavedTheme() {
    // First, ensure settingsState is populated with stored themes
    const globalTheme = localStorage.getItem('global_theme');
    const page = getCurrentPage();
    const pageTheme = localStorage.getItem(`${page}_theme`);

    const existingLink = document.getElementById('dynamic-theme');
    if (existingLink) existingLink.remove();

    if (pageTheme && pageTheme !== 'default') {
        const themeFile = `/themes/${page}/${pageTheme}.css`;
        const link = document.createElement('link');
        link.id = 'dynamic-theme';
        link.rel = 'stylesheet';
        link.href = themeFile;
        document.head.appendChild(link);
        settingsState[`active${capitalize(page)}Theme`] = pageTheme;
        console.log(`Loaded ${page} theme: ${pageTheme}`);
    } else if (globalTheme && globalTheme !== 'default') {
        const themeFile = `/themes/global/${globalTheme}.css`;
        const link = document.createElement('link');
        link.id = 'dynamic-theme';
        link.rel = 'stylesheet';
        link.href = themeFile;
        document.head.appendChild(link);
        settingsState.activeGlobalTheme = globalTheme;
        console.log(`Loaded global theme: ${globalTheme} for page: ${page}`);
    } else {
        settingsState.activeGlobalTheme = 'default';
        if (page) settingsState[`active${capitalize(page)}Theme`] = 'default';
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('messages')) return 'messages';
    if (path.includes('jarvis')) return 'jarvis';
    if (path.includes('photos')) return 'photos';
    if (path.includes('wishlist')) return 'wishlist';
    return 'index';
}