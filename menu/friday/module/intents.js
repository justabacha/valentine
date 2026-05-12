import { fetchWeatherData } from './weather.js';
import { getCurrentTimeData } from './time.js';
import { fetchLocationData } from './location.js';
import { showStarkModal } from './modal.js';
import { appendMessage } from './chat.js';

export async function handleIntent(userMessage) {
    const lower = userMessage.toLowerCase();

    // ========================================
    // WEATHER
    // ========================================
    if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast')) {
        const weather = await fetchWeatherData();

        showStarkModal({
            centerTitle: `${weather.temp}°C`,
            centerSub: weather.condition.toUpperCase(),
            centerDynamic: weather.icon,
            cards: [
                { label: 'Humidity', value: `${weather.humidity}%` },
                { label: 'Wind', value: `${weather.wind} km/h` },
                { label: 'Feels Like', value: `${weather.feelsLike}°` },
                { label: 'Visibility', value: '10 km' }
            ],
            responseText: `Current conditions: ${weather.temp}°C, ${weather.condition}.`,
            responseSmall: `“FRIDAY scanned the atmosphere ✨”`
        });

        setTimeout(() => {
            appendMessage('FRIDAY', `Weather update: ${weather.temp}°C, ${weather.condition}. ${weather.icon}`, false);
        }, 5200);

        return true;
    }

    // ========================================
    // TIME
    // ========================================
    if (lower.includes('time') || lower.includes('clock')) {
        const timeData = getCurrentTimeData();

        showStarkModal({
            centerTitle: timeData.timeString,
            centerSub: 'LOCAL TIME',
            centerDynamic: '⏰',
            cards: [
                { label: 'Timezone', value: timeData.timezone },
                { label: 'Date', value: timeData.dateString },
                { label: 'Day', value: timeData.now.toLocaleDateString(undefined, { weekday: 'long' }) },
                { label: 'Seconds', value: timeData.now.getSeconds() }
            ],
            responseText: `It's ${timeData.timeString} on ${timeData.dateString}.`,
            responseSmall: '“Always here, always now ✨”'
        });

        setTimeout(() => {
            appendMessage('FRIDAY', `The time is ${timeData.timeString}. ${timeData.dateString}`, false);
        }, 5200);

        return true;
    }

    // ========================================
    // LOCATION
    // ========================================
    if (lower.includes('location') || lower.includes('where am i') || lower.includes('city')) {
        const location = await fetchLocationData();

        showStarkModal({
            centerTitle: location.city.toUpperCase(),
            centerSub: 'CURRENT POSITION',
            centerDynamic: '📍',
            cards: [
                {
                    label: 'Latitude',
                    value: location.latitude ? location.latitude.toFixed(4) : '--'
                },
                {
                    label: 'Longitude',
                    value: location.longitude ? location.longitude.toFixed(4) : '--'
                },
                {
                    label: 'Accuracy',
                    value: '±10m'
                },
                {
                    label: 'Status',
                    value: 'SECURE'
                }
            ],
            responseText: `You are in ${location.city}.`,
            responseSmall: '“FRIDAY knows where you are 🛸”'
        });

        setTimeout(() => {
            appendMessage('FRIDAY', `You are in ${location.city}. I'm right there with you. 🌍`, false);
        }, 5200);

        return true;
    }

    return false;
}