import { wishlistState } from './wishlist-state.js';
import { wishlistUsers } from './wishlist.js';

function formatDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
}

export function renderGallery() {
    const wishGallery = document.querySelector('.wish-gallery');
    if (!wishGallery) return;
    wishGallery.innerHTML = '';

    wishlistState.wishes.forEach((wish, index) => {
        const num = index + 1;
        const creatorData = wishlistUsers[wish.creator];
        const starColorStyle = `
            background-color: ${creatorData.color};
            box-shadow: 0 0 10px ${creatorData.color}80;
        `;
        const displayDate = formatDate(wish.date);

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
                    <div class="objective-text">${escapeHtml(wish.text)}</div>
                    <div class="card-actions">
                        <button class="action-svg-btn delete-wish" onclick="window.promptDelete(${wish.id})" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                        <button class="check-btn" onclick="window.dustWish(${wish.id})">✓✓</button>
                    </div>
                </div>
            `;
        } else {
            // DUSTED layout
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
                    <div class="objective-text" title="${escapeHtml(wish.text)}">${escapeHtml(shortText)}</div>
                    <div class="card-actions">
                        <button class="action-svg-btn" onclick="window.uploadPhotos(${wish.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </button>
                        <button class="action-svg-btn emoji-btn" onclick="window.promptEmoji(${wish.id})">
                            ${emojiDisplay}
                        </button>
                        <div class="ratings-box" onclick="window.promptRating(${wish.id})">
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

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}