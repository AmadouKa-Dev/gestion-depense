#!/bin/sh
# entrypoint.sh

set -e

# Collecter les fichiers statiques pour gunicorn (css/js)
python manage.py collectstatic --noinput

# Appliquer les migrations
python manage.py migrate --noinput

# Lancer Gunicorn
exec python -m gunicorn --bind 0.0.0.0:8000 --workers 3 backend.wsgi:application
