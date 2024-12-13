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
            'RecurrenceRuleString': event.recurrence_rule if event.is_recurring else None,
            'IsRecurring': event.is_recurring,
    }
    
        # Add RecurrenceID if this is a child event
        if event.parent_event:
            event_dict['RecurrenceID'] = event.parent_event.id
            
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
        """Create a new event with recurrence handling"""
        event_type = event_data.get('eventType')
        recurrence_rule = event_data.get('RecurrenceRule')
        
        # Create the main event
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
            is_recurring=bool(recurrence_rule),
            recurrence_rule=recurrence_rule,
            parent_event=None 
        )

        if recurrence_rule:
            try:
                # Parse the recurrence rule components more safely
                rule_parts = recurrence_rule.split(';')
                rule_dict = {}
                
                # Safely parse each part into the dictionary
                for part in rule_parts:
                    if '=' in part:
                        key, value = part.split('=')
                        rule_dict[key.strip()] = value.strip()
                    else:
                            print(f"Invalid rule part: {part}")
                            continue
                
                # Convert start_datetime to datetime object
                dtstart = datetime.fromisoformat(event.start_datetime.replace('Z', '+00:00'))
                
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
        
                # Add count if specified
                if 'COUNT' in rule_dict:
                    rule_params['count'] = int(rule_dict['COUNT'])
                    
                # Add until if specified
                if 'UNTIL' in rule_dict:
                    rule_params['until'] = datetime.fromisoformat(rule_dict['UNTIL'].replace('Z', '+00:00'))
                    
                # Add weekdays if specified for weekly recurrence
                if 'BYDAY' in rule_dict:
                    weekday_map = {
                        'MO': rrule.MO,
                        'TU': rrule.TU,
                        'WE': rrule.WE,
                        'TH': rrule.TH,
                        'FR': rrule.FR,
                        'SA': rrule.SA,
                        'SU': rrule.SU
                    }
                    byweekday = [weekday_map[day] for day in rule_dict['BYDAY'].split(',')]
                    rule_params['byweekday'] = byweekday
        
                # Create the rule
                rule = rrule.rrule(**rule_params)
                
                # Calculate event duration
                event_duration = (
                    datetime.fromisoformat(event_data['EndTime'].replace('Z', '+00:00')) -
                    datetime.fromisoformat(event_data['StartTime'].replace('Z', '+00:00'))
                )
        
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

        return cls._convert_event_to_dict(event)
            
    @classmethod
    def update_event(cls, event_id: int, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing event and handle recurrence updates"""
        event = Event.objects.get(id=event_id)
        recurrence_rule = event_data.get('RecurrenceRule')
    
        # If this is a parent event
        if event.parent_event is None:
            # Delete existing child events if recurrence rule has changed
            if event.recurrence_rule != recurrence_rule:
                Event.objects.filter(parent_event=event).delete()
                
            # Update parent event
            event.start_datetime = event_data['StartTime']
            event.end_datetime = event_data['EndTime']
            event.is_all_day = event_data.get('IsAllDay', False)
            event.title = event_data.get('Subject', event.title)
            event.notes = event_data.get('Description', event.notes)
            event.location_id = event_data.get('location')
            event.patient_id = event_data.get('Client')
            event.cancel_appointments = event_data.get('CancelAppointments', False)
            event.notify_clients = event_data.get('NotifyClients', False)
            event.is_recurring = bool(recurrence_rule)
            event.recurrence_rule = recurrence_rule
            event.save()

            # Create new recurrence pattern if needed
            if recurrence_rule:
                try:
                    # Parse the recurrence rule
                    rule_parts = recurrence_rule.split(';')
                    rule_dict = {}
                    for part in rule_parts:
                        if '=' in part:
                            key, value = part.split('=')
                            rule_dict[key.strip()] = value.strip()

                     # Convert start_datetime to datetime object
                    dtstart = datetime.fromisoformat(event.start_datetime.replace('Z', '+00:00'))

                    
                    # Map frequency to rrule constant
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
                        rule_params['until'] = datetime.fromisoformat(
                            rule_dict['UNTIL'].replace('Z', '+00:00')
                        )
                    if 'BYDAY' in rule_dict:
                        weekday_map = {
                            'MO': rrule.MO, 'TU': rrule.TU, 'WE': rrule.WE,
                            'TH': rrule.TH, 'FR': rrule.FR, 'SA': rrule.SA, 'SU': rrule.SU
                        }
                        byweekday = [weekday_map[day] for day in rule_dict['BYDAY'].split(',')]
                        rule_params['byweekday'] = byweekday
                    
                    # Create rule and calculate duration
                    rule = rrule.rrule(**rule_params)
                    event_duration = (
                        datetime.fromisoformat(event_data['EndTime'].replace('Z', '+00:00')) -
                        datetime.fromisoformat(event_data['StartTime'].replace('Z', '+00:00'))
                    )
                    
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
        else:
            # This is a child event - only update this occurrence
            event.start_datetime = event_data['StartTime']
            event.end_datetime = event_data['EndTime']
            event.is_all_day = event_data.get('IsAllDay', False)
            event.title = event_data.get('Subject', event.title)
            event.notes = event_data.get('Description', event.notes)
            event.location_id = event_data.get('Location')
            event.patient_id = event_data.get('Client')
            event.cancel_appointments = event_data.get('CancelAppointments', False)
            event.notify_clients = event_data.get('NotifyClients', False)
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