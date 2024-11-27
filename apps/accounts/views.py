from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django.views import View
from django.utils import timezone
from django.contrib import messages

class LoginView(View):
    template_name = 'accounts/login.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('dashboard')
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            if user.is_active:
                login(request, user)
                # Update last login
                user.last_login = timezone.now()
                user.save()
                
                # Redirect based on user type
                return redirect(user.get_dashboard_url())
            else:
                messages.error(request, 'Your account is inactive.')
        else:
            messages.error(request, 'Invalid email or password.')
        
        return render(request, self.template_name)
