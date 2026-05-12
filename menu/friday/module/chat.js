import { state } from '../../../app_launcher/state.js';

export function initializeChat() {

    initializeDemoChat();
    initializeInput();

    console.log("Chat systems initialized ✨");
}


// ========================================
// DEMO CHAT
// ========================================

function initializeDemoChat() {

    appendMessage(
        'FRIDAY',
        "Session restored successfully ✨",
        false
    );

    appendMessage(
        'FRIDAY',
        "Your emotional systems are synchronizing softly 🌙",
        false
    );

    appendMessage(
        'FRIDAY',
        "Welcome back. I remember your atmosphere.",
        false
    );
}


// ========================================
// INPUT
// ========================================

function initializeInput() {

    const textarea = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (!textarea || !sendBtn) return;

    sendBtn.addEventListener('click', sendMessage);

    textarea.addEventListener('keypress', (e) => {

        if (e.key === 'Enter' && !e.shiftKey) {

            e.preventDefault();
            sendMessage();
        }
    });
}


// ========================================
// SEND MESSAGE
// ========================================

function sendMessage() {

    const textarea = document.getElementById('messageInput');

    if (!textarea) return;

    const msg = textarea.value.trim();

    if (!msg) return;

    appendMessage('You', msg, true);

    textarea.value = '';

    setTimeout(() => {

        appendMessage(
            'FRIDAY',
            "Message received softly ✨",
            false
        );

    }, 700);
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

    // 🧠 REAL AVATAR LOGIC
    let avatarContent;

    if (isUser) {
        avatarContent = state.userProfile?.avatar
            ? `<img src="${state.userProfile.avatar}" />`
            : '👤';
     } else {
        const fridayAvatar = "https://img.icons8.com/fluency/48/artificial-intelligence.png"; 
        avatarContent = fridayAvatar 
            ? `<img src="${fridayAvatar}" onerror="this.src='data:image/svg+xml;base64,PHN2Zy8+'; this.parentElement.innerHTML='✨'" />`
            : '✨';
    }

    msgDiv.innerHTML = `
        <div class="avatar">${avatarContent}</div>
        <div class="bubble">${escapeHtml(text)}</div>
    `;

    chatArea.insertBefore(msgDiv, typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}


// ========================================
// HELPERS
// ========================================

function escapeHtml(str) {

    return str.replace(/[&<>]/g, function(m){

        if(m === '&') return '&amp;';
        if(m === '<') return '&lt;';
        if(m === '>') return '&gt;';

        return m;
    });
}