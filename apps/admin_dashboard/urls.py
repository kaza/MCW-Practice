from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('api/clients/search/', views.ClientSearchView.as_view(), name='client_search'),
    path('api/locations/search/', views.LocationSearchView.as_view(), name='location_search'),
    path('api/get_client_clinicians/<int:client_id>/', views.GetClientCliniciansView.as_view(), name='get_client_clinicians'),
    path('api/clinicians/search/', views.ClinicianSearchView.as_view(), name='clinician_search'),
    path('api/get_clinician_services/<int:clinician_id>/<int:patient_id>/', views.GetClinicianServicesView.as_view(), name='get_clinician_services'),
]