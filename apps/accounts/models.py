from django.db import models
from django.contrib.auth.hashers import make_password

class Login(models.Model):
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

    class Meta:
        db_table = 'login'

    def save(self, *args, **kwargs):
        if not self.password_hash.startswith('pbkdf2_sha256$'):
            self.password_hash = make_password(self.password_hash)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email