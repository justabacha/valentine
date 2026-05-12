import { state } from '../../../app_launcher/state.js';
import { supabaseClient } from '../../../app_launcher/config.js';

export function initializeDrawer() {
    setupDrawerToggle();
    hydrateDrawerProfile();
    console.log("Drawer system online 🦾");
}

export function closeDrawer() {
    const drawerOverlay = document.getElementById('drawerOverlay');
    if (drawerOverlay) drawerOverlay.classList.remove('active');
}

export async function loadPinnedMemories() {
    if (!state.userProfile?.id) {
        console.warn("No user ID, cannot load memories");
        return;
    }

    const { data, error } = await supabaseClient
        .from('friday_memories')
        .select('*')
        .eq('owner_id', state.userProfile.id)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to load pinned memories:", error);
        return;
    }

    const container = document.getElementById('memoryList');
    if (!container) return;

    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="memory-card empty">✨ No pinned memories yet. Ask FRIDAY to remember something for you.</div>';
        return;
    }

    // Store the full data array globally (or in a weak map) for delete-by-number
    window._fridayMemories = data;

    for (let i = 0; i < data.length; i++) {
        const mem = data[i];
        const card = document.createElement('div');
        card.className = 'memory-card';
        // Display index (i+1) and memory text
        card.innerHTML = `<span><strong>${i+1}.</strong> ${escapeHtml(mem.memory_text)}</span>`;
        container.appendChild(card);
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ==================== DRAWER UI LOGIC ====================
function setupDrawerToggle() {
    const drawerOverlay = document.getElementById('drawerOverlay');
    const trigger = document.getElementById('drawerTrigger');
    if (!drawerOverlay || !trigger) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        drawerOverlay.classList.add('active');
        loadPinnedMemories();
    });

    drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) closeDrawer();
    });

    const navChat = document.getElementById('navChat');
    const goToVoice = document.getElementById('goToVoice');
    if (navChat) navChat.addEventListener('click', closeDrawer);
    if (goToVoice) {
        goToVoice.addEventListener('click', () => {
            closeDrawer();
            window.location.href = '/menu/friday/friday-bridge.html';
        });
    }
}

function hydrateDrawerProfile() {
    const avatarBox = document.getElementById('drawerAvatar');
    const presence = document.getElementById('presenceState');
    if (!state.userProfile) return;
    if (avatarBox) {
        if (state.userProfile.avatar) {
            avatarBox.style.backgroundImage = `url('${state.userProfile.avatar}')`;
            avatarBox.style.backgroundSize = "cover";
            avatarBox.style.backgroundPosition = "center";
            avatarBox.innerHTML = '';
        } else {
            avatarBox.innerHTML = "👤";
        }
    }
    if (presence) {
        presence.innerText = `Connected • ${state.userProfile.displayName || 'User'}`;
    }
}