function InitializePracticeServices(services) {
    // Get the service select elements
    const serviceSelects = document.querySelectorAll('.service-select');
    
    // Early return if no services data or select elements
    if (!services || serviceSelects.length === 0) {
        console.warn('No services data or select elements found');
        return;
    }

    // Determine which services array to use
    const servicesArray = services.clinician_services || services.patient_default_services
    ;
    if (!servicesArray || !Array.isArray(servicesArray)) {
        console.warn('No valid services array found');
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
            option.value = service.code;
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
                option.value = defaultService.code;
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
    }

    // Initialize all existing service selects
    serviceSelects.forEach(select => {
        populateSelect(select);
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
   
            const deleteIcon = document.createElement('i'); 
            deleteIcon.className = 'fas fa-trash'; 
            deleteIcon.style.cursor = 'pointer'; 
            deleteIcon.onclick = function() {
                newBlock.remove(); 
            };

            newBlock.querySelector('.modifiers-fee-row').appendChild(deleteIcon);
            
            // Add the new block before the add button
            addServiceBtn.parentElement.insertBefore(newBlock, addServiceBtn);

            // Update the fee input
            updateFee(newSelect);
        });
    }

    // Global change event listener for service selection
    document.addEventListener('change', function(e) {
        if (e.target.matches('.service-select')) {
            updateFee(e.target);
        }
    });
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