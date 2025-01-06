let eventLocationSearch;
let eventTeamMemberSearch;  
function createEvent(selectedLocation, selectedTeamMember, scheduler) {
    return new Promise((resolve, reject) => {
        
        const validationResult = validateEventData(selectedLocation, selectedTeamMember);

        // If all validations pass, proceed with creating the event
        if (validationResult.isValid) {
            const eventData = {
                eventType: 'EVENT',
                Subject: validationResult.eventName,
                StartTime: !validationResult.isAllDay 
                ? moment.tz(
                    `${validationResult.startDate}T${validationResult.startTime}`,
                    'America/New_York'
                ).format()
                : moment.tz(
                    `${validationResult.allDayStartDate}T00:00:00`,
                    'America/New_York'
                ).format(),
                EndTime: !validationResult.isAllDay 
                ? moment.tz(
                    `${validationResult.startDate}T${validationResult.endTime}`,
                    'America/New_York'
                ).format()
                : moment.tz(
                    `${validationResult.allDayEndDate}T23:59:59`,
                    'America/New_York'
                ).format(),
                IsAllDay: validationResult.isAllDay,
                Location: selectedLocation,
                TeamMember: selectedTeamMember
            };

            // Handle recurring events
            if (document.getElementById('recurring').checked) {
                const recurringData = getRecurringValues(validationResult.startDate);
                if (!recurringData.isValid) {
                    showError('recurring-error', recurringData.error);
                    reject(new Error(recurringData.error));
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
            resolve();
        } else {
            reject(new Error('Validation failed'));
        }
    });
}

function updateEvent(selectedLocation, selectedTeamMember, scheduler) {
    return new Promise((resolve, reject) => {
        const validationResult = validateEventData(selectedLocation, selectedTeamMember);
        if (validationResult.isValid) {
            const eventData = {
                eventId: document.getElementById('event-id').value,
                eventType: 'EVENT',
                Subject: validationResult.eventName,
                StartTime: !validationResult.isAllDay 
                ? moment.tz(
                    `${validationResult.startDate}T${validationResult.startTime}`,
                    'America/New_York'
                ).format()
                : moment.tz(
                    `${validationResult.allDayStartDate}T00:00:00`,
                    'America/New_York'
                ).format(),
                EndTime: !validationResult.isAllDay 
                ? moment.tz(
                    `${validationResult.startDate}T${validationResult.endTime}`,
                    'America/New_York'
                ).format()
                : moment.tz(
                    `${validationResult.allDayEndDate}T23:59:59`,
                    'America/New_York'
                ).format(),
                IsAllDay: validationResult.isAllDay,
                Location: selectedLocation,
                TeamMember: selectedTeamMember
            };

            // Handle recurring events
            const isRecurring = document.getElementById('is-recurring').value;
            if (isRecurring === 'true') {
                const appointmentModal = new AppointmentModal();
                appointmentModal.show({
                    title: 'Edit event?',
                    message: 'This event is part of a series. What would you like to edit?',
                    options: [
                        { value: 'single', text: 'This event only' },
                        { value: 'series', text: 'This and all future events' }
                    ],
                    onSave: (selectedValue) => {
                        // Handle the save action
                        if (selectedValue === 'single') {
                            eventData.editType = 'occurrence';

                        } else {
                            eventData.editType = 'series';
                            // Handle recurring events
                            if (document.getElementById('recurring').checked) {
                                const recurringData = getRecurringValues(validationResult.startDate);
                                if (!recurringData.isValid) {
                                    showError('recurring-error', recurringData.error);
                                    reject(new Error(recurringData.error));
                                    return;
                                }

                                // Convert recurring data to RRULE format
                                const rrule = constructRRule(recurringData.data, eventData.StartTime);
                                if (rrule) {
                                    eventData.RecurrenceRule = rrule;
                                }
                            }
                        }

                        const args = {
                            requestType: 'eventChange',
                            data: eventData
                        };
                        scheduler.actionBegin(args);
                        resolve(eventData);
                    }
                });
            } else {
                eventData.editType = 'single';
                const args = {
                    requestType: 'eventChange',
                    data: eventData
                };
                scheduler.actionBegin(args);
                resolve(eventData);
            }
        }
        else {
            reject(new Error('Validation failed'));
        }
    });
}

function deleteEvent(scheduler) {
    return new Promise((resolve, reject) => {
        const eventId = document.getElementById('event-id').value;
        const isRecurring = document.getElementById('is-recurring').value;
        let eventData = {};

        if (isRecurring === 'true') {
            const appointmentModal = new AppointmentModal();
            appointmentModal.show({
                title: 'Delete event?',
                message: 'This event is part of a series. What would you like to delete?',
                options: [
                    { value: 'single', text: 'This event only' },
                    { value: 'series', text: 'This and all future events' },
                    { value: 'all', text: 'All of the series, including past events' }
                ],
                onSave: (selectedValue) => {
                    if (selectedValue === 'single') {
                        eventData.editType = 'occurrence';
                    } else if (selectedValue === 'series') {
                        eventData.editType = 'series';
                    } else {
                        eventData.editType = 'all';
                    }

                    eventData.Id = eventId;
                    const args = {
                        requestType: 'eventRemove',
                        data: eventData
                    };
                    scheduler.actionBegin(args);
                    resolve();
                }
            });
        } else {
            eventData.editType = 'single';
            eventData.Id = eventId;
            const args = {
                requestType: 'eventRemove',
                data: eventData
            };
            scheduler.actionBegin(args);
            resolve();
        }
    });
}

function validateEventData(selectedLocation, selectedTeamMember) {

    // Get all the necessary values
    const eventName = document.getElementById('event-name').value;
    const startDate = document.getElementById('event-startDate').value;
    const startTime = document.getElementById('event-startTime').value;
    const endTime = document.getElementById('event-endTime').value;
    const isAllDay = document.getElementById('event-allDay').checked;
    const allDayStartDate = document.getElementById('event-allDayStartDate').value;
    const allDayEndDate = document.getElementById('event-allDayEndDate').value;

    // Validate required fields
    let isValid = true;

    // Location validation
    if (!selectedLocation) {
        showError('event-location-error', 'Please select a location');
        isValid = false;
    }
    // Team member validation
    if (!selectedTeamMember) {
        showError('event-team-member-error', 'Please select a team member');
        isValid = false;
    }
    // Date validation
    if (!startDate) {
        showError('event-date-error', 'Please select a date');
        isValid = false;
    }

    if (!isAllDay) {
        // Time validation
        if (!startTime || !endTime) {
            showError('event-time-error', 'Start time and end time are required');
            isValid = false;
        } else {
            // Validate end time is after start time
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${startDate}T${endTime}`);

            if (endDateTime <= startDateTime) {
                showError('event-time-error', 'End time must be after start time');
                isValid = false;
            }
        }
    } else {
        if (!allDayStartDate || !allDayEndDate) {
            showError('event-allDayStartDate-error', 'Please select a date range');
            isValid = false;
        }
        if (allDayEndDate < allDayStartDate) {
            showError('event-allDayEndDate-error', 'End date must be after start date');
            isValid = false;
        }
    }

    return {isValid, eventName, startDate, startTime, endTime, isAllDay, allDayStartDate, allDayEndDate};
}

function initializeEventDateTimePicker(dateData) {
    // Cache all DOM elements
    const elements = {
        dateInput: document.getElementById('event-startDate'),
        startTimeInput: document.getElementById('event-startTime'),
        endTimeInput: document.getElementById('event-endTime'),
        durationInput: document.getElementById('event-duration'),
        regularTimeView: document.getElementById('event-regularTimeView'),
        allDayCheckbox: document.getElementById('event-allDay'),
        allDayView: document.getElementById('event-allDayView'),
        allDayStartDate: document.getElementById('event-allDayStartDate'),
        allDayEndDate: document.getElementById('event-allDayEndDate'),
        numberOfDays: document.getElementById('event-numberOfDays')
    };

    // Initialize event listeners
    function initializeEventListeners() {
        // All-day toggle
        elements.allDayCheckbox?.addEventListener('change', (e) => {
            const isAllDay = e.target.checked;
            toggleViews(isAllDay, elements.regularTimeView, elements.dateInput, elements.allDayView);
            syncViewData(isAllDay, elements);
        });

        // Regular view time changes
        elements.startTimeInput?.addEventListener('change', () => {
            elements.endTimeInput.value = updateEndTimeBasedOnDuration(elements.dateInput, elements.startTimeInput, elements.durationInput);
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
            toggleViews(isAllDay, elements.regularTimeView, elements.dateInput, elements.allDayView);

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

function initializeEventLocationDropdown(locations) {
    
    eventLocationSearch = new DynamicSearch({
        containerId: 'event-locationSearchContainer',
        items: locations,
        onSelect: function (selectedLocation) {
            console.log('Selected event location:', selectedLocation);
        }
    });
    
    if (locations.length > 0) {
        const firstLocation = locations[0];
        eventLocationSearch.selectItem(firstLocation);
    }
}

function initializeEventTeamMemberDropdown(teamMembers) {
    eventTeamMemberSearch = new DynamicSearch({
        containerId: 'event-teamMemberSearchContainer',
        items: teamMembers,
        onSelect: function (selectedTeamMember) {
            console.log('Selected event team member:', selectedTeamMember);
        }
    });

    if (teamMembers.length > 0) {
        const firstTeamMember = teamMembers[0];
        eventTeamMemberSearch.selectItem(firstTeamMember);
    }
}

function reInitializeEventComponents(dateData) {
    if (eventLocationSearch) {
        eventLocationSearch.reset();
        initializeEventLocationDropdown(eventLocationSearch.items);
    }
    if (eventTeamMemberSearch) {
        eventTeamMemberSearch.reset();
        initializeEventTeamMemberDropdown(eventTeamMemberSearch.items);
    }
    initializeEventDateTimePicker(dateData);
}


function bindEventData(data, container) {
    return new Promise((resolve, reject) => {
        const recurringSummary = container.querySelector('.recurring-summary');
        const isRecurring = container.querySelector('#is-recurring');

        try {
            if (data.TeamMember && eventTeamMemberSearch) {
                eventTeamMemberSearch.selectItemById(data.TeamMember);
            }
            if (data.Location && eventLocationSearch) {
                eventLocationSearch.selectItemById(data.Location);
            }
            if (data.IsRecurring) {
                isRecurring.value = true;
                if (recurringSummary) {
                    recurringSummary.style.display = 'block';
                    window.recurringSummary.setDocumentElement(container);
                    window.recurringSummary.show(data.RecurrenceRuleString);
                }
            }

            resolve();
        } catch (error) {
            console.error('Error binding event data:', error);
            reject(error);
        }
    });
}