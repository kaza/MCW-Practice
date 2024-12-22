document.addEventListener('DOMContentLoaded', function() {
    // Handle service selection
    document.addEventListener('change', function(e) {
        if (e.target.matches('.service-select')) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const fee = selectedOption.dataset.fee;
            const feeInput = e.target.closest('.service-block').querySelector('.fee-input');
            
            if (fee) {
                feeInput.value = parseFloat(fee).toFixed(2);
            } else {
                feeInput.value = '';
            }
        }
    });

    // Handle add service button
    const addServiceBtn = document.querySelector('.service-link');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const serviceBlock = document.querySelector('.service-block').cloneNode(true);
            serviceBlock.querySelector('.service-select').value = '';
            serviceBlock.querySelector('.fee-input').value = '';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-close';
            deleteBtn.onclick = function() {
                serviceBlock.remove();
            };
            serviceBlock.appendChild(deleteBtn);
            
            addServiceBtn.parentElement.insertBefore(serviceBlock, addServiceBtn);
        });
    }
});