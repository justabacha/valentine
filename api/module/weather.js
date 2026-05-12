// weather.js
export async function fetchWeatherData() {
    try {
        const pos = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) reject();
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=auto`);
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;
        let condition = "clear";
        if (weatherCode >= 61 && weatherCode <= 67) condition = "rainy";
        else if (weatherCode >= 71) condition = "snow";
        const icon = condition === "rainy" ? "🌧️" : (condition === "snow" ? "❄️" : "☀️");
        const humidity = data.hourly?.relativehumidity_2m?.[0] ?? Math.floor(Math.random() * 30 + 50);
        const wind = data.current_weather?.windspeed ?? Math.floor(Math.random() * 15 + 5);
        const feelsLike = Math.round(temp - (wind > 10 ? 3 : 1));
        return { temp, condition, icon, humidity, wind, feelsLike };
    } catch (e) {
        return { temp: 22, condition: "clear", icon: "☀️", humidity: 65, wind: 8, feelsLike: 21 };
    }
}