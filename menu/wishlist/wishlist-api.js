// ==========================================
// SUPABASE BRAIN
// ==========================================
import { supabaseClient } from '../../app_launcher/config.js';

// Helper: convert DB row to UI model
function mapWish(dbWish) {
    const ratingsObj = {};
    const reactionsObj = {};

    (dbWish.wishlist_ratings || []).forEach(r => {
        const key = r.persona_id === 'phesty_official' ? 'P' : 'B';
        ratingsObj[key] = r.rating;
    });
    (dbWish.wishlist_reactions || []).forEach(r => {
        const key = r.persona_id === 'phesty_official' ? 'P' : 'B';
        reactionsObj[key] = r.emoji;
    });

    return {
        id: dbWish.id,
        text: dbWish.text,
        date: dbWish.wish_date,
        status: dbWish.status,
        creator: dbWish.creator_id === 'phesty_official' ? 'P' : 'B',
        ratings: ratingsObj,
        reactions: reactionsObj,
        created_at: dbWish.created_at
    };
}

// FETCH ALL WISHES
export async function fetchWishes() {
    const { data, error } = await supabaseClient
        .from('wishlist_items')
        .select(`
            *,
            wishlist_reactions(*),
            wishlist_ratings(*)
        `)
        .order('wish_date', { ascending: true });

    if (error) {
        console.error('Failed to fetch wishes:', error.message);
        return [];
    }
    return (data || []).map(mapWish);
}

// CREATE NEW WISH
export async function createWish(payload) {
    // payload should contain { text, wish_date, status, creator_id }
    const { data, error } = await supabaseClient
        .from('wishlist_items')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Failed to create wish:', error.message);
        return null;
    }
    return mapWish(data);
}

// DELETE WISH
export async function deleteWish(wishId) {
    const { error } = await supabaseClient
        .from('wishlist_items')
        .delete()
        .eq('id', wishId);

    if (error) {
        console.error('Failed to delete wish:', error.message);
        return false;
    }
    return true;
}

// UPDATE WISH STATUS (dust / planning)
export async function updateWishStatus(wishId, status) {
    const { error } = await supabaseClient
        .from('wishlist_items')
        .update({
            status: status,
            updated_at: new Date()
        })
        .eq('id', wishId);

    if (error) {
        console.error('Failed to update wish status:', error.message);
        return false;
    }
    return true;
}

// SAVE REACTION (upsert)
export async function saveReaction(payload) {
    const { error } = await supabaseClient
        .from('wishlist_reactions')
        .upsert(payload, { onConflict: 'wish_id,persona_id' });

    if (error) {
        console.error('Failed to save reaction:', error.message);
        return false;
    }
    return true;
}

// SAVE RATING (upsert)
export async function saveRating(payload) {
    const { error } = await supabaseClient
        .from('wishlist_ratings')
        .upsert(payload, { onConflict: 'wish_id,persona_id' });

    if (error) {
        console.error('Failed to save rating:', error.message);
        return false;
    }
    return true;
}