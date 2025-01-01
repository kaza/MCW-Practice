import json
from django.views import View
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.shortcuts import render
from apps.shared.services.event_notes_service import EventNotesService

class NoteFormView(TemplateView):
    template_name = 'components/event_notes.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        event_id = kwargs.get('event_id')
        context['event_id'] = event_id
        return context

class GetEventNotesDataView(View):
    def get(self, request, event_id):
        data = EventNotesService.get_event_details(event_id)
        return render(request, 'admin_dashboard/event_notes.html', {'note': data}) 

class SaveEventNoteView(View):
    def post(self, request, event_id):
        data = json.loads(request.body)
        clinician_id = request.user.id  
        result = EventNotesService.save_event_note(event_id, data, clinician_id)
        return JsonResponse(result)
