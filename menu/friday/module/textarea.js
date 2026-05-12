// textarea.js — FRIDAY Input Engine 🧠✨

export function initTextareaEngine() {
    const textarea = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (!textarea || !sendBtn) {
        console.warn("Textarea engine missing DOM elements");
        return;
    }

    setupAutoResize(textarea);
    setupSendShortcut(textarea, sendBtn);

    console.log("Textarea engine online ✨");
}


// ===============================
// AUTO RESIZE ENGINE
// ===============================

function setupAutoResize(textarea) {

    const resize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    };

    textarea.addEventListener('input', resize);
    textarea.addEventListener('focus', resize);

    // initial sync (in case of prefilled text)
    resize();
}


// ===============================
// SEND BEHAVIOUR ENGINE
// ===============================

function setupSendShortcut(textarea, sendBtn) {

    const triggerSend = () => {
        if (typeof window.sendMessageFromEngine === "function") {
            window.sendMessageFromEngine();
        } else {
            console.warn("sendMessageFromEngine not connected");
        }
    };

    sendBtn.addEventListener('click', triggerSend);

    textarea.addEventListener('keydown', (e) => {

        // Enter sends
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            triggerSend();
        }

        // Shift + Enter = new line (default behaviour)
    });
}