"""
Django settings for config project.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# =====================================================
# Alapbeállítások
# =====================================================

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-zssoifwpm@i^@4*dby61(#vbnu0gd&y-upva6m#b8vqkwf&8hj')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'treasurehunter-mz1x.onrender.com',  # Backend domain
    '.onrender.com',  # Minden Render.com subdomain
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5176',
    'http://127.0.0.1:5176',
    'https://treasurehunter-mz1x.onrender.com',  # Backend domain
    'https://treasurehunter-frontend.onrender.com',  # Frontend domain
    'https://treasurehunter-1.onrender.com',  # Aktuális frontend domain
    'https://*.onrender.com',  # Minden Render.com subdomain
]

# =====================================================
# Telepített alkalmazások
# =====================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Külső appok
    'rest_framework',
    'corsheaders',

    # Saját app
    'treasurehunt',
]

# =====================================================
# Middleware
# =====================================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware a legelső helyen
    'whitenoise.middleware.WhiteNoiseMiddleware', # Django Admin oldal megjelenítése éles környezetben
    'treasurehunt.middleware.RateLimitMiddleware',  # Rate limiting middleware
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'treasurehunt.middleware.CacheHeadersMiddleware',  # Cache header middleware
]

# =====================================================
# URL, WSGI, Templating
# =====================================================

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# =====================================================
# Adatbázis
# =====================================================

# Production PostgreSQL, Development SQLite
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL and DATABASE_URL.strip() and not DATABASE_URL.startswith('://'):
    try:
        import dj_database_url
        db_config = dj_database_url.parse(DATABASE_URL)
        # SSL beállítások hozzáadása
        db_config['OPTIONS'] = {
            'sslmode': 'require',
        }
        DATABASES = {
            'default': db_config
        }
    except Exception as e:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# =====================================================
# Jelszóvalidálás
# =====================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =====================================================
# Nyelv, időzóna
# =====================================================

LANGUAGE_CODE = 'hu'
TIME_ZONE = 'Europe/Budapest'
USE_I18N = True
USE_TZ = True

# =====================================================
# Statikus fájlok (Django)
# =====================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',                      # Saját statikus fájlok
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =====================================================
# Alapértelmezett ID típus
# =====================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =====================================================
# CORS & CSRF
# =====================================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # Alternatív port
    "http://127.0.0.1:3000",  # Alternatív port
    "https://treasurehunter-mz1x.onrender.com",  # Backend domain
    "https://treasurehunter-frontend.onrender.com",  # Frontend domain
    "https://treasurehunter-1.onrender.com",  # Aktuális frontend domain
    "https://*.onrender.com",
]

# Production CORS beállítások
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# Fejlesztési CORS beállítások
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True

# CORS headers a cookie támogatáshoz
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CORS preflight requests támogatása
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 óra
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]



# =====================================================
# Redis Cache és Session Storage (kapcsolható módon)
# =====================================================

import os

USE_REDIS = os.environ.get('REDIS_OFF', '0') != '1'  # Ha REDIS_OFF=1 → Redis kikapcsolva
REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1')

if USE_REDIS:
    try:
        import redis
        r = redis.from_url(REDIS_URL)
        r.ping()
        REDIS_AVAILABLE = True

        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': REDIS_URL,
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                    'CONNECTION_POOL_KWARGS': {
                        'max_connections': 50,
                        'retry_on_timeout': True,
                    },
                    'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                    'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
                },
                'KEY_PREFIX': 'treasurehunt',
                'TIMEOUT': 300,
            }
        }

        SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
        SESSION_CACHE_ALIAS = 'default'

    except Exception as e:
        REDIS_AVAILABLE = False
        USE_REDIS = False

# Ha Redis ki van kapcsolva vagy nem elérhető
if not USE_REDIS:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
            'OPTIONS': {
                'MAX_ENTRIES': 1000,
                'CULL_FREQUENCY': 3,
            },
            'TIMEOUT': 300,
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'

SESSION_COOKIE_AGE = 3600 * 24 * 7  # 7 nap




# =====================================================
# Windows kompatibilis fejlesztési beállítások
# =====================================================

# =====================================================
# Logging konfiguráció
# =====================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'treasurehunt': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# =====================================================
# Security Headers
# =====================================================

# HTTPS redirect production-ben
SECURE_SSL_REDIRECT = not DEBUG
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session security
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'

# Production deployment beállítások
# Render.com Linux környezetben fut, Gunicorn támogatott
