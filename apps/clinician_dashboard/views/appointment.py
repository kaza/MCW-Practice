import json
from django.views import View
from django.http import JsonResponse
from apps.clinician_dashboard.models import Clinician
from apps.shared.services.scheduler_service import SchedulerDataService
from django.core.exceptions import ObjectDoesNotExist

class GetClientCliniciansView(View):
    def get(self, request, client_id):
        clinicians = SchedulerDataService.get_client_clinicians(client_id)
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
        
        # Add user type to the response
        user_type = request.user.user_type if request.user.is_authenticated else ''
        event_data['userType'] = user_type 
        
        return JsonResponse(event_data, safe=False)
            
class GetAppointmentStatesView(View):
    def get(self, request):
        appointment_states = SchedulerDataService.get_appointment_states()
        return JsonResponse(appointment_states, safe=False)
    
class GetClinicianLocationsView(View):
    def get(self, request, clinician_id):
        locations = SchedulerDataService.get_clinician_locations(clinician_id)
        return JsonResponse(locations, safe=False)
    
class GetEventsView(View):
    def post(self, request):
        data = json.loads(request.body)
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        location_ids = data.get('location_ids', [])
        login_id = request.user.id
        clinician = Clinician.objects.filter(login_id=login_id).values('id')
        clinician_ids = [clinician[0]['id']]

        events = SchedulerDataService.get_events(
            request.user.user_type, 
            getattr(request.user, 'id', None), 
            start_date, 
            end_date, 
            clinician_ids, 
            location_ids
        )
        return JsonResponse(events, safe=False)    