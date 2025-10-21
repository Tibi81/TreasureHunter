# 🚂 Railway.app Deployment Útmutató

## 🎯 Railway.app előnyök

- ✅ **Git push = automatikus deployment**
- ✅ **$5/hó kezdő csomag**
- ✅ **PostgreSQL ingyenes**
- ✅ **Custom domain ingyenes**
- ✅ **Gyors build idő**
- ✅ **Django + React egyben támogatás**

## 🚀 Gyors deployment

### 1. Railway.app regisztráció

1. Menj a [railway.app](https://railway.app) oldalra
2. Kattints a "Start a New Project" gombra
3. Regisztrálj GitHub fiókkal

### 2. Repository kapcsolás

1. **"Deploy from GitHub repo"** kiválasztása
2. **TreasureHunter repository** kiválasztása
3. **`production` ág** kiválasztása (FONTOS!)

### 3. Automatikus konfiguráció

Railway automatikusan felismeri:
- ✅ **Python projekt** (requirements.txt alapján)
- ✅ **Django alkalmazás** (manage.py alapján)
- ✅ **Frontend build** (package.json alapján)

### 4. Environment változók beállítása

Railway dashboard-ban:

```bash
SECRET_KEY = "your-super-secret-key-here"
DEBUG = "False"
DJANGO_SETTINGS_MODULE = "config.settings_production"
```

### 5. PostgreSQL adatbázis hozzáadása

1. **"New"** → **"Database"** → **"PostgreSQL"**
2. Automatikusan kapcsolódik az alkalmazáshoz
3. `DATABASE_URL` environment változó automatikusan beállítódik

## 📋 Deployment lépések

### Automatikus (ajánlott)

```bash
# Csak push-olj a production ágra
git checkout production
git add .
git commit -m "Railway deployment ready"
git push origin production
```

### Manuális ellenőrzés

```bash
# Lokális tesztelés
cd backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py runserver
```

## 🔧 Railway konfiguráció

### railway.toml fájl

```toml
# Railway.app konfigurációs fájl
python_version = "3.11"

[build]
build_command = "cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt"

[start]
start_command = "cd backend && python manage.py collectstatic --noinput && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT"

[env]
DJANGO_SETTINGS_MODULE = "config.settings_production"
DEBUG = "False"
```

### Build folyamat

1. **Frontend build**: `npm install && npm run build`
2. **Backend setup**: `pip install -r requirements.txt`
3. **Django setup**: `collectstatic && migrate`
4. **Server start**: `gunicorn` indítása

## 🌐 Domain beállítás

### Railway.app domain

- Automatikusan kapod: `your-app-name.railway.app`
- HTTPS automatikusan engedélyezve
- Custom domain hozzáadható

### Custom domain

1. **Railway dashboard** → **Settings** → **Domains**
2. **Custom domain** hozzáadása
3. **DNS beállítás** a domain provider-nél

## 📊 Monitoring és logok

### Railway dashboard

- ✅ **Real-time logok**
- ✅ **Build status**
- ✅ **Deployment history**
- ✅ **Resource usage**

### Logok megtekintése

```bash
# Railway CLI (opcionális)
npm install -g @railway/cli
railway login
railway logs
```

## 🐛 Hibaelhárítás

### Gyakori problémák

1. **Build hiba**
   - Ellenőrizd a `requirements.txt` fájlt
   - Frontend build hibák ellenőrzése

2. **Database hiba**
   - PostgreSQL service hozzáadása
   - `DATABASE_URL` environment változó ellenőrzése

3. **Static files hiba**
   - `collectstatic` futtatása
   - WhiteNoise middleware ellenőrzése

4. **CORS hiba**
   - `ALLOWED_HOSTS` ellenőrzése
   - Railway domain hozzáadása

### Debug mód

```bash
# Railway dashboard-ban
DEBUG = "True"  # Csak fejlesztéshez!
```

## 💰 Költségek

### Kezdő csomag ($5/hó)

- ✅ **Unlimited deployments**
- ✅ **512MB RAM**
- ✅ **1GB storage**
- ✅ **PostgreSQL database**
- ✅ **Custom domain**

### Pro csomag ($20/hó)

- ✅ **2GB RAM**
- ✅ **10GB storage**
- ✅ **Priority support**
- ✅ **Team collaboration**

## 🎯 Előnyök Render.com-hoz képest

| Funkció | Railway | Render |
|---------|---------|--------|
| **Deployment** | Git push | Git push |
| **Build idő** | ⚡ Gyors | 🐌 Lassabb |
| **Költség** | $5/hó | $7/hó |
| **PostgreSQL** | ✅ Ingyenes | ✅ Ingyenes |
| **Custom domain** | ✅ Ingyenes | ✅ Ingyenes |
| **Konfiguráció** | 🎯 Egyszerű | 🔧 Összetett |

## 🚀 Következő lépések

1. **Railway.app regisztráció**
2. **GitHub repository kapcsolás**
3. **Production ág deployment**
4. **Environment változók beállítása**
5. **PostgreSQL adatbázis hozzáadása**
6. **Custom domain beállítása**

---

**Sikeres deployment! 🎉**
