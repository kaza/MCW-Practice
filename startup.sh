#!/bin/bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn --bind 0.0.0.0 --timeout 600 --workers 4 --env DJANGO_SETTINGS_MODULE=config.settings.production config.wsgi:application