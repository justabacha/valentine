// ==========================================
// CALENDAR LOGIC
// ==========================================
import { wishlistState } from './wishlist-state.js';

const calModal = document.getElementById('calendar-modal');
const calendarToggle = document.querySelector('.calendar-toggle');
const monthDisplay = document.getElementById('month-display');
const daysContainer = document.getElementById('calendar-days');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');

let currentDate = new Date();

function formatDateForButton(dateString) {
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
}

function renderCalendar() {
    if (!daysContainer) return;
    daysContainer.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthDisplay.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        daysContainer.innerHTML += `<div class="day empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = new Date().toISOString().split('T')[0] === dateString ? 'today' : '';
        const isSelected = wishlistState.selectedDate === dateString ? 'selected' : '';
        daysContainer.innerHTML += `
            <div class="day ${isToday} ${isSelected}" data-date="${dateString}">
                ${d}
            </div>
        `;
    }
}

function selectDate(dateStr) {
    wishlistState.selectedDate = dateStr;
    if (calendarToggle) {
        calendarToggle.innerHTML = `<span style="color:white;font-weight:bold;">${formatDateForButton(dateStr)}</span>`;
    }
    if (calModal) calModal.style.display = 'none';
}

export function bindCalendar() {
    if (!calendarToggle || !calModal) return;

    calendarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = calModal.style.display === 'block';
        calModal.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) renderCalendar();
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    if (daysContainer) {
        daysContainer.addEventListener('click', (e) => {
            const el = e.target.closest('.day');
            if (!el || el.classList.contains('empty')) return;
            selectDate(el.dataset.date);
        });
    }
    document.addEventListener('click', (e) => {
        if (calModal && !calModal.contains(e.target) && calendarToggle && !calendarToggle.contains(e.target)) {
            calModal.style.display = 'none';
        }
    });
}