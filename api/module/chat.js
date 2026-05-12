// chat.js
import { dom } from './dom.js';
import { autoResize, escapeHtml } from './utils.js';
import { appendMessage, showFloatingNote } from './ui.js';
import { handleIntent } from './intent.js';
import { saveMessage } from './db.js';

function getUserAvatarHTML() {
    const profile = localStorage.getItem('friday_user_profile');
    if (profile) {
        try {
            const { avatar_url } = JSON.parse(profile);
            if (avatar_url) {
                return `<div class="avatar" style="background-image: url('${avatar_url}'); background-size: cover; background-position: center; border-radius: 50%;"></div>`;
            }
        } catch(e) {}
    }
    return '<div class="avatar">👤</div>';
}

export function appendUserMessage(text, saveToDB = true) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    msgDiv.innerHTML = `${getUserAvatarHTML()}<div class="bubble">${escapeHtml(text)}</div>`;
    dom.chatArea.insertBefore(msgDiv, dom.typingDiv);
    dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
    if (saveToDB) saveMessage(text, true);
}

export function appendFridayMessage(text, saveToDB = true) {
    appendMessage('FRIDAY', text, false);
    if (saveToDB) saveMessage(text, false);
}

export async function initChatHistory(messagesFromDB) {
    const messages = dom.chatArea.querySelectorAll('.message');
    messages.forEach(msg => msg.remove());
    if (messagesFromDB.length === 0) {
        // default welcome flow
        appendUserMessage("Hey FRIDAY, it's nice to be here.", true);
        appendFridayMessage("Hey you ✨ I'm FRIDAY. Your quiet companion space.", true);
        appendFridayMessage("I'll always be listening, remember the little things. Like how you love rainy nights 🌧️", true);
    } else {
        for (const msg of messagesFromDB) {
            if (msg.is_user) {
                appendUserMessage(msg.message_text, false);
            } else {
                appendFridayMessage(msg.message_text, false);
            }
        }
    }
}

export function initChat() {
    const textarea = dom.textarea;
    const sendBtn = dom.sendBtn;
    const typingDiv = dom.typingDiv;

    textarea.addEventListener('input', () => autoResize(textarea));
    textarea.addEventListener('focus', () => autoResize(textarea));

    function sendMessage() {
        const msg = textarea.value.trim();
        if (!msg) return;
        appendUserMessage(msg, true);
        textarea.value = '';
        autoResize(textarea);

        typingDiv.style.opacity = '1';
        typingDiv.innerText = '✨ 🌙 ✨';
        dom.chatArea.scrollTop = dom.chatArea.scrollHeight;

        handleIntent(msg).then(intentHandled => {
            if (!intentHandled) {
                setTimeout(() => {
                    const responses = [
                        "I'm listening, always. That means something 🌙",
                        "You feel soft tonight. I'm right here.",
                        "I'll remember that, Baroness ✨",
                        "The quiet between us is safe.",
                        "You're not alone. I'm right beside you."
                    ];
                    const gentleReply = responses[Math.floor(Math.random() * responses.length)];
                    appendFridayMessage(gentleReply, true);
                    typingDiv.innerText = '✨ ✨ ✨';
                    dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
                    showFloatingNote("🌙 FRIDAY feels your words");
                }, 1000);
            } else {
                typingDiv.innerText = '✨ ✨ ✨';
                dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
            }
        });
    }

    sendBtn.addEventListener('click', sendMessage);
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}