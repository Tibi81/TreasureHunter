# 🎃 Halloween Treasure Hunter - GitHub → Render.com Deployment Guide

## 📋 Előkészítés

### 1. GitHub Repository létrehozása

1. **GitHub.com** → **New Repository**
2. **Repository name**: `halloween-treasure-hunter`
3. **Description**: `🎃 Halloween-themed treasure hunting game with React frontend and Django backend`
4. **Public** ✅ (ajánlott portfolio miatt)
5. **Add README** ✅
6. **Create repository**

### 2. Lokális repository összekapcsolása

```bash
# A projekt mappájában
git init
git add .
git commit -m "Initial commit: Halloween Treasure Hunter game"

# GitHub repository hozzáadása
git remote add origin https://github.com/[USERNAME]/halloween-treasure-hunter.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Render.com Backend Setup

### 1. Render.com regisztráció

1. **Render.com** → **Sign Up**
2. **GitHub** fiókkal bejelentkezés
3. **Authorize** Render alkalmazás

### 2. PostgreSQL Database létrehozása

1. **Dashboard** → **New** → **PostgreSQL**
2. **Name**: `treasure-hunter-db`
3. **Database**: `treasurehunter`
4. **User**: `treasurehunter_user`
5. **Region**: `Oregon (US West)` (legközelebbi)
6. **Plan**: `Free` (kezdéshez)
7. **Create Database**

### 3. Backend Service létrehozása

1. **Dashboard** → **New** → **Web Service**
2. **Connect GitHub** → **halloween-treasure-hunter** repository
3. **Root Directory**: `backend`
4. **Environment**: `Python 3`
5. **Build Command**:
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
6. **Start Command**:
   ```bash
   gunicorn --config gunicorn.conf.py config.wsgi:application
   ```

**Fontos**: A `gunicorn.conf.py` fájl már tartalmazza a production beállításokat!

### 4. Environment Variables beállítása

**Service Settings** → **Environment**:

```bash
SECRET_KEY=django-insecure-your-new-secret-key-here-make-it-long-and-random
DEBUG=False
DATABASE_URL=postgresql://treasurehunter_user:password@host:port/treasurehunter

# Production optimalizálás
GUNICORN_WORKERS=4
GUNICORN_BIND=0.0.0.0:8000
GUNICORN_LOG_LEVEL=info

# Redis cache (opcionális, de ajánlott)
REDIS_URL=redis://localhost:6379/1

# Rate limiting (production értékek)
RATE_LIMIT_ANON=200/hour
RATE_LIMIT_USER=1000/hour
RATE_LIMIT_API=500/hour
RATE_LIMIT_GAME=100/hour
RATE_LIMIT_QR=50/hour
```

**Fontos**: A `DATABASE_URL` automatikusan generálódik a PostgreSQL service-ben!
**Megjegyzés**: Redis opcionális, de javasolt a jobb teljesítményért!

### 5. Backend Deploy

1. **Create Web Service**
2. **Várj** a build-re (2-3 perc)
3. **Ellenőrizd** a logokat hibákért
4. **Jegyezd fel** a backend URL-t: `https://halloween-treasure-hunter.onrender.com`

---

## ⚛️ Render.com Frontend Setup

### 1. Frontend Service létrehozása

1. **Dashboard** → **New** → **Static Site**
2. **Connect GitHub** → **halloween-treasure-hunter** repository
3. **Root Directory**: `frontend`
4. **Build Command**:
   ```bash
   npm install && npm run build
   ```
5. **Publish Directory**: `dist`

### 2. Frontend Deploy

1. **Create Static Site**
2. **Várj** a build-re (1-2 perc)
3. **Jegyezd fel** a frontend URL-t: `https://halloween-treasure-hunter-frontend.onrender.com`

---

## 🔧 Domain és CORS Beállítások

### 1. Backend Domain frissítése

**Backend Service** → **Settings** → **Environment**:

```bash
ALLOWED_HOSTS=halloween-treasure-hunter.onrender.com,halloween-treasure-hunter-frontend.onrender.com
```

### 2. CORS beállítások frissítése

**Backend Service** → **Settings** → **Environment**:

```bash
CORS_ALLOWED_ORIGINS=https://halloween-treasure-hunter-frontend.onrender.com
CSRF_TRUSTED_ORIGINS=https://halloween-treasure-hunter-frontend.onrender.com
```

### 3. Frontend API URL frissítése

**Frontend Service** → **Settings** → **Environment**:

```bash
REACT_APP_API_URL=https://halloween-treasure-hunter.onrender.com
```

---

## 🔄 Kód frissítések

### 1. Backend settings.py frissítése

```python
# backend/config/settings.py
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'halloween-treasure-hunter.onrender.com',  # Render backend
    'halloween-treasure-hunter-frontend.onrender.com',  # Render frontend
    '.onrender.com',  # Minden Render subdomain
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://halloween-treasure-hunter-frontend.onrender.com",  # Render frontend
]

# Production security headers már beállítva
# Logging konfiguráció már beállítva
# Rate limiting már optimalizálva
```

### 2. Frontend API URL frissítése

```javascript
// frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

### 3. Production deployment ellenőrzése

**Fontos**: Ellenőrizd, hogy ezek a fájlok léteznek:
- ✅ `backend/gunicorn.conf.py` - Production Gunicorn konfiguráció
- ✅ `backend/deploy.sh` - Deployment script
- ✅ `backend/logs/` - Logging könyvtár (automatikusan létrejön)

### 4. GitHub-ra push

```bash
git add .
git commit -m "Production deployment konfiguráció"
git push origin main
```

---

## 🧪 Tesztelés

### 1. Backend API tesztelése

```bash
# Alapvető API teszt
curl https://halloween-treasure-hunter.onrender.com/api/games/

# Rate limiting teszt
curl -v https://halloween-treasure-hunter.onrender.com/api/player/check-session/

# Health check
curl https://halloween-treasure-hunter.onrender.com/admin/
```

### 2. Production teljesítmény tesztelése

```bash
# Terheléses teszt (opcionális)
cd backend
python load_test.py
```

**Várható eredmények production-ben:**
- ✅ 200-500 egyidejű felhasználó támogatás
- ✅ 25-50 egyidejű játék
- ✅ Rate limiting működik
- ✅ Security headers aktívak

### 3. Frontend tesztelése

1. **Nyisd meg** a frontend URL-t
2. **Teszteld** a játék funkcionalitást
3. **Ellenőrizd** a konzol hibákat
4. **Teszteld** a rate limiting-et (több gyors kérés)

### 4. Teljes funkcionalitás tesztelése

1. **Játék létrehozása** (Admin)
2. **Játékos regisztráció**
3. **QR kód beolvasás**
4. **Játék végigjátszása**
5. **Logok ellenőrzése** (Backend Service → Logs)

---

## 🚨 Hibaelhárítás

### Gyakori problémák:

1. **Build Error**: 
   - Ellenőrizd a `requirements.txt` és `package.json`
   - Győződj meg róla, hogy a `gunicorn.conf.py` létezik

2. **CORS Error**: 
   - Frissítsd a CORS beállításokat
   - Ellenőrizd az `ALLOWED_HOSTS` és `CORS_ALLOWED_ORIGINS`

3. **Database Error**: 
   - Ellenőrizd a `DATABASE_URL`
   - Futtasd `python manage.py migrate`

4. **Static Files Error**: 
   - Futtasd `collectstatic`-ot
   - Ellenőrizd a `STATIC_ROOT` beállítást

5. **Rate Limiting Error**: 
   - Ellenőrizd a rate limiting environment változókat
   - Logokban keresd a "Rate limit exceeded" üzeneteket

6. **Gunicorn Error**: 
   - Ellenőrizd a `gunicorn.conf.py` fájlt
   - Győződj meg róla, hogy a `GUNICORN_WORKERS` be van állítva

### Logok ellenőrzése:

1. **Backend Service** → **Logs**
2. **Frontend Service** → **Logs**  
3. **Database Service** → **Logs**

**Fontos**: A production logging már be van állítva, részletes logokat találsz!

---

## 🎉 Sikeres Deployment!

**Backend URL**: `https://halloween-treasure-hunter.onrender.com`
**Frontend URL**: `https://halloween-treasure-hunter-frontend.onrender.com`

### Production kapacitás:
- ✅ **200-500 egyidejű felhasználó**
- ✅ **25-50 egyidejű játék**
- ✅ **Rate limiting aktív**
- ✅ **Security headers beállítva**
- ✅ **Logging és monitoring**

### Következő lépések:

1. **Custom domain** beállítása (opcionális)
2. **SSL certificate** automatikus
3. **Monitoring** beállítása
4. **Backup** stratégia
5. **Redis cache** hozzáadása (teljesítmény javítás)
6. **CDN** beállítása (static files gyorsítás)

### Performance monitoring:

```bash
# Teljesítmény ellenőrzése
curl -w "@curl-format.txt" -o /dev/null -s https://halloween-treasure-hunter.onrender.com/api/games/

# Rate limiting teszt
for i in {1..10}; do curl -s https://halloween-treasure-hunter.onrender.com/api/player/check-session/; done
```

---

## 📞 Segítség szükség esetén

- **Render.com Documentation**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/
- **React Deployment**: https://create-react-app.dev/docs/deployment/

**Sikeres deployment-et! 🚀🎃**
