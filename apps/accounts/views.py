# apps/accounts/views.py
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views import View
from django.contrib.auth import login, get_user_model, logout
from django.utils import timezone
from django.urls import reverse

Login = get_user_model()

class LoginView(View):
    template_name = 'accounts/login.html'

    def get(self, request):
        if request.user.is_authenticated:
            return self._get_redirect_url_for_user(request.user)
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('email')
        password = request.POST.get('password')
        next_url = request.GET.get('next')
        
        try:
            user = Login.objects.get(email=email)
            if user.check_password(password) and user.is_active:
                login(request, user)
                Login.objects.filter(id=user.id).update(last_login=timezone.now())
                
                if next_url:
                    return redirect(next_url)
                return self._get_redirect_url_for_user(user)
            else:
                messages.error(request, 'Invalid credentials')
        except Login.DoesNotExist:
            messages.error(request, 'Invalid credentials')
        
        return render(request, self.template_name)

    def _get_redirect_url_for_user(self, user):
        print(f"Redirecting user {user.email} with type {user.user_type}")
        
        if user.user_type == 'ADMIN':
            return redirect('admin_dashboard:home')
        elif user.user_type == 'CLINICIAN':
            return redirect('clinician_dashboard:home')
        return redirect('client_dashboard:home')

class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect(reverse('accounts:login'))