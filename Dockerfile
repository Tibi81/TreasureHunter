@@ -1,31 +0,0 @@
FROM python:3.11-slim

# Node.js telepítése a React buildhez
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Frontend build
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Collectstatic
RUN python manage.py collectstatic --noinput --settings=config.settings_production

# Port
EXPOSE 8000

# Start command
CMD ["sh", "-c", "python manage.py migrate --settings=config.settings_production && python manage.py setup_halloween_game --settings=config.settings_production && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]
