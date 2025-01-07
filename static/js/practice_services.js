function InitializePracticeServices(services) {
    return new Promise((resolve, reject) => {
        // Get the service select elements
        const serviceSelects = document.querySelectorAll('.service-select');
        
        // Early return if no services data or select elements
        if (!services || serviceSelects.length === 0) {
            console.warn('No services data or select elements found');
            reject('No services data or select elements found');
            return;
        }

        // Determine which services array to use
        const servicesArray = services.clinician_services || services.patient_default_services;
        if (!servicesArray || !Array.isArray(servicesArray)) {
            console.warn('No valid services array found');
            reject('No valid services array found');
            return;
        }

        // Get patient default services
        const patientDefaults = services.patient_default_services || [];

        // Function to populate a single select element
        function populateSelect(select) {
            // Clear existing options
            select.innerHTML = '';
            
            // Add initial placeholder option
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Select service';
            select.appendChild(placeholderOption);

            // Create Practice Services group
            const practiceGroup = document.createElement('optgroup');
            practiceGroup.label = 'Practice Services';
            
            // Add practice/clinician services
            servicesArray.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.dataset.fee = service.rate;
                option.textContent = `${service.description}`;
                practiceGroup.appendChild(option);
            });
            
            select.appendChild(practiceGroup);

            // Create Client's Default Services group if there are any defaults
            if (patientDefaults.length > 0) {
                const defaultGroup = document.createElement('optgroup');
                defaultGroup.label = "Client's Default Services";
                
                patientDefaults.forEach(defaultService => {
                    const option = document.createElement('option');
                    option.value = defaultService.id;
                    option.dataset.fee = defaultService.rate;
                    option.dataset.isDefault = 'true';
                    if (defaultService.is_primary) {
                        option.dataset.isPrimary = 'true';
                    }
                    option.textContent = `${defaultService.description}`;
                    defaultGroup.appendChild(option);
                });
                
                select.appendChild(defaultGroup);
            }

            // Auto-select if it's a primary or default service
            const primaryOption = select.querySelector('option[data-is-primary="true"]');
            const defaultOption = select.querySelector('option[data-is-default="true"]');
            
            if (primaryOption) {
                primaryOption.selected = true;
            } else if (defaultOption) {
                defaultOption.selected = true;
            }

            // Update the fee input
            updateFee(select);
        }

        // Function to update fee input
        function updateFee(select) {
            const selectedOption = select.options[select.selectedIndex];
            const feeInput = select.closest('.service-block').querySelector('.fee-input');
            
            if (selectedOption && selectedOption.dataset.fee) {
                feeInput.value = parseFloat(selectedOption.dataset.fee).toFixed(2);
            } else {
                feeInput.value = '';
            }
            updateBillingAmount();
        }

        // Initialize all existing service selects
        serviceSelects.forEach(select => {
            populateSelect(select);
        });

        // Add event listeners to fee inputs
        document.querySelectorAll('.fee-input').forEach(input => {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9.]/g, ''); // Ensure only numbers and decimal points
                updateBillingAmount(); // Recalculate total fee
            });
        });

        // Add service button click handler
        const addServiceBtn = document.querySelector('.service-link');
        if (addServiceBtn) {
            addServiceBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Clone the first service block
                const firstBlock = document.querySelector('.service-block');
                const newBlock = firstBlock.cloneNode(true);
                
                // Reset the new block's values
                const newSelect = newBlock.querySelector('.service-select');
                const newFeeInput = newBlock.querySelector('.fee-input');
                
                // Repopulate the select to ensure proper event binding
                populateSelect(newSelect);
                newFeeInput.value = '';

                // Create a delete icon
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fas fa-trash';
                deleteIcon.style.cursor = 'pointer';
                deleteIcon.style.marginLeft = '10px';
                deleteIcon.onclick = function() {
                    newBlock.remove(); 
                    updateBillingAmount(); 
                };

                newBlock.querySelector('.modifiers-fee-row').appendChild(deleteIcon);
                
                // Add the new block before the add button
                addServiceBtn.parentElement.insertBefore(newBlock, addServiceBtn);

                updateFee(newSelect);

                // Update total when fee inputs change
                newFeeInput.addEventListener('input', function() {
                    this.value = this.value.replace(/[^0-9.]/g, ''); 
                    updateBillingAmount(); 
                });
                
                // Update billing amount after adding a new service
                updateBillingAmount();
            });
        }

        // Global change event listener for service selection
        document.addEventListener('change', function(e) {
            if (e.target.matches('.service-select')) {
                updateFee(e.target);
            }
        });

        // Resolve the promise after initialization
        resolve('Services initialized successfully');
    });
}

  // Function to calculate total fee
  function calculateTotalFee() {
    const feeInputs = document.querySelectorAll('.fee-input');
    let total = 0;

    feeInputs.forEach(input => {
        const fee = parseFloat(input.value) || 0; // Parse fee or default to 0
        total += fee;
    });

    return total;
}

// Function to update billing amount
function updateBillingAmount() {
    const total = calculateTotalFee();
    const appointmentTotal = document.getElementById('appointment-total');
    if (appointmentTotal) {
        document.getElementById('appointment-total').setAttribute('data-amount', '$' + total.toFixed(2));
    }
}

// Function to reset all services
function reInitializePracticeServices() {
    // Remove all additional service blocks
    const serviceBlocks = document.querySelectorAll('.service-block');
    serviceBlocks.forEach((block, index) => {
        if (index > 0) { // Keep the first block
            block.remove();
        }
    });
    
    // Reset the first service block
    const firstBlock = document.querySelector('.service-block');
    if (firstBlock) {
        const serviceSelect = firstBlock.querySelector('.service-select');
        const feeInput = firstBlock.querySelector('.fee-input');
        if (serviceSelect) populateSelect(serviceSelect);
        if (feeInput) feeInput.value = '';
    }
}

function getSelectedServices() {
    const serviceBlocks = document.querySelectorAll('.service-block');
    const services = [];
    
    serviceBlocks.forEach(block => {
        const serviceSelect = block.querySelector('.service-select');
        const feeInput = block.querySelector('.fee-input');
        const modifiers = block.querySelectorAll('.modifier-input'); // Get all modifier inputs
        const modifierValues = Array.from(modifiers).map(modifier => modifier.value).filter(value => value); // Filter out empty values

        const service = {
            serviceId: serviceSelect.value, 
            code: serviceSelect.options[serviceSelect.selectedIndex].dataset.code,
            fee: parseFloat(feeInput.value) || 0,
            modifiers: modifierValues
        };

        services.push(service);
    });
    
    return services;
}   

function buildSelectedServices(services) {
    // Get the first service block
    const firstBlock = document.querySelector('.service-block');
    if (firstBlock && services.length > 0) {
        const serviceSelect = firstBlock.querySelector('.service-select');
        const feeInput = firstBlock.querySelector('.fee-input');
        const modifierInputs = firstBlock.querySelectorAll('.modifier-input');

        // Assign the first service's details
        const firstService = services[0];
        serviceSelect.value = firstService.service_id; // Set the service ID
        feeInput.value = firstService.fee.toFixed(2); // Set the fee

        // Set modifiers if they exist
        if (firstService.modifiers && firstService.modifiers.length > 0) {
            const modifiersArray = firstService.modifiers.split(','); // Split by comma
            modifiersArray.forEach((modifier, index) => {
                if (modifierInputs[index]) {
                    modifierInputs[index].value = modifier.trim(); // Set each modifier
                }
            });
        }

        // Add additional services if they exist
        for (let i = 1; i < services.length; i++) {
            const newService = services[i];
            const newBlock = firstBlock.cloneNode(true); // Clone the first block

            // Reset values in the new block
            const newServiceSelect = newBlock.querySelector('.service-select');
            const newFeeInput = newBlock.querySelector('.fee-input');
            const newModifierInputs = newBlock.querySelectorAll('.modifier-input');

            newServiceSelect.value = newService.service_id; // Set the service ID
            newFeeInput.value = newService.fee.toFixed(2); // Set the fee

            // Set modifiers if they exist
            if (newService.modifiers && newService.modifiers.length > 0) {
                const newModifiersArray = newService.modifiers.split(',');
                newModifiersArray.forEach((modifier, index) => {
                    if (newModifierInputs[index]) {
                        newModifierInputs[index].value = modifier.trim(); // Set each modifier
                    }
                });
            }

            // Create a delete icon for the new service block
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.style.marginLeft = '10px';
            deleteIcon.onclick = function() {
                newBlock.remove(); 
                updateBillingAmount(); // Update total after deletion
            };

            // Append the delete icon to the new block
            newBlock.querySelector('.modifiers-fee-row').appendChild(deleteIcon);

            // Add the new block before the add service button
            const addServiceBtn = document.querySelector('.service-link');
            addServiceBtn.parentElement.insertBefore(newBlock, addServiceBtn);
        }
    }
}
