# Gunicorn konfigurációs fájl - fejlesztéshez optimalizálva
# Futtatás: gunicorn -c gunicorn.conf.py config.wsgi:application

# Alapvető beállítások
bind = "127.0.0.1:8000"
workers = 2  # Fejlesztéshez kevesebb worker
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "treasurehunt_dev"

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

# Development specific
reload = False  # Fejlesztéshez False (Django auto-reload használata)
reload_extra_files = []
reload_engine = "auto"

print("🚀 Gunicorn fejlesztési konfiguráció betöltve")
print(f"📍 Bind: {bind}")
print(f"👥 Workers: {workers}")
print(f"⏱️ Timeout: {timeout}s")
print(f"🔄 Max requests: {max_requests}")
