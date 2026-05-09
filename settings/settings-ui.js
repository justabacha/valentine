// settings-ui.js
import { state } from '../../app_launcher/state.js';

export function buildSettingsHTML() {
    const avatarUrl = state.userProfile?.avatar || '';
    const avatarInitial = state.userProfile?.persona?.charAt(0) || 'P';
    const avatarStyle = avatarUrl ? `background-image: url('${avatarUrl}'); background-size: cover;` : '';

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

            <div class="category-wrapper">
                <div class="category-pill">GLOBAL THEMES</div>
                <div class="theme-grid" data-theme-type="global">
                    <div class="theme-item" data-theme-name="natural">
                        <div class="theme-card card-natural"></div>
                        <div class="label-pill">Natural</div>
                    </div>
                    <div class="theme-item" data-theme-name="blueray">
                        <div class="theme-card card-blueray"></div>
                        <div class="label-pill">Blueray</div>
                    </div>
                    <div class="theme-item" data-theme-name="galaxy">
                        <div class="theme-card card-galaxy"></div>
                        <div class="label-pill">Galaxy</div>
                    </div>
                </div>
            </div>

            <div class="category-wrapper">
                <div class="category-pill">WISHLIST THEMES</div>
                <div class="theme-grid" data-theme-type="wishlist">
                    <div class="theme-item" data-theme-name="soft">
                        <div class="theme-card"></div>
                        <div class="label-pill">Soft</div>
                    </div>
                    <div class="theme-item" data-theme-name="baroness">
                        <div class="theme-card"></div>
                        <div class="label-pill">Baroness</div>
                    </div>
                    <div class="theme-item" data-theme-name="night">
                        <div class="theme-card"></div>
                        <div class="label-pill">Night</div>
                    </div>
                </div>
            </div>
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

        <!-- Full Screen Preview Gallery (hidden) -->
        <div id="preview-layer" class="preview-overlay hidden">
            <button class="close-preview" id="close-preview-btn">×</button>
            <div class="preview-scroller" id="preview-scroller">
                <div class="snippet-slide pos-left" data-view="home">
                    <img src="/bucket/Image-14.jpg" alt="Home View">
                    <button class="apply-inside-btn">Apply Theme</button>
                </div>
                <div class="snippet-slide pos-center" data-view="wishlist">
                    <img src="/bucket/Image-51.jpg" alt="Wishlist View">
                    <button class="apply-inside-btn">Apply Theme</button>
                </div>
                <div class="snippet-slide pos-right" data-view="messages">
                    <img src="/bucket/Image-16.jpg" alt="Messages View">
                    <button class="apply-inside-btn">Apply Theme</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function injectSettingsModal() {
    const existing = document.getElementById('settings-modal-root');
    if (existing) existing.remove();
    const modalHTML = buildSettingsHTML();
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);
}

export function closeSettingsModal() {
    const modal = document.getElementById('settings-modal-root');
    if (modal) modal.remove();
}