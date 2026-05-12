// memory.js
import { dom } from './dom.js';
import { showFloatingNote } from './ui.js';
import { escapeHtml } from './utils.js';
import { togglePinMemory } from './db.js';

let currentMemories = [];

export async function renderMemoryList(memories) {
    currentMemories = memories;
    if (!dom.memoryList) return;
    dom.memoryList.innerHTML = memories.map(mem => `
        <div class="memory-card" data-id="${mem.id}" data-pinned="${mem.is_pinned}">
            <span>${escapeHtml(mem.memory_text)}</span>
            <span class="pin-icon" data-id="${mem.id}">${mem.is_pinned ? '📌✨' : '📍'}</span>
        </div>
    `).join('');
    attachPinListeners();
}

function attachPinListeners() {
    document.querySelectorAll('.memory-card .pin-icon').forEach(pin => {
        pin.removeEventListener('click', pinClickHandler);
        pin.addEventListener('click', pinClickHandler);
    });
}

async function pinClickHandler(e) {
    e.stopPropagation();
    const pin = e.currentTarget;
    const memoryId = pin.getAttribute('data-id');
    const card = pin.closest('.memory-card');
    const isPinned = card.getAttribute('data-pinned') === 'true';
    await togglePinMemory(memoryId, isPinned);
    showFloatingNote(`✨ Memory ${isPinned ? 'unpinned' : 'pinned'}`);
    // Reload memories after toggle (you may want to re‑call loadMemories and re‑render)
    const { loadMemories } = await import('./db.js');
    const newMemories = await loadMemories();
    await renderMemoryList(newMemories);
}