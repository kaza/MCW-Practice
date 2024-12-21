let clientSearch;
let locationSearch;
function createAppointment(selectedClient, selectedLocation, scheduler) {
    // Get all the necessary values
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const isAllDay = document.getElementById('allDay').checked;
    const allDayStartDate = document.getElementById('allDayStartDate').value;
    const allDayEndDate = document.getElementById('allDayEndDate').value;

    // Validate required fields
    let isValid = true;

    // Client validation
    if (!selectedClient) {
        showError('client-error', 'Please select a client');
        isValid = false;
    }

    // Location validation
    if (!selectedLocation) {
        showError('location-error', 'Please select a location');
        isValid = false;
    }

    // Date validation
    if (!startDate) {
        showError('date-error', 'Please select a date');
        isValid = false;
    }

    if (!isAllDay) {
        // Time validation
        if (!startTime || !endTime) {
            showError('time-error', 'Start time and end time are required');
            isValid = false;
        } else {
            // Validate end time is after start time
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${startDate}T${endTime}`);

            if (endDateTime <= startDateTime) {
                showError('time-error', 'End time must be after start time');
                isValid = false;
            }
        }
    }
    else {
        if (!allDayStartDate || !allDayEndDate) {
            showError('allDayStartDate-error', 'Please select a date range');
            isValid = false;
        }
        if (allDayEndDate < allDayStartDate) {
            showError('allDayEndDate-error', 'End date must be after start date');
            isValid = false;
        }
    }

    // If all validations pass, proceed with creating the event
    if (isValid) {
        const eventData = {
            eventType: 'APPOINTMENT',
            StartTime: !isAllDay ? new Date(`${startDate}T${startTime}`) : new Date(`${allDayStartDate}T00:00:00`),
            EndTime: !isAllDay ? new Date(`${startDate}T${endTime}`) : new Date(`${allDayEndDate}T23:59:59`),
            IsAllDay: isAllDay,
            Client: selectedClient,
            Location: selectedLocation
        };

        // Handle recurring events
        if (document.getElementById('recurring').checked) {
            const recurringData = getRecurringValues();
            if (!recurringData.isValid) {
                showError('recurring-error', recurringData.error);
                return;
            }

            // Convert recurring data to RRULE format
            const rrule = constructRRule(recurringData.data, eventData.StartTime);
            if (rrule) {
                eventData.RecurrenceRule = rrule;
            }
        }

        const args = {
            requestType: 'eventCreate',
            data: eventData
        };
        scheduler.actionBegin(args);
    }
}

function initializeClientSearch(clients) {
    clientSearch = new DynamicSearch({
        containerId: 'clientSearchContainer',
        items: clients,
        onSelect: function (selectedClient) {
        }
    });
}

// Date/time pickers initialization function
function initializeDateTimePicker(dateData) {
    // Cache all DOM elements
    const elements = {
        // Regular view elements
        dateInput: document.querySelector('.datetime-section .date-input'),
        startDate: document.getElementById('startDate'),
        startTimeInput: document.getElementById('startTime'),
        endTimeInput: document.getElementById('endTime'),
        durationInput: document.getElementById('duration'),
        regularTimeView: document.getElementById('regularTimeView'),

        // All-day view elements
        allDayCheckbox: document.getElementById('allDay'),
        allDayView: document.getElementById('allDayView'),
        allDayStartDate: document.getElementById('allDayStartDate'),
        allDayEndDate: document.getElementById('allDayEndDate'),
        numberOfDays: document.getElementById('numberOfDays')
    };

    // Initialize event listeners
    function initializeEventListeners() {
        // All-day toggle
        elements.allDayCheckbox?.addEventListener('change', (e) => {
            const isAllDay = e.target.checked;
            toggleViews(isAllDay, elements.regularTimeView, elements.startDate, elements.allDayView);
            syncViewData(isAllDay, elements);
        });

        // Regular view time changes
        elements.startTimeInput?.addEventListener('change', () => {
            calculateDuration(elements.startTimeInput, elements.endTimeInput, elements.durationInput);
        });
        elements.endTimeInput?.addEventListener('change', () => {
            calculateDuration(elements.startTimeInput, elements.endTimeInput, elements.durationInput);
        });

        // All-day view date changes
        elements.allDayStartDate?.addEventListener('change', () => {
            calculateNumberOfDays(elements.allDayStartDate, elements.allDayEndDate, elements.numberOfDays);
        });
        elements.allDayEndDate?.addEventListener('change', () => {
            calculateNumberOfDays(elements.allDayStartDate, elements.allDayEndDate, elements.numberOfDays);
        });
    }

    // Initialize with data
    function initializeWithData() {
        try {
            const startDateTime = new Date(dateData.StartTime);
            const endDateTime = new Date(dateData.EndTime);

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                console.error('Invalid date values:', dateData.StartTime, dateData.EndTime);
                return;
            }

            // Set regular view values
            if (elements.dateInput) {
                elements.dateInput.value = formatDateToYYYYMMDD(startDateTime);
            }
            if (elements.startTimeInput) {
                elements.startTimeInput.value = formatTimeToHHMM(startDateTime);
            }
            if (elements.endTimeInput) {
                elements.endTimeInput.value = formatTimeToHHMM(endDateTime);
            }

            // Set all-day view values
            if (elements.allDayStartDate) {
                elements.allDayStartDate.value = formatDateToYYYYMMDD(startDateTime);
            }
            if (elements.allDayEndDate) {
                elements.allDayEndDate.value = formatDateToYYYYMMDD(endDateTime);
            }

            // Calculate initial values
            calculateDuration(elements.startTimeInput, elements.endTimeInput, elements.durationInput);
            calculateNumberOfDays(elements.allDayStartDate, elements.allDayEndDate, elements.numberOfDays);

            // Set initial view based on IsAllDay
            const isAllDay = dateData.IsAllDay || false;
            if (elements.allDayCheckbox) {
                elements.allDayCheckbox.checked = isAllDay;
            }
            toggleViews(isAllDay, elements.regularTimeView, elements.startDate, elements.allDayView);

        } catch (error) {
            console.error('Error initializing date/time pickers:', error);
        }
    }

    // Initialize everything
    initializeEventListeners();
    if (dateData) {
        initializeWithData();
    }
}
// Location dropdown initialization function
function initializeLocationDropdown(locations) {
    locationSearch = new DynamicSearch({
        containerId: 'locationSearchContainer',
        items: locations,
        onSelect: function (selectedLocation) {
            console.log('Selected location:', selectedLocation);
            // Handle the selection here
        }
    });
    if (locations.length > 0) {
        const firstLocation = locations[0];
        locationSearch.selectItem(firstLocation);
        console.log('Automatically selected location:', firstLocation);
    }
}

function initializeTabNavigation() {
    const tabs = document.querySelectorAll('.tab-link');
    const appointmentSection = document.querySelector('.appointment-section');
    const outOfOfficeSection = document.querySelector('.out-of-office-section');
    const eventSection = document.querySelector('.event-section');
    const recurringSection = document.querySelector('#recurring-section');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabType = tab.textContent.toLowerCase();
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Uncheck recurring control
            unCheckRecurringControl();
            // Show/hide appropriate sections
            if (tabType === 'event') {
                appointmentSection.style.display = 'none';
                outOfOfficeSection.style.display = 'none';
                eventSection.style.display = 'block';
                recurringSection.style.display = 'block';
            } else if (tabType === 'out of office') {
                appointmentSection.style.display = 'none';
                eventSection.style.display = 'none';
                outOfOfficeSection.style.display = 'block';
                recurringSection.style.display = 'none';
            } else {
                appointmentSection.style.display = 'block';
                eventSection.style.display = 'none';
                outOfOfficeSection.style.display = 'none';
                recurringSection.style.display = 'block';
            }
        });
    });
}
// Call the function to initialize tab navigation
initializeTabNavigation();
// Appointment Type Selection
const typeButtons = document.querySelectorAll('.type-btn');
typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

