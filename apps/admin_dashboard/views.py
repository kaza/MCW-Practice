from django.views.generic import TemplateView

class AdminDashboardView(TemplateView):
    template_name = 'admin_dashboard/dashboard.html'