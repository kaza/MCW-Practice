from typing import List, Dict, Any
from datetime import datetime, timedelta
from django.db.models import Q, Value, F, CharField
from django.db.models.functions import Concat
from django.conf import settings
from django.utils import timezone
from django.utils.timezone import make_aware
from zoneinfo import ZoneInfo
import pytz
from dateutil import rrule
from django.contrib.auth.models import User 
import threading

from apps.clinician_dashboard.models import Clinician, Event, EventType, Patient, Location

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
    def _convert_event_to_dict(cls, event: Event) -> Dict[str, Any]:
        """Convert event model to dictionary format"""
        event_dict = {
            'Id': event.id,
            'StartTime': event.start_datetime,
            'EndTime': event.end_datetime, 
            'IsAllDay': event.is_all_day,
            'ResourceId': event.clinician_id,
            'RecurrenceRuleString': event.recurrence_rule if event.is_recurring else None,
            'IsRecurring': event.is_recurring,
            }
    
        # Add RecurrenceID if this is a child event
        if event.parent_event:
            event_dict['RecurrenceID'] = event.parent_event.id
            
        # Add type-specific fields
        if event.type.name == EventType.APPOINTMENT:
            event_dict.update({
                'Type': event.type.name,
                'Subject': f"Appointment - {event.patient.get_full_name() if event.patient else 'No Patient'}",
                'Description': f"Patient Appointment at {event.location.name if event.location else 'No Location'}",
                'Status': event.status.name if event.status else None,
                'Client': event.patient.id if event.patient else None,
                'Location': event.location.id if event.location else None,
            })
        elif event.type.name == EventType.EVENT:
            event_dict.update({
                'Type': event.type.name,
                'Subject': event.title,
                'Description': event.notes,
                'Status': event.status.name if event.status else None,
                'TeamMember': event.team_member.id if event.team_member else None,
                'Location': event.location.id if event.location else None,
            })
        else:  # OUT_OF_OFFICE
            event_dict.update({
                'Type': event.type.name,
                'Subject': 'Out of Office',
                'Description': event.notes,
                'TeamMember': event.team_member.id if event.team_member else None,
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
        ).values('id', 'name')

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
            
        # Common event fields
        common_fields = {
            'type_id': EventType.objects.get(name=event_type).id,
            'clinician_id': data.get('resourceId'),
            'start_datetime': start_time,
            'end_datetime': end_time,
            'is_all_day': data.get('eventData').get('IsAllDay', False),
            'status_id': 1,  # Default status
            'is_recurring': bool(recurrence_rule),
            'recurrence_rule': recurrence_rule,
            'parent_event': None
        }
        
        try:
            # Create the main event based on type
            if event_type == 'APPOINTMENT':
                event = Event.objects.create(
                    **common_fields,
                    location_id=data.get('eventData').get('Location').get('id'),
                    patient_id=data.get('eventData').get('Client').get('id'),
                    cancel_appointments=data.get('eventData').get('IsCancelAppointment', False),
                    notify_clients=data.get('eventData').get('IsNotifyClient', False)
                )
            
            elif event_type == 'EVENT':
                event = Event.objects.create(
                    **common_fields,
                    title=data.get('eventData').get('Subject'),
                    location_id=data.get('eventData').get('Location').get('id'),
                    team_member_id=data.get('eventData').get('TeamMember').get('id'),
                    cancel_appointments=data.get('eventData').get('IsCancelAppointment', False),
                    notify_clients=data.get('eventData').get('IsNotifyClient', False)
                )
            
            elif event_type == 'OutOfOffice':
                event = Event.objects.create(
                    **common_fields,
                    team_member_id=data.get('eventData').get('TeamMember').get('id'),
                    cancel_appointments=data.get('eventData').get('IsCancelAppointment', False),
                    notify_clients=data.get('eventData').get('IsNotifyClient', False),
                    is_recurring=False,  # Out of office events don't support recurrence
                    recurrence_rule=None
                )
            else:
                raise ValueError(f"Invalid event type: {event_type}")

            # Handle recurring events in background thread
            if recurrence_rule and event_type != 'OUT_OF_OFFICE':
                threading.Thread(
                    target=cls._handle_recurring_events,
                    args=(event, recurrence_rule, data.get('eventData')),
                    daemon=True  # Make thread daemon so it doesn't block server shutdown
                ).start()

            return cls._convert_event_to_dict(event)
            
        except Exception as e:
            # Log the error and re-raise
            print(f"Error creating event: {str(e)}")
            raise

    @classmethod
    def update_event(cls, event_id: int, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing event and handle recurrence updates"""
        event = Event.objects.get(id=event_id)
        event_type = event_data.get('eventType')
        recurrence_rule = event_data.get('RecurrenceRule')
        edit_type = event_data.get('editType')  # Get the edit type from event_data

        # Check if the event is a parent event
        is_parent_event = event.parent_event is None

        if edit_type == 'series' or is_parent_event:
            # If this is a series update or the event is a parent, delete existing child events first
            Event.objects.filter(parent_event=event).delete()

            # Update parent event
            event.type_id=EventType.objects.get(name=event_type).id
            event.start_datetime = event_data['StartTime']
            event.end_datetime = event_data['EndTime']
            event.is_all_day = event_data.get('IsAllDay', False)
            event.location_id = event_data.get('Location')
            event.cancel_appointments=event_data.get('IsCancelAppointment', False)
            event.notify_clients=event_data.get('IsNotifyClient', False)
            event.is_recurring = bool(recurrence_rule)
            event.recurrence_rule = recurrence_rule

            # Update specific fields based on event type
            event_type = event_data.get('eventType')
            if event_type == 'APPOINTMENT':
                event.patient_id = event_data.get('Client')  
                event.team_member_id = None
                event.title = None
            elif event_type == 'EVENT':
                event.title = event_data.get('Subject', event.title)  
                event.team_member_id = event_data.get('TeamMember') 
                event.patient_id = None
            elif event_type == 'OUT_OF_OFFICE':
                event.team_member_id = event_data.get('TeamMember') 
                event.patient_id = None
                event.title = None
                event.notify_clients = event_data.get('IsNotifyClient', False)
                event.cancel_appointments = event_data.get('IsCancelAppointment', False)
                event.is_recurring = False
                event.recurrence_rule = None
                recurrence_rule = None

            print(f"Updating event: {event.id}, Patient ID: {event.patient_id}, Team Member ID: {event.team_member_id}, Location ID: {event.location_id}")

            event.save()

            # Start a background thread to handle recurrence
            if recurrence_rule:
                threading.Thread(target=cls._handle_recurring_events, args=(event, recurrence_rule, event_data)).start()

        elif edit_type == 'occurrence':
            # This is a child event - only update this occurrence
            event.type_id=EventType.objects.get(name=event_type).id
            event.start_datetime = event_data['StartTime']
            event.end_datetime = event_data['EndTime']
            event.is_all_day = event_data.get('IsAllDay', False)
            event.location_id = event_data.get('Location')

            # Update specific fields based on event type
            event_type = event_data.get('eventType')
            if event_type == 'APPOINTMENT':
                event.patient_id = event_data.get('Client') 
                event.team_member_id = None
                event.title = None
            elif event_type == 'EVENT':
                event.title = event_data.get('Subject', event.title) 
                event.team_member_id = event_data.get('TeamMember') 
                event.patient_id = None
            elif event_type == 'OUT_OF_OFFICE':
                event.team_member_id = event_data.get('TeamMember') 
                event.patient_id = None
                event.title = None
                event.is_recurring = False
                event.recurrence_rule = None

            event.cancel_appointments=event_data.get('IsCancelAppointment', False)
            event.notify_clients=event_data.get('IsNotifyClient', False)
            event.save()

        return cls._convert_event_to_dict(event)
   
    @classmethod
    def delete_event(cls, event_id: int) -> bool:
        """Delete an event and its recurrences if it's a parent event"""
        try:
            event = Event.objects.get(id=event_id)
        
            # If this is a parent event, delete all related events
            if event.parent_event is None:
                Event.objects.filter(
                    Q(id=event_id) |  # parent event
                    Q(parent_event_id=event_id)  # child events
                ).delete()
            else:
                # If this is a child event, only delete this occurrence
                event.delete()
                
                return True
        
        except Event.DoesNotExist:
            return False

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

            if 'BYDAY' in rule_dict:
                weekday_map = {
                    'MO': rrule.MO, 'TU': rrule.TU, 'WE': rrule.WE,
                    'TH': rrule.TH, 'FR': rrule.FR, 'SA': rrule.SA, 'SU': rrule.SU
                }
                byweekday = [weekday_map[day] for day in rule_dict['BYDAY'].split(',')]
                rule_params['byweekday'] = byweekday

            # Create the rule
            rule = rrule.rrule(**rule_params)

            # Calculate event duration
            event_duration = event.end_datetime - event.start_datetime

            # Create occurrences
            for occurrence_start in rule:
                if occurrence_start != dtstart:
                    occurrence_end = occurrence_start + event_duration
                    Event.objects.create(
                        type_id=event.type_id,
                        clinician_id=event.clinician_id,
                        start_datetime=occurrence_start,
                        end_datetime=occurrence_end,
                        is_all_day=event.is_all_day,
                        title=event.title,
                        notes=event.notes,
                        location_id=event.location_id,
                        patient_id=event.patient_id,
                        team_member_id=event.team_member_id,
                        status_id=event.status_id,
                        cancel_appointments=event.cancel_appointments,
                        notify_clients=event.notify_clients,
                        is_recurring=True,
                        recurrence_rule=None,  
                        parent_event=event,
                        occurrence_date=occurrence_start.date()
                    )
                    
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise ValueError(f"Invalid recurrence rule format: {str(e)}")