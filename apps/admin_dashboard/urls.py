from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('api/clients/search/', views.ClientSearchView.as_view(), name='client_search'),
    path('api/locations/search/', views.LocationSearchView.as_view(), name='location_search'),
]