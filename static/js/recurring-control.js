function initializeRecurringControl(startDate) {
    const recurringCheckbox = document.getElementById('recurring');
    const recurrenceEditor = document.querySelector('.recurrence-editor-container');
    const datePickerInput = document.getElementById('recurring-date-picker');
    
    // Containers for different frequency options
    const frequencyContainer = document.querySelector('#frequency-container');
    const weekdaysContainer = document.querySelector('#weekdays-container');
    const monthContainer = document.querySelector('#month-container');

    if (recurringCheckbox && recurrenceEditor) {
        recurringCheckbox.addEventListener('change', function(e) {
            recurrenceEditor.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Initialize DOW checkboxes
        const dowLabels = document.querySelectorAll('.dows-container label');
        dowLabels.forEach(label => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                label.classList.toggle('checked', this.checked);
            });
        });
        
        // Initialize end type toggle
        const endTypeSelect = document.getElementById('recurring-frequency-end-type');
        const endCountSelect = document.getElementById('recurring-frequency-end-count');
        const eventsLabel = document.querySelector('.events-label');
        const frequencySelect = document.getElementById('recurring-frequency-select');
        const frequencyPeriodSelect = document.getElementById('recurring-frequency-period-select');

        if (endTypeSelect) {
            endTypeSelect.addEventListener('change', function() {
                const isAfter = this.value === 'After';
                if (endCountSelect) endCountSelect.style.display = isAfter ? 'block' : 'none';
                if (eventsLabel) eventsLabel.style.display = isAfter ? 'block' : 'none';
                
                if (this.value === 'On Date') {
                    datePickerInput.style.display = 'block';
                    endCountSelect.style.display = 'none';
                } else {
                    datePickerInput.style.display = 'none';
                    endCountSelect.style.display = 'block';
                }
            });
        }

        // Function to handle frequency visibility
        function updateFrequencyVisibility(selectedValue) {
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

        // Initialize frequency selection
        if (frequencySelect) {
            frequencySelect.addEventListener('change', function() {
                const selectedValue = this.value;
                updateFrequencyVisibility(selectedValue);
            });
        }

        // Initialize frequency period selection
        if (frequencyPeriodSelect) {
            frequencyPeriodSelect.addEventListener('change', function() {
                const selectedPeriod = this.value;
                updateFrequencyVisibility(selectedPeriod);
            });
        }

        // Set initial values based on startDate
        if (startDate) {
            const startDateObj = new Date(startDate);
            const futureDate = new Date(startDateObj);
            futureDate.setDate(startDateObj.getDate() + 25);
            datePickerInput.value = futureDate.toISOString().split('T')[0];

            const dayOfWeek = startDateObj.getDay(); 
            const dowCheckbox = weekdaysContainer.querySelector(`input[name="${['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][dayOfWeek]}"]`);
            if (dowCheckbox) {
                dowCheckbox.checked = true; 
                dowCheckbox.dispatchEvent(new Event('change')); 
            }
        }
    }
}

function getRecurringValues() {
    if (!document.getElementById('recurring').checked) {
        return { isValid: true, data: null };
    }

    const frequency = document.getElementById('recurring-frequency-select').value;
    const period = document.getElementById('recurring-frequency-period-select').value;
    const endType = document.getElementById('recurring-frequency-end-type').value;
    
    // Get selected weekdays for weekly recurrence
    const selectedDays = [];
    if (period === 'WEEKLY') {
        const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        weekdays.forEach(day => {
            if (document.querySelector(`.recurring-dow-${day}`).checked) {
                selectedDays.push(day);
            }
        });
        
        if (selectedDays.length === 0) {
            return {
                isValid: false,
                error: 'Please select at least one day of the week for weekly recurrence'
            };
        }
    }

    // Validate end condition
    let endValue;
    if (endType === 'After') {
        endValue = document.getElementById('recurring-frequency-end-count').value;
    } else {
        endValue = document.getElementById('recurring-date-picker').value;
        if (!endValue) {
            return {
                isValid: false,
                error: 'Please select an end date'
            };
        }
    }

    return {
        isValid: true,
        data: {
            frequency,
            period,
            endType,
            endValue,
            selectedDays: period === 'WEEKLY' ? selectedDays : null
        }
    };
}

function unCheckRecurringControl() {
    const recurringCheckbox = document.getElementById('recurring');
    const recurrenceEditor = document.querySelector('.recurrence-editor-container');
    recurringCheckbox.checked = false;
    recurrenceEditor.style.display = 'none';
}
