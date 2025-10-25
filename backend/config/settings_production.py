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
    'treasurehunter-production.up.railway.app',  # Konkrét domain
]

# Railway.app CORS beállítások
CORS_ALLOWED_ORIGINS = [
    'https://treasurehunter-production.up.railway.app',
]

CSRF_TRUSTED_ORIGINS = [
    'https://treasurehunter-production.up.railway.app',
    'https://*.railway.app',
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

# WhiteNoise beállítások
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

# WhiteNoise middleware hozzáadása statikus fájlokhoz
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

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
# FONTOS: Railway már kezeli az HTTPS-t proxy szinten!
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  # ← HOZZÁADVA
SECURE_SSL_REDIRECT = False  # ← MEGVÁLTOZTATVA False-ra!

# Cookie biztonsági beállítások
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# További biztonsági beállítások
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# HSTS csak akkor ha biztos vagy benne
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

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