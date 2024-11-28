from django.contrib.auth.backends import BaseBackend
from .models import Login

class EmailAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        try:
            user = Login.objects.get(email=username)
            if user.check_password(password):
                return user
        except Login.DoesNotExist:
            return None
        
    def get_user(self, user_id):
        try:
            return Login.objects.get(pk=user_id)
        except Login.DoesNotExist:
            return None