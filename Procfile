web: cd backend && python3 manage.py collectstatic --noinput && python3 manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
