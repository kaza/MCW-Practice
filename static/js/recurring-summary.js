class RecurringSummary {

    setDocumentElement(container) {
        this.summaryElement = container.querySelector('.recurring-summary');
        this.summaryText = this.summaryElement?.querySelector('.recurring-text');
        this.editButton = this.summaryElement?.querySelector('.edit-recurring-btn');
        this.recurringSection = container.querySelector('#recurring-section');
    }

    show(rrule) {
        if (!this.summaryElement) return;

        this.summaryElement.style.display = 'block';
        if (this.recurringSection) {
            this.recurringSection.style.display = 'none';
        }

        const summaryText = this.formatRecurrenceRule(rrule);
        if (this.summaryText) {
            this.summaryText.textContent = summaryText;
        }

        this.setupEditButton(rrule);
    }

    hide() {
        if (this.summaryElement) {
            this.summaryElement.style.display = 'none';
        }
        if (this.recurringSection) {
            this.recurringSection.style.display = 'block';
        }
    }

    setupEditButton(rrule) {
        if (!this.editButton) return;

        this.editButton.onclick = () => {
            this.hide();
            this.initializeRecurringControlFromRule(rrule);
        };
    }

    formatRecurrenceRule(rrule) {
        const parts = rrule.split(';');

        const freq = parts.find(p => p.startsWith('FREQ='))?.split('=')[1];
        const interval = parts.find(p => p.startsWith('INTERVAL='))?.split('=')[1] || '1';
        const count = parts.find(p => p.startsWith('COUNT='))?.split('=')[1];
        const until = parts.find(p => p.startsWith('UNTIL='))?.split('=')[1];
        const byday = parts.find(p => p.startsWith('BYDAY='))?.split('=')[1];

        const dayMap = {
            'MO': 'Mon',
            'TU': 'Tue',
            'WE': 'Wed',
            'TH': 'Thu',
            'FR': 'Fri',
            'SA': 'Sat',
            'SU': 'Sun'
        };

        // First line: Frequency and period with optional days
        let summaryLines = [];
        let frequencyLine = `Every ${interval}`;

        if (freq === 'WEEKLY') {
            frequencyLine += ' week';
            if (byday) {
                const days = byday.split(',').map(d => dayMap[d]).join(', ');
                frequencyLine += ` on ${days}`;
            }
        } else if (freq === 'MONTHLY') {
            frequencyLine += ' month';
            const startDate = new Date(parts.find(p => p.startsWith('DTSTART='))?.split('=')[1]);
            if (startDate) {
                const dayOfMonth = startDate.getDate();
                const weekNum = Math.ceil(dayOfMonth / 7);
                const dayName = dayMap[['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][startDate.getDay()]];

                frequencyLine += ` on day ${dayOfMonth}`; // or ` on the ${weekNum}${getOrdinalSuffix(weekNum)} ${dayName}`;
            }
        } else if (freq === 'YEARLY') {
            frequencyLine += ' year';
        }

        summaryLines.push(frequencyLine);

        // Second line: End condition
        let endLine = 'Ends ';
        if (count) {
            endLine += `after ${count} events`;
        } else if (until) {
            const untilDate = new Date(until.slice(0, 8));
            endLine += `on ${untilDate.toLocaleDateString()}`;
        }
        summaryLines.push(endLine);

        return summaryLines.join('\n');
    }

    // Helper function for ordinal suffixes
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j == 1 && k != 11) {
            return "st";
        }
        if (j == 2 && k != 12) {
            return "nd";
        }
        if (j == 3 && k != 13) {
            return "rd";
        }
        return "th";
    }

    initializeRecurringControlFromRule(rrule) {
        const parts = rrule.split(';');
        const freq = parts.find(p => p.startsWith('FREQ='))?.split('=')[1];
        const interval = parts.find(p => p.startsWith('INTERVAL='))?.split('=')[1] || '1';
        const count = parts.find(p => p.startsWith('COUNT='))?.split('=')[1];
        const until = parts.find(p => p.startsWith('UNTIL='))?.split('=')[1];
        const byday = parts.find(p => p.startsWith('BYDAY='))?.split('=')[1];

        // Set recurring checkbox
        const recurringCheckbox = document.getElementById('recurring');
        if (recurringCheckbox) {
            recurringCheckbox.checked = true;
            document.querySelector('.recurrence-editor-container').style.display = 'block';
        }

        // Set frequency and period
        const frequencySelect = document.getElementById('recurring-frequency-select');
        const periodSelect = document.getElementById('recurring-frequency-period-select');
        if (frequencySelect) frequencySelect.value = interval;
        if (periodSelect) periodSelect.value = freq;

        // Set weekday checkboxes if weekly
        if (freq === 'WEEKLY' && byday) {
            const days = byday.split(',');
            days.forEach(day => {
                const checkbox = document.querySelector(`.recurring-dow-${day}`);
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        }

        this.updateFrequencyVisibility(freq);


        // Set end condition
        const endTypeSelect = document.getElementById('recurring-frequency-end-type');
        if (endTypeSelect) {
            if (count) {
                endTypeSelect.value = 'After';
                const endCountSelect = document.getElementById('recurring-frequency-end-count');
                if (endCountSelect) endCountSelect.value = count;
            } else if (until) {
                endTypeSelect.value = 'On Date';
                const datePicker = document.getElementById('recurring-date-picker');
                if (datePicker) {
                    const untilDate = until.slice(0, 8);
                    datePicker.value =
                        `${untilDate.slice(0, 4)}-${untilDate.slice(4, 6)}-${untilDate.slice(6, 8)}`;
                }
            }
            endTypeSelect.dispatchEvent(new Event('change'));
        }
    }

    updateFrequencyVisibility(selectedValue) {
        const frequencyContainer = document.querySelector('#frequency-container');
        const weekdaysContainer = document.querySelector('#weekdays-container');
        const monthContainer = document.querySelector('#month-container');
        if (selectedValue === 'WEEKLY') {
            frequencyContainer.style.display = 'block';
            weekdaysContainer.style.display = 'block';
            weekdaysContainer.style.display = 'flex';
            monthContainer.style.display = 'none';

        } else if (selectedValue === 'MONTHLY') {
            frequencyContainer.style.display = 'block';
            monthContainer.style.display = 'block';
            weekdaysContainer.style.display = 'none';

        } else if (selectedValue === 'YEARLY') {
            weekdaysContainer.style.display = 'none';
            monthContainer.style.display = 'none';
            frequencyContainer.style.display = 'none';
        }
    }

}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.recurringSummary = new RecurringSummary();
}); 