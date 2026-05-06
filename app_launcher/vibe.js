import { state } from './state.js';
import { announceVibe } from './voice.js';
import { signatureLoops } from './quotes.js';

//---Greeting Bank---
export const greetingBank = {
    morning: {
        Phesty: [
            "hope your morning’s starting easy.",
            "fresh start, fresh energy today.",
            "let’s make today count, yeah?"
        ],
        Baroness: [
            "hope the morning’s treating you gently.",
            "new day, same glow.",
            "take it slow, you’ve got time."
        ]
    },
    afternoon: {
        Phesty: [
            "midday check, still in control?",
            "hope the day’s moving your way.",
            "don’t lose that momentum now."
        ],
        Baroness: [
            "hope the day’s been kind so far.",
            "still shining through the afternoon.",
            "just a little more to go."
        ]
    },
    evening: {
        Phesty: [
            "blud time to get night started.",
            "you made it through, take it in.",
            "slow it down, you’ve done enough."
        ],
        Baroness: [
            "the evening’s calm, just like you.",
            "time to relax, you’ve earned it.",
            "let the day fade easy."
        ]
    }
};

export async function setDynamicGreeting(user) {
    try {
        const hour = new Date().getHours();
        let timeOfDay =
            (hour >= 5 && hour < 12) ? "morning" :
            (hour >= 12 && hour < 17) ? "afternoon" : "evening";

        const welcomeEl = document.getElementById('welcome-text');
        if (welcomeEl && state.userProfile) {
            welcomeEl.innerText = `Hi ${state.userProfile.displayName}, Welcome back.`;
        }

        const persona = user || (state.userProfile ? state.userProfile.persona : 'Phesty');

        const userGreetings = greetingBank[timeOfDay][persona]
            || greetingBank[timeOfDay]['Phesty'];

        const randomGreeting =
            userGreetings[Math.floor(Math.random() * userGreetings.length)];

        const greetingEl = document.getElementById('dynamic-greeting');
        if (greetingEl) greetingEl.innerText = randomGreeting;

        startClock();
        fetchWeather();

    } catch (err) {
        console.error("Greeting Error:", err);
    }
}

export function startClock() {
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const localTimeEl = document.getElementById('local-time');
        if (localTimeEl) {
            localTimeEl.innerText = `${timeStr} HRS || ${state.dailySuggestion}`;
        }
    };

    updateTime();
    setInterval(updateTime, 60000);
}

export async function fetchWeather() {
    const success = (position) => {
        updateWeatherLogic(position.coords.latitude, position.coords.longitude);
    };

    const error = () => {
        updateWeatherLogic(-1.2864, 36.8172, "Nairobi");
    };

    navigator.geolocation.getCurrentPosition(success, error);
}

export async function updateWeatherLogic(lat, lon, forcedCity = null) {
    try {
        let cityName = forcedCity;

        if (!cityName) {
            const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            const geoData = await geoRes.json();
            cityName = geoData.city || geoData.locality || "Eldoret";
        }

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`
        );

        const data = await weatherRes.json();

        // ⚠️ SAFETY FIX (prevents crash if API acts up)
        if (!data.current_weather) throw new Error("Weather data missing");

        const weather = data.current_weather;
        const temp = Math.round(weather.temperature);
        const humid = data.hourly ? data.hourly.relative_humidity_2m[0] : "--";

        // ✅ STATE (already correct)
        if (temp <= 18) state.dailySuggestion = `${cityName} is cold, stay warm! ☕`;
        else if (temp < 26) state.dailySuggestion = `${cityName} is chill, enjoy the vibe. 🍃`;
        else state.dailySuggestion = `${cityName} is heating up! Keep icy. 🧊`;

        // UI updates
        document.getElementById('temp').innerText = `${temp}°C`;
        document.getElementById('humidity').innerText = `${humid}%`;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        document.getElementById('local-time').innerText =
            `${timeStr} HRS || ${state.dailySuggestion}`;

        document.getElementById('condition').innerText = "Temperature";

        // 🎙️ VOICE TRIGGER (THIS WAS MISSING)
       /* setTimeout(() => {
            announceVibe();
        }, 1500);*/

    } catch (err) {
        console.error("Logic Error:", err);
        state.dailySuggestion = "Vibing Locally";
    }
}

// 3. Core Engine
export function updateDate() {
    const options = { month: 'long', weekday: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);

    document.getElementById('date1').innerText = today;
    document.getElementById('date2').innerText = today;
}

export function generateVibe() {
    const launchDate = new Date(2026, 3, 11);
    const today = new Date();
    const MASTER_SEED = 2026;

    const timeDiff = today.getTime() - launchDate.getTime();
    const daysSinceLaunch = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    const shuffledLoops = [...signatureLoops];

    let seed = MASTER_SEED;

    for (let i = shuffledLoops.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [shuffledLoops[i], shuffledLoops[j]] =
        [shuffledLoops[j], shuffledLoops[i]];
    }

    const index = daysSinceLaunch % shuffledLoops.length;
    const vibe = shuffledLoops[index];

    document.getElementById('text1').innerText = vibe.part1;
    document.getElementById('text2').innerText = vibe.part2;

    const loadSafeImage = (elementId, imagePath) => {
        const el = document.getElementById(elementId);
        if (!el) return;

        const img = new Image();
        img.src = imagePath;

        img.onload = () => {
            el.style.backgroundImage = `url("${imagePath}")`;
        };

        img.onerror = () => {
            let altPath =
                imagePath.endsWith('.jpg')
                    ? imagePath.replace('.jpg', '.JPG')
                    : imagePath.replace('.JPG', '.jpg');

            el.style.backgroundImage = `url("${altPath}")`;
        };
    };

    loadSafeImage('card1', vibe.photo1);
    loadSafeImage('card2', vibe.photo2);
}

export function startVibeParade() {
    let origin = document.querySelector('.parade-origin');
    if (!origin) {
        origin = document.createElement('div');
        origin.className = 'parade-origin';
        document.body.appendChild(origin);
    }

    const emojis = ['❤️', '💖', '✨', '🌸', '💎', '🔥', '👑'];
    
    setInterval(() => {
        const p = document.createElement('span');
        p.className = 'parade-emoji';
        p.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
        const spreadWidth = (Math.random() - 0.5) * 1000; 
        p.style.setProperty('--spread', `${spreadWidth}px`);
        p.style.setProperty('--duration', (Math.random() * 4 + 8) + 's');
        origin.appendChild(p);
        setTimeout(() => p.remove(), 13000);
    }, 450); 
}

export function downloadCard(cardId, fileName) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const rect = card.getBoundingClientRect();

    html2canvas(card, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 3,
        logging: false,
        width: rect.width,
        height: rect.height,
        scrollX: 0,
        scrollY: -window.scrollY,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
            clonedDoc.getElementById(cardId).style.margin = "0";
        }
    }).then(canvas => {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${fileName}-${Date.now()}.png`;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png', 1.0);
    }).catch(err => {
        console.error("HD Capture failed:", err);
    });
}