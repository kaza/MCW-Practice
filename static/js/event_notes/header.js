class EventHeader {
    constructor(eventId) {
        this.eventId = eventId;
        this.init();
    }

    init() {
        this.loadEventDetails();
        this.bindActions();
    }

    async loadEventDetails() {
        try {
            const response = await fetch(`/api/events/${this.eventId}/`);
            const data = await response.json();
            this.updateHeader(data);
        } catch (error) {
            console.error('Error loading event details:', error);
        }
    }

    updateHeader(data) {
        const patientName = document.getElementById('patient-name');
        const patientEmail = document.getElementById('patient-email');
        
        if (patientName) patientName.textContent = `${data.patient.first_name} ${data.patient.last_name}`;
        if (patientEmail) patientEmail.textContent = data.patient.email;
    }

    bindActions() {
        const documentationBtn = document.getElementById('documentation-btn');
        const messageBtn = document.getElementById('message-btn');
        const diagnosisBtn = document.getElementById('diagnosis-btn');

        if (documentationBtn) documentationBtn.addEventListener('click', () => this.handleDocumentation());
        if (messageBtn) messageBtn.addEventListener('click', () => this.handleMessage());
        if (diagnosisBtn) diagnosisBtn.addEventListener('click', () => this.handleDiagnosis());
    }

    // Action handlers
    handleDocumentation() {
        
    }

    handleMessage() {
       
    }

    handleDiagnosis() {
        
    }
}
