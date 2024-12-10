# services/scheduler_service.py
from typing import List, Dict, Any
from datetime import datetime, timedelta
from django.conf import settings

class SchedulerDataService:
    """Service class to handle all scheduler related data operations"""
    
    @classmethod
    def get_resources(cls) -> List[Dict[str, Any]]:
        """Get all resources (doctors/clinicians)"""
        if settings.DEBUG:
            return cls._get_mock_resources()
        
        # TODO: Replace this line with actual model query
        # return Resource.objects.all().values('id', 'text', 'color', 'designation')
        return cls._get_mock_resources()
    
    @classmethod
    def get_events(cls) -> List[Dict[str, Any]]:
        """Get all scheduled events"""
        if settings.DEBUG:
            return cls._get_mock_events()
            
        # TODO: Replace this line with actual model query
        # return Event.objects.all().values(
        #     'Id', 'Subject', 'StartTime', 'EndTime', 
        #     'Description', 'IsAllDay', 'ResourceId'
        # )
        return cls._get_mock_events()
    
    @classmethod
    def get_clients(cls) -> List[Dict[str, Any]]:
        """Get all clients"""
        if settings.DEBUG:
            return cls._get_mock_clients()
            
        # TODO: Replace this line with actual model query
        # return Client.objects.all().values('id', 'name', 'email', 'phone')
        return cls._get_mock_clients()
    
    @classmethod
    def get_locations(cls) -> List[Dict[str, Any]]:
        """Get all locations"""
        if settings.DEBUG:
            return cls._get_mock_locations()
            
        # TODO: Replace this line with actual model query
        # return Location.objects.all().values('id', 'name', 'address')
        return cls._get_mock_locations()

    # Mock data methods
    @staticmethod
    def _get_mock_resources():
        return [
            {
                'id': 1,
                'text': 'Dr. John Smith',
                'color': '#7499e1',
                'designation': 'Cardiologist'
            },
            {
                'id': 2,
                'text': 'Dr. Sarah Johnson',
                'color': '#e974c3',
                'designation': 'Neurologist'
            }
        ]

    @staticmethod
    def _get_mock_events():
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return [
            {
                'Id': 1,
                'Subject': 'Patient Consultation',
                'StartTime': (today + timedelta(hours=9)).isoformat(),
                'EndTime': (today + timedelta(hours=10)).isoformat(),
                'Description': 'Regular checkup',
                'IsAllDay': False,
                'ResourceId': 1
            }
        ]

    @staticmethod
    def _get_mock_clients():
        return [
            {
                'id': 1,
                'name': 'Alice Parker',
                'email': 'alice.parker@email.com',
                'phone': '(555) 123-4567'
            }
        ]

    @staticmethod
    def _get_mock_locations():
        return [
            {
                'id': 1,
                'name': 'Saint Petersburg McNulty Counseling and Wellness',
                'address': '123 Main St, Saint Petersburg, FL'
            }
        ]
    

    @classmethod
    def search_clients(cls, query: str) -> List[Dict[str, Any]]:
        """Search clients by name or email"""
        if settings.DEBUG:
            # Mock search in development
            mock_clients = cls._get_mock_clients()
            return [
                client for client in mock_clients 
                if query.lower() in client['name'].lower() or 
                   query.lower() in client['email'].lower()
            ]
            
        # TODO: Replace with actual model query
        # return Client.objects.filter(
        #     Q(name__icontains=query) | 
        #     Q(email__icontains=query)
        # ).values('id', 'name', 'email', 'phone')
        
    @classmethod
    def search_locations(cls, query: str) -> List[Dict[str, Any]]:
        """Search locations by name or address"""
        if settings.DEBUG:
            # Mock search in development
            mock_locations = cls._get_mock_locations()
            return [
                location for location in mock_locations
                if query.lower() in location['name'].lower() or
                   query.lower() in location['address'].lower()
            ]
            
        # TODO: Replace with actual model query
        # return Location.objects.filter(
        #     Q(name__icontains=query) |
        #     Q(address__icontains=query)
        # ).values('id', 'name', 'address')    

