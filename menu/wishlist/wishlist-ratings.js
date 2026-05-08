// ==========================================
// STAR RATINGS (with card repositioning)
// ==========================================
import { wishlistState } from './wishlist-state.js';
import { renderGallery } from './wishlist-render.js';
import { saveRating as apiSaveRating } from './wishlist-api.js';
import { getCurrentUserKey, wishlistUsers } from './wishlist.js';

let currentRating = 0;
let ratingWishId = null;

export async function openRating(wishId) {
    const modal = document.getElementById('rating-modal');
    const wish = wishlistState.wishes.find(w => w.id === wishId);
    if (!modal || !wish) return;

    // If already open for this card, just close it (toggle)
    if (modal.style.display === 'flex' && ratingWishId === wishId) {
        return closeRating();
    }

    ratingWishId = wishId;

    // --- REPOSITION MODAL: move it right after the clicked wish row ---
    const cardElement = document.querySelector(`.wish-row[data-id="${wishId}"]`);
    if (cardElement) {
        cardElement.after(modal);
    }

    const currentUserKey = getCurrentUserKey();
    const otherUserKey = currentUserKey === 'P' ? 'B' : 'P';
    const otherScore = wish.ratings?.[otherUserKey] || 0;

    // Get the peer's actual display name from wishlistUsers
    const otherName = wishlistUsers[otherUserKey]?.name || otherUserKey;

    const peerDisplay = document.getElementById('peer-rating-display');
    if (peerDisplay) {
        peerDisplay.innerHTML = otherScore > 0
            ? `${otherName.toUpperCase()} RATED: ${otherScore} ${'★'.repeat(otherScore)}`
            : `WAITING FOR ${otherName.toUpperCase()}...`;
    }

    currentRating = wish.ratings?.[currentUserKey] || 0;
    updateStars(currentRating);
    modal.style.display = 'flex';
}

export function selectStar(value) {
    currentRating = value;
    updateStars(value);
}

function updateStars(value) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        const v = parseInt(star.dataset.value);
        star.classList.remove('active', 'rate-red', 'rate-green', 'rate-gold');
        if (v <= value) {
            star.classList.add('active');
            if (value <= 2) star.classList.add('rate-red');
            else if (value === 3) star.classList.add('rate-green');
            else star.classList.add('rate-gold');
        }
    });
}

export async function saveRating() {
    const wish = wishlistState.wishes.find(w => w.id === ratingWishId);
    if (!wish || currentRating === 0) return;

    const currentUserKey = getCurrentUserKey();
    const personaId = currentUserKey === 'P' ? 'phesty_official' : 'baroness_official';

    const success = await apiSaveRating({
        wish_id: wish.id,
        persona_id: personaId,
        rating: currentRating
    });
    if (!success) return;

    if (!wish.ratings) wish.ratings = {};
    wish.ratings[currentUserKey] = currentRating;

    // --- Move modal back to body BEFORE re‑rendering (prevents deletion) ---
    const modal = document.getElementById('rating-modal');
    if (modal) document.body.appendChild(modal);

    closeRating();       // hide modal
    renderGallery();     // re‑draw the gallery (modal is safe in body)
}

export function closeRating() {
    const modal = document.getElementById('rating-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.appendChild(modal);   // tuck it away at the bottom
}

// Global bridges
window.promptRating = openRating;
window.saveRating = saveRating;
window.closeRatingModal = closeRating;

// Star click delegation (dynamic stars)
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('star')) {
        selectStar(parseInt(e.target.dataset.value));
    }
});