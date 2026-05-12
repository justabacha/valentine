// ========================================
// WEATHER SERVICE
// ========================================

export async function fetchWeatherData() {

    try {

        const position = await getUserPosition();

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`
        );

        const data = await response.json();

        const temp = Math.round(
            data.current_weather.temperature
        );

        const weatherCode =
            data.current_weather.weathercode;

        let condition = "clear";

        if (weatherCode >= 61 && weatherCode <= 67) {
            condition = "rainy";
        }

        else if (weatherCode >= 71) {
            condition = "snow";
        }

        const icon =
            condition === "rainy"
                ? "🌧️"
                : condition === "snow"
                ? "❄️"
                : "☀️";

        const humidity =
            data.hourly?.relativehumidity_2m?.[0] ?? 65;

        const wind =
            data.current_weather?.windspeed ?? 8;

        const feelsLike =
            Math.round(temp - (wind > 10 ? 3 : 1));

        return {
            success: true,
            temp,
            condition,
            icon,
            humidity,
            wind,
            feelsLike
        };

    } catch (error) {

        console.error(
            "Weather system fallback triggered:",
            error
        );

        return {
            success: false,
            temp: 22,
            condition: "clear",
            icon: "☀️",
            humidity: 65,
            wind: 8,
            feelsLike: 21
        };
    }
}


// ========================================
// GEOLOCATION
// ========================================

async function getUserPosition() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject("Geolocation unsupported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { timeout: 5000 }
        );
    });
}