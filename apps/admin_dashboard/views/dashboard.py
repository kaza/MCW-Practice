import json
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.utils.decorators import method_decorator
from apps.shared.services.scheduler_service import SchedulerDataService
from django.views.decorators.csrf import csrf_exempt

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
        clinicians = SchedulerDataService.get_resources(self.request.user.user_type, self.request.user)
        locations = SchedulerDataService.get_locations()
        context.update({
            'clinicians': json.dumps(list(clinicians)),
            'clients': json.dumps(list(SchedulerDataService.get_clients())),
            'locations': json.dumps(list(locations)),
            'team_members': json.dumps(list(SchedulerDataService.get_team_members())),
            'clinician_header': {
                'title': 'All team members',
                'icon': None
            },
            'clinician_groups': [
                {
                    'name': 'CLINICIANS',
                     'items': [
                      {'id': c['id'], 'name': c['text'], 'selected': True}
                        for c in clinicians
                    ]
                }
            ],
            'clinician_all_selected': True,
            'location_header': {
                'title': 'All locations',
                'icon': None
            },
            'location_groups': [
                {
                    'name': 'LOCATIONS',
                    'items': [
                        {
                            'id': l['id'],
                            'name': l['name'],
                            'color': l['color'],
                            'icon': (
                                f'''<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                                    <path fill="{l['color']}" d="M7.26 15.62C5.627 13.616 2 8.753 2 6.02a6 6 0 1112 0c0 2.732-3.656 7.595-5.26 9.6a.944.944 0 01-1.48 0zM8 8.02c1.103 0 2-.896 2-2 0-1.102-.897-2-2-2s-2 .898-2 2c0 1.104.897 2 2 2z"></path>
                                </svg>'''
                                if l['type'] == 'Onsite'
                                else f'''<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                                <rect x="1" y="4" width="10" height="8" rx="1" fill="#4CAF50"/>
                                <path d="M11 7L15 4V12L11 9V7Z" fill="#4CAF50"/>
                                </svg>'''
                            ),
                            'selected': True
                        }
                        for l in locations
                    ]
                }
            ],
            'location_all_selected': True,
            'is_clinician': False
        })
        return context
        
    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            clinician_ids = request.GET.get('clinician_ids')
            location_ids = request.GET.get('location_ids')
            return JsonResponse(
                SchedulerDataService.get_events(
                    request.user.user_type,
                    getattr(request.user, 'id', None),
                    start_date,
                    end_date,
                    clinician_ids,
                    location_ids
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
