import { state } from './state.js';
import { supabaseClient } from './config.js';
import { launchApp } from './app.js';

export function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('avatar-preview');
        preview.style.backgroundImage = `url(${reader.result})`;
        state.pendingFile = file; 
        console.log("Oii! Raw file locked in variable:", state.pendingFile.name, state.pendingFile.size, "bytes");
    };
    reader.readAsDataURL(file);
}

export async function saveSetup() {

    if (!state.currentPersonaId) {
        console.error("No ID found! Redirecting to Gate...");
        document.getElementById('gate-overlay').classList.remove('hidden');
        document.getElementById('lockscreen').style.display = "none";
        return;
    }

    const assignedPersona = state.currentPersonaId.includes('phesty') ? 'Phesty' : 'Baroness';
    console.log(`Vibing in as: ${assignedPersona}`);
    if (state.isSaving) return; 
    state.isSaving = true;

    const nameInput = document.getElementById('user-name');
    const name = nameInput.value.trim();
    const file = state.pendingFile;

    const saveBtn = document.querySelector('.save-vibe-btn'); 
    if (saveBtn) saveBtn.style.opacity = "0.5";

    if (!name) {
        nameInput.style.border = "1px solid #ff4d6d";
        state.isSaving = false; 

        if (saveBtn) saveBtn.style.opacity = "1";
        return;
    }

    try {
        let finalAvatarUrl = "";

        const { data: existing } = await supabaseClient
            .from('profiles')
            .select('avatar_url')
            .eq('id', state.currentPersonaId)
            .single();
            
        finalAvatarUrl = existing?.avatar_url || "";

        if (file) {
            console.log("New vibe detected, prepping upload...");

            if (state.userProfile?.avatar && state.userProfile.avatar.includes('storage/v1/object/public')) {
                const oldFileName = state.userProfile.avatar.split('/').pop();

                await supabaseClient.storage.from('avatars').remove([oldFileName]);
            }

            const fileName = `avatar_${Date.now()}_${file.name}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type || 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: publicData } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(fileName);

            finalAvatarUrl = publicData.publicUrl;
        }

        const { error: dbError } = await supabaseClient
            .from('profiles')
            .upsert({ 
                id: state.currentPersonaId, 
                display_name: name, 
                avatar_url: finalAvatarUrl, 
                persona: assignedPersona,
                updated_at: new Date()
            });

        if (dbError) throw dbError;
        state.userProfile = { displayName: name, avatar: finalAvatarUrl, persona: assignedPersona };

        console.log("Vibe updated! Duplicate glitch nerfed. 🦾");
        state.pendingFile = null;

        launchApp(); 

    } catch (err) {
        console.error("Save process crashed, mate:", err.message);
    } finally {
        state.isSaving = false;

        if (saveBtn) saveBtn.style.opacity = "1";
    }
}

export async function openSettings() {
    const lockscreen = document.getElementById('lockscreen');
    const nameInput = document.getElementById('user-name');
    const preview = document.getElementById('avatar-preview');

   
    if (state.userProfile) {
        nameInput.value = state.userProfile.displayName || "";

        if (state.userProfile.avatar) {
            preview.style.backgroundImage = `url(${state.userProfile.avatar})`;
        }
    }

    lockscreen.style.display = "flex";
    setTimeout(() => { lockscreen.style.opacity = "1"; }, 10);
}