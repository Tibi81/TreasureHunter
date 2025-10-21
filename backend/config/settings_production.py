"""
Django production settings for config project.
"""

from pathlib import Path
import os
from .settings import *

BASE_DIR = Path(__file__).resolve().parent.parent

# =====================================================
# Production beállítások
# =====================================================

DEBUG = False

# Production hostok - itt add meg a domain nevedet
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    # Add meg a production domain nevedet:
    # 'your-domain.com',
    # 'www.your-domain.com',
]

# Production CORS beállítások
CORS_ALLOWED_ORIGINS = [
    # Add meg a production domain nevedet:
    # "https://your-domain.com",
    # "https://www.your-domain.com",
]

CSRF_TRUSTED_ORIGINS = [
    # Add meg a production domain nevedet:
    # "https://your-domain.com",
    # "https://www.your-domain.com",
]

# =====================================================
# Production statikus fájlok
# =====================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Production-ben a staticfiles mappát használjuk
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# =====================================================
# Production adatbázis (PostgreSQL ajánlott)
# =====================================================

# SQLite (egyszerű deployment)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# PostgreSQL (professzionális deployment) - kommentezd ki a SQLite-et és add meg a PostgreSQL adatokat
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'treasurehunt_db',
#         'USER': 'your_db_user',
#         'PASSWORD': 'your_db_password',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# =====================================================
# Production biztonság
# =====================================================

# Titkos kulcs - production-ben változtasd meg!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# HTTPS beállítások
SECURE_SSL_REDIRECT = False  # Ha HTTPS-t használsz, állítsd True-ra
SECURE_HSTS_SECONDS = 0  # Ha HTTPS-t használsz, állítsd 31536000-re
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# =====================================================
# Production logging
# =====================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}

# Logs mappa létrehozása
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
