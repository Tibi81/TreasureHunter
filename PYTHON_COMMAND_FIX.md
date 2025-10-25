# 🚂 Railway Python Command Fix

## ❌ Probléma
Railway logokban: `python: command not found`

## ✅ Megoldás
Railway-ben a Python parancs `python3` néven érhető el, nem `python`.

## 🔧 Javított fájlok

### `railway.toml`
```toml
[start]
start_command = "cd backend && python3 manage.py collectstatic --noinput && python3 manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"
```

### `build.sh`
```bash
pip3 install -r backend/requirements.txt
```

### `start.sh`
```bash
pip3 install -r requirements.txt
python3 manage.py collectstatic --noinput
python3 manage.py migrate
```

### `Procfile`
```
web: cd backend && python3 manage.py collectstatic --noinput && python3 manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

## 🚀 Következő lépések

1. **Commitold a javításokat:**
   ```bash
   git add .
   git commit -m "Fix python command for Railway deployment"
   git push origin production
   ```

2. **Railway automatikusan újra deployol**
   - Railway figyeli a GitHub repository változásait
   - Automatikusan újra buildel és deployol

3. **Ellenőrizd a logokat**
   - Railway dashboard → Deployments → Latest deployment → Logs
   - Most már `python3` parancsokat kell látnod

## 🎯 Várható eredmény

Most már a logokban ezt kell látnod:
```
📦 Installing Python dependencies...
📊 Collecting static files...
🗄️ Running database migrations...
🎯 Starting Gunicorn server...
```

---

**Python parancs javítva! 🐍✅**
