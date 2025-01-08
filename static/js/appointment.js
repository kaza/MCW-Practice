let clientSearch;
let locationSearch;
let clinicianSearch;
const stateColors = {
    '1': {
        color: '#10643d',
        background: '#e7f9f1'
    },
    '2': {
        color: '#6d504c',
        background: '#fdebe8'
    },
    '3': {
        color: '#94782f',
        background: '#fff9e8'
    },
    '4': {
        color: '#6e514c',
        background: '#fdebe8'
    },
    '5': {
        color: '#7a6b44',
        background: '#fff9e8'
    }
};
function createAppointment(selectedClient, selectedLocation, selectedClinician , scheduler) {
    return new Promise((resolve, reject) => {
        const validationResult = validateAppointment(selectedClient, selectedLocation);

        // If all validations pass, proceed with creating the event
        if (validationResult.isValid) {
            const eventData = {
                eventType: 'APPOINTMENT',
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
                Client: selectedClient,
                Clinician: selectedClinician,
                Location: selectedLocation,
                Services: getSelectedServices(),
                AppointmentTotal: validationResult.appointmentTotal
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
            resolve(eventData);
        } else {
            reject(new Error('Validation failed'));
        }
    });
}

function updateAppointment(selectedLocation, selectedClinician ,scheduler) {
    return new Promise((resolve, reject) => {
        const validationResult = validateAppointment(selectedLocation, true);

        if (validationResult.isValid) {
            const stateId = document.getElementById('appointment-state').value;
            const eventData = {
                eventId: document.getElementById('event-id').value,
                StateId: stateId,
                eventType: 'APPOINTMENT',
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
                Clinician: selectedClinician,
                Location: selectedLocation,
                Services: getSelectedServices(),
                AppointmentTotal: validationResult.appointmentTotal
            };

            // Handle recurring events
            const isRecurring = document.getElementById('is-recurring').value;
            if (isRecurring === 'true') {
                const appointmentModal = new AppointmentModal();
                appointmentModal.show({
                    title: 'Edit appointment?',
                    message: 'This appointment is part of a series. What would you like to edit?',
                    options: [
                        { value: 'single', text: 'This appointment only' },
                        { value: 'series', text: 'This and all future appointments' }
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
        } else {
            reject(new Error('Validation failed'));
        }
    });
}

function deleteAppointment(scheduler) {
    return new Promise((resolve, reject) => {
        const eventId = document.getElementById('event-id').value;
        const isRecurring = document.getElementById('is-recurring').value;
        let eventData = {};

        if (isRecurring === 'true') {
            const appointmentModal = new AppointmentModal();
            appointmentModal.show({
                title: 'Delete appointment?',
                message: 'This appointment is part of a series. What would you like to delete?',
                options: [
                    { value: 'single', text: 'This appointment only' },
                    { value: 'series', text: 'This and all future appointments' },
                    { value: 'all', text: 'All of the series, including past appointments' }
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

function validateAppointment(selectedLocation, isUpdateAppointment = false) {

    // Get all the necessary values
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const isAllDay = document.getElementById('allDay').checked;
    const allDayStartDate = document.getElementById('allDayStartDate').value;
    const allDayEndDate = document.getElementById('allDayEndDate').value;
    let appointmentTotal = document.getElementById('appointment-total').getAttribute('data-amount');
    if (appointmentTotal) {
        appointmentTotal = parseFloat(appointmentTotal.replace('$', ''));
    }

    // Validate required fields
    let isValid = true;

    // Client validation
    if (!isUpdateAppointment && !selectedClient) {
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

    return { isValid, isAllDay, startDate, startTime, endTime, allDayStartDate, allDayEndDate, appointmentTotal };

}

function initializeClientSearch(clients) {
    clientSearch = new DynamicSearch({
        containerId: 'clientSearchContainer',
        items: clients,
        onSelect: function (selectedClient) {

            const clinician = document.getElementById('is-clinician').value;
            if (clinician.trim() === 'False') {
                // Show the clinician section when a client is selected
                document.querySelector('.clinician-section').style.display = 'block';

                // Fetch clinicians for the selected client
                showSpinner();
                getClientClinicians(selectedClient.id)
                    .then(clinicians => {
                        initializeClinicianDropdown(clinicians, selectedClient).then(() => {
                            hideSpinner();
                        }).catch(() => {
                            hideSpinner();
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching clinicians:', error);
                        hideSpinner();
                    });
            }
            else{
                showSpinner();
                const clinicianId = document.getElementById('clinician-id').value;
                fetchClinicianServices(clinicianId, selectedClient.id)
                    .then(message => {
                        document.querySelector('.services-section').style.display = 'block';
                        hideSpinner();
                    })
                    .catch(error => {
                        console.error('Error fetching clinician services:', error);
                        hideSpinner();
                    }).finally(() => {
                        hideSpinner();
                    });
            }
        },
        onDeselect: function () {
            document.querySelector('.clinician-section').style.display = 'none';
            document.querySelector('.services-section').style.display = 'none';
            hideClientDetails();
        }
    });
}

function updateClientDetails(client) {
    const detailsContainer = document.querySelector('.client-info');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
         <div class="client-main-row">
             <div class="client-name" id="client-name">${client.full_name}</div>
             <button class="caret-button" id="toggle-client-info">
                <svg class="caret-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
             </button>
         </div>
        <div class="client-phone" style="display: block;">
            ${client.phone ? `<div class="info-item"> ${client.phone} <span class="home-tag">Mobile</span></div>` : ''}
         </div>
         <div class="client-email" style="display: block;">
            ${client.email ? `<div class="info-item"> ${client.email} <span class="home-tag">Home</span></div>` : ''}
         </div>
        `;
        detailsContainer.style.display = 'block';

        // Add event listener to toggle email and phone visibility
        document.getElementById('toggle-client-info').addEventListener('click', function () {
            const emailSection = detailsContainer.querySelector('.client-email');
            const phoneSection = detailsContainer.querySelector('.client-phone');
            const isEmailVisible = emailSection.style.display === 'block';
            const isPhoneVisible = phoneSection.style.display === 'block';

            // Toggle visibility
            emailSection.style.display = isEmailVisible ? 'none' : 'block';
            phoneSection.style.display = isPhoneVisible ? 'none' : 'block';

            this.classList.toggle('expanded');
        });
    }
}

function hideClientDetails() {
    const detailsContainer = document.querySelector('.client-info');
    if (detailsContainer) {
        detailsContainer.style.display = 'none';
    }
}

function initializeAppointmentState(states, selectedStateId = null) {
    const stateSelect = document.getElementById('appointment-state');
    if (stateSelect) {

        stateSelect.addEventListener('change', function () {
            updateOptionStyle(this);
        });

        // Clear existing options
        stateSelect.innerHTML = '';

        // Populate the dropdown with states
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.id;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });
    }
}

function updateOptionStyle(select) {
    const selectedOption = select.selectedOptions[0];
    const selectedValue = select.value.toLowerCase();
    const colors = stateColors[selectedValue] || { color: '', background: '' };

    // Reset all options to default
    Array.from(select.options).forEach(option => {
        option.style.color = '';
        option.style.backgroundColor = '';
    });

    // Style only the selected option
    select.style.color = colors.color;
    select.style.backgroundColor = colors.background;
    if (selectedOption) {
        selectedOption.style.color = colors.color;
        selectedOption.style.backgroundColor = colors.background;
    }
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
    
    const locationsWithSvg = locations.map(location => {
        const item = { ...location }; 
        
        if (location.type === 'Onsite') {
            // Create SVG with dynamic color from the location's color property
            item.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path fill="${location.color}" d="M7.26 15.62C5.627 13.616 2 8.753 2 6.02a6 6 0 1112 0c0 2.732-3.656 7.595-5.26 9.6a.944.944 0 01-1.48 0zM8 8.02c1.103 0 2-.896 2-2 0-1.102-.897-2-2-2s-2 .898-2 2c0 1.104.897 2 2 2z"></path>
            </svg>`;
        }
        else{
            item.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                        <rect x="1" y="4" width="10" height="8" rx="1" fill="#4CAF50"/>
                        <path d="M11 7L15 4V12L11 9V7Z" fill="#4CAF50"/>
                        </svg>`;
        }
        return item;
    });

    locationSearch = new DynamicSearch({
        containerId: 'locationSearchContainer',
        items: locationsWithSvg,
        onSelect: function (selectedLocation) {
            console.log('Selected location:', selectedLocation);
            // Handle the selection here
        }
    });

    if (locationsWithSvg.length > 0) {
        const firstLocation = locationsWithSvg[0];
        locationSearch.selectItem(firstLocation);
        console.log('Automatically selected location:', firstLocation);
    }
}

function initializeClinicianDropdown(clinicians, selectedClient) {
    return new Promise((resolve, reject) => {
        clinicianSearch = new DynamicSearch({
            containerId: 'clinicianSearchContainer',
            items: clinicians,
            onSelect: function (selectedClinician) {
                // Handle selection if needed
            }
        });

        if (clinicians.length > 0) {
            const firstClinician = clinicians[0];
            clinicianSearch.selectItem(firstClinician);
            console.log('Automatically selected clinician:', firstClinician);
            showSpinner();

            fetchClinicianServices(firstClinician.id, selectedClient.id)
                .then(message => {
                    document.querySelector('.services-section').style.display = 'block';
                    hideSpinner();
                    resolve();
                })
                .catch(error => {
                    console.error('Error:', error);
                    hideSpinner();
                    reject(error); // Reject the promise on error
                });
        } else {
            resolve(); // Resolve immediately if no clinicians are available
        }
    });
}

// function to fetch clinician services
function fetchClinicianServices(clinicianId, clientId) {
    return fetch(`api/get_clinician_services/${clinicianId}/${clientId}/`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                return InitializePracticeServices(result.data);
            } else {
                throw new Error(result.error); 
            }
        });
}

// Helper function to clear error messages
function clearErrorMessages() {
    const errorElements = document.querySelectorAll('[id$="-error"]');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
}


function reInitializeAppointment(dateData) {
    // Reset and reinitialize client search
    if (clientSearch) {
        clientSearch.reset();
        initializeClientSearch(clientSearch.items);
    }

    // Reset and reinitialize location search
    if (locationSearch) {
        locationSearch.reset();
        initializeLocationDropdown(locationSearch.items);
    }

    // Reset and reinitialize clinician search
    if (clinicianSearch) {
        clinicianSearch.reset();

    }

    // Reset datetime picker
    initializeDateTimePicker(dateData);


    // Hide clinician and services sections
    document.querySelector('.clinician-section').style.display = 'none';
    document.querySelector('.services-section').style.display = 'none';
}

function loadEventData(eventId, container) {
    showSpinner();

    return new Promise((resolve, reject) => {
        // Fetch event data first
        getEventData(eventId)
            .then(data => {

                const userType = data.userType; 

                // Show appropriate section based on event type
                const appointmentSection = container.querySelector('.appointment-section');
                const eventSection = container.querySelector('.event-section');
                const outOfOfficeSection = container.querySelector('.out-of-office-section');
                const deleteButton = container.querySelector('.btn-delete');
                const recurringSection = container.querySelector('#recurring-section');
                const recurringSummary = container.querySelector('.recurring-summary');
                const isRecurring = container.querySelector('#is-recurring');
                const lastEventsSection = container.querySelector('.last-events-section');

                // Hide all sections first
                if (appointmentSection) appointmentSection.style.display = 'none';
                if (eventSection) eventSection.style.display = 'none';
                if (outOfOfficeSection) outOfOfficeSection.style.display = 'none';
                if (deleteButton) deleteButton.style.display = 'block';
                if (recurringSection) recurringSection.style.display = 'none';
                if (lastEventsSection) lastEventsSection.style.display = 'none';

                // Show relevant section and bind data
                if (data.Type === 'APPOINTMENT') {
                    if (appointmentSection) {
                        appointmentSection.style.display = 'block';
                        if (lastEventsSection) lastEventsSection.style.display = 'flex';

                        // Show client details if client exists
                        if (data.Client) {
                            updateClientDetails(data.Client);
                        }

                        // Fetch appointment states after loading event data
                        return getAppointmentStates()
                            .then(states => {
                                const stateSection = container.querySelector('.appointment-state-section');
                                if (stateSection) {
                                    stateSection.style.display = 'block';
                                    initializeAppointmentState(states);
                                }
                            })
                            .then(() => {
                                // Initialize and set appointment state
                                if (data.Status) {
                                    const stateSelect = document.getElementById('appointment-state');
                                    if (stateSelect) {
                                        stateSelect.value = data.Status.id;
                                        updateOptionStyle(stateSelect);
                                    }
                                }
                                // Fetch clinicians and initialize dropdown
                                if (data.Clinician) {
                                    return getClientClinicians(data.Client.id)
                                        .then(clinicians => {
                                            return initializeClinicianDropdown(clinicians, data.Client);
                                        })
                                        .then(() => {
                                            document.querySelector('.clinician-section').style.display = 'block';

                                            const eventDate = new Date(data.StartTime);
                                            const currentDate = new Date();

                                            // Set both dates to midnight to ignore time
                                            eventDate.setHours(0, 0, 0, 0);
                                            currentDate.setHours(0, 0, 0, 0);

                                            if (eventDate < currentDate) {
                                                // Disable clinician dropdown if the event date is older
                                                const clinicianInput = document.getElementById('clinicianSearchInput');
                                                const clinicianArrow = document.getElementById('clinicianDropdownArrow');
                                                if (clinicianInput) {
                                                    clinicianInput.disabled = true;
                                                }
                                                if (clinicianArrow) {
                                                    clinicianArrow.style.display = 'none';
                                                }
                                            }

                                            if (clinicianSearch) {
                                                clinicianSearch.selectItemById(data.Clinician.id);

                                                if (data.Location) {
                                                    locationSearch.selectItemById(data.Location);
                                                }

                                                if (data.IsRecurring) {
                                                    isRecurring.value = 'true';
                                                    if (recurringSummary) {
                                                        recurringSummary.style.display = 'block';
                                                        window.recurringSummary.setDocumentElement(container);
                                                        window.recurringSummary.show(data.RecurrenceRuleString);
                                                    }
                                                }

                                                buildSelectedServices(data.services);

                                                BindNotes(data.last_events, container, userType);

                                                const appointmentTotal = document.getElementById('appointment-total');
                                                if (appointmentTotal) {
                                                    document.getElementById('appointment-total').setAttribute('data-amount', '$' + data.AppointmentTotal.toFixed(2));
                                                }
                                            }

                                            resolve();
                                        });
                                }
                                resolve();
                            });
                    }
                    resolve();
                } else if (data.Type === 'EVENT') {
                    if (eventSection) eventSection.style.display = 'block';
                    if (lastEventsSection) lastEventsSection.style.display = 'none';
                    bindEventData(data, container).then(() => {
                        resolve();
                    }).catch((error) => {
                        console.error('Error binding event data:', error);
                        reject(error);
                    });

                    resolve();
                } else if (data.Type === 'OUT_OF_OFFICE') {
                    if (outOfOfficeSection) outOfOfficeSection.style.display = 'block';
                    if (lastEventsSection) lastEventsSection.style.display = 'none';
                    bindOutOffOfficeData(data, container).then(() => {
                        resolve();
                    }).catch((error) => {
                        console.error('Error binding out of office data:', error);
                        reject(error);
                    });

                    resolve();
                }
            })
            .catch(error => {
                console.error('Error fetching event data:', error);
                reject(error); // Reject on error
            })
            .finally(() => {
                hideSpinner();
            });
    });
}

function getClientClinicians(clientId) {
    return fetch(`api/get_client_clinicians/${clientId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching clinicians:', error);
            throw error; // Rethrow the error for handling in the calling function
        });
}

function getAppointmentStates() {
    return new Promise((resolve, reject) => {
        fetch('api/get_appointment_states/')
            .then(response => response.json())
            .then(states => {
                resolve(states);
            })
            .catch(error => {
                console.error('Error fetching appointment states:', error);
                reject(error);
            });
    });
}

function getEventData(eventId) {
    return new Promise((resolve, reject) => {
        fetch(`api/get_event_data/${eventId}/`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error fetching event data:', error);
                reject(error);
            });
    });
}

function BindNotes(lastEvents, container, userType) {
    const addNoteLink = container.querySelector('#add-note-link');
    const lastEventsSection = container.querySelector('.last-events-list');
    const eventId = document.getElementById('event-id').value;
    let noteUrl;

    if (userType === 'ADMIN') {
        noteUrl = `/admin-dashboard/notes/`;
    } else if (userType === 'CLINICIAN') {
        noteUrl = `/clinician-dashboard/notes/`;
    }

    if (addNoteLink) {
        let addNoteLinkUrl = noteUrl + eventId + '/';
        addNoteLink.addEventListener('click', () => {
            if (addNoteLinkUrl !== '#') {
                window.location.href = addNoteLinkUrl;
            }
        });

    }

    if (lastEventsSection) {
        lastEventsSection.innerHTML = '';

        // Sort lastEvents by event.id in ascending order
        lastEvents.sort((a, b) => a.id - b.id);

        lastEvents.forEach(event => {
            const eventItem = document.createElement('span');
            eventItem.className = 'last-event-item';
            eventItem.textContent = event.date;
            eventItem.setAttribute('data-id', event.id);

            let lastEventUrl = noteUrl + event.id + '/';
            // Add click handler for the event item
            eventItem.addEventListener('click', () => {
                if (lastEventUrl !== '#') {
                    window.location.href = lastEventUrl;
                }
            });
            eventItem.style.cursor = 'pointer';

            lastEventsSection.appendChild(eventItem);
            lastEventsSection.appendChild(document.createTextNode(' | '));
        });

        // Remove the last separator
        if (lastEventsSection.lastChild) {
            lastEventsSection.removeChild(lastEventsSection.lastChild);
        }


    }
}



