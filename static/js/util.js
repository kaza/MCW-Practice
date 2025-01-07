function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.textContent = '';
        msg.style.display = 'none';
    });
}

function getCsrfToken() {
    const csrfCookie = document.cookie
        .split(';')
        .find(cookie => cookie.trim().startsWith('csrftoken='));
    return csrfCookie ? csrfCookie.split('=')[1] : '';
}
function getStartAndEndDates(selectedDate, selectedView) {
    let startDate, endDate;

    switch (selectedView) {
        case 'Day':
            startDate = moment(selectedDate).startOf('day').format();
            endDate = moment(selectedDate).endOf('day').format();
            break;
        case 'Week':
            startDate = moment(selectedDate).startOf('week').format();
            endDate = moment(selectedDate).endOf('week').format();
            break;
        case 'Month':
            startDate = moment(selectedDate).startOf('month').format();
            endDate = moment(selectedDate).endOf('month').format();
            break;
        default:
            return null;
    }

    return { startDate, endDate };
}

function formatTimeToHHMM(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateDuration(startTimeInput, endTimeInput, durationInput) {
    if (startTimeInput?.value && endTimeInput?.value) {
        const start = new Date(`2000-01-01T${startTimeInput.value}`);
        const end = new Date(`2000-01-01T${endTimeInput.value}`);
        const duration = (end - start) / (1000 * 60);
        if (durationInput) {
            durationInput.value = duration >= 0 ? duration : 0;
        }
    }
}

function updateEndTimeBasedOnDuration(dateInput, startTimeInput, durationInput) {
    const startTime = startTimeInput.value;
    const duration = durationInput.value;
    if (startTime && duration) {
        const startDateTime = new Date(`${dateInput.value}T${startTime}`);
        const durationInMinutes = parseInt(duration, 10);
        const endDateTime = new Date(startDateTime.getTime() + durationInMinutes * 60000); 
        return formatTimeToHHMM(endDateTime);
    }
}

function calculateNumberOfDays(allDayStartDate, allDayEndDate, numberOfDaysInput) {
    if (allDayStartDate?.value && allDayEndDate?.value) {
        const start = new Date(allDayStartDate.value);
        const end = new Date(allDayEndDate.value);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (numberOfDaysInput) {
            numberOfDaysInput.value = diffDays;
        }
    }
}

function toggleViews(isAllDay, regularTimeView, startDate, allDayView) {
    if (regularTimeView) {
        regularTimeView.style.display = isAllDay ? 'none' : 'flex';
        startDate.style.display = isAllDay ? 'none' : 'block';
    }
    if (allDayView) {
        allDayView.style.display = isAllDay ? 'block' : 'none';
    }
}

function syncViewData(isAllDay, elements) {
    if (isAllDay) {
        // Regular to All-day
        if (elements.allDayStartDate && elements.dateInput) {
            elements.allDayStartDate.value = elements.dateInput.value;
        }
        if (elements.allDayEndDate && elements.dateInput) {
            elements.allDayEndDate.value = elements.dateInput.value;
        }
        calculateNumberOfDays(elements.allDayStartDate, elements.allDayEndDate, elements.numberOfDays);
    } else {
        // All-day to Regular
        if (elements.dateInput && elements.allDayStartDate) {
            elements.dateInput.value = elements.allDayStartDate.value;
        }
        calculateDuration(elements.startTimeInput, elements.endTimeInput, elements.durationInput);
    }
}

function showSpinner() {
    const spinnerContainer = document.getElementById('spinner-container');
    if (spinnerContainer) {
        spinnerContainer.style.display = 'flex'; // Show the spinner
    }
}

function hideSpinner() {
    const spinnerContainer = document.getElementById('spinner-container');
    if (spinnerContainer) {
        spinnerContainer.style.display = 'none'; // Hide the spinner
    }
}
