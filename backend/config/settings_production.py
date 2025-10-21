"""
Django production settings for config project - Railway.app optimized.
"""

from pathlib import Path
import os
import dj_database_url
from .settings import *

BASE_DIR = Path(__file__).resolve().parent.parent

# =====================================================
# Railway.app Production beállítások
# =====================================================

DEBUG = False

# Railway.app hostok
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.railway.app',  # Railway.app domain
    # Add meg a custom domain nevedet:
    # 'your-domain.com',
    # 'www.your-domain.com',
]

# Railway.app CORS beállítások
CORS_ALLOWED_ORIGINS = [
    # Railway.app domain automatikusan hozzáadódik
    # Add meg a custom domain nevedet:
    # "https://your-domain.com",
    # "https://www.your-domain.com",
]

CSRF_TRUSTED_ORIGINS = [
    # Railway.app domain automatikusan hozzáadódik
    # Add meg a custom domain nevedet:
    # "https://your-domain.com",
    # "https://www.your-domain.com",
]

# =====================================================
# Railway.app statikus fájlok
# =====================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Railway.app-ben a staticfiles mappát használjuk
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# WhiteNoise middleware hozzáadása statikus fájlokhoz
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# =====================================================
# Railway.app adatbázis (PostgreSQL)
# =====================================================

# Railway.app PostgreSQL automatikus konfiguráció
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# =====================================================
# Railway.app biztonság
# =====================================================

# Titkos kulcs - Railway.app environment változóból
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# HTTPS beállítások Railway.app-hez
SECURE_SSL_REDIRECT = True  # Railway.app HTTPS-t használ
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# =====================================================
# Railway.app logging
# =====================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
