function bindRecurringSummary(data, container) {
    if (data.is_recurring) {
        const recurringSummary = document.querySelector('#recurring-summary');
        recurringSummary.style.display = 'block';
        window.recurringSummary.setDocumentElement(container);
        window.recurringSummary.show(data.recurring_string);
        window.recurringSummary.hideEditButton();
    }
}

function bindEventServices(data) {
    const servicesList = document.querySelector('.services-list');
    
    // Clear existing content
    servicesList.innerHTML = '';

    // Iterate over the services and create HTML elements
    data.forEach(service => {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'price-info'; 

        // Create the inner HTML for the service item
        serviceItem.innerHTML = `
            <span>${service.name}</span>
            <span>$${service.fee}</span>
        `;
        servicesList.appendChild(serviceItem);
    });
}

