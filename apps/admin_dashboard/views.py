from django.views import View
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from django.contrib.auth.decorators import login_required
from apps.shared.services.scheduler_service import SchedulerDataService

class DashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'admin_dashboard/dashboard.html'
    login_url = 'login'
    
    def test_func(self):
        return self.request.user.user_type == 'ADMIN'
    
    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            return redirect(self.login_url)
        return redirect('login')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        mock_data = {
            'mock_clinicians': json.dumps([
                {'id': 1, 'text': 'Dr. John Doe', 'color': '#FF0000', 'designation': 'Therapist'},
            {'id': 2, 'text': 'Dr. Jane Smith', 'color': '#00FF00', 'designation': 'Psychologist'}
        ]),
        'mock_clients': json.dumps([
            {'id': 1, 'name': 'Patient One', 'email': 'patient1@example.com', 'phone': '1234567890'},
            {'id': 2, 'name': 'Patient Two', 'email': 'patient2@example.com', 'phone': '0987654321'}
        ]),
        'mock_locations': json.dumps([
            {'id': 1, 'name': 'Room 101'},
            {'id': 2, 'name': 'Room 102'}
        ])
        }
        context.update(mock_data)
        return context
    
    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            mock_events = [
                {
                    'Id': 1,
                    'Subject': 'Test Appointment',
                    'StartTime': '2024-12-14T09:00:00',
                    'EndTime': '2024-12-14T10:00:00',
                    'ResourceId': 1,
                    'IsAllDay': False
                }
            ]
            return JsonResponse(mock_events, safe=False)
        return super().get(request, *args, **kwargs)

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        action = data.get('action')
        response_data = {}

        if action == 'create':
            event_data = SchedulerDataService.create_event(data)
            response_data = {'status': 'success', 'event': event_data}
        elif action == 'change':
            event_id = data.get('Id')
            event_data = SchedulerDataService.update_event(event_id, data)
            response_data = {'status': 'success', 'event': event_data}
        elif action == 'remove':
            event_id = data.get('Id')
            SchedulerDataService.delete_event(event_id)
            response_data = {'status': 'success', 'message': 'Event deleted'}

        return JsonResponse(response_data)

class ClientSearchView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) >= 2:
            clients = SchedulerDataService.search_clients(query)
            return JsonResponse(clients, safe=False)
        return JsonResponse([], safe=False)

class LocationSearchView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) >= 2:
            locations = SchedulerDataService.search_locations(query)
            return JsonResponse(locations, safe=False)
        return JsonResponse([], safe=False)