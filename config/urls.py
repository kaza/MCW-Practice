# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls')),
    path('admin-dashboard/', include('apps.admin_dashboard.urls')),
    # path('clinician-dashboard/', include('apps.clinician_dashboard.urls')),
    # path('client-dashboard/', include('apps.client_dashboard.urls')),
    # Redirect root URL to login
    path('', lambda request: redirect('accounts:login'), name='home'),
]