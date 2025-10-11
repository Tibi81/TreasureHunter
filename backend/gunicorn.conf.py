# Gunicorn konfigurációs fájl - Production optimalizálva
# Futtatás: gunicorn -c gunicorn.conf.py config.wsgi:application

import os

# Alapvető beállítások
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')
workers = int(os.environ.get('GUNICORN_WORKERS', '4'))  # Production-ben több worker
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "treasurehunt_prod"

# Worker lifecycle
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Performance
worker_tmp_dir = "/dev/shm"  # Linux/Mac, Windows-on automatikusan kezeli

# Production specific
reload = False  # Production-ben soha ne reload
reload_extra_files = []
reload_engine = "auto"

# Graceful shutdown
graceful_timeout = 30
worker_timeout = 30

print("🚀 Gunicorn production konfiguráció betöltve")
print(f"📍 Bind: {bind}")
print(f"👥 Workers: {workers}")
print(f"⏱️ Timeout: {timeout}s")
print(f"🔄 Max requests: {max_requests}")
print(f"📊 Log level: {loglevel}")
