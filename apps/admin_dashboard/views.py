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
        context.update({
            'clinicians': json.dumps(list(SchedulerDataService.get_resources(self.request.user.user_type, self.request.user))),
            'clients': json.dumps(list(SchedulerDataService.get_clients())),
            'locations': json.dumps(list(SchedulerDataService.get_locations()))
        })
        return context
        
    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            return JsonResponse(
                SchedulerDataService.get_events(
                    request.user.user_type,
                    getattr(request.user, 'id', None),
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