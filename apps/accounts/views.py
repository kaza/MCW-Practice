from django.shortcuts import render, redirect
from django.contrib import messages
from django.views import View
from .models import Login
from django.contrib.auth.hashers import check_password, make_password

class LoginView(View):
    template_name = 'accounts/login.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        try:
            
            user = Login.objects.get(email=email)
            if check_password(password, user.password_hash):
                request.session['user_id'] = user.id
                request.session['user_type'] = user.user_type
                
                # Redirect based on user type
                if user.user_type == 'ADMIN':
                    return redirect('admin_dashboard:home')
                elif user.user_type == 'CLINICIAN':
                    return redirect('clinician_dashboard:home')
                return redirect('client_dashboard:home')
            else:
                messages.error(request, 'Invalid credentials')
        except Login.DoesNotExist:
            messages.error(request, 'Invalid credentials')
        
        return render(request, self.template_name)