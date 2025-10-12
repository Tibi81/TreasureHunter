# 🎃 Halloween Treasure Hunter - GitHub → Render.com Deployment Guide

## 📋 Előkészítés

### 1. GitHub Repository létrehozása

1. **GitHub.com** → **New Repository**
2. **Repository name**: `treasurehunter` (vagy tetszőleges név)
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
git remote add origin https://github.com/[USERNAME]/treasurehunter.git
git branch -M main
git push -u origin main
```

---

## 🚀 Render.com Külön Szolgáltatások Deployment

### 1. Render.com regisztráció

1. **Render.com** → **Sign Up**
2. **GitHub** fiókkal bejelentkezés
3. **Authorize** Render alkalmazás

### 2. PostgreSQL Database létrehozása

1. **Dashboard** → **New** → **PostgreSQL**
2. **Name**: `treasurehunt-db`
3. **Database**: `treasurehunt`
4. **User**: `treasurehunt_user`
5. **Region**: `Frankfurt (EU Central)` (ajánlott)
6. **Plan**: `Free` (kezdéshez)
7. **Create Database**

### 3. Backend Web Service létrehozása

1. **Dashboard** → **New** → **Web Service**
2. **Connect GitHub** → **treasurehunter** repository
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
7. **Publish Directory**: `backend`

### 4. Frontend Static Site létrehozása

1. **Dashboard** → **New** → **Static Site**
2. **Connect GitHub** → **treasurehunter** repository
3. **Root Directory**: `frontend`
4. **Build Command**:
   ```bash
   npm install && npm run build
   ```
5. **Publish Directory**: `dist`

### 5. Environment Variables beállítása

#### **Backend Service Settings** → **Environment**:

```bash
SECRET_KEY=django-insecure-your-new-secret-key-here-make-it-long-and-random
DEBUG=False
DATABASE_URL=postgresql://treasurehunt_user:password@host:port/treasurehunt

# Production optimalizálás
GUNICORN_WORKERS=2
GUNICORN_BIND=0.0.0.0:$PORT
GUNICORN_LOG_LEVEL=info

# Redis cache (opcionális, de ajánlott)
REDIS_URL=redis://red-xxxxx:6379

# Rate limiting (production értékek)
RATE_LIMIT_ANON=200/hour
RATE_LIMIT_USER=1000/hour
RATE_LIMIT_API=500/hour
RATE_LIMIT_GAME=100/hour
RATE_LIMIT_QR=50/hour
```

**Fontos**: A `DATABASE_URL` automatikusan generálódik a PostgreSQL service-ben!

---

## 🔧 Architektúra Magyarázata

### Miért külön szolgáltatások?

#### **A. Frontend (Static Site):**
- ✅ **Gyors betöltés**: CDN-en szolgáltatott statikus fájlok
- ✅ **Skálázhatóság**: Automatikus CDN terjesztés
- ✅ **Egyszerű deploy**: Csak build és upload
- ✅ **Ingyenes**: Render.com Static Site ingyenes

#### **B. Backend (Web Service):**
- ✅ **API szolgáltatás**: Django REST Framework
- ✅ **Adatbázis kapcsolat**: PostgreSQL
- ✅ **Session kezelés**: Cookie-k és session token-ek
- ✅ **Rate limiting**: API védelem

#### **C. Kommunikáció:**
- ✅ **CORS**: Cross-Origin Resource Sharing beállítva
- ✅ **HTTPS**: Biztonságos kommunikáció
- ✅ **Cookie-k**: Session kezelés domain-ek között

---

## ⚛️ Frontend Build Folyamat

### 1. Vite Configuration

**frontend/vite.config.js**:
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist', // Standard dist mappa
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
```

### 2. API Service (Automatikus)

**frontend/src/services/api.js**:
```javascript
const getApiBaseUrl = () => {
  // Mindig használd a jelenlegi domain-t (build módban)
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();
```

**Fontos**: A frontend automatikusan a jelenlegi domain-t használja API hívásokhoz!

---

## 🔄 Kód frissítések

### 1. Backend settings.py frissítése

```python
# backend/config/settings.py
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'treasurehunt-backend.onrender.com',  # Backend service
    'treasurehunter-mz1x.onrender.com',  # Aktuális Backend domain
    '.onrender.com',  # Minden Render subdomain
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://treasurehunt-frontend.onrender.com",  # Frontend service
    "https://treasurehunter-frontend.onrender.com",  # Aktuális Frontend domain
    "https://*.onrender.com",  # Minden Render subdomain
]
```

### 2. Frontend API URL (automatikus)

A frontend automatikusan a jelenlegi domain-t használja API hívásokhoz, nincs szükség külön beállításra.

### 3. Production deployment ellenőrzése

**Fontos**: Ellenőrizd, hogy ezek a fájlok léteznek:
- ✅ `backend/gunicorn.conf.py` - Production Gunicorn konfiguráció
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `frontend/package.json` - Node.js dependencies
- ✅ `frontend/vite.config.js` - Frontend build konfiguráció

### 4. GitHub-ra push

```bash
git add .
git commit -m "Külön szolgáltatások deployment konfiguráció"
git push origin main
```

---

## 🧪 Tesztelés

### 1. Backend API tesztelése

```bash
# Alapvető API teszt
curl https://treasurehunt-backend.onrender.com/api/games/

# Rate limiting teszt
curl -v https://treasurehunt-backend.onrender.com/api/player/check-session/

# Health check
curl https://treasurehunt-backend.onrender.com/admin/
```

### 2. Frontend tesztelése

1. **Nyisd meg** a frontend URL-t: `https://treasurehunt-frontend.onrender.com`
2. **Teszteld** a játék funkcionalitást
3. **Ellenőrizd** a konzol hibákat
4. **Teszteld** a rate limiting-et (több gyors kérés)

### 3. Teljes funkcionalitás tesztelése

1. **Játék létrehozása** (Admin)
2. **Játékos regisztráció**
3. **QR kód beolvasás**
4. **Játék végigjátszása**
5. **Logok ellenőrzése** (Service → Logs)

---

## 🚨 Hibaelhárítás

### Gyakori problémák:

1. **Build Error**: 
   - Ellenőrizd a `requirements.txt` és `package.json`
   - Győződj meg róla, hogy a `gunicorn.conf.py` létezik
   - Ellenőrizd a `vite.config.js` beállításokat

2. **Frontend nem tölt be**: 
   - Ellenőrizd a `frontend/vite.config.js` `outDir` beállítást
   - Ellenőrizd a `dist` mappa tartalmát

3. **Database Error**: 
   - Ellenőrizd a `DATABASE_URL`
   - Futtasd `python manage.py migrate`

4. **CORS Error**: 
   - Ellenőrizd a `CORS_ALLOWED_ORIGINS` beállításokat
   - Győződj meg róla, hogy a frontend URL benne van

5. **Rate Limiting Error**: 
   - Ellenőrizd a rate limiting environment változókat
   - Logokban keresd a "Rate limit exceeded" üzeneteket

6. **Gunicorn Error**: 
   - Ellenőrizd a `gunicorn.conf.py` fájlt
   - Győződj meg róla, hogy a `GUNICORN_WORKERS` be van állítva

### Gyors Javítások:

#### **Backend Build Command (Render Dashboard):**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

#### **Backend Start Command (Render Dashboard):**
```bash
gunicorn --config gunicorn.conf.py config.wsgi:application
```

#### **Frontend Build Command (Render Dashboard):**
```bash
npm install && npm run build
```

#### **Environment Variables (Backend Service):**
```bash
SECRET_KEY=django-insecure-your-new-secret-key-here-make-it-long-and-random
DEBUG=False
DATABASE_URL=postgresql://treasurehunt_user:password@host:port/treasurehunt
```

### Logok ellenőrzése:

1. **Backend Service** → **Logs**
2. **Frontend Service** → **Logs**
3. **Database Service** → **Logs**

**Fontos**: A production logging már be van állítva, részletes logokat találsz!

---

## 🎉 Sikeres Deployment!

**Backend URL**: `https://treasurehunt-backend.onrender.com`
**Frontend URL**: `https://treasurehunt-frontend.onrender.com`

### Production kapacitás:
- ✅ **200-500 egyidejű felhasználó**
- ✅ **25-50 egyidejű játék**
- ✅ **Rate limiting aktív**
- ✅ **Security headers beállítva**
- ✅ **Logging és monitoring**
- ✅ **CDN gyors betöltés**

### Következő lépések:

1. **Custom domain** beállítása (opcionális)
2. **SSL certificate** automatikus
3. **Monitoring** beállítása
4. **Backup** stratégia
5. **Redis cache** hozzáadása (teljesítmény javítás)

### Performance monitoring:

```bash
# Backend teljesítmény ellenőrzése
curl -w "@curl-format.txt" -o /dev/null -s https://treasurehunt-backend.onrender.com/api/games/

# Frontend betöltési idő ellenőrzése
curl -w "@curl-format.txt" -o /dev/null -s https://treasurehunt-frontend.onrender.com/

# Rate limiting teszt
for i in {1..10}; do curl -s https://treasurehunt-backend.onrender.com/api/player/check-session/; done
```

---

## 📞 Segítség szükség esetén

- **Render.com Documentation**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/
- **Vite Build**: https://vitejs.dev/guide/build.html

**Sikeres deployment-et! 🚀🎃**