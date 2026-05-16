import { state } from '../../../app_launcher/state.js';
import { supabaseClient } from '../../../app_launcher/config.js';
import { handleIntent } from './intents.js';
import { initTextareaEngine } from './textarea.js';
import { showFloatingNote } from './floating.js';

let currentOffset = 0;
const PAGE_SIZE = 30;
let isLoadingMore = false;
let hasMoreMessages = true;
let scrollTriggerEnabled = true;

export async function initializeChat() {
    initTextareaEngine();
    window.sendMessageFromEngine = sendMessage;
    setupScrollListener();
    await loadChatHistory();
    console.log("Chat systems initialized & bridged ✨");
}

function setupScrollListener() {
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;
    chatArea.addEventListener('scroll', () => {
        if (!scrollTriggerEnabled) return;
        if (chatArea.scrollTop <= 50 && !isLoadingMore && hasMoreMessages) {
            loadOlderMessages();
        }
    });
}

async function loadOlderMessages() {
    if (isLoadingMore || !hasMoreMessages || !state.userProfile?.id) return;
    isLoadingMore = true;
    scrollTriggerEnabled = false;
    const chatArea = document.getElementById('chatArea');
    const oldScrollHeight = chatArea.scrollHeight;
    const oldScrollTop = chatArea.scrollTop;

    const { data, error } = await supabaseClient
        .from('friday_messages')
        .select('*')
        .eq('owner_id', state.userProfile.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })   // tie‑breaker for stable ordering
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (error) {
        console.error("Failed to load older messages:", error);
        isLoadingMore = false;
        scrollTriggerEnabled = true;
        return;
    }

    if (!data || data.length === 0) {
        hasMoreMessages = false;
        isLoadingMore = false;
        scrollTriggerEnabled = true;
        return;
    }

    const messages = data.reverse(); // oldest first for prepending
    const typingDiv = document.getElementById('typingDots');
    for (const msg of messages) {
        const isUser = msg.sender === 'user';
        const msgDiv = createMessageElement(isUser ? 'You' : 'FRIDAY', msg.message, isUser);
        chatArea.insertBefore(msgDiv, typingDiv);
    }
    currentOffset += data.length;
    if (data.length < PAGE_SIZE) hasMoreMessages = false;

    // Restore scroll position
    const newScrollHeight = chatArea.scrollHeight;
    chatArea.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
    isLoadingMore = false;
    scrollTriggerEnabled = true;
}

async function loadChatHistory() {
    if (!state.userProfile?.id) return;
    currentOffset = 0;
    hasMoreMessages = true;

    const chatArea = document.getElementById('chatArea');
    const typingDiv = document.getElementById('typingDots');
    if (chatArea && typingDiv) {
        // Clear all messages except the typing indicator
        while (chatArea.firstChild !== typingDiv) {
            chatArea.removeChild(chatArea.firstChild);
        }
    }

    const { data, error } = await supabaseClient
        .from('friday_messages')
        .select('*')
        .eq('owner_id', state.userProfile.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })   // stable order
        .range(0, PAGE_SIZE - 1);

    if (error) {
        console.error("Failed to load messages:", error);
        showWelcomeMessage();
        return;
    }

    if (!data || data.length === 0) {
        showWelcomeMessage();
        hasMoreMessages = false;
        return;
    }

    const messages = data.reverse(); // now oldest first (top to bottom)
    for (const msg of messages) {
        const isUser = msg.sender === 'user';
        appendMessage(isUser ? 'You' : 'FRIDAY', msg.message, isUser, true);
    }
    currentOffset = data.length;
    if (data.length < PAGE_SIZE) hasMoreMessages = false;

    // 🎯 SCROLL TO BOTTOM – ensures latest message is visible
    scrollToBottom();
}

function showWelcomeMessage() {
    const welcomeMsg = "✨ Welcome back, love. Your story continues here. How are you feeling today? 🌙";
    appendMessage('FRIDAY', welcomeMsg, false, true);
}

export async function saveMessage(sender, text) {
    if (!state.userProfile?.id) return;
    try {
        await supabaseClient.from('friday_messages').insert({
            owner_id: state.userProfile.id,
            sender: sender,
            message: text,
            message_type: 'text'
        });
    } catch (e) {
        console.warn("Failed to save message:", e);
    }
}

function sendMessage() {
    const textarea = document.getElementById('messageInput');
    const typingDiv = document.getElementById('typingDots');
    if (!textarea || !typingDiv) return;

    const msg = textarea.value.trim();
    if (!msg) return;

    appendMessage('You', msg, true);
    saveMessage('user', msg);

    textarea.value = '';
    textarea.dispatchEvent(new Event('input'));

    typingDiv.style.opacity = '1';
    typingDiv.innerText = '✨ 🌙 ✨';

    handleIntent(msg).then((intentHandled) => {
        if (!intentHandled) {
            setTimeout(async () => {
                const responses = [
                    "I'm listening, always 🌙",
                    "Your atmosphere feels calm tonight ✨",
                    "FRIDAY received your message softly.",
                    "You are safe here.",
                    "I'm right beside you 🦾"
                ];
                const reply = responses[Math.floor(Math.random() * responses.length)];
                appendMessage('FRIDAY', reply, false);
                await saveMessage('FRIDAY', reply);
                typingDiv.innerText = '✨ ✨ ✨';
                showFloatingNote("🌙 FRIDAY feels your words");
            }, 700);
        } else {
            setTimeout(() => {
                typingDiv.innerText = '✨ ✨ ✨';
            }, 5200);
        }
    });
}

export function appendMessage(sender, text, isUser = false, dontSave = false) {
    const chatArea = document.getElementById('chatArea');
    const typingDiv = document.getElementById('typingDots');
    if (!chatArea || !typingDiv) return;
    const msgDiv = createMessageElement(sender, text, isUser);
    chatArea.insertBefore(msgDiv, typingDiv);
    scrollToBottom(); // ensures new messages are visible
}

function scrollToBottom() {
    const chatArea = document.getElementById('chatArea');
    if (chatArea) {
        // Use requestAnimationFrame to wait for DOM updates
        requestAnimationFrame(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        });
    }
}

function createMessageElement(sender, text, isUser) {
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
    return msgDiv;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}