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
            StartTime: !isAllDay ? new Date(`${startDate}T${startTime}`) : new Date(`${allDayStartDate}T00:00:00`),
            EndTime: !isAllDay ? new Date(`${startDate}T${endTime}`) : new Date(`${allDayEndDate}T23:59:59`),
            IsAllDay: isAllDay, 
            Client: selectedClient,
            Location: selectedLocation
        };
        // Get recurring values if recurring is checked
        if (document.getElementById('recurring').checked) {
            const recurringData = getRecurringValues();
            if (!recurringData.isValid) {
                showError(recurringData.error);
                return;
            }
            eventData.recurring = recurringData.data;
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

    // Helper Functions
    const helpers = {
        formatTimeToHHMM(date) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        },

        formatDateToYYYYMMDD(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        calculateDuration() {
            if (elements.startTimeInput?.value && elements.endTimeInput?.value) {
                const start = new Date(`2000-01-01T${elements.startTimeInput.value}`);
                const end = new Date(`2000-01-01T${elements.endTimeInput.value}`);
                const duration = (end - start) / (1000 * 60);
                if (elements.durationInput) {
                    elements.durationInput.value = duration >= 0 ? duration : 0;
                }
            }
        },

        calculateNumberOfDays() {
            if (elements.allDayStartDate?.value && elements.allDayEndDate?.value) {
                const start = new Date(elements.allDayStartDate.value);
                const end = new Date(elements.allDayEndDate.value);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                if (elements.numberOfDays) {
                    elements.numberOfDays.value = diffDays;
                }
            }
        },

        toggleViews(isAllDay) {
            if (elements.regularTimeView) {
                elements.regularTimeView.style.display = isAllDay ? 'none' : 'flex';
                elements.startDate.style.display = isAllDay ? 'none' : 'block';
            }
            if (elements.allDayView) {
                elements.allDayView.style.display = isAllDay ? 'block' : 'none';
            }
        },

        syncViewData(isAllDay) {
            if (isAllDay) {
                // Regular to All-day
                if (elements.allDayStartDate && elements.dateInput) {
                    elements.allDayStartDate.value = elements.dateInput.value;
                }
                if (elements.allDayEndDate && elements.dateInput) {
                    elements.allDayEndDate.value = elements.dateInput.value;
                }
                helpers.calculateNumberOfDays();
            } else {
                // All-day to Regular
                if (elements.dateInput && elements.allDayStartDate) {
                    elements.dateInput.value = elements.allDayStartDate.value;
                }
                helpers.calculateDuration();
            }
        }
    };

    // Initialize event listeners
    function initializeEventListeners() {
        // All-day toggle
        elements.allDayCheckbox?.addEventListener('change', (e) => {
            const isAllDay = e.target.checked;
            helpers.toggleViews(isAllDay);
            helpers.syncViewData(isAllDay);
        });

        // Regular view time changes
        elements.startTimeInput?.addEventListener('change', helpers.calculateDuration);
        elements.endTimeInput?.addEventListener('change', helpers.calculateDuration);

        // All-day view date changes
        elements.allDayStartDate?.addEventListener('change', helpers.calculateNumberOfDays);
        elements.allDayEndDate?.addEventListener('change', helpers.calculateNumberOfDays);
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
                elements.dateInput.value = helpers.formatDateToYYYYMMDD(startDateTime);
            }
            if (elements.startTimeInput) {
                elements.startTimeInput.value = helpers.formatTimeToHHMM(startDateTime);
            }
            if (elements.endTimeInput) {
                elements.endTimeInput.value = helpers.formatTimeToHHMM(endDateTime);
            }

            // Set all-day view values
            if (elements.allDayStartDate) {
                elements.allDayStartDate.value = helpers.formatDateToYYYYMMDD(startDateTime);
            }
            if (elements.allDayEndDate) {
                elements.allDayEndDate.value = helpers.formatDateToYYYYMMDD(endDateTime);
            }

            // Calculate initial values
            helpers.calculateDuration();
            helpers.calculateNumberOfDays();

            // Set initial view based on IsAllDay
            const isAllDay = dateData.IsAllDay || false;
            if (elements.allDayCheckbox) {
                elements.allDayCheckbox.checked = isAllDay;
            }
            helpers.toggleViews(isAllDay);

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

