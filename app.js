/***************************************************************************/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log("Vibe Service Worker Registered 🦾");

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version detected and installed, auto-reloading to apply heat!
            console.log("New version found! Reloading...");
            window.location.reload();
          }
        });
      });
    }).catch((err) => console.log("SW Failed:", err));
  });
}
/***************************************************************************/
// 1. Setup & Persistence Engine
let userProfile = JSON.parse(localStorage.getItem('vibe_profile')) || null;

function handleImageUpload(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('avatar-preview');
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.dataset.img = reader.result;
    };
    if (event.target.files && event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// Consolidated saveSetup - Handles both first-time and settings updates
function saveSetup(choice) {
    const nameInput = document.getElementById('user-name');
    const name = nameInput.value.trim();
    const photo = document.getElementById('avatar-preview').dataset.img || "";

    if (!name) {
        nameInput.style.border = "1px solid #ff4d6d";
        return;
    }

    userProfile = { 
        displayName: name, 
        avatar: photo, 
        persona: choice 
    };
    
    localStorage.setItem('vibe_profile', JSON.stringify(userProfile));
    console.log("Vibe updated and adapted, blud! 🦾");
    
    launchApp(); // Immediately boot up the interface
}

function launchApp() {
    const lockscreen = document.getElementById('lockscreen');
    if (lockscreen) {
        lockscreen.style.opacity = "0";
        setTimeout(() => lockscreen.style.display = "none", 500);
    }

    // Apply Avatar to Header safely
    const headerAvatar = document.getElementById('header-avatar-circle');
    if (headerAvatar && userProfile && userProfile.avatar) {
        headerAvatar.style.backgroundImage = `url(${userProfile.avatar})`;
    }

    // Initialize the Vibe
    updateDate();
    
    // Safety check for quotes.js
    if (typeof signatureLoops !== 'undefined') {
        generateVibe();
    } else {
        console.error("signatureLoops missing! Make sure quotes.js loads first.");
    }

    // Safe persona check
    if (userProfile && userProfile.persona) {
        setDynamicGreeting(userProfile.persona); 
    } else {
        console.warn("No user profile found. Using default.");
        setDynamicGreeting('Phesty');
    }
}

window.onload = () => {
    if (userProfile) {
        document.getElementById('lockscreen').style.display = "none";
        launchApp();
    } else {
        document.getElementById('lockscreen').style.display = "flex";
    }
};

function openSettings() {
    const lockscreen = document.getElementById('lockscreen');
    const nameInput = document.getElementById('user-name');
    const preview = document.getElementById('avatar-preview');

    if (userProfile) {
        nameInput.value = userProfile.displayName;
        if (userProfile.avatar) {
            preview.style.backgroundImage = `url(${userProfile.avatar})`;
            preview.dataset.img = userProfile.avatar;
        }
    }

    lockscreen.style.display = "flex";
    setTimeout(() => { lockscreen.style.opacity = "1"; }, 10);
}

// App Install Logic
let deferredPrompt;
const installModal = document.getElementById('install-modal');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installModal) installModal.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installModal.style.display = 'none';
    });
}

const closeBtn = document.getElementById('close-modal');
if (closeBtn) {
    closeBtn.addEventListener('click', () => { installModal.style.display = 'none'; });
}

// Wake up the voice engine
window.speechSynthesis.getVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// 2. The Greeting Vault
const greetingBank = {
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
            "time to ease into the night.",
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

let dailySuggestion = "Vibing..."; 

async function setDynamicGreeting(user) {
    try {
        const hour = new Date().getHours();
        let timeOfDay = (hour >= 5 && hour < 12) ? "morning" : (hour >= 12 && hour < 17) ? "afternoon" : "evening";

        const welcomeEl = document.getElementById('welcome-text');
        if (welcomeEl && userProfile) {
            welcomeEl.innerText = `Hi ${userProfile.displayName}, Welcome back.`;
        }

        const persona = user || (userProfile ? userProfile.persona : 'Phesty');
        const userGreetings = greetingBank[timeOfDay][persona] || greetingBank[timeOfDay]['Phesty'];
        const randomGreeting = userGreetings[Math.floor(Math.random() * userGreetings.length)];
        
        const greetingEl = document.getElementById('dynamic-greeting');
        if (greetingEl) greetingEl.innerText = randomGreeting;

        startClock();
        fetchWeather();
    } catch (err) {
        console.error("Greeting Error:", err);
    }
}

function startClock() {
    const updateTime = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const localTimeEl = document.getElementById('local-time');
        if(localTimeEl) localTimeEl.innerText = `${timeStr} HRS || ${dailySuggestion}`;
    };
    updateTime();
    setInterval(updateTime, 60000); 
}

async function fetchWeather() {
    const success = (position) => {
        updateWeatherLogic(position.coords.latitude, position.coords.longitude);
    };
    const error = () => {
        updateWeatherLogic(-1.2864, 36.8172, "Nairobi"); 
    };
    navigator.geolocation.getCurrentPosition(success, error);
}

async function updateWeatherLogic(lat, lon, forcedCity = null) {
    try {
        let cityName = forcedCity;
        if (!cityName) {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const geoData = await geoRes.json();
            cityName = geoData.city || geoData.locality || "Eldoret";
        }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
        const data = await weatherRes.json();
        const weather = data.current_weather;
        const temp = Math.round(weather.temperature);
        const humid = data.hourly ? data.hourly.relative_humidity_2m[0] : "--";

        if (temp <= 18) dailySuggestion = `${cityName} is cold, stay warm! ☕`;
        else if (temp > 18 && temp < 26) dailySuggestion = `${cityName} is chill, enjoy the vibe. 🍃`;
        else dailySuggestion = `${cityName} is heating up! Keep icy. 🧊`;

        document.getElementById('temp').innerText = `${temp}°C`;
        document.getElementById('humidity').innerText = `${humid}%`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        document.getElementById('local-time').innerText = `${timeStr} HRS || ${dailySuggestion}`;
        document.getElementById('condition').innerText = "Temperature";
        
        setTimeout(() => { announceVibe(); }, 1500);
    } catch (err) {
        console.error("Logic Error:", err);
        dailySuggestion = "Vibing Locally";
    }
}

async function announceVibe() {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; 

    let minutesStr = (minutes === 0) ? "o'clock" : (minutes < 10) ? `oh ${minutes}` : minutes;
    const period = ampm === 'AM' ? 'morning' : 'evening';
    const timeForVoice = `${hours} ${minutesStr} in the ${period}`;

    const welcome = userProfile ? `Hi ${userProfile.displayName}` : (document.getElementById('welcome-text')?.innerText || "Hi there");
    const greeting = document.getElementById('dynamic-greeting')?.innerText || "Welcome back";
    const rawStatus = document.getElementById('local-time')?.innerText || "";
    const cleanStatus = rawStatus.split('||')[1]?.trim() || "stay in your zone";

    const introVariants = ["Quick update,", "Here’s where we are,", "Right now,"];
    const intro = introVariants[Math.floor(Math.random() * introVariants.length)];

    const fullMessage = `${welcome}. ${greeting}... ${intro} it’s ${dayName}, ${dateStr},. The time is ${timeForVoice}.. Just so you know, ${cleanStatus}.`;
    const cleanText = fullMessage.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            body: JSON.stringify({ text: cleanText })
        });
        
        if (!response.ok) throw new Error(`API Bridge failed with status ${response.status}`);
        
        const audioBlob = await response.blob();
        
        // --- ROBUST AUDIO PLAYBACK LOGIC ---
        // 1. Get a URL for the Blob
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 2. Create an <audio> element
        const audioElement = new Audio();
        
        // 3. Create a promise to handle the playing state, which solves many autoplay and loading issues
        const playPromise = new Promise((resolve, reject) => {
            // Set up one-time 'canplaythrough' event listener to be sure the audio is ready
            audioElement.addEventListener('canplaythrough', () => {
                audioElement.play()
                    .then(resolve)
                    .catch(reject);
            }, { once: true });
            
            // Handle any errors during loading or playback
            audioElement.addEventListener('error', (e) => {
                console.error("Audio element error:", e);
                reject(new Error(`Audio error: ${audioElement.error?.message || 'Unknown error'}`));
            }, { once: true });
            
            // Set the source and load
            audioElement.src = audioUrl;
            audioElement.load(); // Explicitly start loading the audio
        });
        
        await playPromise;
        
        // Clean up the blob URL after playback finishes or fails
        audioElement.onended = () => URL.revokeObjectURL(audioUrl);
        audioElement.onerror = () => URL.revokeObjectURL(audioUrl);
        
    } catch (error) {
        console.error("Primary audio API failed, falling back to browser speech:", error);
        // --- Your existing native speech fallback ---
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const fallbackVoice = voices.find(v => v.name.toLowerCase().includes("male") && v.lang.startsWith("en"));
        if (fallbackVoice) utterance.voice = fallbackVoice;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function startVibeParade() {
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

window.addEventListener('load', startVibeParade);

// 3. Core Engine (Date, Vibe, Download)
function updateDate() {
    const options = { month: 'long', weekday: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    document.getElementById('date1').innerText = today;
    document.getElementById('date2').innerText = today;
}

function generateVibe() {
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
        [shuffledLoops[i], shuffledLoops[j]] = [shuffledLoops[j], shuffledLoops[i]];
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
        img.onload = () => { el.style.backgroundImage = `url("${imagePath}")`; };
        img.onerror = () => {
            let altPath = imagePath.endsWith('.jpg') ? imagePath.replace('.jpg', '.JPG') : imagePath.replace('.JPG', '.jpg');
            el.style.backgroundImage = `url("${altPath}")`;
        };
    };

    loadSafeImage('card1', vibe.photo1);
    loadSafeImage('card2', vibe.photo2);
}

function downloadCard(cardId, fileName) {
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

// 4. Safe Passcode Listener (Placeholder)
function checkPasscode() {
    console.log("Passcode check fired");
}
const passInput = document.getElementById('passcode-input');
if (passInput) {
    passInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPasscode(); });
}