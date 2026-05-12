// ui.js
import { dom } from './dom.js';
import { escapeHtml } from './utils.js';

export function showFloatingNote(msg) {
    const floatDiv = dom.floatingMessage;
    if (floatDiv) {
        floatDiv.innerText = msg;
        floatDiv.style.opacity = '1';
        floatDiv.style.animation = 'none';
        setTimeout(() => floatDiv.style.animation = 'floatUp 0.3s ease', 5);
        setTimeout(() => {
            if (floatDiv.innerText === msg) floatDiv.style.opacity = '0.9';
        }, 2800);
    }
}

export function appendMessage(sender, text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'friday-message'}`;
    const avatarContent = isUser ? '👤' : '✨';
    msgDiv.innerHTML = `<div class="avatar">${avatarContent}</div><div class="bubble">${escapeHtml(text)}</div>`;
    dom.chatArea.insertBefore(msgDiv, dom.typingDiv);
    dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
}

export function closeDrawer() {
    dom.drawerOverlay.classList.remove('active');
}

export function initDrawer() {
    dom.drawerTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.drawerOverlay.classList.add('active');
    });
    dom.drawerOverlay.addEventListener('click', (e) => {
        if (e.target === dom.drawerOverlay) closeDrawer();
    });
    dom.returnToChat?.addEventListener('click', closeDrawer);
    dom.goToVoice?.addEventListener('click', () => {
        window.location.href = '/menu/friday/friday-bridge.html';
    });
}