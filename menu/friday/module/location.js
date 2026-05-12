// ========================================
// LOCATION SERVICE
// ========================================

export async function fetchLocationData() {

    try {

        const position = await getUserPosition();

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        let city = "your area";

        try {

            const response = await fetch(
                `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
            );

            const data = await response.json();

            city =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "your area";

        } catch (geoError) {

            console.warn(
                "Reverse geocoding failed:",
                geoError
            );
        }

        return {
            success: true,
            city,
            latitude,
            longitude
        };

    } catch (error) {

        console.error(
            "Location engine fallback triggered:",
            error
        );

        return {
            success: false,
            city: "your area",
            latitude: null,
            longitude: null
        };
    }
}


// ========================================
// GEOLOCATION
// ========================================

function getUserPosition() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject("Geolocation unsupported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                timeout: 5000
            }
        );
    });
}