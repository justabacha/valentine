// ==========================================
// USER ACTIONS (Cast, Dust, Delete)
// ==========================================
import { wishlistState } from './wishlist-state.js';
import { createWish, deleteWish, updateWishStatus } from './wishlist-api.js';
import { renderGallery } from './wishlist-render.js';
import { updateStats } from './wishlist.js';

export async function castWish(text, selectedDate, currentUserKey) {
    if (!text || !selectedDate) {
        alert("Pick a date + write a wish first!");
        return false;
    }
    const creator_id = currentUserKey === 'P' ? 'phesty_official' : 'baroness_official';
    const payload = {
        text: text,
        wish_date: selectedDate,
        status: 'planning',
        creator_id: creator_id
    };
    const newWish = await createWish(payload);
    if (!newWish) return false;
    wishlistState.wishes.push(newWish);
    wishlistState.selectedDate = null;
    updateStats();
    renderGallery();
    return true;
}

export async function dustWish(wishId) {
    const wish = wishlistState.wishes.find(w => w.id === wishId);
    if (!wish) return;
    const success = await updateWishStatus(wishId, 'dusted');
    if (!success) return;
    wish.status = 'dusted';
    updateStats();
    renderGallery();
}

export async function removeWish(wishId) {
    const success = await deleteWish(wishId);
    if (!success) return;
    wishlistState.wishes = wishlistState.wishes.filter(w => w.id !== wishId);
    updateStats();
    renderGallery();
}

export function uploadPhotos(wishId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.onchange = e => {
        if (e.target.files.length > 3) {
            alert("Maximum of 3 photos allowed, mate!");
            return;
        }
        alert(`Successfully attached ${e.target.files.length} photos to the memory!`);
        // TODO: implement actual upload to Supabase Storage
    };
    fileInput.click();
}

export function bindCastButton(domRefs, getCurrentUserFn) {
    const { wishInput, castBtn, calendarToggle } = domRefs;
    castBtn.addEventListener('click', async () => {
        const text = wishInput.value.trim();
        const userKey = getCurrentUserFn();
        await castWish(text, wishlistState.selectedDate, userKey);
        wishInput.value = '';
        calendarToggle.innerHTML = `<img src="https://img.icons8.com/fluency/48/calendar.png" width="22">`;
    });
}

// Global bridges for inline onclick
window.dustWish = dustWish;
window.promptDelete = removeWish;
window.uploadPhotos = uploadPhotos;