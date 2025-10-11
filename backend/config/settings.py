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
    'treasurehunt-game.onrender.com',  # Render.com domain
    '.onrender.com',  # Minden Render.com subdomain
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5176',
    'http://127.0.0.1:5176',
    'https://treasurehunt-game.onrender.com',  # Render.com domain
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
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
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
# Statikus fájlok (Django + React + Tailwind)
# =====================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',                      # Saját statikus fájlok
]

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
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://192.168.50.195:5173",  # Helyi hálózatos React fejlesztés
    "https://treasurehunt-game.onrender.com",  # Render.com domain
]

# Production CORS beállítások
if not DEBUG:
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_CREDENTIALS = True

# =====================================================
# Redis Cache és Session Storage
# =====================================================

# Cache konfiguráció - Redis vagy fallback
import os

# Redis elérhetőség ellenőrzése
REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1')

try:
    # Redis kapcsolat tesztelése
    import redis
    r = redis.from_url(REDIS_URL)
    r.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis elérhető - Redis cache használata")
    
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
    
except Exception as e:
    # Fallback: memóriában tárolt cache
    REDIS_AVAILABLE = False
    print(f"⚠️ Redis nem elérhető - memóriában tárolt cache használata: {e}")
    
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

# Session storage Redis-re átállítása
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 3600 * 24 * 7  # 7 nap (session token alapján)

# =====================================================
# Rate Limiting konfiguráció
# =====================================================

# Django REST Framework throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'treasurehunt.middleware.CustomRateThrottle',  # Saját rate limiter
    ],
           'DEFAULT_THROTTLE_RATES': {
               'anon': '200/hour',      # Névtelen felhasználók (fejlesztéshez növelve)
               'user': '2000/hour',     # Bejelentkezett felhasználók (fejlesztéshez növelve)
               'api': '500/hour',       # API végpontok (fejlesztéshez növelve)
               'game': '100/hour',      # Játék műveletek (fejlesztéshez növelve)
               'qr': '50/hour',         # QR kód validálás (fejlesztéshez növelve)
           }
}

# =====================================================
# Windows kompatibilis fejlesztési beállítások
# =====================================================

# Windows-on Gunicorn nem működik (fcntl modul hiányzik)
# Django development szerver használata optimalizált beállításokkal
if os.name == 'nt':  # Windows
    print("🪟 Windows észlelve - Django development szerver használata")
    print("💡 Production-ben Linux/Gunicorn ajánlott")
else:
    print("🐧 Linux/Mac észlelve - Gunicorn használható")
