from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from django.db.models import Q, Value, F, CharField
from django.db.models.functions import Concat
from django.conf import settings
from django.forms import BooleanField, ValidationError
from django.utils import timezone
from django.utils.timezone import make_aware
from zoneinfo import ZoneInfo
import pytz
from dateutil import rrule
from django.contrib.auth.models import User 
import threading
from django.db import transaction
from django.db.models import QuerySet
from django.db.models import F
from django.db.models.functions import ExtractYear, ExtractMonth, ExtractDay
from apps.clinician_dashboard.models import AppointmentState, CareTeam, Clinician, Event, EventService, EventType, Patient, Location, PracticeService, PatientDefaultService, ClinicianService, ClinicianLocation
from apps.accounts.models import Login  

class SchedulerDataService:
    """Service class to handle all scheduler related data operations"""
    
    TIMEZONE = ZoneInfo("America/New_York")  # EST timezone

    @classmethod
    def get_resources(cls, user_role: str, user: User) -> List[Dict[str, Any]]:
        """Get resources (clinicians) based on user role"""
        if user_role == 'ADMIN':
            return Clinician.objects.annotate(
                text=Concat(
                    F('first_name'),
                    Value(' '),
                    F('last_name'),
                    output_field=CharField()
                ),
                designation=F('field')
            ).values('id', 'text', 'color', 'designation')
        elif user_role == 'CLINICIAN':
            clinician_id = user.id 
            return Clinician.objects.filter(login_id=clinician_id).annotate(
                text=Concat(
                    F('first_name'),
                    Value(' '),
                    F('last_name'),
                    output_field=CharField()
                ),
                designation=F('field')
            ).values('id', 'text', 'color', 'designation')
        return []

    @classmethod
    def get_events(cls, user_role: str, clinician_id: int = None, start_date=None, end_date=None) -> List[Dict[str, Any]]:
        """Get scheduled events based on user role and date range"""
        # Set default dates if not provided
        today = timezone.now()
        if not start_date or not end_date:
            start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = (start_date + timedelta(days=32)).replace(day=1)
        else:
            try:
                start_date = start_date.replace(' ', '+')  
                end_date = end_date.replace(' ', '+')  
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (TypeError, ValueError):
                # Fallback to current month if dates are invalid
                start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = (start_date + timedelta(days=32)).replace(day=1)

        base_query = Event.objects.select_related(
            'type',
            'clinician',
            'patient',
            'location',
            'status'
        ).filter(
            start_datetime__gte=start_date,
            start_datetime__lt=end_date
        ).order_by('start_datetime')

        if user_role == 'ADMIN':
            events = base_query
        elif user_role == 'CLINICIAN' and clinician_id is not None:
            clinician = Clinician.objects.filter(login_id=clinician_id).first()
            if clinician:
                events = base_query.filter(clinician_id=clinician.id)
            else:
                return []
        else:
            return []

        return [cls._convert_event_to_dict(event) for event in events]
    
    @classmethod
    def get_event_data(cls, event_id: int) -> Dict[str, Any]:
        """Get event data for a specific event by event ID, including associated services and client information"""
        try:
            event = Event.objects.get(id=event_id)
            event_data = cls._convert_event_to_dict(event)

            # Fetch client information if the event is an appointment
            if event.type.name == EventType.APPOINTMENT and event.patient:
                event_data['Client'] = {
                    'id': event.patient.id,
                    'full_name': event.patient.get_full_name(),
                    'email': event.patient.email,
                    'phone': event.patient.phone,
                }
                # Fetch associated services
                event_services = EventService.objects.filter(event=event).values(
                    'service_id', 'fee', 'modifiers'
                )
                event_data['services'] = list(event_services)

                # Fetch appointment state
                if event.status:
                    event_data['Status'] = {
                        'id': event.status.id,
                        'name': event.status.name,
                    }

                # Fetch last 2 events for the same clinician and patient
                last_events = Event.objects.filter(
                clinician=event.clinician,
                patient=event.patient,
                start_datetime__lt=event.start_datetime 
                ).exclude(id=event_id).order_by('-start_datetime')[:2] 

                event_data['last_events'] = [
                    {
                        'id': event.id, 
                        'date': event.start_datetime.date().strftime('%m/%d/%Y')
                    } 
                    for event in last_events
                ]

            return event_data
        except Event.DoesNotExist:
            return {'error': 'Event not found'}
    
    @classmethod
    def _convert_event_to_dict(cls, event: Event) -> Dict[str, Any]:
        """Convert event model to dictionary format"""
        event_dict = {
            'Id': event.id,
            'StartTime': event.start_datetime.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'EndTime': event.end_datetime.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'IsAllDay': event.is_all_day,
            'ResourceId': event.clinician_id,
            'RecurrenceRuleString': event.recurrence_rule if event.is_recurring else None,
            'IsRecurring': event.is_recurring,
            'AppointmentTotal': event.appointment_total if event.type.name == EventType.APPOINTMENT else None,
            }
            
        # Add type-specific fields
        if event.type.name == EventType.APPOINTMENT:
            event_dict.update({
                'Type': event.type.name,
                'Subject': f"Appointment - {event.patient.get_full_name() if event.patient else 'No Patient'}",
                'Description': f"Patient Appointment at {event.location.name if event.location else 'No Location'}",
                'Status': event.status.name if event.status else None,
                'Client': event.patient.id if event.patient else None,
                'Location': event.location.id if event.location else None,
                'Clinician': event.clinician.id if event.clinician else None,
            })
        elif event.type.name == EventType.EVENT:
            event_dict.update({
                'Type': event.type.name,
                'Subject': event.title,
                'Description': event.notes,
                'Status': event.status.name if event.status else None,
                'Clinician': event.clinician.id if event.clinician else None,
                'Location': event.location.id if event.location else None,
            })
        else:  # OUT_OF_OFFICE
            event_dict.update({
                'Type': event.type.name,
                'Subject': 'Out of Office',
                'Description': event.notes,
                'Clinician': event.clinician.id if event.clinician else None,
                'IsCancelAppointment': event.cancel_appointments,
                'IsNotifyClient': event.notify_clients,
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
    def get_clients_by_clinician(cls, login_id: int) -> List[Dict[str, Any]]:
        """
        Get all clients (patients) by clinician using CareTeam relationship.
        
        Args:
            login_id (int): Clinician's login ID
            
        Returns:
            List[Dict[str, Any]]: List of patients with their details
        """
        # Retrieve clinician ID from login ID
        clinician = Clinician.objects.filter(login_id=login_id).first()
        if not clinician:
            return []

        # Get patients through CareTeam relationship
        return (Patient.objects
                .annotate(
                    name=Concat(
                        F('first_name'),
                        Value(' '),
                        F('last_name'),
                        output_field=CharField()
                    )
                )
                .filter(
                    careteam__clinician=clinician,
                    careteam__status='ACTIVE'
                )
                .values(
                    'id',
                    'name',
                    'email',
                    'phone'
                ))

    @classmethod
    def get_location_by_clinician_login_id(cls, login_id: int) -> List[Dict[str, Any]]:
        """Get all locations by clinician based on login ID"""
        #retrieve clinician ID from login ID
        clinician = Clinician.objects.filter(login_id=login_id).first()
        if not clinician:
            return []
        return cls.get_clinician_locations(clinician.id)
    
    @classmethod
    def get_locations(cls) -> List[Dict[str, Any]]:
        """Get all locations"""
        return Location.objects.values('id', 'name', 'type', 'color')

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
    def get_team_members(cls) -> List[Dict[str, Any]]:
        """Get all team members (clinicians)"""
        return Clinician.objects.annotate(
            name=Concat('first_name', Value(' '), 'last_name')
        ).values('id', 'name')


    @classmethod
    def search_locations(cls, query: str) -> List[Dict[str, Any]]:
        """Search locations by name"""
        return Location.objects.filter(
            Q(name__icontains=query)
        ).values('id', 'name', 'type', 'color')

    
    @classmethod
    def get_practice_services(cls) -> List[Dict[str, Any]]:
        """Get all practice services"""
        return PracticeService.objects.values('id', 'type', 'rate', 'code', 'description')
    

    @classmethod
    def get_client_clinicians(cls, patient_id: int) -> List[Dict[str, Any]]:
        """
        Get all clinicians for a client including:
        - Admin clinicians
        - Clinicians actively assigned to the patient through CareTeam
        
        Returns:
            List of dictionaries containing:
            - id: Clinician ID
            - name: Full name
        """
        # Get all clinicians with user type 'ADMIN'
        admin_clinicians = Clinician.objects.filter(
            login_id__in=Login.objects.filter(user_type='ADMIN').values('id')
        ).annotate(
            name=Concat('first_name', Value(' '), 'last_name')
        )

        # Get assigned clinicians with relationship details from CareTeam
        assigned_clinicians = Clinician.objects.filter(
            careteam__patient_id=patient_id
        ).annotate(
            name=Concat('first_name', Value(' '), 'last_name')
        )

        # Combine and return results
        combined_clinicians = admin_clinicians | assigned_clinicians

        return list(combined_clinicians.values(
            'id', 
            'name'
        ).distinct())
    
    @classmethod
    def search_clinicians(cls, patient_id: int, query: str) -> List[Dict[str, Any]]:
        """
        Search clinicians by name including:
        - Admin clinicians 
        - Active care team members for the patient
        
        Args:
            patient_id: ID of the patient
            query: Search string to filter clinicians by name
            
        Returns:
            List of dictionaries containing clinician id and full name
        """
        # Get all clinicians with user type 'ADMIN'
        admin_clinicians = Clinician.objects.filter(
            login_id__in=Login.objects.filter(user_type='ADMIN').values('id')
        )

        # Get clinicians from active care team
        care_team_clinicians = Clinician.objects.filter(
            careteam__patient_id=patient_id,
            careteam__status='ACTIVE'
        )

        # Combine both querysets and apply the search query
        combined_clinicians = admin_clinicians | care_team_clinicians

        return list(combined_clinicians.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query)
        ).annotate(
            name=Concat('first_name', Value(' '), 'last_name'),
        ).values(
            'id', 
            'name'
        ).distinct()) 
    
    @classmethod
    def get_clinician_services(cls, clinician_id: int, patient_id: int) -> Dict[str, Any]:
        """
        Get services for a clinician and patient's default services if assigned.
        
        Args:
            clinician_id: The ID of the clinician
            patient_id: The ID of the patient
            
        Returns:
            Dict containing either clinician_services or practice_services, 
            along with patient_default_services
        """
        # Check if clinician is in patient's active care team
        is_assigned = CareTeam.objects.filter(
            patient_id=patient_id,
            clinician_id=clinician_id,
            status='ACTIVE'
        ).exists()

        # Get patient default services
        patient_defaults = PatientDefaultService.objects.filter(
            patient_id=patient_id
        ).select_related('service').values(
            'service_id',
            'custom_rate',
            'is_primary',
            'service__id',
            'service__type',
            'service__rate',
            'service__code',
            'service__description',
            'service__duration'
        )

        # Process default services to match service structure
        processed_default_services = []
        for default in patient_defaults:
            processed_default_services.append({
                'id': default['service__id'],
                'type': default['service__type'],
                'rate': float(default['custom_rate'] if default['custom_rate'] is not None else default['service__rate']),
                'code': default['service__code'],
                'description': default['service__description'],
                'duration': default['service__duration'],
                'is_primary': default['is_primary']
            })

        if is_assigned:
            # Get clinician's active services
            clinician_services = ClinicianService.objects.filter(
                clinician_id=clinician_id,
                is_active=True
            ).select_related('service').values(
                'service__id',
                'service__type',
                'custom_rate',
                'service__code',
                'service__description',
                'service__duration',
                'service__rate'
            )

            # Process clinician services
            services_data = []
            for service in clinician_services:
                services_data.append({
                    'id': service['service__id'],
                    'type': service['service__type'],
                    'rate': float(service['custom_rate'] if service['custom_rate'] is not None else service['service__rate']),
                    'code': service['service__code'],
                    'description': service['service__description'],
                    'duration': service['service__duration']
                })

            return {
                'clinician_services': services_data,
                'patient_default_services': processed_default_services
            }
        else:
            # Get all practice services
            practice_services = PracticeService.objects.all().values(
                'id',
                'type',
                'rate',
                'code',
                'description',
                'duration'
            )

            # Process practice services
            services_data = []
            for service in practice_services:
                services_data.append({
                    'id': service['id'],
                    'type': service['type'],
                    'rate': float(service['rate']),
                    'code': service['code'],
                    'description': service['description'],
                    'duration': service['duration']
                })

            return {
                'practice_services': services_data,
                'patient_default_services': processed_default_services
            }
    
    @classmethod
    def get_clinician_locations(cls, clinician_id: int) -> List[Dict[str, Any]]:
        """
        Get all locations for a clinician
        
        Args:
            clinician_id: ID of the clinician
            
        Returns:
            List of dictionaries containing:
            - id: Location ID
            - name: Location name
            - type: Location type
            - color: Location color
        """
        return list(ClinicianLocation.objects.filter(
            clinician_id=clinician_id
        ).select_related('location').values(
            'location__id',
            'location__name', 
            'location__type',
            'location__color'
        ).annotate(
            id=F('location__id'),
            name=F('location__name'),
            type=F('location__type'),
            color=F('location__color')
        ).values('id', 'name', 'type', 'color'))

    @classmethod
    def get_appointment_states(cls) -> List[Dict[str, Any]]:
        """Get all appointment states"""
        return list(AppointmentState.objects.values('id', 'name'))
    
    @classmethod
    def create_event(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new event with recurrence handling"""
        event_type = data.get('eventData').get('eventType')
        recurrence_rule = data.get('eventData').get('RecurrenceRule')

        # Convert datetime strings to datetime objects if they're strings
        start_time = data.get('eventData').get('StartTime')
        end_time = data.get('eventData').get('EndTime')
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))

        # If it's a recurring event, get the first occurrence date
        if recurrence_rule and event_type != 'OUT_OF_OFFICE':
            try:
                recurring_dates = cls._get_future_dates_from_rule(start_time, recurrence_rule)
                if recurring_dates:
                    event_duration = end_time - start_time
                    start_time = recurring_dates[0]
                    end_time = start_time + event_duration
            except Exception as e:
                print(f"Error getting first occurrence date: {str(e)}")

        # Common event fields
        common_fields = {
            'type_id': EventType.objects.get(name=event_type).id,
            'start_datetime': start_time,
            'end_datetime': end_time,
            'is_all_day': data.get('eventData').get('IsAllDay', False),
            'status_id': 1,  # Default status
            'is_recurring': bool(recurrence_rule),
            'recurrence_rule': recurrence_rule,
            'parent_event': None
        }

        try:
            # Rest of your event creation code stays the same...
            if event_type == 'APPOINTMENT':
                event = Event.objects.create(
                    **common_fields,
                    appointment_total=data.get('eventData').get('AppointmentTotal'),
                    location_id=data.get('eventData').get('Location').get('id'),
                    patient_id=data.get('eventData').get('Client').get('id'),
                    clinician_id=data.get('eventData').get('Clinician').get('id'),
                    cancel_appointments=data.get('eventData').get('CancelAppointments', False),
                    notify_clients=data.get('eventData').get('NotifyClients', False)
                )

                # Create EventServices for each service
                for service in data.get('eventData').get('Services'):
                    EventService.objects.create(
                        event=event,
                        service_id=service.get('serviceId'),
                        fee=service.get('fee'),
                        modifiers=', '.join(service.get('modifiers'))
                    )

            elif event_type == 'EVENT':
                event = Event.objects.create(
                    **common_fields,
                    title=data.get('eventData').get('Subject'),
                    location_id=data.get('eventData').get('Location').get('id'),
                    clinician_id=data.get('eventData').get('TeamMember').get('id'),
                    cancel_appointments=data.get('eventData').get('CancelAppointments', False),
                    notify_clients=data.get('eventData').get('NotifyClients', False)
                )
            
            elif event_type == 'OUT_OF_OFFICE':
                # Out of office events don't support recurrence
                common_fields.update({
                    'is_recurring': False,
                    'recurrence_rule': None
                })
                event = Event.objects.create(
                    **common_fields,
                    clinician_id=data.get('eventData').get('TeamMember').get('id'),
                    cancel_appointments=data.get('eventData').get('CancelAppointments', False),
                    notify_clients=data.get('eventData').get('NotifyClients', False),
                )

            # Handle recurring events in background thread
            if recurrence_rule and event_type != 'OUT_OF_OFFICE':
                threading.Thread(
                    target=cls._handle_recurring_events,
                    args=(event, recurrence_rule, data.get('eventData')),
                    daemon=True
                ).start()

            return cls._convert_event_to_dict(event)

        except Exception as e:
            print(f"Error creating event: {str(e)}")
            raise    

    #region update events

    class UpdateType:
        SINGLE = 'single'
        SERIES = 'series'
        OCCURRENCE = 'occurrence'
        
        CHOICES = [
            (SINGLE, 'Single'),
            (SERIES, 'Series'),
            (OCCURRENCE, 'Occurrence')
        ]

    @classmethod
    def _parse_datetime(cls, dt_value: Union[str, datetime]) -> datetime:
        """Convert string datetime to datetime object if needed"""
        if isinstance(dt_value, str):
            return datetime.fromisoformat(dt_value.replace('Z', '+00:00'))
        return dt_value

    @classmethod
    def _get_common_fields(cls, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and validate common fields from event data"""
        try:
            return {
                'type_id': EventType.objects.get(name=event_data.get('eventType')).id,
                'start_datetime': cls._parse_datetime(event_data.get('StartTime')),
                'end_datetime': cls._parse_datetime(event_data.get('EndTime')),
                'is_all_day': event_data.get('IsAllDay', False),
                'location_id': event_data.get('Location', {}).get('id'),
                'cancel_appointments': event_data.get('IsCancelAppointment', False),
                'notify_clients': event_data.get('IsNotifyClient', False)
            }
        except EventType.DoesNotExist:
            raise ValidationError(f"Invalid event type: {event_data.get('eventType')}")
        except Exception as e:
            raise ValidationError(f"Error processing event data: {str(e)}")

    @classmethod
    def update_event_services(cls, event: 'Event', services: List[Dict[str, Any]]) -> None:
        """Update event services efficiently"""
        with transaction.atomic():
            current_services = set(EventService.objects.filter(event=event).values_list('service_id', flat=True))
            new_services = {service.get('serviceId') for service in services}
            
            # Delete services that are no longer needed
            services_to_delete = current_services - new_services
            if services_to_delete:
                EventService.objects.filter(event=event, service_id__in=services_to_delete).delete()
            
            # Update or create new services
            for service in services:
                EventService.objects.update_or_create(
                    event=event,
                    service_id=service.get('serviceId'),
                    defaults={
                        'fee': service.get('fee'),
                        'modifiers': ', '.join(service.get('modifiers', []))
                    }
                )

    @classmethod
    def _update_appointment_specific_fields(cls, event: 'Event', event_data: Dict[str, Any]) -> None:
        """Update appointment-specific fields"""
        event.appointment_total = event_data.get('AppointmentTotal')
        event.clinician_id = event_data.get('Clinician').get('id')
        event.status_id = event_data.get('StateId')
        if event_data.get('Services'):
            cls.update_event_services(event, event_data.get('Services'))
    
    @classmethod
    def _update_event_specific_fields(cls, event: 'Event', event_data: Dict[str, Any]) -> None:
        """Update event-specific fields"""
        event.title = event_data.get('Subject')
        event.clinician_id = event_data.get('TeamMember').get('id')

    @classmethod
    def _update_out_of_office_specific_fields(cls, event: 'Event', event_data: Dict[str, Any]) -> None:
        """Update out of office-specific fields"""
        event.clinician_id = event_data.get('TeamMember').get('id')
        event.cancel_appointments = event_data.get('CancelAppointments', False)
        event.notify_clients = event_data.get('NotifyClients', False)
       

    @classmethod
    def _update_base_event_fields(cls, event: 'Event', common_fields: Dict[str, Any], 
                                event_data: Dict[str, Any]) -> None:
        """Update base event fields with validation"""
        for field, value in common_fields.items():
            if value is not None:  # Only update non-None values
                setattr(event, field, value)
        
        if event_data.get('eventType') == 'APPOINTMENT':
            cls._update_appointment_specific_fields(event, event_data)
        if event_data.get('eventType') == 'EVENT':
            cls._update_event_specific_fields(event, event_data)
        if event_data.get('eventType') == 'OUT_OF_OFFICE':
            cls._update_out_of_office_specific_fields(event, event_data)

    @classmethod
    def _handle_series_update_timing(cls, events: QuerySet, time_diff: timedelta) -> None:
        """Update timing for a series of events"""
        for event in events:
            event.start_datetime -= time_diff
            event.end_datetime -= time_diff
            event.save(update_fields=['start_datetime', 'end_datetime'])

    @classmethod
    def _update_series_child(cls, event: 'Event', common_fields: Dict[str, Any], 
                           event_data: Dict[str, Any], recurrence_rule: str) -> None:
        """Handle series update for a child event"""
        with transaction.atomic():
            # Get future events
            future_events = Event.objects.filter(
                parent_event=event.parent_event,
                start_datetime__gt=event.start_datetime
            ).select_for_update().order_by('start_datetime')
            
            # Calculate time difference
            time_diff = event.start_datetime - common_fields['start_datetime']
            
            # Update current event as new parent
            event.parent_event = None
            event.is_recurring = True
            event.recurrence_rule = recurrence_rule
            cls._update_base_event_fields(event, common_fields, event_data)
            event.save()
            
            # Update future events
            for future_event in future_events.exclude(id=event.id):
                future_event.start_datetime -= time_diff
                future_event.end_datetime -= time_diff
                cls._update_base_event_fields(future_event, 
                    {k: v for k, v in common_fields.items() if k not in ['start_datetime', 'end_datetime']},
                    event_data
                )
                future_event.parent_event = event
                future_event.save()

    @classmethod
    def _update_series_parent(cls, event: 'Event', common_fields: Dict[str, Any], 
                            event_data: Dict[str, Any], recurrence_rule: str) -> None:
        """Handle series update for a parent event"""
        with transaction.atomic():
            # Get all series events
            series_events = Event.objects.filter(parent_event=event).select_for_update()
            time_diff = event.start_datetime - common_fields['start_datetime']
            
            # If recurrence rule has changed, handle the change
            if event.recurrence_rule != recurrence_rule:
                # Get all future dates based on new recurrence rule
                new_dates = cls._get_future_dates_from_rule(
                    common_fields['start_datetime'],
                    recurrence_rule
                )
                
                # Get all existing event dates
                existing_dates = set(
                    series_events.values_list('start_datetime', flat=True)
                )
                
                # Delete events that don't match new recurrence pattern
                events_to_delete = series_events.exclude(
                    start_datetime__in=new_dates
                )
                events_to_delete.delete()
                
                # Create new events for dates that don't exist
                event_duration = event.end_datetime - event.start_datetime
                for new_date in new_dates:
                    if new_date not in existing_dates:
                        new_event = Event.objects.create(
                            parent_event=event,
                            start_datetime=new_date,
                            end_datetime=new_date + event_duration,
                            is_recurring=True,
                            recurrence_rule=recurrence_rule,
                            **{k: getattr(event, k) for k in [
                                'type_id', 'clinician_id', 'is_all_day', 'title',
                                'notes', 'location_id', 'patient_id', 'status_id',
                                'cancel_appointments', 'notify_clients',
                                'appointment_total'
                            ]}
                        )
                        
                        # Copy services if it's an appointment
                        if event.type.name == 'APPOINTMENT' and event_data.get('Services'):
                            cls.update_event_services(new_event, event_data.get('Services'))
            
            # Update parent
            cls._update_base_event_fields(event, common_fields, event_data)
            event.is_recurring = bool(recurrence_rule)
            event.recurrence_rule = recurrence_rule
            event.save()
            
            # Update remaining series events
            remaining_series_events = Event.objects.filter(parent_event=event)
            for series_event in remaining_series_events:
                series_event.start_datetime -= time_diff
                series_event.end_datetime -= time_diff
                cls._update_base_event_fields(series_event, 
                    {k: v for k, v in common_fields.items() if k not in ['start_datetime', 'end_datetime']},
                    event_data
                )
                series_event.save()

    @classmethod
    def _get_future_dates_from_rule(cls, start_date: datetime, recurrence_rule: str) -> List[datetime]:
        """
        Get all future dates based on a recurrence rule
        
        Args:
            start_date: The start date for the recurrence
            recurrence_rule: The recurrence rule string (iCal format)
            
        Returns:
            List of datetime objects for all occurrences
        """
        try:
            # Parse the recurrence rule
            rule_parts = recurrence_rule.split(';')
            rule_dict = {}
            for part in rule_parts:
                if '=' in part:
                    key, value = part.split('=')
                    rule_dict[key.strip()] = value.strip()

            # Map frequency
            freq_map = {
                'DAILY': rrule.DAILY,
                'WEEKLY': rrule.WEEKLY,
                'MONTHLY': rrule.MONTHLY,
                'YEARLY': rrule.YEARLY
            }

            # Build rule parameters
            rule_params = {
                'dtstart': start_date,
                'freq': freq_map[rule_dict['FREQ']],
                'interval': int(rule_dict.get('INTERVAL', 1))
            }

            # Add count or until if present
            if 'COUNT' in rule_dict:
                rule_params['count'] = int(rule_dict['COUNT'])
            if 'UNTIL' in rule_dict:
                until_str = rule_dict['UNTIL']
                if 'T' in until_str:
                    until_str = until_str.replace('T', '').replace('Z', '')
                year = int(until_str[:4])
                month = int(until_str[4:6])
                day = int(until_str[6:8])
                hour = int(until_str[8:10]) if len(until_str) > 8 else 23
                minute = int(until_str[10:12]) if len(until_str) > 10 else 59
                second = int(until_str[12:14]) if len(until_str) > 12 else 59
                rule_params['until'] = datetime(year, month, day, hour, minute, second, tzinfo=start_date.tzinfo)

            # Handle weekly recurrence
            if rule_dict['FREQ'] == 'WEEKLY' and 'BYDAY' in rule_dict:
                weekday_map = {
                    'MO': rrule.MO, 'TU': rrule.TU, 'WE': rrule.WE,
                    'TH': rrule.TH, 'FR': rrule.FR, 'SA': rrule.SA, 'SU': rrule.SU
                }
                byweekday = [weekday_map[day] for day in rule_dict['BYDAY'].split(',')]
                rule_params['byweekday'] = byweekday

            # Handle monthly recurrence
            if rule_dict['FREQ'] == 'MONTHLY':
                if 'BYMONTHDAY' in rule_dict:
                    rule_params['bymonthday'] = int(rule_dict['BYMONTHDAY'])
                elif 'BYDAY' in rule_dict and 'BYSETPOS' in rule_dict:
                    weekday_map = {
                        'MO': rrule.MO, 'TU': rrule.TU, 'WE': rrule.WE,
                        'TH': rrule.TH, 'FR': rrule.FR, 'SA': rrule.SA, 'SU': rrule.SU
                    }
                    bysetpos = int(rule_dict['BYSETPOS'])
                    weekday = weekday_map[rule_dict['BYDAY']]
                    rule_params['byweekday'] = weekday(-1) if bysetpos == -1 else weekday(bysetpos)

            # Create the rule and get all dates
            rule = rrule.rrule(**rule_params)
            return list(rule)

        except Exception as e:
            print(f"Error parsing recurrence rule: {str(e)}")
            raise ValidationError(f"Invalid recurrence rule format: {str(e)}")

    @classmethod
    def _handle_occurrence_update(cls, event: 'Event', common_fields: Dict[str, Any], 
                                event_data: Dict[str, Any]) -> None:
        """Handle occurrence update for both parent and child events"""
        with transaction.atomic():
            if event.parent_event:
                # Handle child event
                event.parent_event = None
                event.is_recurring = False
                event.recurrence_rule = None
                cls._update_base_event_fields(event, common_fields, event_data)
                event.save()
            else:
                # Handle parent event
                next_event = Event.objects.filter(
                    parent_event=event,
                    start_datetime__gt=event.start_datetime
                ).select_for_update().order_by('start_datetime').first()
                
                if next_event:
                    # Setup new parent
                    next_event.parent_event = None
                    next_event.is_recurring = True
                    next_event.recurrence_rule = event.recurrence_rule
                    next_event.save()
                    
                    # Update remaining events
                    Event.objects.filter(
                        parent_event=event,
                        start_datetime__gt=next_event.start_datetime
                    ).update(parent_event=next_event)
                
                # Update current event
                event.is_recurring = False
                event.recurrence_rule = None
                cls._update_base_event_fields(event, common_fields, event_data)
                event.save()

    @classmethod
    def update_event(cls, event_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Main method to update an event with specific edit type handling"""
        try:
            with transaction.atomic():
                event = Event.objects.select_for_update().get(id=event_id)
                event_data = data.get('eventData', {})
                recurrence_rule = event_data.get('RecurrenceRule') or event.recurrence_rule
                edit_type = event_data.get('editType')
                
                if not edit_type or edit_type not in dict(cls.UpdateType.CHOICES):
                    raise ValidationError(f"Invalid edit type: {edit_type}")
                
                common_fields = cls._get_common_fields(event_data)
                
                if edit_type == cls.UpdateType.SERIES:
                    if event.parent_event:
                        cls._update_series_child(event, common_fields, event_data, recurrence_rule)
                    else:
                        cls._update_series_parent(event, common_fields, event_data, recurrence_rule)
                
                elif edit_type == cls.UpdateType.OCCURRENCE:
                    cls._handle_occurrence_update(event, common_fields, event_data)
                
                elif edit_type == cls.UpdateType.SINGLE:
                    cls._update_base_event_fields(event, common_fields, event_data)
                    event.save()
                
                return cls._convert_event_to_dict(event)

        except Event.DoesNotExist:
            raise ValidationError(f"Event with id {event_id} does not exist")
        except Exception as e:
            print(f"Error updating event: {str(e)}")
            raise

    #endregion update events

    #region delete events

    VALID_DELETE_TYPES = {'series', 'all', 'occurrence', 'single'}

    @classmethod
    def delete_event(cls, event_id: int, delete_type: str) -> None:
        """
        Delete an event and its related data based on the specified delete type.
        
        Args:
            event_id: The ID of the event to delete
            delete_type: Type of deletion ('series', 'all', 'occurrence', 'single')
            
        Raises:
            EventDeletionError: If event doesn't exist or deletion fails
            ValueError: If delete_type is invalid
        """
        if delete_type not in cls.VALID_DELETE_TYPES:
            raise ValueError(f"Invalid delete type: {delete_type}. Must be one of {cls.VALID_DELETE_TYPES}")

        try:
            with transaction.atomic():
                event = cls._get_event(event_id)
                
                if delete_type in ('occurrence', 'single'):
                    cls._delete_single_event(event)
                elif delete_type == 'series':
                    cls._delete_series(event)
                else:  # delete_type == 'all'
                    cls._delete_all(event)
                    
        except Event.DoesNotExist:
            raise ValueError(f"Event with id {event_id} does not exist")
        except Exception as e:
            print(f"Failed to delete event {event_id}: {str(e)}")
            raise ValueError(f"Failed to delete event: {str(e)}")

    @staticmethod
    def _get_event(event_id: int) -> Event:
        """Retrieve event by ID"""
        return Event.objects.get(id=event_id)

    @staticmethod
    def _delete_event_and_services(event: Event) -> None:
        """
        Delete a single event and its associated services if it's an appointment.
        
        Args:
            event: Event instance to delete
        """
        if event.type_id == EventType.objects.get(name=EventType.APPOINTMENT).id:
            EventService.objects.filter(event=event).delete()
        event.delete()

    @classmethod
    def _delete_events_and_services(cls, events: QuerySet) -> None:
        """
        Delete multiple events and their associated services based on event type.
        
        Args:
            events: QuerySet of events to delete
        """
        if not events.exists():
            return
            
        event_ids = list(events.values_list('id', flat=True))
        
        # Get the ID of the APPOINTMENT type
        appointment_type_id = EventType.objects.get(name=EventType.APPOINTMENT).id
        
        # Get unique event type IDs in a single query
        event_type_ids = set(events.values_list('type_id', flat=True).distinct())
        
        # If all events are appointments, delete their services
        if event_type_ids == {appointment_type_id}:
            EventService.objects.filter(event__in=event_ids).delete()
        # If mixed event types, only delete services for appointment events
        elif appointment_type_id in event_type_ids:
            appointment_ids = events.filter(type_id=appointment_type_id).values_list('id', flat=True)
            EventService.objects.filter(event__in=appointment_ids).delete()
        
        events.delete()
    @classmethod
    def _delete_single_event(cls, event: Event) -> None:
        """Delete a single event and its services, handling parent events appropriately"""
        if event.parent_event is None:
            # This is a parent event
            next_event = Event.objects.filter(
                parent_event=event,
                start_datetime__gt=event.start_datetime
            ).order_by('start_datetime').first()

            if next_event:
                # Make the next event the new parent
                next_event.parent_event = None
                next_event.save()

                # Update remaining events to point to the new parent
                Event.objects.filter(
                    parent_event=event,
                    start_datetime__gt=next_event.start_datetime
                ).update(parent_event=next_event)

            # Delete the current parent event's services and the parent itself
            cls._delete_event_and_services(event)
        else:
            # This is a child event - simply delete it
            cls._delete_event_and_services(event)

    @classmethod
    def _delete_series(cls, event: Event) -> None:
        """Delete current event and all future events in the series"""
        parent_event = event.parent_event or event
        
        # Delete future events
        future_events = Event.objects.filter(
            parent_event=parent_event,
            start_datetime__gt=event.start_datetime
        )
        cls._delete_events_and_services(future_events)
        
        # Delete the current event
        cls._delete_event_and_services(event)

    @classmethod
    def _delete_all(cls, event: Event) -> None:
        """Delete all events in the series including the parent"""
        if event.parent_event:
            parent_event = event.parent_event
            # Delete all child events
            child_events = Event.objects.filter(parent_event=parent_event)
            cls._delete_events_and_services(child_events)
            # Delete the parent
            cls._delete_event_and_services(parent_event)
        else:
            # Delete all child events
            child_events = Event.objects.filter(parent_event=event)
            cls._delete_events_and_services(child_events)
            # Delete the parent event
            cls._delete_event_and_services(event)

    #endregion delete events
    
    @classmethod
    def _handle_recurring_events(cls, event: Event, recurrence_rule: str, event_data: Dict[str, Any]):
        """Handle the creation of recurring events in a background thread"""
        try:
            # Parse the recurrence rule components
            rule_parts = recurrence_rule.split(';')
            rule_dict = {}
            for part in rule_parts:
                if '=' in part:
                    key, value = part.split('=')
                    rule_dict[key.strip()] = value.strip()

            # Convert start_datetime to datetime object
            dtstart = event.start_datetime

            # Map frequency string to rrule constant
            freq_map = {
                'DAILY': rrule.DAILY,
                'WEEKLY': rrule.WEEKLY,
                'MONTHLY': rrule.MONTHLY,
                'YEARLY': rrule.YEARLY
            }

            # Build rule parameters
            rule_params = {
                'dtstart': dtstart,
                'freq': freq_map[rule_dict['FREQ']],
                'interval': int(rule_dict.get('INTERVAL', 1))
            }

            # Add optional parameters
            if 'COUNT' in rule_dict:
                rule_params['count'] = int(rule_dict['COUNT'])
            if 'UNTIL' in rule_dict:
                # Parse UNTIL date from YYYYMMDD'T'HHMMSS'Z' format
                until_str = rule_dict['UNTIL']
                if 'T' in until_str:
                    until_str = until_str.replace('T', '').replace('Z', '')
                year = int(until_str[:4])
                month = int(until_str[4:6])
                day = int(until_str[6:8])
                hour = int(until_str[8:10]) if len(until_str) > 8 else 23
                minute = int(until_str[10:12]) if len(until_str) > 10 else 59
                second = int(until_str[12:14]) if len(until_str) > 12 else 59
                rule_params['until'] = datetime(year, month, day, hour, minute, second, tzinfo=dtstart.tzinfo)

            # Handle weekly recurrence
            if rule_dict['FREQ'] == 'WEEKLY' and 'BYDAY' in rule_dict:
                weekday_map = {
                    'MO': rrule.MO, 'TU': rrule.TU, 'WE': rrule.WE,
                    'TH': rrule.TH, 'FR': rrule.FR, 'SA': rrule.SA, 'SU': rrule.SU
                }
                byweekday = [weekday_map[day] for day in rule_dict['BYDAY'].split(',')]
                rule_params['byweekday'] = byweekday

            # Handle monthly recurrence
            if rule_dict['FREQ'] == 'MONTHLY':
                # Case 1: Specific day of month (BYMONTHDAY)
                if 'BYMONTHDAY' in rule_dict:
                    rule_params['bymonthday'] = int(rule_dict['BYMONTHDAY'])
                
                # Case 2: Nth weekday of month (BYDAY + BYSETPOS)
                elif 'BYDAY' in rule_dict and 'BYSETPOS' in rule_dict:
                    weekday_map = {
                        'MO': rrule.MO, 'TU': rrule.TU, 'WE': rrule.WE,
                        'TH': rrule.TH, 'FR': rrule.FR, 'SA': rrule.SA, 'SU': rrule.SU
                    }
                    bysetpos = int(rule_dict['BYSETPOS'])
                    weekday = weekday_map[rule_dict['BYDAY']]
                    
                    # Handle last weekday of month (BYSETPOS = -1)
                    if bysetpos == -1:
                        rule_params['byweekday'] = weekday(-1)
                    else:
                        rule_params['byweekday'] = weekday(bysetpos)

            # Create the rule
            rule = rrule.rrule(**rule_params)

            # Calculate event duration
            event_duration = event.end_datetime - event.start_datetime

            # Create occurrences
            for occurrence_start in rule:
                if occurrence_start != dtstart:
                    occurrence_end = occurrence_start + event_duration
                    new_event = Event.objects.create(
                        type_id=event.type_id,
                        clinician_id=event.clinician_id,
                        start_datetime=occurrence_start,
                        end_datetime=occurrence_end,
                        is_all_day=event.is_all_day,
                        title=event.title,
                        notes=event.notes,
                        location_id=event.location_id,
                        patient_id=event.patient_id,
                        status_id=event.status_id,
                        cancel_appointments=event.cancel_appointments,
                        notify_clients=event.notify_clients,
                        is_recurring=True,
                        recurrence_rule=event.recurrence_rule,  
                        parent_event=event,
                        occurrence_date=occurrence_start.date(),
                        appointment_total=event.appointment_total
                    )
                    # Set the services for the newly created event
                    if(event_data.get('eventType') == 'APPOINTMENT'):
                        for service in event_data.get('Services'):
                            EventService.objects.create(
                            event=new_event,
                            service_id=service.get('serviceId'),
                            fee=service.get('fee'),
                            modifiers=', '.join(service.get('modifiers')))
                    
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise ValueError(f"Invalid recurrence rule format: {str(e)}")