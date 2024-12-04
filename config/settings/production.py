from .base import *
import environ

env = environ.Env()
environ.Env.read_env()

# Set DEBUG to False in production
DEBUG = False

ALLOWED_HOSTS = [
    'simple-practice.azurewebsites.net'
]


# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  #
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CSRF_TRUSTED_ORIGINS = [
    'https://simple-practice.azurewebsites.net'
]

# Replace CORS_ALLOW_ALL_ORIGINS with specific origins
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://simple-practice.azurewebsites.net/",
]


DATABASES['default'].update({
    'OPTIONS': {
        **DATABASES['default']['OPTIONS']
    }
})
