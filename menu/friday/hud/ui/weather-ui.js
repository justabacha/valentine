import { fetchWeatherData } from '../../module/weather.js';
import { fetchLocationData } from '../../module/location.js';
import { addChatMsg } from './chat-ui.js';

async function updateWeatherCard() {
  try {
    const weather = await fetchWeatherData();
    const location = await fetchLocationData();
    const city = location.city || 'your area';
    
    document.getElementById('w-temp').textContent = weather.temp;
    document.getElementById('w-condition').textContent = weather.condition;
    document.getElementById('w-feels').textContent = `${weather.feelsLike}°C`;
    document.getElementById('w-wind').textContent = `${weather.wind} km/h`;
    document.getElementById('w-humidity').textContent = `${weather.humidity}%`;
    document.getElementById('w-vis').textContent = `10 km`; // visibility not available in free Open-Meteo? we keep static
    document.getElementById('w-location').textContent = city.toUpperCase();
    
    // optional: announce weather in chat once on load
    addChatMsg(`Weather: ${weather.condition}, ${weather.temp}°C in ${city}.`, 'friday');
  } catch (err) {
    console.warn("Weather update failed", err);
    document.getElementById('w-condition').textContent = 'Unavailable';
  }
}

export function initWeatherUI() {
  updateWeatherCard();
  // refresh every 30 minutes
  setInterval(updateWeatherCard, 30 * 60 * 1000);
}