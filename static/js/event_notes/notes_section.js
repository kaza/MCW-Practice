class NotesSection {
    constructor(eventId) {
        this.eventId = eventId;
        this.currentTemplate = null;
        this.init();
    }

    async init() {
        await this.loadEventData();
        this.loadNoteTemplates();
        this.bindEvents();
    }

    async loadEventData() {
        try {
            const response = await fetch(`/admin/api/notes/${this.eventId}/`);
            const data = await response.json();
            this.eventData = data;
            this.updateUI(data);
        } catch (error) {
            console.error('Error loading event data:', error);
        }
    }

    async saveNote() {
        const noteData = {
            template_id: this.currentTemplate.id,
            note_data: {
                content: document.getElementById('note-content').innerHTML
            }
        };

        try {
            const response = await fetch(`/admin/api/notes/${this.eventId}/save/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify(noteData)
            });

            const result = await response.json();
            if (result.error) {
                console.error('Error saving note:', result.error);
            } else {
                // Refresh the notes list
                this.loadEventData();
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }

    async loadNoteTemplates() {
        try {
            const response = await fetch('/api/note-templates/?type=1');
            const templates = await response.json();
            this.populateTemplateDropdown(templates);
        } catch (error) {
            console.error('Error loading note templates:', error);
        }
    }

    populateTemplateDropdown(templates) {
        const dropdown = document.getElementById('note-template-select');
        if (!dropdown) return;

        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            dropdown.appendChild(option);
        });
    }

    bindEvents() {
        const templateSelect = document.getElementById('note-template-select');
        const saveButton = document.getElementById('save-note-btn');

        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => this.handleTemplateChange(e));
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveNote());
        }
    }

    async handleTemplateChange(event) {
        const templateId = event.target.value;
        if (!templateId) return;

        try {
            const response = await fetch(`/api/note-templates/${templateId}/`);
            const template = await response.json();
            this.renderTemplateForm(template);
        } catch (error) {
            console.error('Error loading template:', error);
        }
    }

    renderTemplateForm(template) {
        this.currentTemplate = template;
    }

    updateUI(data) {

    }
}
