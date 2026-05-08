// ==========================================
// WISHLIST BOOTSTRAP (Main Entry)
// ==========================================
import { wishlistState } from './wishlist-state.js';
import { fetchWishes } from './wishlist-api.js';
import { supabaseClient } from '../../app_launcher/config.js';
import { bindCalendar } from './wishlist-calendar.js';
import { bindCastButton } from './wishlist-actions.js';
import { renderGallery } from './wishlist-render.js';
// Import the modules that attach global functions (promptEmoji, promptRating, etc.)
import './wishlist-reactions.js';
import './wishlist-ratings.js';

// ==========================================
// USER METADATA (will be populated from DB)
// ==========================================
export const wishlistUsers = {
    P: { name: 'Phesty', color: '#00ff51', dotClass: 'dot-p', avatarUrl: null },
    B: { name: 'Baroness', color: '#007aff', dotClass: 'dot-b', avatarUrl: null }
};

let currentUserKey = 'P'; // default

// ==========================================
// FETCH BOTH PROFILES FROM SUPABASE
// ==========================================
async function loadBothProfiles() {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, display_name, avatar_url, persona')
        .in('id', ['phesty_official', 'baroness_official']);

    if (error) {
        console.error('Failed to fetch profiles:', error.message);
        return;
    }

    for (const profile of data) {
        if (profile.id === 'phesty_official') {
            wishlistUsers.P.name = profile.display_name || 'Phesty';
            wishlistUsers.P.avatarUrl = profile.avatar_url;
        } else if (profile.id === 'baroness_official') {
            wishlistUsers.B.name = profile.display_name || 'Baroness';
            wishlistUsers.B.avatarUrl = profile.avatar_url;
        }
    }

    // Determine current user from localStorage (set by main app)
    const savedPersona = localStorage.getItem('vibe_persona');
    if (savedPersona === 'Baroness') {
        currentUserKey = 'B';
    } else if (savedPersona === 'Phesty') {
        currentUserKey = 'P';
    } else {
        console.warn('No vibe_persona in localStorage, defaulting to Phesty');
    }

    console.log('Profiles loaded:', wishlistUsers);
}

// ==========================================
// UPDATE BOTH AVATAR CIRCLES IN THE DOM
// ==========================================
function syncAvatarsToUI() {
    // Phesty's avatar
    const phestyEl = document.querySelector('.phesty-img');
    if (phestyEl && wishlistUsers.P.avatarUrl) {
        phestyEl.style.backgroundImage = `url(${wishlistUsers.P.avatarUrl})`;
        phestyEl.style.backgroundSize = "cover";
        phestyEl.innerText = "";
    } else if (phestyEl && !wishlistUsers.P.avatarUrl) {
        phestyEl.style.backgroundImage = "";
        phestyEl.innerText = "P";
    }

    // Baroness's avatar
    const baronessEl = document.querySelector('.bestie-img');
    if (baronessEl && wishlistUsers.B.avatarUrl) {
        baronessEl.style.backgroundImage = `url(${wishlistUsers.B.avatarUrl})`;
        baronessEl.style.backgroundSize = "cover";
        baronessEl.innerText = "";
    } else if (baronessEl && !wishlistUsers.B.avatarUrl) {
        baronessEl.style.backgroundImage = "";
        baronessEl.innerText = "B";
    }
}

// ==========================================
// GET CURRENT USER KEY (for other modules)
// ==========================================
export function getCurrentUserKey() {
    return currentUserKey;
}

// ==========================================
// UPDATE STATS (wish counter)
// ==========================================
export function updateStats() {
    const total = wishlistState.wishes.length;
    const dusted = wishlistState.wishes.filter(w => w.status === 'dusted').length;
    const statsCapsule = document.querySelector('.stat-capsule');
    if (statsCapsule) {
        statsCapsule.innerHTML = `
            <img src="https://img.icons8.com/fluency/48/star.png" width="20">
            ${total} GOALS ! ${dusted} DUSTED
        `;
    }
}

// ==========================================
// LOAD WISHES FROM DB
// ==========================================
async function loadWishes() {
    wishlistState.wishes = await fetchWishes();
    console.log('Wishlist synced:', wishlistState.wishes.length, 'items');
}

// ==========================================
// INITIALISE EVERYTHING
// ==========================================
async function initWishlist() {
    await loadBothProfiles();
    syncAvatarsToUI();
    await loadWishes();
    updateStats();
    renderGallery();
    bindCalendar();
    bindCastButton(
        {
            wishInput: document.querySelector('textarea'),
            castBtn: document.querySelector('.cast-star-btn'),
            calendarToggle: document.querySelector('.calendar-toggle')
        },
        getCurrentUserKey
    );
    console.log('Bedroom engine online 😭🔥 – Current user:', currentUserKey);
}

initWishlist();