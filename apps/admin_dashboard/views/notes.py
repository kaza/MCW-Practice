


from django.urls import reverse_lazy
from apps.admin_dashboard.forms import DynamicNoteForm
from apps.clinician_dashboard.models import EventNote, NoteTemplate
from django.views.generic.edit import FormView
from django.contrib import messages



class NoteFormView(FormView):
    template_name = 'admin_dashboard/components/event_notes_form.html'
    form_class = DynamicNoteForm
    
    def get_success_url(self):
        return reverse_lazy('event_detail', kwargs={'pk': self.kwargs['event_id']})

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        template = NoteTemplate.objects.get(id=self.kwargs['template_id'])
        kwargs['template_data'] = template.template_data
        return kwargs

    def form_valid(self, form):
        # Process and save the form data
        note_data = {
            key.replace('question_', ''): value 
            for key, value in form.cleaned_data.items()
        }
        
        EventNote.objects.create(
            event_id=self.kwargs['event_id'],
            template_id=self.kwargs['template_id'],
            note_data=note_data,
            created_by=self.request.user
        )
        
        messages.success(self.request, 'Note saved successfully!')
        return super().form_valid(form)

