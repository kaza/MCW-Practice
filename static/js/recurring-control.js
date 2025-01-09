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

            updateMonthlyOptions(startDate);
        }
    }
}

function getRecurringValues(startDate) {
    if (!document.getElementById('recurring').checked) {
        return { isValid: true, data: null };
    }

    const frequency = document.getElementById('recurring-frequency-select').value;
    const period = document.getElementById('recurring-frequency-period-select').value;
    const endType = document.getElementById('recurring-frequency-end-type').value;
    
    
    // Get selected weekdays for weekly recurrence
    let selectedDays = [];
    let monthlyConfig = null;

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
    // Handle monthly selection
    else if (period === 'MONTHLY') {
        const monthlyOption = document.getElementById('month-select').value;
        const startDateObj = new Date(startDate);
        const dayOfMonth = startDateObj.getDate();
        const dayOfWeek = startDateObj.getDay();
        const weekday = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][dayOfWeek];
        const weekNum = Math.ceil(dayOfMonth / 7);
        
        if (monthlyOption === 'onDateOfMonth') {
            monthlyConfig = {
                type: 'dateOfMonth',
                day: dayOfMonth
            };
        } else if (monthlyOption === 'onWeekDayOfMonth') {
            monthlyConfig = {
                type: 'weekDayOfMonth',
                week: weekNum,
                day: weekday
            };
        }
        else if (monthlyOption === 'onLastWeekDayOfMonth') {
            monthlyConfig = {
                type: 'lastWeekDayOfMonth',
                day: weekday
            };
        }

        if (!monthlyConfig) {
            return {
                isValid: false,
                error: 'Please select a valid monthly recurrence pattern'
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
            selectedDays: period === 'WEEKLY' ? selectedDays : null,
            monthlyConfig: period === 'MONTHLY' ? monthlyConfig : null
        }
    };
}

function unCheckRecurringControl() {
    const recurringCheckbox = document.getElementById('recurring');
    const recurrenceEditor = document.querySelector('.recurrence-editor-container');
    recurringCheckbox.checked = false;
    recurrenceEditor.style.display = 'none';
}

function constructRRule(recurringData, startDate) {
    try {
        let rrule = `FREQ=${recurringData.period};INTERVAL=${recurringData.frequency}`;

        // Add BYDAY for weekly recurrence
        if (recurringData.period === 'WEEKLY' && recurringData.selectedDays?.length > 0) {
            rrule += `;BYDAY=${recurringData.selectedDays.join(',')}`;
        }

        // Add monthly recurrence pattern
        if (recurringData.period === 'MONTHLY' && recurringData.monthlyConfig) {
            const startDateObj = new Date(startDate);
            
            switch (recurringData.monthlyConfig.type) {
                case 'dateOfMonth':
                    // For "On day X" pattern
                    const dayOfMonth = startDateObj.getDate();
                    rrule += `;BYMONTHDAY=${dayOfMonth}`;
                    break;

                case 'weekDayOfMonth':
                    // For "On the Nth weekday" pattern
                    const dayOfWeek = startDateObj.getDay();
                    const weekNum = Math.ceil(startDateObj.getDate() / 7);
                    const weekday = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][dayOfWeek];
                    rrule += `;BYDAY=${weekday};BYSETPOS=${weekNum}`;
                    break;

                case 'lastWeekDayOfMonth':
                    // For "On the last weekday" pattern
                    const lastWeekday = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][startDateObj.getDay()];
                    rrule += `;BYDAY=${lastWeekday};BYSETPOS=-1`;
                    break;
            }
        }

        // Add end condition
        if (recurringData.endType === 'After') {
            rrule += `;COUNT=${recurringData.endValue}`;
        } else if (recurringData.endType === 'On Date') {
            // Format the end date to YYYYMMDD format for UNTIL
            const untilDate = new Date(recurringData.endValue);
            const untilDateStr = untilDate.toISOString().split('T')[0].replace(/-/g, '');
            rrule += `;UNTIL=${untilDateStr}T235959Z`;
        }

        // Add DTSTART in UTC
        const dtstart = new Date(startDate).toISOString();
        rrule += `;DTSTART=${dtstart}`;

        return rrule;
    } catch (error) {
        console.error('Error constructing RRULE:', error);
        return null;
    }
}

function reInitializeRecurringControl(startDate) {
    // Reset checkbox
    const recurringCheckbox = document.getElementById('recurring');
    const recurrenceEditor = document.querySelector('.recurrence-editor-container');
    if (recurringCheckbox) {
        recurringCheckbox.checked = false;
        recurrenceEditor.style.display = 'none';
    }
    
    // Reset DOW checkboxes
    const dowLabels = document.querySelectorAll('.dows-container label');
    dowLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = false;
            label.classList.remove('checked');
        }
    });
    
    // Reset monthly options
    const monthContainer = document.getElementById('month-container');
    const monthSelect = document.getElementById('month-select');
    if (monthContainer) {
        monthContainer.style.display = 'none';
    }
    if (monthSelect) {
        // Reset to default options or clear options
        monthSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = 'onDateOfMonth';
        defaultOption.textContent = 'Select monthly option';
        monthSelect.appendChild(defaultOption);
    }
    
    // Reset end type selections
    const endTypeSelect = document.getElementById('recurring-frequency-end-type');
    const endCountSelect = document.getElementById('recurring-frequency-end-count');
    const datePickerInput = document.getElementById('recurring-date-picker');
    
    if (endTypeSelect) endTypeSelect.value = 'After';
    if (endCountSelect) {
        endCountSelect.value = '';
        endCountSelect.style.display = 'block';
    }
    if (datePickerInput) {
        datePickerInput.value = '';
        datePickerInput.style.display = 'none';
    }
    
    // Reinitialize with new start date if provided
    if (startDate) {
        initializeRecurringControl(startDate);
        const frequencySelect = document.getElementById('recurring-frequency-select');
        const frequencyPeriodSelect = document.getElementById('recurring-frequency-period-select');
        const endTypeSelect = document.getElementById('recurring-frequency-end-type');
        const endCountSelect = document.getElementById('recurring-frequency-end-count');
        const weekdaysContainer = document.querySelector('#weekdays-container');
        
        // Reset all checkboxes
        dowLabels.forEach(label => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        });

        // Reset all selects to first option
        frequencySelect.selectedIndex = 0;
        frequencyPeriodSelect.selectedIndex = 0;
        endTypeSelect.selectedIndex = 0;
        endCountSelect.selectedIndex = 0;   

        // Handle containers visibility
        if (weekdaysContainer) {
            weekdaysContainer.style.display = 'block';
            weekdaysContainer.style.display = 'flex';
        }
        
        // Show/hide containers based on frequency period
        updateFrequencyVisibility(frequencyPeriodSelect.value);

        // Update monthly options if it's monthly frequency
        if (frequencyPeriodSelect.value === 'MONTHLY') {
            updateMonthlyOptions(startDate);
        }
    }
}

function updateMonthlyOptions(selectedDate) {
    const monthSelect = document.getElementById('month-select');
    if (!monthSelect) return;

    const date = new Date(selectedDate);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekNumber = Math.ceil(dayOfMonth / 7);
    
    // Function to get ordinal suffix
    function getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j == 1 && k != 11) return "st";
        if (j == 2 && k != 12) return "nd";
        if (j == 3 && k != 13) return "rd";
        return "th";
    }

    // Function to check if it's the last occurrence of this weekday in the month
    function isLastWeekdayOfMonth(date) {
        const temp = new Date(date);
        temp.setDate(date.getDate() + 7); 
        return temp.getMonth() !== date.getMonth();
    }

    // Clear existing options
    monthSelect.innerHTML = '';

    // Add "On day X" option
    const dayOption = document.createElement('option');
    dayOption.value = 'onDateOfMonth';
    dayOption.textContent = `On day ${dayOfMonth}`;
    monthSelect.appendChild(dayOption);

    // Add "On the Xth DayName" option
    const weekdayOption = document.createElement('option');
    weekdayOption.value = 'onWeekDayOfMonth';
    weekdayOption.textContent = `On the ${weekNumber}${getOrdinalSuffix(weekNumber)} ${dayNames[dayOfWeek]}`;
    monthSelect.appendChild(weekdayOption);

    // Add "On the last DayName" option if it's the last occurrence
    if (isLastWeekdayOfMonth(date)) {
        const lastWeekdayOption = document.createElement('option');
        lastWeekdayOption.value = 'onLastWeekDayOfMonth';
        lastWeekdayOption.textContent = `On the last ${dayNames[dayOfWeek]}`;
        monthSelect.appendChild(lastWeekdayOption);
    }
}

 // Function to handle frequency visibility
 function updateFrequencyVisibility(selectedValue) {
    // Containers for different frequency options
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

