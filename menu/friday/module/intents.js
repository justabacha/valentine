import { fetchWeatherData } from './weather.js';
import { getCurrentTimeData } from './time.js';
import { fetchLocationData } from './location.js';
import { showStarkModal } from './modal.js';
import { appendMessage, saveMessage } from './chat.js';
import { showFloatingNote } from './floating.js';
import { supabaseClient } from '../../../app_launcher/config.js';
import { state } from '../../../app_launcher/state.js';
import { loadPinnedMemories } from './drawer.js';

// ========================================
// HELPER: clean memory text
// ========================================
function cleanMemoryText(rawText, commandWord) {
    let cleaned = rawText.replace(new RegExp(`^.*?${commandWord}\\s*`, 'i'), '');
    const stopwords = ['that', 'this', 'please', 'to', 'the', 'a', 'an', 'for', 'of', 'and', 'but', 'so', 'then'];
    const words = cleaned.split(' ');
    if (words.length > 0 && stopwords.includes(words[0].toLowerCase())) {
        words.shift();
        cleaned = words.join(' ');
    }
    return cleaned.trim();
}

// ========================================
// MAIN INTENT HANDLER
// ========================================
export async function handleIntent(userMessage) {
    const lower = userMessage.toLowerCase();

    // ---------- WEATHER ----------
    if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast')) {
        const weather = await fetchWeatherData();
        showStarkModal({
            centerTitle: `${weather.temp}°C`,
            centerSub: weather.condition.toUpperCase(),
            centerDynamic: weather.icon,
            cards: [
                { label: 'Humidity', value: `${weather.humidity}%` },
                { label: 'Wind', value: `${weather.wind} km/h` },
                { label: 'Feels Like', value: `${weather.feelsLike}°` },
                { label: 'Visibility', value: '10 km' }
            ],
            responseText: `Current conditions: ${weather.temp}°C, ${weather.condition}.`,
            responseSmall: `“FRIDAY scanned the atmosphere ✨”`
        });
        setTimeout(async () => {
            const reply = `Weather update: ${weather.temp}°C, ${weather.condition}. ${weather.icon}`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        }, 5200);
        return true;
    }

    // ---------- TIME ----------
    if (lower.includes('time') || lower.includes('clock')) {
        const timeData = getCurrentTimeData();
        showStarkModal({
            centerTitle: timeData.timeString,
            centerSub: 'LOCAL TIME',
            centerDynamic: '⏰',
            cards: [
                { label: 'Timezone', value: timeData.timezone },
                { label: 'Date', value: timeData.dateString },
                { label: 'Day', value: timeData.now.toLocaleDateString(undefined, { weekday: 'long' }) },
                { label: 'Seconds', value: timeData.now.getSeconds() }
            ],
            responseText: `It's ${timeData.timeString} on ${timeData.dateString}.`,
            responseSmall: '“Always here, always now ✨”'
        });
        setTimeout(async () => {
            const reply = `The time is ${timeData.timeString}. ${timeData.dateString}`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        }, 5200);
        return true;
    }

    // ---------- LOCATION ----------
    if (lower.includes('location') || lower.includes('where am i') || lower.includes('city')) {
        const location = await fetchLocationData();
        showStarkModal({
            centerTitle: location.city.toUpperCase(),
            centerSub: 'CURRENT POSITION',
            centerDynamic: '📍',
            cards: [
                { label: 'Latitude', value: location.latitude ? location.latitude.toFixed(4) : '--' },
                { label: 'Longitude', value: location.longitude ? location.longitude.toFixed(4) : '--' },
                { label: 'Accuracy', value: '±10m' },
                { label: 'Status', value: 'SECURE' }
            ],
            responseText: `You are in ${location.city}.`,
            responseSmall: '“FRIDAY knows where you are 🛸”'
        });
        setTimeout(async () => {
            const reply = `You are in ${location.city}. I'm right there with you. 🌍`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        }, 5200);
        return true;
    }

    // ---------- DELETE MEMORY RANGE ----------
    const rangeMatch = lower.match(/delete\s+memory\s+(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
        let start = parseInt(rangeMatch[1], 10);
        let end = parseInt(rangeMatch[2], 10);
        if (start > end) [start, end] = [end, start];
        if (!window._fridayMemories || start < 1 || end > window._fridayMemories.length) {
            const reply = `Please check the memory numbers (1 to ${window._fridayMemories?.length || 0}). Open the drawer to see them.`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            return true;
        }
        const toDelete = window._fridayMemories.slice(start-1, end);
        const ids = toDelete.map(m => m.id);
        const { error } = await supabaseClient
            .from('friday_memories')
            .delete()
            .in('id', ids)
            .eq('owner_id', state.userProfile.id);
        if (error) {
            const reply = "Couldn't delete that range. Try again? 🌙";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        } else {
            const reply = `🗑️ Forgotten memories ${start} through ${end}.`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            showFloatingNote("Range erased ✨");
            await loadPinnedMemories();
        }
        return true;
    }

    // ---------- DELETE SINGLE MEMORY ----------
    const deleteMatch = lower.match(/delete\s+memory\s+(\d+)/);
    if (deleteMatch) {
        const index = parseInt(deleteMatch[1], 10) - 1;
        if (!window._fridayMemories || index < 0 || index >= window._fridayMemories.length) {
            const reply = `I couldn't find memory number ${parseInt(deleteMatch[1],10)}. Open the drawer to see the list. ✨`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            return true;
        }
        const memoryToDelete = window._fridayMemories[index];
        const { error } = await supabaseClient
            .from('friday_memories')
            .delete()
            .eq('id', memoryToDelete.id)
            .eq('owner_id', state.userProfile.id);
        if (error) {
            const reply = "I couldn't delete that memory right now. Try again? 🌙";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        } else {
            const reply = `🗑️ I've erased memory ${parseInt(deleteMatch[1],10)}: “${memoryToDelete.memory_text.substring(0, 60)}”`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            showFloatingNote("Memory forgotten ✨");
            await loadPinnedMemories();
        }
        return true;
    }

    // ---------- DELETE ALL MEMORIES (with confirmation) ----------
    if (lower.match(/delete\s+all\s+memories?/)) {
        if (!window._fridayMemories || window._fridayMemories.length === 0) {
            const reply = "You have no memories to delete, love. ✨";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            return true;
        }
        const reply = `⚠️ You want to delete ALL ${window._fridayMemories.length} memories? This cannot be undone. Say "yes, erase all" to confirm.`;
        appendMessage('FRIDAY', reply, false);
        await saveMessage('FRIDAY', reply);
        window._pendingDeleteAll = true;
        return true;
    }

    if (window._pendingDeleteAll && (lower === 'yes erase all' || lower === 'yes' || lower === 'confirm')) {
        window._pendingDeleteAll = false;
        const { error } = await supabaseClient
            .from('friday_memories')
            .delete()
            .eq('owner_id', state.userProfile.id)
            .eq('is_pinned', true);
        if (error) {
            const reply = "Couldn't delete all memories. Try again later? 🌙";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        } else {
            const reply = `✨ All memories have been gently erased. A fresh start. ✨`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            showFloatingNote("All memories forgotten 🕊️");
            await loadPinnedMemories();
        }
        return true;
    }

    // ---------- CREATE MEMORY ----------
    const memoryKeywords = ['remember', 'pin this', 'save this', 'never forget', 'make a note', 'keep this'];
    const matchedKeyword = memoryKeywords.find(keyword => lower.includes(keyword));
    if (matchedKeyword) {
        let memoryText = userMessage;
        const regex = new RegExp(`^.*?${matchedKeyword}\\s*`, 'i');
        memoryText = memoryText.replace(regex, '').trim();
        memoryText = cleanMemoryText(memoryText, matchedKeyword);

        if (!memoryText) {
            const reply = "What would you like me to remember, love? 🌙";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            return true;
        }

        if (!state.userProfile?.id) {
            const reply = "You need to be signed in to save memories.";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            return true;
        }

        const { error } = await supabaseClient
            .from('friday_memories')
            .insert({
                owner_id: state.userProfile.id,
                memory_text: memoryText,
                emotion_tag: 'soft',
                is_pinned: true
            });

        if (error) {
            console.error("Memory save error:", error);
            const reply = "I couldn't save that memory right now. Try again later? ✨";
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
        } else {
            const reply = `✨ I'll remember: “${memoryText.substring(0, 80)}” ✨`;
            appendMessage('FRIDAY', reply, false);
            await saveMessage('FRIDAY', reply);
            showFloatingNote("📌 Memory saved to your galaxy");
            await loadPinnedMemories();
        }
        return true;
    }

    // ---------- no intent matched ----------
    if (window._pendingDeleteAll) window._pendingDeleteAll = false;
    return false;
}