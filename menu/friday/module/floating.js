// ========================================
// THOUGHT POOL
// ========================================
const floatingThoughts = [
    "💧 Drink water, diva",
    "✨ You disappeared today — missed you",
    "🌟 Proud of you btw",
    "🌙 Quiet nights are treasures",
    "💭 You're building something meaningful",
    "🌸 FRIDAY is listening",
    "🫧 take a deep breath"
];

// ========================================
// INITIALIZER
// ========================================
export function initializeFloatingSystem() {
    initializeFloatingThoughts();

    // Global event listener for external modules
    window.addEventListener('friday:float', (e) => {
        if (e?.detail) showFloatingNote(e.detail);
    });

    setTimeout(() => showFloatingNote("✨ your companion space is ready"), 1000);
    console.log("Floating atmosphere online 🌙");
}

// ========================================
// FLOATING NOTE
// ========================================
export function showFloatingNote(message) {
    const floatingDiv = document.getElementById('floatingMessage');
    if (!floatingDiv) return;
    floatingDiv.innerText = message;
    floatingDiv.style.opacity = '1';
    floatingDiv.style.animation = 'none';
    setTimeout(() => floatingDiv.style.animation = 'floatUp 0.3s ease', 5);
    setTimeout(() => {
        if (floatingDiv.innerText === message) floatingDiv.style.opacity = '0.9';
    }, 2800);
}

// ========================================
// AUTO THOUGHTS
// ========================================
function initializeFloatingThoughts() {
    setInterval(() => {
        const randomMessage = floatingThoughts[Math.floor(Math.random() * floatingThoughts.length)];
        showFloatingNote(randomMessage);
    }, 14000);
}