let activeModalTimeout = null;


// ========================================
// INITIALIZER
// ========================================

export function initializeModal() {

    console.log("Stark HUD online 🦾");
}


// ========================================
// MAIN MODAL ENGINE
// ========================================

export function showStarkModal(options = {}) {

    const modal = document.getElementById('fridayModal');

    if (!modal) return;

    if (activeModalTimeout) {
        clearTimeout(activeModalTimeout);
    }

    hydrateCenter(options);
    hydrateCards(options.cards || []);
    hydrateResponse(options);

    modal.classList.add('show');

    activeModalTimeout = setTimeout(() => {

        modal.classList.remove('show');
        activeModalTimeout = null;

    }, options.duration || 5000);

    modal.addEventListener('click', closeModal, { once: true });
}


// ========================================
// CENTER SECTION
// ========================================

function hydrateCenter(options) {

    const centerTitleEl = document.getElementById('centerTitle');
    const centerSubEl = document.getElementById('centerSub');
    const centerDynamicEl = document.getElementById('centerDynamic');

    if (centerTitleEl) {
        centerTitleEl.innerHTML =
            options.centerTitle || 'F.R.I.D.A.Y';
    }

    if (centerSubEl) {
        centerSubEl.innerHTML =
            options.centerSub ||
            'Friendship Reinforcer<br>Intelligent Dialogue, Always Yours';
    }

    if (centerDynamicEl) {

        if (options.centerDynamic) {

            centerDynamicEl.style.display = 'block';
            centerDynamicEl.innerHTML = options.centerDynamic;

        } else {

            centerDynamicEl.style.display = 'none';
        }
    }
}


// ========================================
// SIDE CARDS
// ========================================

function hydrateCards(cards = []) {

    for (let i = 1; i <= 4; i++) {

        const labelEl = document.getElementById(`card${i}Label`);
        const valueEl = document.getElementById(`card${i}Value`);

        const card = cards[i - 1];

        if (!labelEl || !valueEl || !card) continue;

        labelEl.innerText = card.label;
        valueEl.innerHTML = card.value;
    }
}


// ========================================
// RESPONSE AREA
// ========================================

function hydrateResponse(options) {

    const respTextEl = document.getElementById('responseText');
    const respSmallEl = document.getElementById('responseSmall');

    if (respTextEl) {

        respTextEl.innerHTML =
            options.responseText ||
            'Systems stable.';
    }

    if (respSmallEl) {

        respSmallEl.innerHTML =
            options.responseSmall ||
            '“All systems synchronized.”';
    }
}


// ========================================
// CLOSE
// ========================================

export function closeModal() {

    const modal = document.getElementById('fridayModal');

    if (!modal) return;

    if (activeModalTimeout) {
        clearTimeout(activeModalTimeout);
    }

    modal.classList.remove('show');

    activeModalTimeout = null;
}