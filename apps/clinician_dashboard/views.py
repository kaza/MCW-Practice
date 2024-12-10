from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
import json

class DashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'clinician_dashboard/dashboard.html'
    login_url = 'login'
    
    def test_func(self):
        return self.request.user.user_type == 'CLINICIAN'
    
    def handle_no_permission(self):     
        if not self.request.user.is_authenticated:
            return redirect(self.login_url)
        return redirect('login')
    
    @staticmethod
    def get_mock_resources():
        """Returns mock resource data for the scheduler"""
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
            },
            {
                'id': 3,
                'text': 'Dr. Michael Brown',
                'color': '#5ed363',
                'designation': 'Pediatrician'
            }
        ]

    @staticmethod
    def get_mock_events():
        """Returns mock event data for the scheduler"""
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
            },
            {
                'Id': 2,
                'Subject': 'Medical Assessment',
                'StartTime': (today + timedelta(hours=11)).isoformat(),
                'EndTime': (today + timedelta(hours=12)).isoformat(),
                'Description': 'Initial assessment',
                'IsAllDay': False,
                'ResourceId': 2
            },
            {
                'Id': 3,
                'Subject': 'Follow-up Visit',
                'StartTime': (today + timedelta(hours=14)).isoformat(),
                'EndTime': (today + timedelta(hours=15)).isoformat(),
                'Description': 'Follow-up consultation',
                'IsAllDay': False,
                'ResourceId': 3
            }
        ]
    
    @staticmethod
    def get_mock_clients():
        """Returns mock client data"""
        return [
            {
                'id': 1,
                'name': 'Alice Parker',
                'email': 'alice.parker@email.com',
                'phone': '(555) 123-4567'
            },
            {
                'id': 2,
                'name': 'Bob Wilson',
                'email': 'bob.wilson@email.com',
                'phone': '(555) 234-5678'
            },
            {
                'id': 3,
                'name': 'Carol Martinez',
                'email': 'carol.m@email.com',
                'phone': '(555) 345-6789'
            }
        ]   

    @staticmethod
    def get_mock_locations():
        """Returns mock location data"""
        return [
            {
                'id': 1,        
                'name': 'Saint Petersburg McNulty Counseling and Wellness',
                'address': '123 Main St, Saint Petersburg, FL'
            },
            {
                'id': 2,
                'name': 'Tampa Branch Office',
                'address': '456 Bay Street, Tampa, FL'
            },
            {
                'id': 3,
                'name': 'Clearwater Medical Center',
                'address': '789 Beach Blvd, Clearwater, FL'
            }
        ]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['scheduler_resources'] = json.dumps(self.get_mock_resources())
        context['mock_clients'] = json.dumps(self.get_mock_clients())
        context['mock_locations'] = json.dumps(self.get_mock_locations())
        return context
        
    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse(self.get_mock_events(), safe=False)
        return super().get(request, *args, **kwargs)

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        action = data.get('action')
        
        return JsonResponse({
            'status': 'success',
            'message': f'Action {action} processed successfully',
            'data': data
        })