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
            startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'Week':
            startDate = new Date(selectedDate);
            startDate.setDate(selectedDate.getDate() - selectedDate.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'Month':
            startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
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
