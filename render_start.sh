set -o errexit

python manage.py migrate --noinput
python manage.py createsuperuser --noinput || true
gunicorn happynewyear.wsgi:application
