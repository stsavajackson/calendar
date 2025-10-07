class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.events = this.loadEvents();
        this.init();
    }

    init() {
        this.renderCalendar();
        this.bindEvents();
        this.updateEmbedCode();
    }

    bindEvents() {
        // Navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('addEvent').addEventListener('click', () => this.openEventModal());

        // Modal events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        document.querySelectorAll('.cancel').forEach(cancelBtn => {
            cancelBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => this.saveEvent(e));
        document.getElementById('deleteEvent').addEventListener('click', () => this.deleteEvent());

        // Embed code
        document.getElementById('copyEmbed').addEventListener('click', () => this.copyEmbedCode());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    renderCalendar() {
        const monthYear = this.currentDate.toLocaleString('default', { 
            month: 'long', 
            year: 'numeric' 
        });
        document.getElementById('currentMonth').textContent = monthYear;

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        // Add empty cells for days before the first day of month
        const startingDay = firstDay.getDay();
        for (let i = 0; i < startingDay; i++) {
            calendarDays.appendChild(this.createDayElement('', true));
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day));
            const dayEvents = this.events[dateStr] || [];
            calendarDays.appendChild(this.createDayElement(day, false, dayEvents, dateStr));
        }
    }

    createDayElement(day, isOtherMonth, events = [], dateStr = '') {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        } else {
            const today = new Date();
            if (this.isSameDate(new Date(dateStr), today)) {
                dayElement.classList.add('today');
            }

            if (events.length > 0) {
                dayElement.classList.add('has-events');
            }
        }

        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="events-list">
                ${events.slice(0, 2).map(event => 
                    `<div class="event-item" title="${event.title}">${event.title}</div>`
                ).join('')}
                ${events.length > 2 ? `<div class="event-item">+${events.length - 2} more</div>` : ''}
            </div>
        `;

        if (!isOtherMonth) {
            dayElement.addEventListener('click', () => this.openEventModal(dateStr));
        }

        return dayElement;
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    openEventModal(dateStr = '') {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const deleteBtn = document.getElementById('deleteEvent');
        
        form.reset();
        deleteBtn.style.display = 'none';
        document.getElementById('modalTitle').textContent = 'Add Event';
        document.getElementById('eventId').value = '';
        
        if (dateStr) {
            document.getElementById('eventDate').value = dateStr;
        } else {
            document.getElementById('eventDate').value = this.formatDate(new Date());
        }

        modal.style.display = 'block';
    }

    openEditEventModal(event, dateStr) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const deleteBtn = document.getElementById('deleteEvent');
        
        form.reset();
        deleteBtn.style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Edit Event';
        
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = dateStr;
        document.getElementById('eventStart').value = event.startTime || '';
        document.getElementById('eventEnd').value = event.endTime || '';
        document.getElementById('eventDescription').value = event.description || '';

        // Store current editing event data
        this.editingEvent = { event, dateStr };
        
        modal.style.display = 'block';
    }

    saveEvent(e) {
        e.preventDefault();
        
        const eventId = document.getElementById('eventId').value || Date.now().toString();
        const eventData = {
            id: eventId,
            title: document.getElementById('eventTitle').value,
            startTime: document.getElementById('eventStart').value,
            endTime: document.getElementById('eventEnd').value,
            description: document.getElementById('eventDescription').value
        };

        const dateStr = document.getElementById('eventDate').value;
        
        if (!this.events[dateStr]) {
            this.events[dateStr] = [];
        }

        // Update existing event or add new one
        const existingIndex = this.events[dateStr].findIndex(e => e.id === eventId);
        if (existingIndex > -1) {
            this.events[dateStr][existingIndex] = eventData;
        } else {
            this.events[dateStr].push(eventData);
        }

        this.saveEvents();
        this.renderCalendar();
        this.closeModal(document.getElementById('eventModal'));
    }

    deleteEvent() {
        if (!this.editingEvent) return;

        const { event, dateStr } = this.editingEvent;
        this.events[dateStr] = this.events[dateStr].filter(e => e.id !== event.id);
        
        if (this.events[dateStr].length === 0) {
            delete this.events[dateStr];
        }

        this.saveEvents();
        this.renderCalendar();
        this.closeModal(document.getElementById('eventModal'));
    }

    closeModal(modal) {
        modal.style.display = 'none';
        this.editingEvent = null;
    }

    loadEvents() {
        try {
            return JSON.parse(localStorage.getItem('calendarEvents')) || {};
        } catch {
            return {};
        }
    }

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    updateEmbedCode() {
        const currentUrl = window.location.href;
        const embedCode = `<iframe src="${currentUrl}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 15px;"></iframe>`;
        document.getElementById('embedCode').value = embedCode;
    }

    copyEmbedCode() {
        const embedTextarea = document.getElementById('embedCode');
        embedTextarea.select();
        document.execCommand('copy');
        
        const copyBtn = document.getElementById('copyEmbed');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#4CAF50';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});

// Check if we're in embed mode
if (window.self !== window.top) {
    document.body.classList.add('embed-mode');
}