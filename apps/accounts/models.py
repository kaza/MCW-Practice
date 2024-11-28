from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password as django_check_password
from django.db import models
from django.utils import timezone

class LoginManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.password_hash = make_password(password)
        user.save(using=self._db)
        return user

class Login(AbstractBaseUser):
    USER_TYPE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('CLINICIAN', 'Clinician'),
        ('PATIENT', 'Patient'),
    )

    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    # Add these required fields for Django auth
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = LoginManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'login'

    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)
        self._password = raw_password

    def check_password(self, raw_password):
        """Verify if given password matches the hash"""
        return django_check_password(raw_password, self.password_hash)

    @property
    def password(self):
        return self.password_hash

    @password.setter
    def password(self, raw_password):
        self.set_password(raw_password)

    # Add these required methods for Django auth
    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True