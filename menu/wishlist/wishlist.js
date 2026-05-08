// ==========================================
// WISHLIST BOOTSTRAP (Main Entry)
// ==========================================
import { wishlistState } from './wishlist-state.js';
import { fetchWishes } from './wishlist-api.js';
import { supabaseClient } from '../../app_launcher/config.js';
import { bindCalendar } from './wishlist-calendar.js';
import { bindCastButton } from './wishlist-actions.js';
import { renderGallery } from './wishlist-render.js';
import './wishlist-reactions.js';
import './wishlist-ratings.js';

export const wishlistUsers = {
    P: { name: 'Phesty', color: '#00ff51', dotClass: 'dot-p', avatarUrl: null },
    B: { name: 'Baroness', color: '#007aff', dotClass: 'dot-b', avatarUrl: null }
};

let currentUserKey = 'P'; // default

// ==========================================
// DETECT CURRENT USER FROM MULTIPLE SOURCES
// ==========================================
function detectCurrentUser() {
    // 1. Try localStorage (set by main app after gate)
    let savedPersona = localStorage.getItem('vibe_persona');
    console.log('Raw vibe_persona from localStorage:', savedPersona);
    
    if (savedPersona) {
        // Normalise to proper case
        const normalized = savedPersona.toLowerCase();
        if (normalized === 'baroness') {
            console.log('✅ Detected Baroness from localStorage');
            return 'B';
        } else if (normalized === 'phesty') {
            console.log('✅ Detected Phesty from localStorage');
            return 'P';
        }
    }
    
    // 2. Fallback: try to read from main app's state (if loaded globally)
    if (window.state?.userProfile?.persona) {
        const mainPersona = window.state.userProfile.persona;
        console.log('Falling back to window.state.userProfile.persona:', mainPersona);
        if (mainPersona === 'Baroness') return 'B';
        if (mainPersona === 'Phesty') return 'P';
    }
    
    // 3. Last resort: default to Phesty and warn
    console.warn('⚠️ Could not determine current user, defaulting to Phesty');
    return 'P';
}

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

    console.log('📸 Profiles loaded:', wishlistUsers);
}

// ==========================================
// UPDATE BOTH AVATAR CIRCLES
// ==========================================
function syncAvatarsToUI() {
    const phestyEl = document.querySelector('.phesty-img');
    if (phestyEl && wishlistUsers.P.avatarUrl) {
        phestyEl.style.backgroundImage = `url(${wishlistUsers.P.avatarUrl})`;
        phestyEl.style.backgroundSize = "cover";
        phestyEl.innerText = "";
    } else if (phestyEl) {
        phestyEl.style.backgroundImage = "";
        phestyEl.innerText = "P";
    }

    const baronessEl = document.querySelector('.bestie-img');
    if (baronessEl && wishlistUsers.B.avatarUrl) {
        baronessEl.style.backgroundImage = `url(${wishlistUsers.B.avatarUrl})`;
        baronessEl.style.backgroundSize = "cover";
        baronessEl.innerText = "";
    } else if (baronessEl) {
        baronessEl.style.backgroundImage = "";
        baronessEl.innerText = "B";
    }
}

// ==========================================
// GET CURRENT USER KEY (exported)
// ==========================================
export function getCurrentUserKey() {
    return currentUserKey;
}

// ==========================================
// UPDATE STATS
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
// LOAD WISHES
// ==========================================
async function loadWishes() {
    wishlistState.wishes = await fetchWishes();
    console.log('📋 Wishlist synced:', wishlistState.wishes.length, 'items');
}

// ==========================================
// INITIALISE
// ==========================================
async function initWishlist() {
    await loadBothProfiles();
    syncAvatarsToUI();
    
    // Detect current user after profiles are loaded (in case we need names)
    currentUserKey = detectCurrentUser();
    console.log(`👤 Current user key: ${currentUserKey} (${currentUserKey === 'B' ? wishlistUsers.B.name : wishlistUsers.P.name})`);
    
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
    console.log('🔥 Bedroom engine online');
}

initWishlist();