from django.views import View
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .services.scheduler_service import SchedulerDataService
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

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'mock_clinicians': json.dumps(SchedulerDataService.get_resources()),
            'mock_clients': json.dumps(SchedulerDataService.get_clients()),
            'mock_locations': json.dumps(SchedulerDataService.get_locations())
        })
        return context
        
    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse(SchedulerDataService.get_events(), safe=False)
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

class ClientSearchView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) >= 2:
            # Using the service layer for consistency
            clients = SchedulerDataService.search_clients(query)
            return JsonResponse(clients, safe=False)
        return JsonResponse([], safe=False)

class LocationSearchView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) >= 2:
            # Using the service layer for consistency
            locations = SchedulerDataService.search_locations(query)
            return JsonResponse(locations, safe=False)
        return JsonResponse([], safe=False)