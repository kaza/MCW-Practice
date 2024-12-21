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
