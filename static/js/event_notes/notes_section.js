document.addEventListener('DOMContentLoaded', function () {

    getEventNotes().then(data => {
        console.log(data);

        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            // Clear existing options
            templateSelect.innerHTML = '';

            // Populate the select options from the fetched data
            data.note.templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                templateSelect.appendChild(option);
            });

            const eventNoteId = document.getElementById('eventNote_id');

            // Check if note exists and set initial display
            const note = data.note.notes;
            if (note && !note.error) {
                showHideNoteTemplateAndData(false);
                eventNoteId.value = note.id;
                showNotes(note);
            } else {
                showHideNoteTemplateAndData(true);
                // Load initial template if available
                if (templateSelect.options.length > 0) {
                    templateSelect.selectedIndex = 0;
                    getNoteTemplateData(templateSelect.value);
                }
            }

            // Template Select Change
            templateSelect.addEventListener('change', function () {
                getNoteTemplateData(this.value);
            });

            // Save Note Button
            document.getElementById('saveNoteButton').addEventListener('click', function (e) {
                e.preventDefault();
                saveNote().then((note) => {
                    showHideNoteTemplateAndData(false);
                    showNotes(note);
                });
            });

            // Cancel Note Button
            document.getElementById('cancelNoteButton').addEventListener('click', function () {
                showHideNoteTemplateAndData(false);
                cancelNoteButton.style.display = 'none';
            });
        }
    })
        .catch(error => {
            console.error('Error fetching event notes:', error);
        });
});

function getEventNotes() {
    return new Promise((resolve, reject) => {
        fetch(`api/notes/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                resolve(data); // Resolve the promise with the fetched data
            })
            .catch(error => {
                console.error('Error fetching event notes:', error);
                reject(error); // Reject the promise with the error
            });
    });
}

function getNoteTemplateData(templateId) {
    showSpinner();
    tinymce.remove();
    fetch(`api/notes/${templateId}/`)
        .then(response => response.json())
        .then(data => {
            const formContainer = document.getElementById('dynamicFormFields');
            populateFormFields(data.template_data, formContainer);
        })
        .catch(error => console.error('Error:', error))
        .finally(() => hideSpinner());
}

// Global object to store editor values
const editorValues = {};

function initializeTinyMCE(selector) {
    tinymce.init({
        selector: selector,
        branding: false,
        resize: false,
        statusbar: false,
        height: 150,
        menubar: false,
        plugins: 'lists link',
        placeholder: 'Begin typing here...',
        toolbar: 'bold italic strikethrough bullist numlist | link hr | undo redo',
        content_style: `
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 16px;
                line-height: 1.5;
            }
            .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{
                color: #bbb;
                font-size: .875rem;
            }
        `,
        skin: 'oxide',
        icons: 'thin',
        setup: function (editor) {
            editor.on('focus', function (e) {
                editor.getContainer().style.boxShadow = 'none';
            });

            editor.on('init', function () {
                // Set content from global variable if it exists
                const editorId = editor.id;
                if (editorValues[editorId]) {
                    editor.setContent(editorValues[editorId]);
                }
                console.log('Editor initialized:', editor.id); 
            });
        }
    });
}

function saveNote() {
    return new Promise((resolve, reject) => { // Wrap in a Promise
        const templateId = document.getElementById('templateSelect').value;
        const noteId = document.getElementById('eventNote_id').value;
        let formattedData = [];

        const form = document.querySelector('#noteForm');

        // Process TinyMCE editors (FREE_TEXT)
        form.querySelectorAll('textarea[id^="editor_"]').forEach(textArea => {
            const [_, questionId] = textArea.id.split('_');
            const editor = tinymce.get(textArea.id);
            if (editor) {
                formattedData.push({
                    questionId: parseInt(questionId),
                    questionType: 'FREE_TEXT',
                    freeTextAnswer: editor.getContent(),
                    formattedFreeTextAnswer: editor.getContent() + '\n'
                });
            }
        });

        // Process TEXT_FIELDS
        form.querySelectorAll('input[type="text"]').forEach(input => {
            const [_, questionId, answerId] = input.name.split('_');
            let questionObj = formattedData.find(q => q.questionId === parseInt(questionId));

            if (!questionObj) {
                questionObj = {
                    questionId: parseInt(questionId),
                    questionType: 'TEXT_FIELDS',
                    answers: []
                };
                formattedData.push(questionObj);
            }

            const label = input.closest('.mb-3')?.querySelector('label');
            questionObj.answers.push({
                answer_id: answerId,
                text: input.value || null,
                answer_text: label ? label.textContent.trim() : ''
            });
        });

        // Process SINGLE_SELECT
        form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            const questionId = radio.name.replace('field_', '');
            formattedData.push({
                questionId: parseInt(questionId),
                questionType: 'SINGLE_SELECT',
                answers: [{
                    answer_id: radio.value,
                    text: radio.closest('.flex.items-center.mb-2')?.querySelector('label')?.textContent.trim() || null
                }]
            });
        });

        // Process MULTI_SELECT
        const checkboxGroups = new Map();
        form.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const questionId = checkbox.name.replace('field_', '');

            if (!checkboxGroups.has(questionId)) {
                checkboxGroups.set(questionId, []);
            }

            checkboxGroups.get(questionId).push({
                answer_id: checkbox.value,
                text: checkbox.closest('.flex.items-center.mb-2')?.querySelector('label')?.textContent.trim() || null
            });
        });

        // Add checkbox groups to formatted data
        checkboxGroups.forEach((answers, questionId) => {
            formattedData.push({
                questionId: parseInt(questionId),
                questionType: 'MULTI_SELECT',
                answers: answers
            });
        });

        // Sort the formatted data by questionId
        formattedData.sort((a, b) => a.questionId - b.questionId);

        showSpinner();
        // Send data to server
        fetch(`api/notes/save/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({
                note_id: noteId || null,
                template_id: templateId,
                note_data: formattedData
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    reject('Error saving note: ' + data.error); // Reject the promise
                } else {
                    resolve(data); 
                }
            })
            .catch(error => {
                console.error('Error:', error);
                reject('Error saving note. Please try again.'); // Reject the promise
            })
            .finally(() => hideSpinner());
    });
}

function showNotes(note) {
    const noteContainer = document.getElementById('note-container');

    if (note) {
        noteContainer.innerHTML = '';
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-content';

        // Add edit button
        const editButton = document.createElement('button');
        editButton.className = 'btn-edit btn-primary ml-2';
        editButton.textContent = 'Edit';
        editButton.onclick = function () {
            showEditForm(note);
        };

        // Add header with metadata
        const headerDiv = document.createElement('div');
        headerDiv.className = 'note-header flex justify-between items-center mb-4';
        headerDiv.innerHTML = `
            <div>
                <b class="template-name">${note.template_name}</b>
            </div>
        `;
        headerDiv.appendChild(editButton);
        noteDiv.appendChild(headerDiv);

        showNote(note.note_data, note.template_data, noteDiv);

        noteContainer.appendChild(noteDiv);
    }
}

function showEditForm(note) {
    const noteFormContainer = document.getElementById('note-template-container');
    const noteHistoryContainer = document.getElementById('note-container');
    const templateSelect = document.getElementById('templateSelect');
    const formContainer = document.getElementById('dynamicFormFields');
    const cancelNoteButton = document.getElementById('cancelNoteButton');
    tinymce.remove();

    // Find and select the correct template in dropdown
    Array.from(templateSelect.options).forEach(option => {
        if (option.value === String(note.template_id)) {
            templateSelect.value = option.value;
        }
    });

    noteFormContainer.style.display = 'block';
    noteHistoryContainer.style.display = 'none';
    populateFormFields(note.template_data, formContainer).then(() => {
        bindNoteDataToForm(note.note_data);
        cancelNoteButton.style.display = 'block';
    });
}
    
function bindNoteDataToForm(noteData) {
    noteData.forEach((question, index) => {
        switch (question.questionType) {
            case 'FREE_TEXT':
                const editor = tinymce.get(`editor_${question.questionId}_${index}`);
                if (editor) {
                    editorValues[editor.id] = question.freeTextAnswer || '';
                    editor.setContent(editorValues[editor.id]);
                }
                break;

            case 'TEXT_FIELDS':
                if (question.answers) {
                    question.answers.forEach(answer => {
                        const input = document.querySelector(`[name="field_${question.questionId}_${answer.answer_id}"]`);
                        if (input) {
                            input.value = answer.text || '';
                        }
                    });
                }
                break;

            case 'SINGLE_SELECT':
                if (question.answers && question.answers.length > 0) {
                    const radio = document.querySelector(`[name="field_${question.questionId}"][value="${question.answers[0].answer_id}"]`);
                    if (radio) {
                        radio.checked = true;
                    }
                }
                break;

            case 'MULTI_SELECT':
                if (question.answers) {
                    question.answers.forEach(answer => {
                        const checkbox = document.querySelector(`[name="field_${question.questionId}"][value="${answer.answer_id}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                }
                break;
        }
    });
}

function showNote(noteData, templateData, container) {
    // Create a container for the note content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content-details';

    // Process each question in the note data
    noteData.forEach(questionData => {
        const templateQuestion = templateData.find(q => q.id === questionData.questionId);
        if (!templateQuestion) return;

        const section = document.createElement('div');
        section.className = 'mb-4';

        switch (questionData.questionType) {
            case 'FREE_TEXT':
                if (questionData.freeTextAnswer) {
                    section.innerHTML = `
                        <div class="question-text">${templateQuestion.question}</div>
                        <div class="answer-text">${questionData.freeTextAnswer}</div>
                    `;
                }
                break;

            case 'TEXT_FIELDS':
                if (questionData.answers && questionData.answers.length > 0) {
                    
                    const hasValidAnswers = questionData.answers.some(answer => {
                        return answer.text != null;
                    });
                    if (hasValidAnswers) {
                        let content = `<div class="question-text">${templateQuestion.question}</div>`;
                        questionData.answers.forEach(answer => {
                            if(answer.text != null) {   
                                const templateAnswer = templateQuestion.intakeAnswers.find(a => a.id === parseInt(answer.answer_id));
                                if (templateAnswer && answer.text) {
                                    // content += `<div style="display: flex; align-items: baseline;">`;
                                    content += `<div class="question-text" style="margin-right: 10px;">${templateAnswer.text}</div>`;
                                    content += `<div class="answer-text">${answer.text}</div>`;
                                    // content += `</div>`;
                                }
                            }
                        });
                        section.innerHTML = content;

                    }
                }
                break;

            case 'MULTI_SELECT':
                if (questionData.answers && questionData.answers.length > 0) {
                    let content = `<div class="question-text">${templateQuestion.question}</div><ul class="list-disc pl-5">`;
                    questionData.answers.forEach(answer => {
                        const templateAnswer = templateQuestion.intakeAnswers.find(a => a.id === parseInt(answer.answer_id));
                        if (templateAnswer) {
                            content += `<li class="answer-text">${templateAnswer.text}</li>`;
                        }
                    });
                    content += '</ul>';
                    section.innerHTML = content;
                }
                break;

            case 'SINGLE_SELECT':
                if (questionData.answers && questionData.answers.length > 0) {
                    const templateAnswer = templateQuestion.intakeAnswers.find(
                        a => a.id === parseInt(questionData.answers[0].answer_id)
                    );
                    if (templateAnswer) {
                        section.innerHTML = `
                            <div class="question-text">${templateQuestion.question}</div>
                            <div class="answer-text">${templateAnswer.text}</div>
                        `;
                    }
                }
                break;
        }

        if (section.innerHTML) {
            contentDiv.appendChild(section);
        }
    });

    container.appendChild(contentDiv);
}

function populateFormFields(templateData, formContainer) {
    return new Promise((resolve, reject) => {
        try {
            formContainer.innerHTML = ''; // Clear existing content

            if (templateData) {
                templateData.forEach((field, index) => {
                    const section = document.createElement('div');
                    section.className = 'mb-4';

                    // Create required marker if field is required
                    const requiredMark = field.required ? '<span class="required-mark">*</span>' : '';

                    switch (field.questionType) {
                        case "FREE_TEXT":
                            const editorId = `editor_${field.id}_${index}`;
                            section.innerHTML = `
                                <div class="field-question mb-2">
                                    ${requiredMark} ${field.question}
                                </div>
                                <div class="editor-wrapper">
                                    <textarea id="${editorId}" name="field_${field.id}"></textarea>
                                </div>
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

            resolve(); // Resolve the promise after populating the fields
        } catch (error) {
            reject(error); // Reject the promise if an error occurs
        }
    });
}


function showHideNoteTemplateAndData(isTemplate = true) {
    const noteFormContainer = document.getElementById('note-template-container');
    const noteHistoryContainer = document.getElementById('note-container');
    if (isTemplate) {
        noteFormContainer.style.display = 'block';
        noteHistoryContainer.style.display = 'none';
    } else {
        noteFormContainer.style.display = 'none';
        noteHistoryContainer.style.display = 'block';
}
}



