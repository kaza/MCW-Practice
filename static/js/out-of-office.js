let oofTeamMemberSearch;

function createOutOfOffice(selectedTeamMember, scheduler) {
    
    const validationResult = validateOutOfOfficeData(selectedTeamMember);
    // If all validations pass, proceed with creating the Out of Office entry
    if (validationResult.isValid) {
        const oofData = {
            eventType: 'OutOfOffice',
            StartTime: !validationResult.isAllDay ? new Date(`${validationResult.startDate}T${validationResult.startTime}`) : new Date(`${validationResult.allDayStartDate}T00:00:00`),
            EndTime: !validationResult.isAllDay ? new Date(`${validationResult.startDate}T${validationResult.endTime}`) : new Date(`${validationResult.allDayEndDate}T23:59:59`),
            IsAllDay: validationResult.isAllDay,
            TeamMember: selectedTeamMember,
            CancelAppointments: document.getElementById('oof-cancelAppointments').checked,
            NotifyClients: document.getElementById('oof-notifyClients').checked
        };

        const args = {
            requestType: 'eventCreate',
            data: oofData
        };
        scheduler.actionBegin(args);
    }
}

function updateOutOfOfficeData(data) {

    const validationResult = validateOutOfOfficeData(selectedTeamMember);
    // If all validations pass, proceed with creating the Out of Office entry
    if (validationResult.isValid) {
        const oofData = {
            eventId: document.getElementById('event-id').value,
            eventType: 'OutOfOffice',
            StartTime: !validationResult.isAllDay ? new Date(`${validationResult.startDate}T${validationResult.startTime}`) : new Date(`${validationResult.allDayStartDate}T00:00:00`),
            EndTime: !validationResult.isAllDay ? new Date(`${validationResult.startDate}T${validationResult.endTime}`) : new Date(`${validationResult.allDayEndDate}T23:59:59`),
            IsAllDay: validationResult.isAllDay,
            TeamMember: selectedTeamMember,
            CancelAppointments: document.getElementById('oof-cancelAppointments').checked,
            NotifyClients: document.getElementById('oof-notifyClients').checked
        };

        const args = {
            requestType: 'eventCreate',
            data: oofData
        };
        scheduler.actionBegin(args);
    }
}

function deleteOutOfOfficeData(data) {
    const eventId = document.getElementById('event-id').value;
    const args = {
        requestType: 'eventDelete',
        data: data
    };
    scheduler.actionBegin(args);
}
function deleteEvent(scheduler) {
    return new Promise((resolve, reject) => {
        const eventId = document.getElementById('event-id').value;
        let eventData = {};

        eventData.editType = 'single';
        eventData.Id = eventId;
        const args = {
            requestType: 'eventRemove',
            data: eventData
        };
        scheduler.actionBegin(args);
        resolve();
    });
}

function validateOutOfOfficeData(selectedTeamMember) {

    // Get all the necessary values
    const startDate = document.getElementById('oof-startDate').value;
    const startTime = document.getElementById('oof-startTime').value;
    const endTime = document.getElementById('oof-endTime').value;
    const isAllDay = document.getElementById('oof-allDay').checked;
    const allDayStartDate = document.getElementById('oof-allDayStartDate').value;
    const allDayEndDate = document.getElementById('oof-allDayEndDate').value;

    // Validate required fields
    let isValid = true;

    // Team member validation
    if (!selectedTeamMember) {
        showError('oof-team-member-error', 'Please select a team member');
        isValid = false;
    }

    // Date validation
    if (!startDate) {
        showError('oof-date-error', 'Please select a date');
        isValid = false;
    }

    if (!isAllDay) {
        // Time validation
        if (!startTime || !endTime) {
            showError('oof-time-error', 'Start time and end time are required');
            isValid = false;
        } else {
            // Validate end time is after start time
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${startDate}T${endTime}`);

            if (endDateTime <= startDateTime) {
                showError('oof-time-error', 'End time must be after start time');
                isValid = false;
            }
        }
    } else {
        if (!allDayStartDate || !allDayEndDate) {
            showError('oof-allDayStartDate-error', 'Please select a date range');
            isValid = false;
        }
        if (allDayEndDate < allDayStartDate) {
            showError('oof-allDayEndDate-error', 'End date must be after start date');
            isValid = false;
        }
    }

    return { isValid, startDate, startTime, endTime, isAllDay, allDayStartDate, allDayEndDate };

}

function initializeOutOfOfficeDateTimePicker(dateData) {
    // Cache all DOM elements
    const elements = {
        dateInput: document.getElementById('oof-startDate'),
        startTimeInput: document.getElementById('oof-startTime'),
        endTimeInput: document.getElementById('oof-endTime'),
        durationInput: document.getElementById('oof-duration'),
        regularTimeView: document.getElementById('oof-regularTimeView'),
        allDayCheckbox: document.getElementById('oof-allDay'),
        allDayView: document.getElementById('oof-allDayView'),
        allDayStartDate: document.getElementById('oof-allDayStartDate'),
        allDayEndDate: document.getElementById('oof-allDayEndDate'),
        numberOfDays: document.getElementById('oof-numberOfDays')
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

function initializeOutOfOfficeTeamMemberDropdown(teamMembers) {
    oofTeamMemberSearch = new DynamicSearch({
        containerId: 'oof-teamMemberSearchContainer',
        items: teamMembers,
        onSelect: function (selectedTeamMember) {
            console.log('Selected team member:', selectedTeamMember);
        }
    });

    if (teamMembers.length > 0) {
        const firstTeamMember = teamMembers[0];
        oofTeamMemberSearch.selectItem(firstTeamMember);
    }
}

function reInitializeOutOfOfficeComponents(dateData) {
    if (oofTeamMemberSearch) {
        oofTeamMemberSearch.reset();
        initializeOutOfOfficeTeamMemberDropdown(oofTeamMemberSearch.items);
    }
    initializeOutOfOfficeDateTimePicker(dateData);

    document.getElementById('oof-cancelAppointments').checked = false;
    document.getElementById('oof-notifyClients').checked = false;
}

function bindOutOffOfficeData(data, container) {
    return new Promise((resolve, reject) => {
        try {

            const oofCancelAppointments = container.querySelector('#oof-cancelAppointments');
            const oofNotifyClients = container.querySelector('#oof-notifyClients');

            if (data.TeamMember && oofTeamMemberSearch) {
                oofTeamMemberSearch.selectItemById(data.TeamMember);
            }

            if (data.IsCancelAppointment) {
                oofCancelAppointments.checked = true;
            }

            if (data.IsNotifyClient) {
                oofNotifyClients.checked = true;
            }

            resolve();
        } catch (error) {
            console.error('Error binding event data:', error);
            reject(error);
        }
    });
}
