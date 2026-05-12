import { fetchWeatherData } from './weather.js';

import {
    getCurrentTimeData,
    getDayGreeting,
    getPresenceMood
} from './time.js';


// ========================================
// INITIALIZER
// ========================================

export function initializePresence() {

    updatePresence();

    // refresh every 30 mins
    setInterval(updatePresence, 1800000);

    console.log("Presence engine online ✨");
}


// ========================================
// MAIN ENGINE
// ========================================

async function updatePresence() {

    await updateWeatherWidget();

    updateTimeAwareness();

    updatePresenceMoodUI();
}


// ========================================
// WEATHER
// ========================================

async function updateWeatherWidget() {

    const weatherSpan =
        document.getElementById('weatherWidget');

    if (!weatherSpan) return;

    try {

        const weather = await fetchWeatherData();

        weatherSpan.innerHTML =
            `${weather.icon} ${weather.temp}° · ${weather.condition}`;

    } catch (error) {

        console.error(
            "Presence weather update failed:",
            error
        );

        weatherSpan.innerHTML =
            `🌙 soft breeze`;
    }
}


// ========================================
// TIME AWARENESS
// ========================================

function updateTimeAwareness() {

    const timeSpan =
        document.getElementById('timeAwareness');

    if (!timeSpan) return;

    const timeData = getCurrentTimeData();

    const greeting =
        getDayGreeting(timeData.hour);

    timeSpan.innerText =
        `${greeting} · ${timeData.timeString}`;
}


// ========================================
// MOOD UI
// ========================================

function updatePresenceMoodUI() {

    const presenceDetailSpan =
        document.getElementById('presenceDetail');

    const presenceStateSpan =
        document.getElementById('presenceState');

    const timeData = getCurrentTimeData();

    const mood =
        getPresenceMood(timeData.hour);

    if (presenceDetailSpan) {

        presenceDetailSpan.innerText =
            mood.detail;
    }

    // 🚨 IMPORTANT:
    // only override if session
    // didn't already personalize it

    if (
        presenceStateSpan &&
        !presenceStateSpan.dataset.locked
    ) {

        presenceStateSpan.innerText =
            mood.state;
    }
}


// ========================================
// SESSION LOCK
// ========================================

export function lockPresenceState(text) {
    const presenceStateSpan =
        document.getElementById('presenceState');

    if (!presenceStateSpan) return;
    presenceStateSpan.dataset.locked = "true";
    presenceStateSpan.innerText = text;
}