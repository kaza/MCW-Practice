from django.shortcuts import redirect
from django.urls import reverse

class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # URLs that don't require authentication
        public_urls = [reverse('accounts:login')]
        
        if not request.session.get('user_id') and request.path not in public_urls:
            return redirect('accounts:login')
            
        response = self.get_response(request)
        return response