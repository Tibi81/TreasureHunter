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

## 🚀 Render.com Modern Deployment (Django + React Együtt)

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

### 3. Web Service létrehozása (Django + React Együtt)

1. **Dashboard** → **New** → **Web Service**
2. **Connect GitHub** → **treasurehunter** repository
3. **Root Directory**: `backend` (marad!)
4. **Environment**: `Python 3`
5. **Build Command**:
   ```bash
   cd ../frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt && python manage.py collectstatic --noinput --verbosity=2 && python manage.py migrate
   ```
6. **Start Command**:
   ```bash
   gunicorn --config gunicorn.conf.py config.wsgi:application
   ```
7. **Publish Directory**: `backend` (marad!)

**Fontos**: A `gunicorn.conf.py` fájl már tartalmazza a production beállításokat!

### 4. Environment Variables beállítása

**Service Settings** → **Environment**:

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
**Megjegyzés**: Redis opcionális, de javasolt a jobb teljesítményért!

### 5. Deploy és Tesztelés

1. **Create Web Service**
2. **Várj** a build-re (3-5 perc)
3. **Ellenőrizd** a logokat hibákért
4. **Jegyezd fel** a service URL-t: `https://treasurehunt-game.onrender.com`

---

## 🔧 Modern Architektúra Magyarázata

### Miért egyetlen Web Service?

#### **A. Egyszerűbb kezelés:**
- ✅ **Egyetlen URL**: `treasurehunt-game.onrender.com`
- ✅ **Egyetlen deploy**: Frontend + Backend együtt
- ✅ **Nincs CORS probléma**: Minden ugyanazon a domain-en
- ✅ **Egyszerűbb domain beállítás**: Egyetlen service

#### **B. Django szolgálja ki a frontend-et:**
- ✅ **Frontend build**: `npm run build` → `../backend/static`
- ✅ **Django collectstatic**: `staticfiles` mappába másolja
- ✅ **Django URL routing**: `/` → React alkalmazás
- ✅ **Static files**: `/static/` → CSS, JS, képek

#### **C. Production optimalizáció:**
- ✅ **Gunicorn**: Production WSGI server
- ✅ **PostgreSQL**: Skálázható adatbázis
- ✅ **Redis**: Cache és session storage
- ✅ **Rate limiting**: API védelem

---

## ⚛️ Frontend Build Folyamat

### 1. Vite Configuration

**frontend/vite.config.js**:
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../backend/static',  // Django static mappába
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

### 2. Django Static Files

**backend/config/settings.py**:
```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',  # Frontend build ide kerül
]
```

### 3. Django URL Routing

**backend/config/urls.py**:
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('treasurehunt.urls')),
    # React alkalmazás szolgáltatása
    path('', TemplateView.as_view(template_name='index.html')),
]
```

---

## 🔄 Kód frissítések

### 1. Backend settings.py frissítése

```python
# backend/config/settings.py
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'treasurehunt-game.onrender.com',  # Render service
    '.onrender.com',  # Minden Render subdomain
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://treasurehunt-game.onrender.com",  # Render service
]

# Production security headers már beállítva
# Logging konfiguráció már beállítva
# Rate limiting már optimalizálva
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
git commit -m "Production deployment konfiguráció"
git push origin main
```

---

## 🧪 Tesztelés

### 1. Backend API tesztelése

```bash
# Alapvető API teszt
curl https://treasurehunt-game.onrender.com/api/games/

# Rate limiting teszt
curl -v https://treasurehunt-game.onrender.com/api/player/check-session/

# Health check
curl https://treasurehunt-game.onrender.com/admin/
```

### 2. Frontend tesztelése

1. **Nyisd meg** a service URL-t: `https://treasurehunt-game.onrender.com`
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
   - Futtasd `python manage.py collectstatic --noinput`
   - Ellenőrizd a `STATIC_ROOT` beállítást

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

7. **"vite: not found" Error**: 
   - Ellenőrizd, hogy a Build Command tartalmazza az `npm install`-t
   - Build Command: `cd ../frontend && npm install && npm run build && ...`

8. **"cd: backend: No such file or directory" Error**: 
   - Ellenőrizd, hogy a Start Command NEM tartalmazza a `cd backend`-et
   - Start Command: `gunicorn --config gunicorn.conf.py config.wsgi:application`

9. **"Not Found: /static/assets/index.css" Error**: 
   - Ellenőrizd, hogy a `backend/config/urls.py` tartalmazza a statikus fájlok routing-ot
   - Győződj meg róla, hogy a `collectstatic` sikeresen lefutott
   - Ellenőrizd a `STATIC_ROOT` és `STATIC_URL` beállításokat
   - **Megoldás**: `urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)` minden módban

### Gyors Javítások:

#### **Build Command (Render Dashboard):**
```bash
cd ../frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt && python manage.py collectstatic --noinput --verbosity=2 && python manage.py migrate
```

#### **Start Command (Render Dashboard):**
```bash
gunicorn --config gunicorn.conf.py config.wsgi:application
```

#### **Environment Variables (Render Dashboard):**
```bash
SECRET_KEY=django-insecure-your-new-secret-key-here-make-it-long-and-random
DEBUG=False
DATABASE_URL=postgresql://treasurehunt_user:password@host:port/treasurehunt
```

### Logok ellenőrzése:

1. **Web Service** → **Logs**
2. **Database Service** → **Logs**

**Fontos**: A production logging már be van állítva, részletes logokat találsz!

---

## 🎉 Sikeres Deployment!

**Service URL**: `https://treasurehunt-game.onrender.com`

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

### Performance monitoring:

```bash
# Teljesítmény ellenőrzése
curl -w "@curl-format.txt" -o /dev/null -s https://treasurehunt-game.onrender.com/api/games/

# Rate limiting teszt
for i in {1..10}; do curl -s https://treasurehunt-game.onrender.com/api/player/check-session/; done
```

---

## 📞 Segítség szükség esetén

- **Render.com Documentation**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/
- **Vite Build**: https://vitejs.dev/guide/build.html

**Sikeres deployment-et! 🚀🎃**
