// ==========================================
// EMOJI REACTIONS
// ==========================================
import { wishlistState } from './wishlist-state.js';
import { renderGallery } from './wishlist-render.js';
import { saveReaction } from './wishlist-api.js';
import { getCurrentUserKey } from './wishlist.js';

let activeWishId = null;

export function openEmojiTray(wishId) {
    const tray = document.getElementById('emoji-tray');
    if (!tray) return;
    if (activeWishId === wishId && tray.style.display === 'block') {
        tray.style.display = 'none';
        return;
    }
    activeWishId = wishId;
    tray.style.display = 'block';
    loadEmojis();
}

function loadEmojis() {
    const grid = document.getElementById('dynamic-emoji-grid');
    if (!grid || !window.LOCAL_EMOJIS) return;
    let html = '';
    for (const [group, emojis] of Object.entries(window.LOCAL_EMOJIS)) {
        html += `<div class="tray-category-header">${group.toUpperCase()}</div>`;
        emojis.forEach(char => {
            html += `<span onclick="window.insertEmoji('${char}')">${char}</span>`;
        });
    }
    grid.innerHTML = html;
    if (window.twemoji) {
        window.twemoji.parse(grid, {
            callback: (icon) => `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/${icon}.png`
        });
    }
}

export async function insertEmoji(char) {
    const wish = wishlistState.wishes.find(w => w.id === activeWishId);
    if (!wish) return;

    const currentUserKey = getCurrentUserKey();
    const personaId = currentUserKey === 'P' ? 'phesty_official' : 'baroness_official';
    let parsedEmoji = char;
    if (window.twemoji) {
        parsedEmoji = window.twemoji.parse(char, {
            callback: (icon) => `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/${icon}.png`
        });
    }
    const success = await saveReaction({
        wish_id: wish.id,
        persona_id: personaId,
        emoji: parsedEmoji
    });
    if (!success) return;

    if (!wish.reactions) wish.reactions = {};
    wish.reactions[currentUserKey] = parsedEmoji;

    const tray = document.getElementById('emoji-tray');
    if (tray) tray.style.display = 'none';
    renderGallery();
}

// Global bridges
window.promptEmoji = openEmojiTray;
window.insertEmoji = insertEmoji;