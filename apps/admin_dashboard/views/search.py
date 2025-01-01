

from django.http import JsonResponse
from django.views import View
from apps.shared.services.scheduler_service import SchedulerDataService


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

class ClinicianSearchView(View):
    def get(self, request):
        query = request.GET.get('q', '')
        clinicians = SchedulerDataService.search_clinicians(query)
        return JsonResponse(clinicians, safe=False)
  

