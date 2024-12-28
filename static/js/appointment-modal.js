// static/js/appointment-modal.js
class AppointmentModal {
    constructor() {
        this.modal = document.getElementById('appointmentModal');
        this.overlay = this.modal.querySelector('.modal-overlay');
        this.closeBtn = this.modal.querySelector('.modal-close');
        this.cancelBtn = this.modal.querySelector('.modal-btn-cancel');
        this.saveBtn = this.modal.querySelector('.modal-btn-save');
        this.title = this.modal.querySelector('#modalTitle');
        this.message = this.modal.querySelector('#modalMessage');
        this.optionsContainer = this.modal.querySelector('#modalOptions');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.hide());
        this.cancelBtn.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', () => this.hide());
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hide();
            }
        });
    }

    show({ title, message, options = [], onSave = null }) {
        this.title.textContent = title;
        this.message.textContent = message;
        
        // Clear existing options
        this.optionsContainer.innerHTML = '';
        
        // Add radio options
        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'modal-option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = `option-${index}`;
            radio.name = 'modal-option';
            radio.value = option.value;
            
            const label = document.createElement('label');
            label.htmlFor = `option-${index}`;
            label.textContent = option.text;
            
            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);
            this.optionsContainer.appendChild(optionDiv);
            
            // Enable save button when an option is selected
            radio.addEventListener('change', () => {
                this.saveBtn.disabled = !this.optionsContainer.querySelector('input[name="modal-option"]:checked');
            });
        });
        
        // Initial state of the save button
        this.saveBtn.disabled = true;

        // Setup save handler
        if (onSave) {
            this.saveBtn.onclick = () => {
                const selectedOption = this.modal.querySelector('input[name="modal-option"]:checked');
                if (selectedOption) {
                    onSave(selectedOption.value);
                    this.hide();
                }
            };
        }
        
        this.modal.classList.remove('hidden');
        
        // Focus first option for accessibility
        const firstOption = this.modal.querySelector('input[type="radio"]');
        if (firstOption) {
            firstOption.focus();
        }
    }

    hide() {
        this.modal.classList.add('hidden');
    }
}
