// intent.js
import { fetchWeatherData } from './weather.js';
import { fetchLocationName, getCurrentPosition } from './location.js';
import { showStarkModal } from './modal.js';
import { appendMessage } from './ui.js';

export async function handleIntent(userMessage) {
    const lower = userMessage.toLowerCase();
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
            responseSmall: `“${weather.condition === 'rainy' ? 'Perfect for a cozy day 🌧️' : 'FRIDAY feels the breeze ✨'}”`
        });
        setTimeout(() => {
            appendMessage('FRIDAY', `Weather update: ${weather.temp}°C, ${weather.condition}. ${weather.icon}`, false);
        }, 5200);
        return true;
    }
    else if (lower.includes('time') || lower.includes('clock')) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        showStarkModal({
            centerTitle: timeStr,
            centerSub: 'LOCAL TIME',
            centerDynamic: '⏰',
            cards: [
                { label: 'Timezone', value: `UTC${-now.getTimezoneOffset() / 60}` },
                { label: 'Date', value: dateStr },
                { label: 'Day', value: now.toLocaleDateString(undefined, { weekday: 'long' }) },
                { label: 'Seconds', value: now.getSeconds() }
            ],
            responseText: `It's ${timeStr} on ${dateStr}.`,
            responseSmall: '“Always here, always now ✨”'
        });
        setTimeout(() => {
            appendMessage('FRIDAY', `The time is ${timeStr}. ${dateStr}`, false);
        }, 5200);
        return true;
    }
    else if (lower.includes('location') || lower.includes('where am i') || lower.includes('city')) {
        let lat = null, lon = null, city = "your area";
        const pos = await getCurrentPosition();
        if (pos) {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            city = await fetchLocationName();
        }
        showStarkModal({
            centerTitle: city.toUpperCase(),
            centerSub: 'CURRENT POSITION',
            centerDynamic: '📍',
            cards: [
                { label: 'Latitude', value: lat ? lat.toFixed(4) : '--' },
                { label: 'Longitude', value: lon ? lon.toFixed(4) : '--' },
                { label: 'Accuracy', value: '±10m' },
                { label: 'Status', value: 'SECURE' }
            ],
            responseText: `You are in ${city}.`,
            responseSmall: '“FRIDAY knows where you are 🛸”'
        });
        setTimeout(() => {
            appendMessage('FRIDAY', `You are in ${city}. I'm right there with you. 🌍`, false);
        }, 5200);
        return true;
    }
    return false;
}