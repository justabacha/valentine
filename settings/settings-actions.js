// settings-actions.js
import { settingsState } from './settings-state.js';
import { closeSettingsModal } from './settings-ui.js';

function getThemeLink() {
    let link = document.getElementById('app-theme');
    if (!link) {
        link = document.createElement('link');
        link.id = 'app-theme';
        link.rel = 'stylesheet';
        link.href = '/settings/themes/default.css';
        document.head.appendChild(link);
    }
    return link;
}

export function applyGlobalTheme(themeName) {
    const themeFile = `/settings/themes/${themeName}.css`;
    getThemeLink().href = themeFile;
    localStorage.setItem('global_theme', themeName);
    settingsState.activeGlobalTheme = themeName;
    console.log(`Applied global theme: ${themeName}`);
}

export function applyWishlistTheme(themeName) {
    localStorage.setItem('wishlist_theme', themeName);
    settingsState.activeWishlistTheme = themeName;
    console.log(`Wishlist theme saved: ${themeName}`);
}

// Preview handling
let currentPreviewType = null;
let currentPreviewName = null;

export function openPreview(themeType, themeName) {
    currentPreviewType = themeType;
    currentPreviewName = themeName;
    const preview = document.getElementById('preview-layer');
    if (preview) preview.classList.remove('hidden');
}

export function closePreview() {
    const preview = document.getElementById('preview-layer');
    if (preview) preview.classList.add('hidden');
    currentPreviewType = null;
    currentPreviewName = null;
}

export function applyFromPreview() {
    if (currentPreviewType === 'global') applyGlobalTheme(currentPreviewName);
    else if (currentPreviewType === 'wishlist') applyWishlistTheme(currentPreviewName);
    closePreview();
    closeSettingsModal();
}

export function hideChoicePopup() {
    const popup = document.getElementById('choice-card');
    if (popup) popup.classList.add('hidden');
}