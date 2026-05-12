// ========================================
// TIME SERVICE
// ========================================

export function getCurrentTimeData() {

    const now = new Date();

    const hour = now.getHours();

    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    const dateString = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return {
        now,
        hour,
        timeString,
        dateString,
        timezone: `UTC${-now.getTimezoneOffset() / 60}`
    };
}


// ========================================
// GREETING ENGINE
// ========================================

export function getDayGreeting(hour) {

    if (hour < 12) {
        return "morning glow";
    }

    if (hour < 18) {
        return "golden afternoon";
    }

    return "quiet night";
}


// ========================================
// PRESENCE ENGINE
// ========================================

export function getPresenceMood(hour) {

    if (hour >= 22 || hour < 5) {

        return {
            detail: "Dreamy • Reflective 🌙",
            state: "Quiet • Reflective"
        };
    }

    if (hour >= 6 && hour < 12) {

        return {
            detail: "Soft • Awakening 🌸",
            state: "Calm • Listening"
        };
    }

    return {
        detail: "Calm • Present ✨",
        state: "Calm • Listening"
    };
}