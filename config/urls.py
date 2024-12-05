# config/urls.py
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('', include('apps.accounts.urls')), 
    path('admin-dashboard/', include('apps.admin_dashboard.urls', namespace='admin_dashboard')),
    path('clinician-dashboard/', include('apps.clinician_dashboard.urls', namespace='clinician_dashboard')),
    # path('client-dashboard/', include('apps.client_dashboard.urls', namespace='client_dashboard')),
]