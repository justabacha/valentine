import { state } from './state.js';
import { supabaseClient } from './config.js';
import { launchApp } from './app.js';

export async function checkGate(persona) {
    const passField = document.getElementById('gate-password');
    const errorMsg = document.getElementById('gate-error');
    const inputPass = passField.value;

    if (!inputPass) {
        errorMsg.innerHTML = "Type the secret key, yoow!";
        return;
    }

    try {
        // ❌ _supabase
        // ✅ supabaseClient
        const { data, error } = await supabaseClient
            .from('access_keys')
            .select('secret_key')
            .eq('id', persona)
            .single();

        if (error || data.secret_key !== inputPass) {
            throw new Error("Invalid pass key, blud!");
        }

        // ✅ already correct
        state.currentPersonaId = `${persona}_official`;
        console.log("Persona locked:", state.currentPersonaId);
        localStorage.setItem('vibe_persona', persona);
        
        // ❌ _supabase
        // ❌ currentPersonaId
        // ✅ supabaseClient + state.currentPersonaId
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', state.currentPersonaId)
            .single();

        if (profile) {
            // ❌ userProfile
            // ✅ state.userProfile
            state.userProfile = { 
                displayName: profile.display_name, 
                avatar: profile.avatar_url, 
                persona: profile.persona 
            };

            document.getElementById('gate-overlay').classList.add('hidden');
            document.getElementById('lockscreen').style.display = "none";
            launchApp();
        } else {
            document.getElementById('gate-overlay').classList.add('hidden');
            document.getElementById('lockscreen').style.display = "flex";
            document.getElementById('lockscreen').style.opacity = "1";
        }

    } catch (err) {
        errorMsg.innerHTML = `<span>ⓘ</span> ${err.message}`;
        errorMsg.classList.add('blink-red');
        passField.classList.add('blink-red');

        setTimeout(() => {
            errorMsg.classList.remove('blink-red');
            passField.classList.remove('blink-red');
        }, 2000);
    }
}

export function handleGateInput() {
    const passField = document.getElementById('gate-password');
    const buttons = document.querySelectorAll('.phesty-btn, .baroness-btn'); 
    
    if (passField.value.length >= 6) {
        buttons.forEach(btn => {
            btn.classList.add('ready-glow');
            btn.style.pointerEvents = "auto";
            btn.style.opacity = "1";
        });
    } else {
        buttons.forEach(btn => {
            btn.classList.remove('ready-glow');
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
        });
    }
}