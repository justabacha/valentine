const homeScreen = document.querySelector('.photos-home-container');
const manageScreen = document.getElementById('manage-center');
const galleryScreen = document.getElementById('main-gallery');

const manageBtn = document.getElementById('open-manage');
const galleryBtn = document.getElementById('open-gallery'); // New grab
const homeBtn = document.getElementById('back-home');
const galleryHomeBtn = document.getElementById('back-home-gallery'); // The home button inside gallery

// Open Manage Center
manageBtn.addEventListener('click', () => {
    homeScreen.classList.add('hidden');
    manageScreen.style.display = 'flex';
    galleryScreen.style.display = 'none'; // Ensure gallery is shut
});

// Open Gallery
galleryBtn.addEventListener('click', () => {
    homeScreen.classList.add('hidden');
    galleryScreen.style.display = 'flex';
    manageScreen.style.display = 'none'; // Ensure manage is shut
});

// Go back to Home from Manage
homeBtn.addEventListener('click', () => {
    manageScreen.style.display = 'none';
    homeScreen.classList.remove('hidden');
});

// Go back to Home from Gallery
galleryHomeBtn.addEventListener('click', () => {
    galleryScreen.style.display = 'none';
    homeScreen.classList.remove('hidden');
});
// Just open it so we can see the design
function expandPhoto(card) {
    const overlay = document.getElementById('photo-overlay');
    const hdImg = document.getElementById('hd-image');
    
    // Just grab the source and show the overlay
    hdImg.src = card.querySelector('img').src;
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
}

// Just close it
function closeOverlay() {
    const overlay = document.getElementById('photo-overlay');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
}

// Minimal Like for the card
function toggleLike(event, btn) {
    event.stopPropagation(); 
    btn.classList.toggle('liked');
}