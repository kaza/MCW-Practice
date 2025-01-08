
import json
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.utils.decorators import method_decorator
from apps.shared.services.scheduler_service import SchedulerDataService
from django.views.decorators.csrf import csrf_exempt

class DashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'clinician_dashboard/dashboard.html'
    login_url = 'login'
    
    def test_func(self):
        return self.request.user.user_type == 'CLINICIAN'
    
    def handle_no_permission(self):     
        if not self.request.user.is_authenticated:
            return redirect(self.login_url)
        return redirect('login')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'clinicians': json.dumps(list(SchedulerDataService.get_resources(self.request.user.user_type, self.request.user))),
            'clients': json.dumps(list(SchedulerDataService.get_clients_by_clinician(self.request.user.id))),
            'locations': json.dumps(list(SchedulerDataService.get_locations())),
            'team_members': json.dumps(list(SchedulerDataService.get_team_members())),
            'is_clinician': True
        })
        return context
        
    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            clinician_id = request.user.id if request.user.user_type == 'CLINICIAN' else None
            return JsonResponse(
                SchedulerDataService.get_events(
                    request.user.user_type, 
                    clinician_id,
                    start_date,
                    end_date
            ), 
                safe=False
            )
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
            event_id = data.get('eventData').get('eventId')
            event_data = SchedulerDataService.update_event(event_id, data)
            response_data = {'status': 'success', 'event': event_data}
        elif action == 'remove':
            event_id = data.get('eventData').get('Id')
            edit_type = data.get('eventData').get('editType')
            SchedulerDataService.delete_event(event_id, edit_type)
            response_data = {'status': 'success', 'message': 'Event deleted'}

        return JsonResponse(response_data)
