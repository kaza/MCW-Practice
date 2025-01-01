from typing import Dict, Any, List
from django.db.models import Q
import json 

from apps.clinician_dashboard.models import Event, EventNote, EventType, NoteTemplate, EventService, Patient, Clinician, Location, AppointmentState
from apps.shared.services.scheduler_service import SchedulerDataService

class EventNotesService:
    @classmethod
    def get_event_details(cls, event_id: int) -> Dict[str, Any]:
        """Get comprehensive event details including notes history"""
        try:
            event = Event.objects.select_related('clinician', 'location', 'status', 'patient').get(id=event_id)
            
            # Prepare the event details
            event_data = {
                'status': event.status.name if event.status else 'Unknown',
                'start_date': event.start_datetime,
                'end_date': event.end_datetime,
                'clinician_name': f"{event.clinician.first_name} {event.clinician.last_name}",
                'location': event.location.name if event.location else 'No Location',
                'is_recurring': event.is_recurring,
                'recurring_string': event.recurrence_rule if event.is_recurring else 'Not Recurring',
                'event_services': cls.get_event_services(event),
                'appointment_total': event.appointment_total,
                'client_name': f"{event.patient.first_name} {event.patient.last_name}" if event.patient else 'No Client',
                'client_email': event.patient.email if event.patient else 'No Email',
                'previous_appointment': cls.get_previous_appointment(event),
                'next_appointment': cls.get_next_appointment(event),
                'appointments_left': cls.get_appointments_left(event)
            }

            # Get note templates
            templates = cls.get_note_templates()
            event_data['note_templates'] = templates
            
            # Get event notes
            notes = cls.get_event_notes(event_id)
            event_data['notes'] = notes
            
            return event_data

        except Event.DoesNotExist:
            return {'error': 'Event not found'}

    @classmethod
    def get_note_templates(cls, type_id: int = 1) -> List[Dict[str, Any]]:
        """Get available note templates"""
        templates = NoteTemplate.objects.filter(
            is_active=True,
            type_id=type_id
        ).values('id', 'name', 'template_data')
        
        return list(templates)
    
    @classmethod
    def get_event_notes(cls, event_id: int) -> List[Dict[str, Any]]:
        """Get notes for a specific event"""
        notes = EventNote.objects.filter(
            event_id=event_id
        ).select_related(
            'template',
            'created_by'
        ).order_by('-created_at')
        
        return [
            {
                'id': note.id,
                'template_name': note.template.name,
                'note_data': note.note_data,
                'created_by': f"{note.created_by.first_name} {note.created_by.last_name}",
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for note in notes
        ]
    
    @classmethod
    def save_event_note(cls, event_id: int, data: Dict[str, Any], clinician_id: int) -> Dict[str, Any]:
        """Save a new note for an event"""
        try:
            event = Event.objects.get(id=event_id)
            template = NoteTemplate.objects.get(id=data['template_id'])
            
            note = EventNote.objects.create(
                event=event,
                template=template,
                note_data=data['note_data'],
                created_by_id=clinician_id
            )
            
            return {
                'id': note.id,
                'template_name': template.name,
                'note_data': note.note_data,
                'created_by': f"{note.created_by.first_name} {note.created_by.last_name}",
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except (Event.DoesNotExist, NoteTemplate.DoesNotExist) as e:
            return {'error': str(e)}
        except Exception as e:
            return {'error': f'Unexpected error: {str(e)}'} 

    @classmethod
    def get_event_services(cls, event: Event) -> str:
        """Get services associated with the event and return as JSON"""
        services = [
            {
                'name': service.service.description,
                'fee': service.fee
            }
            for service in EventService.objects.filter(event=event)
        ]
        
        return json.dumps(services)

    @classmethod
    def get_previous_appointment(cls, event: Event) -> Dict[str, str]:
        """Get previous appointment details for the same client"""
        previous_event = Event.objects.filter(
            patient=event.patient,
            start_datetime__lt=event.start_datetime
        ).order_by('-start_datetime').first()
        
        if previous_event:
            return {
                'start_date': previous_event.start_datetime,
                'end_date': previous_event.end_datetime,
                'status': previous_event.status.name,
                'is_previous': True
            }
        else:
            return {
                'is_previous': False
            }

    @classmethod
    def get_next_appointment(cls, event: Event) -> Dict[str, str]:
        """Get next appointment details for the same client"""
        next_event = Event.objects.filter(
            patient=event.patient,
            start_datetime__gt=event.start_datetime
        ).order_by('start_datetime').first()
        
        if next_event:
            return {
                'start_date': next_event.start_datetime,
                'end_date': next_event.end_datetime,
                'status': next_event.status.name,
                'is_next': True
            }
        else:
            return {
                'is_next': False
            } 

    @classmethod
    def get_appointments_left(cls, event: Event) -> int:
        """Get the number of appointments left for the event"""
        future_appointments_count = Event.objects.filter(
            clinician=event.clinician,
            patient=event.patient,
            start_datetime__gt=event.start_datetime,  
            type__name=EventType.APPOINTMENT  
        ).count()
        
        return future_appointments_count
        
