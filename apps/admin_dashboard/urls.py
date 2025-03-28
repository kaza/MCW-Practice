from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('api/get_events/', views.GetEventsView.as_view(), name='get_events'),
    path('api/clients/search/', views.ClientSearchView.as_view(), name='client_search'),
    path('api/locations/search/', views.LocationSearchView.as_view(), name='location_search'),
    path('api/get_client_clinicians/<int:client_id>/', views.GetClientCliniciansView.as_view(), name='get_client_clinicians'),
    path('api/clinicians/search/', views.ClinicianSearchView.as_view(), name='clinician_search'),
    path('api/get_clinician_services/<int:clinician_id>/<int:patient_id>/', views.GetClinicianServicesView.as_view(), name='get_clinician_services'),
    path('api/get_clinician_locations/<int:clinician_id>/', views.GetClinicianLocationsView.as_view(), name='get_clinician_locations'),
    path('api/get_event_data/<int:event_id>/', views.GetEventDataView.as_view(), name='get_event_data'),
    path('api/get_appointment_states/', views.GetAppointmentStatesView.as_view(), name='get_appointment_states'),
    path('notes/<int:event_id>/', views.GetEventDetailsDataView.as_view(), name='get_event_details'),
    path('notes/<int:event_id>/api/notes/', views.GetEventNotesDataView.as_view(), name='get_event_notes'),
    path('notes/<int:event_id>/api/notes/save/', views.SaveEventNoteView.as_view(), name='save_event_note'),
    path('notes/<int:event_id>/api/psychotherapy/save/', views.SavePsychotherapyNoteView.as_view(), name='save_psychotherapy_note'),
    path('notes/<int:event_id>/api/notes/<int:template_id>/', views.GetNoteTemplateDataView.as_view(), name='get_note_template_data'),
]