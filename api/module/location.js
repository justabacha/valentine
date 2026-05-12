// location.js
export async function fetchLocationName() {
    try {
        const pos = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) reject();
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const res = await fetch(`https://api.open-meteo.com/v1/geocoding?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&count=1&language=en`);
        const data = await res.json();
        if (data.results && data.results[0]) return data.results[0].name;
        return "your area";
    } catch (e) {
        return "your location";
    }
}

export async function getCurrentPosition() {
    try {
        return await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
    } catch {
        return null;
    }
}