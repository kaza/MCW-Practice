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
from django.core.exceptions import ObjectDoesNotExist

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
            'locations': json.dumps(list(SchedulerDataService.get_locations())),
            'team_members': json.dumps(list(SchedulerDataService.get_team_members()))
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
            event_id = data.get('eventData').get('eventId')
            event_data = SchedulerDataService.update_event(event_id, data)
            response_data = {'status': 'success', 'event': event_data}
        elif action == 'remove':
            event_id = data.get('eventData').get('Id')
            edit_type = data.get('eventData').get('editType')
            SchedulerDataService.delete_event(event_id, edit_type)
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

class GetClientCliniciansView(View):
    def get(self, request, client_id):
        clinicians = SchedulerDataService.get_client_clinicians(client_id)
        return JsonResponse(clinicians, safe=False)
    
class ClinicianSearchView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        clinicians = SchedulerDataService.search_clinicians(query)
        return JsonResponse(clinicians, safe=False)
    

class GetClinicianServicesView(View):
    def get(self, request, clinician_id: int, patient_id: int) -> JsonResponse:
        """
        Get services for a clinician and patient with error handling
        
        Args:
            request: HTTP request object
            clinician_id: ID of the clinician
            patient_id: ID of the patient
            
        Returns:
            JsonResponse containing services data or error message
        """
        try:
            # Validate input parameters
            if not isinstance(clinician_id, int) or not isinstance(patient_id, int):
                return JsonResponse({
                    'error': 'Invalid clinician_id or patient_id format'
                }, status=400)

            if clinician_id <= 0 or patient_id <= 0:
                return JsonResponse({
                    'error': 'clinician_id and patient_id must be positive integers'
                }, status=400)

            # Get services data
            services = SchedulerDataService.get_clinician_services(
                clinician_id=clinician_id,
                patient_id=patient_id
            )

            return JsonResponse({
                'status': 'success',
                'data': services
            })

        except ObjectDoesNotExist as e:
            return JsonResponse({
                'error': 'Requested resource not found',
                'detail': str(e)
            }, status=404)
            
        except ValueError as e:
            return JsonResponse({
                'error': 'Invalid input parameters',
                'detail': str(e)
            }, status=400)
            
        except Exception as e:
            # Log the error here using your logging system
            return JsonResponse({
                'error': 'An unexpected error occurred',
                'detail': str(e)
            }, status=500)
        
class GetEventDataView(View):
    def get(self, request, event_id):
        event_data = SchedulerDataService.get_event_data(event_id)
        return JsonResponse(event_data, safe=False)
            
class GetAppointmentStatesView(View):
    def get(self, request):
        appointment_states = SchedulerDataService.get_appointment_states()
        return JsonResponse(appointment_states, safe=False)
