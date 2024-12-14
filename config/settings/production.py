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


# Security settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    'https://simple-practice.azurewebsites.net'
]


# Whitenoise settings for production
WHITENOISE_COMPRESSION_ENABLED = True
WHITENOISE_BROTLI_ENABLED = True
WHITENOISE_USE_FINDERS = False
WHITENOISE_MANIFEST_STRICT = False

# Session and cache settings for production
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

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
