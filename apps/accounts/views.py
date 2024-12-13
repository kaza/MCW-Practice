from django.shortcuts import render, redirect
from django.contrib import messages
from django.views import View
from django.contrib.auth import login, get_user_model, logout
from django.utils import timezone
from django.urls import reverse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
Login = get_user_model()

class LoginView(View):
    template_name = 'accounts/login.html'

    @method_decorator(never_cache)
    def get(self, request):
        if request.user.is_authenticated:
            return self._get_redirect_url_for_user(request.user)
        return render(request, self.template_name)

    @method_decorator(never_cache)
    def post(self, request):
        email = request.POST.get('email')
        password = request.POST.get('password')
        next_url = request.GET.get('next')
        
        try:
            user = Login.objects.get(email=email)
            if user.check_password(password) and user.is_active:
                login(request, user)
                Login.objects.filter(id=user.id).update(last_login=timezone.now())
                
                # Log successful login
                logger.info(f"User {email} logged in successfully")
                
                if next_url:
                    return redirect(next_url)
                return self._get_redirect_url_for_user(user)
            else:
                messages.error(request, 'Invalid credentials')
                logger.warning(f"Failed login attempt for user {email}")
        except Login.DoesNotExist:
            messages.error(request, 'Invalid credentials')
            logger.warning(f"Login attempt with non-existent email: {email}")
        
        return render(request, self.template_name)

    def _get_redirect_url_for_user(self, user):
        logger.debug(f"Redirecting user {user.email} with type {user.user_type}")
        
        if user.user_type == 'ADMIN':
            return redirect('admin_dashboard:dashboard')
        elif user.user_type == 'CLINICIAN':
            return redirect('clinician_dashboard:dashboard')
        return redirect('client_dashboard:home')

class LogoutView(View):
    @method_decorator(never_cache)
    def get(self, request):
        try:
            # Clear session first
            request.session.flush()
            
            # Then logout
            logout(request)
            
            # Add cache control headers
            response = redirect(reverse('accounts:login'))
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
        except Exception as e:
            # Log the error if you have logging configured
            return redirect(reverse('accounts:login'))
    @method_decorator(never_cache)
    @method_decorator(require_http_methods(["POST"]))
    def post(self, request):
        """
        Handle logout via POST request with proper cleanup
        """
        try:
            # Store user info before logout for logging
            user_email = request.user.email
            user_type = request.user.user_type
            
            # Clear any custom session data
            request.session.flush()
            
            # Perform logout
            logout(request)
            
            # Clear any persistent database connections
            connection.close()
            
            # Log the successful logout
            logger.info(f"User {user_email} ({user_type}) logged out successfully")
            
            response = redirect(reverse('accounts:login'))
            
            # Add cache control headers
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return redirect(reverse('accounts:login'))

    @method_decorator(never_cache)
    def get(self, request):
        """
        Handle GET requests by showing a confirmation page or redirecting to POST
        For backward compatibility, but POST is preferred
        """
        try:
            # Perform same logout logic as POST
            user_email = request.user.email
            request.session.flush()
            logout(request)
            connection.close()
            logger.info(f"User {user_email} logged out via GET request")
            
            response = redirect(reverse('accounts:login'))
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
            
        except Exception as e:
            logger.error(f"Logout error (GET): {str(e)}")
            return redirect(reverse('accounts:login'))