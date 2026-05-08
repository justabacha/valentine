// ==========================================
// BARONESS & PHESTY: WISH ENGINE
// ==========================================
// 1. App State (The Brain)
/*let AppState = {
    currentUser: 'P',
    users: {
        'P': { name: 'Phesty', color: '#00ff51', dotClass: 'dot-p' },
        'B': { name: 'Baroness', color: '#007aff', dotClass: 'dot-b' }
    },
    selectedDate: null,
    wishes: []
};
// --- PROFILE SYNC ENGINE ---
const savedProfile = JSON.parse(localStorage.getItem('vibe_profile'));
if (savedProfile) {
    // Sync current user persona
    AppState.currentUser = (savedProfile.persona === 'Baroness') ? 'B' : 'P';   
    // Inject the name from your Main App into the engine
    AppState.users[AppState.currentUser].name = savedProfile.displayName;
    // Apply the Avatar to the correct circle once the page loads
    window.addEventListener('DOMContentLoaded', () => {
        const profileClass = (savedProfile.persona === 'Baroness') ? '.bestie-img' : '.phesty-img';
     const avatarEl = document.querySelector(profileClass);
        if (avatarEl && savedProfile.avatar) {
            avatarEl.style.backgroundImage = `url(${savedProfile.avatar})`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.innerText = ""; // Clear the 'P' or 'B' text
        }
    });
}
// 2. DOM Elements
const statsCapsule = document.querySelector('.stat-capsule');
const wishGallery = document.querySelector('.wish-gallery');
const calendarToggle = document.querySelector('.calendar-toggle');
const wishInput = document.querySelector('textarea');
const castStarBtn = document.querySelector('.cast-star-btn');
// 3. Initialization & Renders
function init() {
    updateStats();
    renderGallery();
}

function updateStats() {
    const total = AppState.wishes.length;
    const dusted = AppState.wishes.filter(w => w.status === 'dusted').length;
    statsCapsule.innerHTML = `<img src="https://img.icons8.com/fluency/48/star.png" width="20"> ${total} GOALS ! ${dusted} DUSTED`;
}

function formatDate(dateString) {
    // Converts "2026-05-04" to "04 May '26"
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year} ||`;
}

// 4. Cast Bar Logic (Calendar & Submit)
// --- Custom Calendar Engine ---
let currentCalDate = new Date();
const calModal = document.getElementById('calendar-modal');
function renderCustomCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const monthDisplay = document.getElementById('month-display');
    daysContainer.innerHTML = '';
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    monthDisplay.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalDate);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Fill empty slots for start of month
    for (let i = 0; i < firstDay; i++) {
        daysContainer.innerHTML += `<div class="day empty"></div>`;
    }
    // Fill actual days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = new Date().toISOString().split('T')[0] === dateString ? 'today' : '';
        const isSelected = AppState.selectedDate === dateString ? 'selected' : '';
        daysContainer.innerHTML += `<div class="day ${isToday} ${isSelected}" onclick="selectCalDate('${dateString}')">${d}</div>`;
    }
}
window.selectCalDate = function(dateStr) {
    AppState.selectedDate = dateStr;
    calendarToggle.innerHTML = `<span style="color: white; font-weight: bold;">${formatDate(dateStr)}</span>`;
    calModal.style.display = 'none'; // Close it
};
// Toggle visibility
calendarToggle.onclick = (e) => {
    e.stopPropagation();
    const isVisible = calModal.style.display === 'block';
    calModal.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) renderCustomCalendar();
};
// Nav buttons
document.getElementById('prevMonth').onclick = (e) => { e.stopPropagation(); currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCustomCalendar(); };
document.getElementById('nextMonth').onclick = (e) => { e.stopPropagation(); currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCustomCalendar(); };

// Close if clicking outside
document.addEventListener('click', (e) => { if (!calModal.contains(e.target)) calModal.style.display = 'none'; });
castStarBtn.addEventListener('click', () => {
    const text = wishInput.value.trim();
    if (!text || !AppState.selectedDate) {
        alert("Oi mate, pick a date and write a wish first!");
        return;
    }
    const newWish = {
        id: Date.now(),
        text: text,
        date: AppState.selectedDate, // We'll format it on render
        status: 'planning',
        creator: AppState.currentUser,
        ratings: { P: null, B: null },
        emoji: null
    };
    AppState.wishes.push(newWish);
  // Reset Bar
    wishInput.value = '';
  AppState.selectedDate = null;
    calendarToggle.innerHTML = `<img src="https://img.icons8.com/fluency/48/calendar.png" width="22">`;  
    updateStats();
  renderGallery();
});

// 5. Gallery Render Logic
function renderGallery() {
    wishGallery.innerHTML = ''; // Clear board
    AppState.wishes.forEach((wish, index) => {
        const num = index + 1;
        const creatorData = AppState.users[wish.creator];
        // Apply dynamic color based on creator
        const starColorStyle = `background-color: ${creatorData.color}; box-shadow: 0 0 10px ${creatorData.color}80;`;
        const displayDate = wish.date.includes('-') ? formatDate(wish.date).replace('||', '') : wish.date;
    if (wish.status === 'planning') {
            wishGallery.innerHTML += `
                <div class="wish-row" data-id="${wish.id}">
                    <div class="star-container" style="${starColorStyle}">
                        <span class="star-number">${num}</span>
                    </div>
                    <div class="meta-section">
                        <div class="date-morphism">${displayDate}</div>
                        <span class="status-label">PLANNING</span>
                    </div>
                    <div class="objective-text">${wish.text}</div>
                    <div class="card-actions">
                        <button class="action-svg-btn delete-wish" onclick="promptDelete(${wish.id})" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                        <button class="check-btn" onclick="dustWish(${wish.id})">✓✓</button>
                    </div>
                </div>
            `;
        } else {
            // DUSTED LAYOUT
            const shortText = wish.text.length > 15 ? wish.text.substring(0, 15) + '...' : wish.text;
            const reactions = wish.reactions || { P: '', B: '' };
            const pEmoji = reactions.P || '';
            const bEmoji = reactions.B || '';
            const emojiDisplay = (pEmoji || bEmoji)
    ? `${pEmoji}${bEmoji}`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>`;
   
            wishGallery.innerHTML += `
                <div class="wish-row dusted" data-id="${wish.id}">
                    <div class="star-container" style="${starColorStyle}">
                        <span class="star-number">${num}</span>
                    </div>
                    <div class="meta-section">
                        <div class="date-morphism">${displayDate}</div>
                        <span class="status-label" style="color: #00e676;">!! DUSTED</span>
                    </div>
                    <div class="objective-text" title="${wish.text}">${shortText}</div>
                    <div class="card-actions">
                        <button class="action-svg-btn" onclick="uploadPhotos(${wish.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </button>
                      <button class="action-svg-btn emoji-btn" onclick="promptEmoji(${wish.id})">
                            ${emojiDisplay}
                        </button>
                        <div class="ratings-box" onclick="promptRating(${wish.id})">
                            ${wish.ratings.P ? `<div class="rate-row"><span class="dot dot-p"></span> ${wish.ratings.P}</div>` : ''}
                            ${wish.ratings.B ? `<div class="rate-row"><span class="dot dot-b"></span> ${wish.ratings.B}</div>` : ''}
                            ${!wish.ratings.P && !wish.ratings.B ? '<span style="font-size: 10px; opacity:0.6;">Rate</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    });
}

// 6. Action Functions
window.dustWish = function(id) {
    const wish = AppState.wishes.find(w => w.id === id);
    if (wish) {
        wish.status = 'dusted';
        updateStats();
        renderGallery();
    }
};

window.promptDelete = function(id) {
    // Custom Confirm using a simple JS prompt (You can replace this with a styled custom div later)
    const sure = confirm("Are you sure you want to delete this wish, blud?");
    if (sure) {
        AppState.wishes = AppState.wishes.filter(w => w.id !== id);
        updateStats();
        renderGallery();
    }
};

window.uploadPhotos = function(id) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.onchange = e => {
        if (e.target.files.length > 3) {
         alert("Maximum of 3 photos allowed, mate!");
         return;
        }
        alert(`Successfully attached ${e.target.files.length} photos to the memory!`);
        // Here you would normally handle the file upload to a server
    };
    fileInput.click();
};
let activeWishId = null;
// The Local Summoner (Adjusted for your engine)
const loadEmojis = () => {
    const grid = document.getElementById('dynamic-emoji-grid');
    if (!grid) return;
    let emojiHTML = '';
    for (const [group, emojis] of Object.entries(LOCAL_EMOJIS)) {
        emojiHTML += `<div class="tray-category-header">${group.toUpperCase()}</div>`;
        emojis.forEach(char => {
            emojiHTML += `<span onclick="insertEmoji('${char}')">${char}</span>`;
        });
    }
    grid.innerHTML = emojiHTML;
    twemoji.parse(grid, {
        callback: (icon) => `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/${icon}.png`
    });
};

window.promptEmoji = function(id) {
    const tray = document.getElementById('emoji-tray');
    if (activeWishId === id && tray.style.display === 'block') {
        tray.style.display = 'none';
    } else {
        activeWishId = id;
        tray.style.display = 'block';
        loadEmojis();
    }
};

window.insertEmoji = function(char) {
    const wish = AppState.wishes.find(w => w.id === activeWishId);
    if (wish) {
        // Parse the emoji to a Twemoji image string
        const parsedEmoji = twemoji.parse(char, {
            callback: (icon) => `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/${icon}.png`
        });
        if (!wish.reactions) wish.reactions = { P: '', B: '' };
        wish.reactions[AppState.currentUser] = parsedEmoji;
        renderGallery();
        document.getElementById('emoji-tray').style.display = 'none';
    }
};
let currentRatingSelection = 0;
let ratingWishId = null;
// The one and only Rating Trigger
window.promptRating = function(id) {
    // 1. If it's already open for THIS card, just close it (Toggle vibe)
    const modal = document.getElementById('rating-modal');
    if (modal.style.display === 'flex' && ratingWishId === id) {
        return closeRatingModal();
    }
    ratingWishId = id;
    const wish = AppState.wishes.find(w => w.id === id);
    const peerDisplay = document.getElementById('peer-rating-display');
    if (!modal) return console.error("Rating modal missing, blud!");
    // 2. MOVEMENT: Find the row. We use the data-id we set in the gallery.
    const cardElement = document.querySelector(`.wish-row[data-id="${id}"]`);
    if (cardElement) {
        cardElement.after(modal);
    }
    // 3. Peer Rating Logic
    const otherUser = AppState.currentUser === 'P' ? 'B' : 'P';
    const otherScore = (wish.ratings && wish.ratings[otherUser]) ? wish.ratings[otherUser] : 0;
    peerDisplay.innerHTML = otherScore > 0
        ? `${AppState.users[otherUser].name.toUpperCase()} RATED: ${otherScore} ${'★'.repeat(otherScore)}`
        : `WAITING FOR ${AppState.users[otherUser].name.toUpperCase()}...`;
    // 4. State Reset
    currentRatingSelection = (wish.ratings && wish.ratings[AppState.currentUser]) ? wish.ratings[AppState.currentUser] : 0;
    updateStarDisplay(currentRatingSelection);
    modal.style.display = 'flex';
};
// GLOBAL DELEGATION: This fixes the "nothing happening" when clicking stars
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('star')) {
        currentRatingSelection = parseInt(e.target.dataset.value);
        updateStarDisplay(currentRatingSelection);
    }
});
function updateStarDisplay(value) {
    const stars = document.querySelectorAll('.star');
    const colorClass = value <= 2 ? 'rate-red' : (value === 3 ? 'rate-green' : 'rate-gold');
    stars.forEach(s => {
        const sVal = parseInt(s.dataset.value);
        s.classList.remove('active', 'rate-red', 'rate-green', 'rate-gold');
        if (sVal <= value) s.classList.add('active', colorClass);
    });
}

window.saveRating = function() {
    const wish = AppState.wishes.find(w => w.id === ratingWishId);
    if (wish && currentRatingSelection > 0) {
        if (!wish.ratings) wish.ratings = { P: 0, B: 0 };
        wish.ratings[AppState.currentUser] = currentRatingSelection;
        // SAFETY: Move modal back to body before render so it's not deleted!
     document.body.appendChild(document.getElementById('rating-modal')); 
        renderGallery();
        closeRatingModal();
    }
};

window.closeRatingModal = () => {
    const modal = document.getElementById('rating-modal');
    modal.style.display = 'none';
    // Move it back to the bottom of the body to keep it safe
    document.body.appendChild(modal);
};

// Boot up the engine
init();*/