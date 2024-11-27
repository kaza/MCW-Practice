from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls')),
    # path('admin-dashboard/', include('apps.admin_dashboard.urls')),
    # path('clinician-dashboard/', include('apps.clinician_dashboard.urls')),
    # path('client-dashboard/', include('apps.client_dashboard.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 