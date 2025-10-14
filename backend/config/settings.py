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
    'treasurehunter-mz1x.onrender.com',  # Aktuális Render.com domain
    '.onrender.com',  # Minden Render.com subdomain
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5176',
    'http://127.0.0.1:5176',
    'https://treasurehunt-game.onrender.com',  # Render.com domain
    'https://treasurehunter-mz1x.onrender.com',  # Aktuális Render.com domain
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
print(f"🔍 DATABASE_URL: {DATABASE_URL}")

if DATABASE_URL and DATABASE_URL.strip() and not DATABASE_URL.startswith('://'):
    try:
        import dj_database_url
        print("✅ PostgreSQL adatbázis használata")
        db_config = dj_database_url.parse(DATABASE_URL)
        # SSL beállítások hozzáadása
        db_config['OPTIONS'] = {
            'sslmode': 'require',
        }
        DATABASES = {
            'default': db_config
        }
    except Exception as e:
        print(f"❌ DATABASE_URL parse hiba: {e}")
        print("⚠️ SQLite adatbázis használata (fallback)")
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    print("⚠️ SQLite adatbázis használata (DATABASE_URL hiányzik, üres vagy hibás)")
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

# Debug információ statikus fájlokhoz
print(f"🔍 STATIC_URL: {STATIC_URL}")
print(f"🔍 STATIC_ROOT: {STATIC_ROOT}")
print(f"🔍 STATICFILES_DIRS: {STATICFILES_DIRS}")
print(f"🔍 DEBUG: {DEBUG}")

# Statikus fájlok ellenőrzése
import os
static_root_exists = os.path.exists(STATIC_ROOT)
static_dir_exists = os.path.exists(BASE_DIR / 'static')
print(f"🔍 STATIC_ROOT exists: {static_root_exists}")
print(f"🔍 STATIC_DIR exists: {static_dir_exists}")

if static_dir_exists:
    static_files = os.listdir(BASE_DIR / 'static')
    print(f"🔍 STATIC_DIR files: {static_files}")
    
    assets_dir = BASE_DIR / 'static' / 'assets'
    if os.path.exists(assets_dir):
        assets_files = os.listdir(assets_dir)
        print(f"🔍 ASSETS_DIR files: {assets_files}")
    else:
        print("🔍 ASSETS_DIR does not exist!")

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
    "https://treasurehunter-1.onrender.com",
    "https://treasurehunter-mz1x.onrender.com",  # backend saját domain
    "https://treasurehunter-frontend.onrender.com",  # frontend domain
    "https://*.onrender.com",
]

# Production CORS beállítások
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

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

# Debug CORS beállítások
print(f"🔍 CORS_ALLOWED_ORIGINS: {CORS_ALLOWED_ORIGINS}")
print(f"🔍 CORS_ALLOW_CREDENTIALS: {CORS_ALLOW_CREDENTIALS}")
print(f"🔍 CORS_ALLOW_METHODS: {CORS_ALLOW_METHODS}")
print(f"🔍 CORS_ALLOW_HEADERS: {CORS_ALLOW_HEADERS}")

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
               'anon': '1000/hour',     # Névtelen felhasználók (fejlesztéshez jelentősen növelve)
               'user': '5000/hour',     # Bejelentkezett felhasználók (fejlesztéshez jelentősen növelve)
               'api': '2000/hour',      # API végpontok (fejlesztéshez jelentősen növelve)
               'game': '500/hour',      # Játék műveletek (fejlesztéshez jelentősen növelve)
               'qr': '200/hour',        # QR kód validálás (fejlesztéshez jelentősen növelve)
           }
}

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

# Windows-on Gunicorn nem működik (fcntl modul hiányzik)
# Django development szerver használata optimalizált beállításokkal
if os.name == 'nt':  # Windows
    print("🪟 Windows észlelve - Django development szerver használata")
    print("💡 Production-ben Linux/Gunicorn ajánlott")
else:
    print("🐧 Linux/Mac észlelve - Gunicorn használható")
