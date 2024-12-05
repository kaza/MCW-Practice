from django.urls import path
from . import views

app_name = 'clinician_dashboard'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard')
]