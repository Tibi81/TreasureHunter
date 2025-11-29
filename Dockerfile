FROM python:3.11-slim

# Node.js telepítése a React buildhez
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Frontend build (optimalizált cache-elés)
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci && \
    npm cache clean --force

COPY frontend/ ./
RUN npm run build

# Backend
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Collectstatic
RUN python manage.py collectstatic --noinput --settings=config.settings_production

# Port (Railway automatikusan beállítja a PORT változót)
EXPOSE 8000

# Start command
# Railway ingyenes verzió: 1 worker (512 MB RAM limit)
# setup_halloween_game idempotens (get_or_create), biztonságos minden indításkor
CMD ["sh", "-c", "python manage.py migrate --settings=config.settings_production && python manage.py setup_halloween_game --settings=config.settings_production && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 1 --threads 2 --timeout 120 --access-logfile - --error-logfile -"]
