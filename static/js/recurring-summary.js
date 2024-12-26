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
        const bymonthday = parts.find(p => p.startsWith('BYMONTHDAY='))?.split('=')[1];
        const bysetpos = parts.find(p => p.startsWith('BYSETPOS='))?.split('=')[1];

        const dayMap = {
            'MO': 'Monday',
            'TU': 'Tuesday',
            'WE': 'Wednesday',
            'TH': 'Thursday',
            'FR': 'Friday',
            'SA': 'Saturday',
            'SU': 'Sunday'
        };

        function getOrdinalSuffix(num) {
            const j = num % 10;
            const k = num % 100;
            if (j == 1 && k != 11) return "st";
            if (j == 2 && k != 12) return "nd";
            if (j == 3 && k != 13) return "rd";
            return "th";
        }

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

            // Case 1: Specific day of month (BYMONTHDAY)
            if (bymonthday) {
                frequencyLine += ` on day ${bymonthday}`;
            }
            // Case 2: Nth weekday of month (BYDAY + BYSETPOS)
            else if (byday && bysetpos) {
                const dayName = dayMap[byday];
                frequencyLine += ` on the ${bysetpos}${getOrdinalSuffix(bysetpos)} ${dayName}`;
            }
        } else if (freq === 'YEARLY') {
            frequencyLine += ' year';
        }

        if (interval !== '1') {
            frequencyLine = frequencyLine.replace('Every 1', 'Every');
        }

        summaryLines.push(frequencyLine);

        // Second line: End condition
        let endLine = 'Ends ';
        if (count) {
            endLine += `after ${count} ${count === '1' ? 'event' : 'events'}`;
        } else if (until) {
            const untilDate = new Date(until.slice(0, 8));
            endLine += `on ${untilDate.toLocaleDateString()}`;
        }
        summaryLines.push(endLine);

        return summaryLines.join('\n');
    }

    initializeRecurringControlFromRule(rrule) {
        const parts = rrule.split(';');
        const freq = parts.find(p => p.startsWith('FREQ='))?.split('=')[1];
        const interval = parts.find(p => p.startsWith('INTERVAL='))?.split('=')[1] || '1';
        const count = parts.find(p => p.startsWith('COUNT='))?.split('=')[1];
        const until = parts.find(p => p.startsWith('UNTIL='))?.split('=')[1];
        const byday = parts.find(p => p.startsWith('BYDAY='))?.split('=')[1];
        const bymonthday = parts.find(p => p.startsWith('BYMONTHDAY='))?.split('=')[1];
        const bysetpos = parts.find(p => p.startsWith('BYSETPOS='))?.split('=')[1];
        const dtstart = parts.find(p => p.startsWith('DTSTART='))?.split('=')[1];

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

        // Handle period-specific settings
        if (freq === 'WEEKLY') {
            // Uncheck all weekday checkboxes first
            const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            weekdays.forEach(day => {
                const checkbox = document.querySelector(`.recurring-dow-${day}`);
                if (checkbox) {
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });

            // Then check only the days specified in BYDAY if present
            if (byday) {
                const days = byday.split(',');
                days.forEach(day => {
                    const checkbox = document.querySelector(`.recurring-dow-${day}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            }
        }
        else if (freq === 'MONTHLY') {
            const monthSelect = document.getElementById('month-select');
            if (monthSelect) {
                const startDate = dtstart ? new Date(dtstart) : new Date();

                // Update the options first
                updateMonthlyOptions(startDate);

                // Then set the appropriate value based on the rule
                if (bymonthday) {
                    monthSelect.value = 'onDateOfMonth';
                } else if (byday && bysetpos) {
                    if (bysetpos === '-1') {
                        monthSelect.value = 'onLastWeekDayOfMonth';
                    } else {
                        monthSelect.value = 'onWeekDayOfMonth';
                    }
                }
                monthSelect.dispatchEvent(new Event('change'));
            }
        }

        // Update visibility of frequency controls based on period
        if (typeof this.updateFrequencyVisibility === 'function') {
            this.updateFrequencyVisibility(freq);
        }

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

        // Trigger change events to update any dependent UI elements
        if (periodSelect) periodSelect.dispatchEvent(new Event('change'));
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