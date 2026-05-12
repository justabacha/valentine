// db.js
import { supabaseClient } from '../../../app_launcher/config.js';

// Get current user from localStorage (set by main app after login)
function getCurrentUserId() {
    const profile = localStorage.getItem('friday_user_profile');
    if (!profile) return null;
    try {
        const { id } = JSON.parse(profile);
        return id;
    } catch(e) { return null; }
}

// Load messages from Supabase
export async function loadMessages() {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const { data, error } = await supabaseClient
        .from('friday_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    if (error) console.error('loadMessages error', error);
    return data || [];
}

// Save a message
export async function saveMessage(text, isUser) {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const { error } = await supabaseClient
        .from('friday_messages')
        .insert([{ user_id: userId, message_text: text, is_user: isUser }]);
    if (error) console.error('saveMessage error', error);
}

// Load memories
export async function loadMemories() {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const { data, error } = await supabaseClient
        .from('friday_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) console.error('loadMemories error', error);
    return data || [];
}

// Add a memory
export async function addMemory(text, pinned = false) {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const { error } = await supabaseClient
        .from('friday_memories')
        .insert([{ user_id: userId, memory_text: text, is_pinned: pinned }]);
    if (error) console.error('addMemory error', error);
}

// Toggle pin
export async function togglePinMemory(id, currentPinned) {
    const { error } = await supabaseClient
        .from('friday_memories')
        .update({ is_pinned: !currentPinned })
        .eq('id', id);
    if (error) console.error('togglePinMemory error', error);
}