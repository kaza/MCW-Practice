# forms.py
from django import forms
from tinymce.widgets import TinyMCE
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Fieldset, Submit, Div

class DynamicNoteForm(forms.Form):
    def __init__(self, *args, template_data=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        layout_fields = []

        if template_data:
            for field in template_data:
                if field['questionType'] == 'FREE_TEXT':
                    field_name = f"question_{field['id']}"
                    self.fields[field_name] = forms.CharField(
                        widget=TinyMCE(attrs={
                            'class': 'w-full'
                        }),
                        label=field['question'],
                        required=field.get('required', False)
                    )
                    layout_fields.append(
                        Field(
                            field_name,
                            css_class='mb-4'
                        )
                    )
                elif field['questionType'] == 'TEXT_FIELDS':
                    subfields = []
                    for answer in field['intakeAnswers']:
                        subfield_name = f"question_{field['id']}_{answer['id']}"
                        self.fields[subfield_name] = forms.CharField(
                            widget=forms.TextInput(attrs={'class': 'w-full'}),
                            label=answer['text'],
                            required=field.get('required', False)
                        )
                        subfields.append(
                            Field(subfield_name, css_class='mb-2')
                        )
                    
                    layout_fields.append(
                        Fieldset(
                            field['question'],
                            Div(*subfields, css_class='space-y-2'),
                            css_class='mb-6 p-4 border rounded'
                        )
                    )

        layout_fields.append(
            Div(
                Submit('submit', 'Save Note', css_class='px-4 py-2 bg-blue-500 text-white rounded'),
                css_class='mt-6'
            )
        )
        self.helper.layout = Layout(*layout_fields)