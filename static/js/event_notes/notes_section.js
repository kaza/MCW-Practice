document.addEventListener('DOMContentLoaded', function () {
    const templateSelect = document.getElementById('templateSelect');
    templateSelect.addEventListener('change', function () {
        getNoteTemplateData(this.value);
    });
    if (templateSelect.options.length > 0) {
        templateSelect.selectedIndex = 0; 
        getNoteTemplateData(templateSelect.value);
    }
});

function getNoteTemplateData(templateId) {
    showSpinner();
    tinymce.remove();
    fetch(`api/notes/${templateId}/`)
        .then(response => response.json())
        .then(data => {
            const formContainer = document.getElementById('dynamicFormFields');
            formContainer.innerHTML = '';

            if (data) {
                data.template_data.forEach((field, index) => {
                    const section = document.createElement('div');
                    section.className = 'mb-4';

                    // Create required marker if field is required
                    const requiredMark = field.required ? '<span class="required-mark">*</span>' : '';

                    switch(field.questionType) {
                        case "FREE_TEXT":
                            const editorId = `editor_${field.id}_${index}`;
                            section.innerHTML = `
                                <div class="field-question">
                                    ${requiredMark} ${field.question}
                                </div>
                                <textarea id="${editorId}" name="field_${field.id}"></textarea>
                            `;
                            formContainer.appendChild(section);
                            initializeTinyMCE(`#${editorId}`);
                            break;

                        case "TEXT_FIELDS":
                            if (field.intakeAnswers.length > 0) {
                                section.innerHTML = `
                                    <div class="field-question">
                                        ${requiredMark} ${field.question}
                                    </div>
                                    ${field.intakeAnswers.map(answer => `
                                        <div class="mb-3">
                                            <label class="field-question">${answer.text}</label>
                                            <input type="text" 
                                                   name="field_${field.id}_${answer.id}" 
                                                   class="w-full border rounded p-2"
                                                   ${field.required ? 'required' : ''}>
                                        </div>
                                    `).join('')}
                                `;
                                formContainer.appendChild(section);
                            }
                            break;

                        case "SINGLE_SELECT":
                            section.innerHTML = `
                                <div class="field-question mb-2">
                                    ${requiredMark} ${field.question}
                                </div>
                                <div class="radio-group">
                                    ${field.intakeAnswers.map(answer => `
                                        <div class="flex items-center mb-2">
                                            <input type="radio" 
                                                   id="radio_${field.id}_${answer.id}"
                                                   name="field_${field.id}" 
                                                   value="${answer.id}"
                                                   class="mr-2"
                                                   ${field.required ? 'required' : ''}>
                                            <label for="radio_${field.id}_${answer.id}"
                                                   class="text-gray-700">
                                                ${answer.text}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                            formContainer.appendChild(section);
                            break;

                        case "MULTI_SELECT":
                            section.innerHTML = `
                                <div class="field-question mb-2">
                                    ${requiredMark} ${field.question}
                                </div>
                                <div class="checkbox-group">
                                    ${field.intakeAnswers.map(answer => `
                                        <div class="flex items-center mb-2">
                                            <input type="checkbox" 
                                                   id="checkbox_${field.id}_${answer.id}"
                                                   name="field_${field.id}" 
                                                   value="${answer.id}"
                                                   class="mr-2"
                                                   ${field.required ? 'required' : ''}>
                                            <label for="checkbox_${field.id}_${answer.id}"
                                                   class="text-gray-700">
                                                ${answer.text}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                            formContainer.appendChild(section);
                            break;

                        case "SECTION_HEADER":
                            section.innerHTML = `
                                <h3 class="font-bold text-lg text-gray-900 mb-3">
                                    ${requiredMark} ${field.question}
                                </h3>
                            `;
                            formContainer.appendChild(section);
                            break;
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
