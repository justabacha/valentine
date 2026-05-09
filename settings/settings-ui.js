// settings-ui.js
import { state } from '../../app_launcher/state.js';

let cachedManifest = null;

async function loadManifest() {
    if (cachedManifest) return cachedManifest;
    const res = await fetch('/themes/themes-manifest.json');
    if (!res.ok) throw new Error('Failed to load themes manifest');
    cachedManifest = await res.json();
    return cachedManifest;
}

export async function buildSettingsHTML() {
    const manifest = await loadManifest();
    const avatarUrl = state.userProfile?.avatar || '';
    const avatarInitial = state.userProfile?.persona?.charAt(0) || 'P';
    const avatarStyle = avatarUrl ? `background-image: url('${avatarUrl}'); background-size: cover;` : '';

    let categoriesHTML = '';
    for (const cat of manifest.categories) {
        let themeCardsHTML = '';
        for (const theme of cat.themes) {
            const previewStyle = theme.preview ? `background-image: url('${theme.preview}'); background-size: cover; background-position: center;` : '';
            themeCardsHTML += `
                <div class="theme-item" data-theme-name="${theme.name}">
                    <div class="theme-card" style="${previewStyle}"></div>
                    <div class="label-pill">${theme.label}</div>
                </div>
            `;
        }
        categoriesHTML += `
            <div class="category-wrapper">
                <div class="category-pill">${cat.label}</div>
                <div class="theme-grid" data-theme-type="${cat.type}">
                    ${themeCardsHTML}
                </div>
            </div>
        `;
    }

    return `
    <div class="settings-modal-overlay" id="settings-modal-root">
        <div class="settings-full-view">
            <header class="settings-top">
                <button class="back-pill" id="settings-close-btn">back</button>
                <h1 class="main-title">SETTING CENTER</h1>
            </header>
            <div class="profile-section">
                <div class="profile-circle" style="${avatarStyle}">${avatarUrl ? '' : avatarInitial}</div>
            </div>
            ${categoriesHTML}
        </div>

        <!-- Choice Popup (hidden) -->
        <div id="choice-card" class="choice-overlay hidden">
            <div class="choice-box">
                <h3 style="color: white; font-size: 1.1rem;">Theme Settings</h3>
                <div class="choice-buttons">
                    <button id="btn-apply">Apply Theme</button>
                    <button id="btn-view">View Preview</button>
                </div>
                <button class="close-choice">Cancel</button>
            </div>
        </div>

        <!-- Preview Gallery (hidden) with navigation buttons -->
        <div id="preview-layer" class="preview-overlay hidden">
            <button class="close-preview" id="close-preview-btn">×</button>
            <button class="preview-nav prev" id="preview-prev">‹</button>
            <button class="preview-nav next" id="preview-next">›</button>
            <div class="preview-scroller" id="preview-scroller">
                <!-- Carousel slides will be injected by JS -->
            </div>
        </div>
    </div>
    `;
}

export async function injectSettingsModal() {
    const existing = document.getElementById('settings-modal-root');
    if (existing) existing.remove();
    const modalHTML = await buildSettingsHTML();
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);
}

export function closeSettingsModal() {
    const modal = document.getElementById('settings-modal-root');
    if (modal) modal.remove();
}