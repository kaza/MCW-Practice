from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home')
]