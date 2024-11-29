# utils/menu_config.py

from django.urls import reverse

class MenuConfig:
    @staticmethod
    def get_admin_menu(request):
        return [

            {
                'name': 'Calendar',
                'url': reverse('admin_dashboard:home'),
                'icon': 'fa-calendar-alt',
                'is_active': request.path == reverse('admin_dashboard:home'),
            },
            {
                'name': 'Logout',
                'url': reverse('accounts:logout'),
                'icon': 'fa-sign-out-alt',
                'is_active': False,
            },

        ]

    @staticmethod
    def get_clinician_menu(request):
        return [
            
        ]

    @staticmethod
    def get_client_menu(request):
        return [
           
        ]

    @classmethod
    def get_menu_for_user(cls, request):
        user = request.user
        if not user.is_authenticated:
            return []
        
        if user.user_type == 'ADMIN':
            return cls.get_admin_menu(request)
        elif user.user_type == 'CLINICIAN':
            return cls.get_clinician_menu(request)
        elif user.user_type == 'CLIENT':
            return cls.get_client_menu(request)
        return []