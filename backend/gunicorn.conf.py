# Gunicorn konfigurációs fájl - Production optimalizálva
# Futtatás: gunicorn -c gunicorn.conf.py config.wsgi:application

import os

# Alapvető beállítások - Render.com port dinamikus hozzárendelés
port = os.environ.get('PORT', '8000')
bind = f"0.0.0.0:{port}"
workers = int(os.environ.get('GUNICORN_WORKERS', '2'))  # Kevesebb worker SSE-hez
worker_class = "sync"
worker_connections = 1000
timeout = 300  # 5 perc timeout SSE-hez
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

# Graceful shutdown - SSE-hez optimalizálva
graceful_timeout = 60
worker_timeout = 300  # 5 perc worker timeout SSE-hez

print("🚀 Gunicorn production konfiguráció betöltve")
print(f"📍 Bind: {bind}")
print(f"👥 Workers: {workers}")
print(f"⏱️ Timeout: {timeout}s")
print(f"🔄 Max requests: {max_requests}")
print(f"📊 Log level: {loglevel}")
