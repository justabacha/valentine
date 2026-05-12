// modal.js
import { dom } from './dom.js';

let activeModalTimeout = null;

export function showStarkModal(options) {
    if (activeModalTimeout) clearTimeout(activeModalTimeout);

    // Center content
    if (dom.centerTitle) dom.centerTitle.innerHTML = options.centerTitle || 'F.R.I.D.A.Y';
    if (dom.centerSub) dom.centerSub.innerHTML = options.centerSub || 'Friendship Reinforcer<br>Intelligent Dialogue, Always Yours';
    if (options.centerDynamic) {
        dom.centerDynamic.style.display = 'block';
        dom.centerDynamic.innerHTML = options.centerDynamic;
    } else if (dom.centerDynamic) {
        dom.centerDynamic.style.display = 'none';
    }

    // Side cards
    if (options.cards) {
        const cards = [dom.card1Label, dom.card2Label, dom.card3Label, dom.card4Label];
        const values = [dom.card1Value, dom.card2Value, dom.card3Value, dom.card4Value];
        for (let i = 0; i < options.cards.length && i < cards.length; i++) {
            if (cards[i] && values[i]) {
                cards[i].innerText = options.cards[i].label;
                values[i].innerHTML = options.cards[i].value;
            }
        }
    }

    // Response box
    if (dom.responseText) dom.responseText.innerHTML = options.responseText || 'Weather conditions remain stable.';
    if (dom.responseSmall) dom.responseSmall.innerHTML = options.responseSmall || '“Feels like a quiet evening.”';

    dom.modal.classList.add('show');
    activeModalTimeout = setTimeout(() => {
        dom.modal.classList.remove('show');
        activeModalTimeout = null;
    }, 5000);

    const closeModal = () => {
        if (activeModalTimeout) clearTimeout(activeModalTimeout);
        dom.modal.classList.remove('show');
        dom.modal.removeEventListener('click', closeModal);
        activeModalTimeout = null;
    };
    dom.modal.addEventListener('click', closeModal, { once: true });
}