// settings-actions.js
import { settingsState } from './settings-state.js';
import { closeSettingsModal } from './settings-ui.js';

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('messages')) return 'messages';
    if (path.includes('jarvis')) return 'jarvis';
    if (path.includes('photos')) return 'photos';
    if (path.includes('wishlist')) return 'wishlist';
    return 'index';
}

// Apply global theme (affects all pages)
export function applyGlobalTheme(themeName) {
    if (!themeName || themeName === 'default') {
        const themeLink = document.getElementById('dynamic-theme');
        if (themeLink) themeLink.remove();
        localStorage.removeItem('global_theme');
        settingsState.activeGlobalTheme = 'default';
        console.log('Reverted to default global theme');
        return;
    }
    const page = getCurrentPage();
    const themeFile = `/themes/global/${themeName}.css`;
    let link = document.getElementById('dynamic-theme');
    if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-theme';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    link.href = themeFile;
    localStorage.setItem('global_theme', themeName);
    settingsState.activeGlobalTheme = themeName;
    console.log(`Applied global theme: ${themeName} to page: ${page}`);
}

// Apply page‑specific theme (messages, jarvis, photos, wishlist)
export function applyPageTheme(category, themeName) {
    if (themeName === 'default') {
        localStorage.removeItem(`${category}_theme`);
        settingsState[`active${capitalize(category)}Theme`] = 'default';
        if (getCurrentPage() === category) window.location.reload();
        return;
    }
    const themeFile = `/themes/${category}/${themeName}.css`;
    localStorage.setItem(`${category}_theme`, themeName);
    settingsState[`active${capitalize(category)}Theme`] = themeName;
    if (getCurrentPage() === category) {
        let link = document.getElementById('dynamic-theme');
        if (!link) {
            link = document.createElement('link');
            link.id = 'dynamic-theme';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = themeFile;
        console.log(`Applied ${category} theme: ${themeName}`);
    } else {
        console.log(`${category} theme saved: ${themeName}`);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Specific wrappers for backwards compatibility
export function applyWishlistTheme(themeName) {
    applyPageTheme('wishlist', themeName);
}

export function resetGlobalTheme() {
    applyGlobalTheme('default');
}

export function resetPageTheme(category) {
    applyPageTheme(category, 'default');
}

// ==========================================
// PREVIEW CAROUSEL (Infinite circular)
// ==========================================

// Image pool – can be expanded later
const previewImages = [
    { url: '/bucket/Image-14.jpg', label: 'Home View', category: 'home' },
    { url: '/bucket/Image-51.jpg', label: 'Wishlist View', category: 'wishlist' },
    { url: '/bucket/Image-16.jpg', label: 'Messages View', category: 'messages' }
];

let currentPreviewCenterIndex = 0;
let currentPreviewType = null;
let currentPreviewName = null;

// Build the three slides based on the center index
function buildPreviewCarousel() {
    const container = document.getElementById('preview-scroller');
    if (!container) return;

    const total = previewImages.length;
    const leftIndex = (currentPreviewCenterIndex - 1 + total) % total;
    const rightIndex = (currentPreviewCenterIndex + 1) % total;

    const slides = [
        { index: leftIndex, position: 'pos-left' },
        { index: currentPreviewCenterIndex, position: 'pos-center' },
        { index: rightIndex, position: 'pos-right' }
    ];

    let html = '';
    for (const slide of slides) {
        const img = previewImages[slide.index];
        html += `
            <div class="snippet-slide ${slide.position}" data-view="${img.category}">
                <img src="${img.url}" alt="${img.label}">
                <button class="apply-inside-btn">Apply Theme</button>
            </div>
        `;
    }
    container.innerHTML = html;

    // Re-attach Apply button event listeners
    document.querySelectorAll('.apply-inside-btn').forEach(btn => {
        btn.removeEventListener('click', applyFromPreview);
        btn.addEventListener('click', applyFromPreview);
    });
}

// Move carousel in direction: 'next' or 'prev'
function moveCarousel(direction) {
    const total = previewImages.length;
    if (direction === 'next') {
        currentPreviewCenterIndex = (currentPreviewCenterIndex + 1) % total;
    } else if (direction === 'prev') {
        currentPreviewCenterIndex = (currentPreviewCenterIndex - 1 + total) % total;
    }
    buildPreviewCarousel();
}

// Attach navigation button events and initial build
function initPreviewCarousel() {
    currentPreviewCenterIndex = 0; // start with first image in center
    buildPreviewCarousel();

    const prevBtn = document.getElementById('preview-prev');
    const nextBtn = document.getElementById('preview-next');
    if (prevBtn) {
        prevBtn.removeEventListener('click', () => moveCarousel('prev'));
        prevBtn.addEventListener('click', () => moveCarousel('prev'));
    }
    if (nextBtn) {
        nextBtn.removeEventListener('click', () => moveCarousel('next'));
        nextBtn.addEventListener('click', () => moveCarousel('next'));
    }
}

// Open preview overlay and initialise carousel
export function openPreview(themeType, themeName) {
    currentPreviewType = themeType;
    currentPreviewName = themeName;
    const preview = document.getElementById('preview-layer');
    if (preview) {
        preview.classList.remove('hidden');
        initPreviewCarousel();
    }
}

// Close preview
export function closePreview() {
    const preview = document.getElementById('preview-layer');
    if (preview) preview.classList.add('hidden');
    currentPreviewType = null;
    currentPreviewName = null;
}

// Apply the selected theme (from the card) and close everything
export function applyFromPreview() {
    if (currentPreviewType === 'global') {
        applyGlobalTheme(currentPreviewName);
    } else {
        applyPageTheme(currentPreviewType, currentPreviewName);
    }
    closePreview();
    closeSettingsModal();
}

// Hide the choice popup
export function hideChoicePopup() {
    const popup = document.getElementById('choice-card');
    if (popup) popup.classList.add('hidden');
}