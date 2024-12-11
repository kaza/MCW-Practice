from typing import List, Dict, Any
from datetime import datetime, timedelta
from django.db.models import Q, Value, F, CharField
from django.db.models.functions import Concat
from django.conf import settings
from django.utils import timezone
from django.utils.timezone import make_aware
from zoneinfo import ZoneInfo
import pytz

from apps.clinician_dashboard.models import Clinician, Event, EventType, Patient, Location

class SchedulerDataService:
    """Service class to handle all scheduler related data operations"""
    
    TIMEZONE = ZoneInfo("America/New_York")  # EST timezone

    @classmethod
    def get_resources(cls) -> List[Dict[str, Any]]:
        """Get all resources (clinicians)"""
        return Clinician.objects.annotate(
            text=Concat(
                F('first_name'),
                Value(' '),
                F('last_name'),
                output_field=CharField()
            ),
            designation=F('field')  # Using the field attribute as designation
        ).values('id', 'text', 'color', 'designation')

    @classmethod
    def get_events(cls) -> List[Dict[str, Any]]:
        """Get all scheduled events"""
        events = Event.objects.select_related(
            'type', 
            'clinician', 
            'patient', 
            'location',
            'status'
        ).all()

        return [cls._convert_event_to_dict(event) for event in events]

    @classmethod
    def _convert_event_to_dict(cls, event: Event) -> Dict[str, Any]:
        """Convert event model to dictionary format"""
        event_dict = {
            'Id': event.id,
            'StartTime': event.start_datetime,
            'EndTime': event.end_datetime, 
            'IsAllDay': event.is_all_day,
            'ResourceId': event.clinician_id,
        }

        # Add type-specific fields
        if event.type.name == EventType.APPOINTMENT:
            event_dict.update({
                'Subject': f"Appointment - {event.patient.get_full_name() if event.patient else 'No Patient'}",
                'Description': f"Patient Appointment at {event.location.name if event.location else 'No Location'}",
                'Status': event.status.name if event.status else None,
                'Client': event.patient.id if event.patient else None,
                'Location': event.location.id if event.location else None,
            })
        elif event.type.name == EventType.EVENT:
            event_dict.update({
                'Subject': event.title,
                'Description': event.notes,
                'Location': event.location.name if event.location else None,
            })
        else:  # OUT_OF_OFFICE
            event_dict.update({
                'Subject': 'Out of Office',
                'Description': event.notes,
                'CancelAppointments': event.cancel_appointments,
                'NotifyClients': event.notify_clients,
            })

        return event_dict

    @classmethod
    def get_clients(cls) -> List[Dict[str, Any]]:
        """Get all clients (patients)"""
        return Patient.objects.annotate(
            name=Concat(
                F('first_name'),
                Value(' '),
                F('last_name'),
                output_field=CharField()
            )
        ).values('id', 'name', 'email', 'phone')

    @classmethod
    def get_locations(cls) -> List[Dict[str, Any]]:
        """Get all locations"""
        return Location.objects.values('id', 'name')

    @classmethod
    def search_clients(cls, query: str) -> List[Dict[str, Any]]:
        """Search clients by name or email"""
        return Patient.objects.annotate(
            name=Concat(
                F('first_name'),
                Value(' '),
                F('last_name'),
                output_field=CharField()
            )
        ).filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).values('id', 'name', 'email', 'phone')

    @classmethod
    def search_locations(cls, query: str) -> List[Dict[str, Any]]:
        """Search locations by name"""
        return Location.objects.filter(
            Q(name__icontains=query)
        ).values('id', 'name')

    @classmethod
    def create_event(cls, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new event"""
        event_type = event_data.get('eventType')

        event = Event.objects.create(
            type_id=EventType.objects.get(name=event_type).id,
            clinician_id=event_data['resourceId'],
            start_datetime=event_data['StartTime'],
            end_datetime=event_data['EndTime'],
            is_all_day=event_data.get('IsAllDay', False),
            title=event_data.get('Subject'),
            notes=event_data.get('Description'),
            location_id=event_data.get('location'),
            patient_id=event_data.get('Client'),
            status_id=1,
            cancel_appointments=event_data.get('CancelAppointments', False),
            notify_clients=event_data.get('NotifyClients', False),
            is_recurring=bool(event_data.get('RecurrenceRule')),
            recurrence_rule=event_data.get('RecurrenceRule')
        )

        return cls._convert_event_to_dict(event)

    @classmethod
    def update_event(cls, event_id: int, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing event"""
        event = Event.objects.get(id=event_id)
        
        # Convert datetime strings to timezone-aware datetime objects in EST
        start_datetime = datetime.fromisoformat(event_data['StartTime'].replace('Z', '+00:00'))
        end_datetime = datetime.fromisoformat(event_data['EndTime'].replace('Z', '+00:00'))
        
        # Make timezone-aware in EST
        start_datetime = make_aware(start_datetime.replace(tzinfo=None), timezone=cls.TIMEZONE)
        end_datetime = make_aware(end_datetime.replace(tzinfo=None), timezone=cls.TIMEZONE)

        # Update fields
        event.start_datetime = start_datetime
        event.end_datetime = end_datetime
        event.title = event_data.get('Subject', event.title)
        event.notes = event_data.get('Description', event.notes)
        
        if 'LocationId' in event_data:
            event.location_id = event_data['LocationId']
        if 'PatientId' in event_data:
            event.patient_id = event_data['PatientId']
        if 'StatusId' in event_data:
            event.status_id = event_data['StatusId']
        
        event.save()
        return cls._convert_event_to_dict(event)

    @classmethod
    def delete_event(cls, event_id: int) -> bool:
        """Delete an event"""
        Event.objects.filter(id=event_id).delete()
        return True