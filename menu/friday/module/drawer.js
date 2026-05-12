import { state } from '../../../app_launcher/state.js';

export function initializeDrawer() {

    setupDrawerToggle();
    hydrateDrawerProfile();

    console.log("Drawer system online 🦾");
}


// ========================================
// TOGGLE OPEN / CLOSE
// ========================================

function setupDrawerToggle() {

    const drawerOverlay = document.getElementById('drawerOverlay');
    const trigger = document.getElementById('drawerTrigger');

    if (!drawerOverlay || !trigger) return;

    trigger.addEventListener('click', (e) => {

        e.stopPropagation();
        drawerOverlay.classList.add('active');
    });

    drawerOverlay.addEventListener('click', (e) => {

        if (e.target === drawerOverlay) {
            drawerOverlay.classList.remove('active');
        }
    });
}


// ========================================
// PROFILE HYDRATION
// ========================================

function hydrateDrawerProfile() {

    const avatarBox = document.getElementById('drawerAvatar');
    const presence = document.getElementById('presenceState');

    if (!state.userProfile) return;

    // 👤 USER AVATAR (fallback safe)
    if (avatarBox) {

        if (state.userProfile.avatar) {

            avatarBox.style.backgroundImage = `url('${state.userProfile.avatar}')`;
            avatarBox.style.backgroundSize = "cover";
            avatarBox.style.backgroundPosition = "center";

        } else {

            avatarBox.innerHTML = "👤";
        }
    }

    // 🧠 PRESENCE TEXT
    if (presence) {

        presence.innerText = `Connected • ${state.userProfile.displayName || 'User'}`;
    }
}