import { state } from '../../../app_launcher/state.js';
import { handleIntent } from './intents.js';
import { initTextareaEngine } from './textarea.js';

export function initializeChat() {
    initializeDemoChat();
    
    // Connect the UI Engine
    initTextareaEngine();
    
    // Bridge the Textarea Engine to the Chat Logic
    window.sendMessageFromEngine = sendMessage;

    console.log("Chat systems initialized & bridged ✨");
}

// ========================================
// DEMO CHAT
// ========================================
function initializeDemoChat() {
    const greetings = [
        "Session restored successfully ✨",
        "Your emotional systems are synchronizing softly 🌙",
        "Welcome back. I remember your atmosphere."
    ];
    greetings.forEach(msg => appendMessage('FRIDAY', msg, false));
}

// ========================================
// SEND MESSAGE (The Bridge)
// ========================================
function sendMessage() {
    const textarea = document.getElementById('messageInput');
    if (!textarea) return;

    const msg = textarea.value.trim();
    if (!msg) return;

    appendMessage('You', msg, true);
    textarea.value = '';
    
    // Trigger auto-resize reset if available
    textarea.dispatchEvent(new Event('input'));

    handleIntent(msg).then((intentHandled) => {
        if (!intentHandled) {
            setTimeout(() => {
                const responses = [
                    "I'm listening, always 🌙",
                    "Your atmosphere feels calm tonight ✨",
                    "FRIDAY received your message softly.",
                    "You are safe here.",
                    "I'm right beside you 🦾"
                ];
                const reply = responses[Math.floor(Math.random() * responses.length)];
                appendMessage('FRIDAY', reply, false);
            }, 700);
        }
    });
}

// ========================================
// MESSAGE RENDERER
// ========================================
export function appendMessage(sender, text, isUser = false) {
    const chatArea = document.getElementById('chatArea');
    const typingDiv = document.getElementById('typingDots');
    if (!chatArea || !typingDiv) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'friday-message'}`;

    let avatarContent;
    if (isUser) {
        avatarContent = state.userProfile?.avatar
            ? `<img src="${state.userProfile.avatar}" />`
            : '👤';
    } else {
        const fridayAvatar = "https://img.icons8.com/fluency/48/artificial-intelligence.png"; 
        avatarContent = `<img src="${fridayAvatar}" onerror="this.parentElement.innerHTML='✨'" />`;
    }

    msgDiv.innerHTML = `
        <div class="avatar">${avatarContent}</div>
        <div class="bubble">${escapeHtml(text)}</div>
    `;

    chatArea.insertBefore(msgDiv, typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}