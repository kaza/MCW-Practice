document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('templateSelect').addEventListener('change', function () {
        getNoteTemplateData(this.value);
    });
});

function getNoteTemplateData(templateId) {
    showSpinner();
    tinymce.remove();
    fetch(`api/notes/${templateId}/`)
        .then(response => response.json())
        .then(data => {

            const formContainer = document.getElementById('dynamicFormFields');
            formContainer.innerHTML = '';

            // Build form based on the selected template data
            if (data) {
                data.template_data.forEach((field, index) => {
                    if (field.questionType === "FREE_TEXT") {
                        // Create rich text editor section
                        const section = document.createElement('div');
                        section.className = 'mb-4';
                        const editorId = `editor_${field.id}_${index}`;
                        section.innerHTML = `
                            <div class="field-question">${field.question}</div>
                            <textarea id="${editorId}" name="field_${field.id}"></textarea>
                        `;
                        formContainer.appendChild(section);
                        initializeTinyMCE(`#${editorId}`);
                    } else if (field.questionType === "TEXT_FIELDS" && field.intakeAnswers.length > 0) {
                        // Create multiple text field section
                        const section = document.createElement('div');
                        section.className = 'mb-4';
                        section.innerHTML = `
                        <div class="field-question">${field.question}</div>
                        ${field.intakeAnswers.map(answer => `
                            <div class="mb-3">
                                <label class="field-question">${answer.text}</label>
                                <input type="text" name="field_${field.id}_${answer.id}" 
                                       class="w-full border rounded p-2">
                            </div>
                        `).join('')}
                    `;
                        formContainer.appendChild(section);
                    }
                });
            }
        })
        .catch(error => console.error('Error:', error))
        .finally(() => hideSpinner());
}

function initializeTinyMCE(selector) {
    tinymce.init({
        selector: selector,
        height: 180,
        menubar: false,
        toolbar: 'undo redo | formatselect | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help'
    });
}
