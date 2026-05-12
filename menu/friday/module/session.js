import { state } from '../../../app_launcher/state.js';
import { supabaseClient } from '../../../app_launcher/config.js';
import { lockPresenceState } from './presence.js';

export async function initializeFridaySession() {

    const savedPersona = localStorage.getItem('vibe_persona');

    // 🚫 No session → bounce out
    if (!savedPersona) {
        console.warn("No saved persona found.");
        window.location.href = '/';
        return false;
    }

    // rebuild shared identity
    state.currentPersonaId = `${savedPersona}_official`;

    // fetch profile
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', state.currentPersonaId)
        .single();

    if (error || !data) {
        console.error("Failed to restore FRIDAY session:", error);

        localStorage.removeItem('vibe_persona');
        window.location.href = '/';

        return false;
    }

    // 🔐 Store the user's UNIQUE ID (owner_id) for DB operations
    state.userProfile = {
        id: data.id,                    // ✅ used as owner_id in friday_messages & friday_memories
        displayName: data.display_name,
        avatar: data.avatar_url,
        persona: data.persona
    };

    hydrateFridayProfile();

    console.log("FRIDAY session restored 🦾, owner_id =", state.userProfile.id);
    return true;
}

function hydrateFridayProfile() {

    const avatar = document.getElementById('drawerAvatar');

    if (avatar && state.userProfile?.avatar) {
        avatar.style.backgroundImage = `url('${state.userProfile.avatar}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
    }

    const presence = document.getElementById('presenceState');

    if (presence && state.userProfile?.displayName) {
        lockPresenceState(`Connected • ${state.userProfile.displayName}`);
    }
}