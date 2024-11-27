from .base import *
import environ


env = environ.Env()
environ.Env.read_env()

DEBUG = True


ALLOWED_HOSTS = ['localhost', '127.0.0.1']


STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CORS_ALLOW_ALL_ORIGINS = True  


DATABASES['default'].update({
    'OPTIONS': {
        **DATABASES['default']['OPTIONS']
    }
})