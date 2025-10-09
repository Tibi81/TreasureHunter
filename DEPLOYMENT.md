# 🎃 Halloween Treasure Hunter - Deployment Guide

## 🚀 Render.com Deployment

### Backend (Django) Settings

**Build Command:**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

**Start Command:**
```bash
gunicorn config.wsgi:application
```

**Environment Variables:**
- `SECRET_KEY`: Generate a new Django secret key
- `DEBUG`: `False`
- `DATABASE_URL`: Auto-provided by Render PostgreSQL
- `ALLOWED_HOSTS`: Auto-configured for Render

### Frontend (React) Settings

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
dist
```

### 🔧 Manual Setup Steps

1. **Create PostgreSQL Database** on Render
2. **Set Environment Variables** in Render dashboard
3. **Deploy Backend** first
4. **Deploy Frontend** second
5. **Update CORS settings** with actual domain

### 📝 Environment Variables Template

```bash
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### 🔒 Security Notes

- ✅ SECRET_KEY is environment-based
- ✅ DEBUG is disabled in production
- ✅ CORS is properly configured
- ✅ Database credentials are secure
- ✅ Static files are collected

### 🌐 Domain Configuration

Update these files with your actual Render domain:
- `backend/config/settings.py` - ALLOWED_HOSTS
- `backend/config/settings.py` - CORS_ALLOWED_ORIGINS
- `backend/config/settings.py` - CSRF_TRUSTED_ORIGINS

### 📊 Monitoring

- Check Render logs for any errors
- Monitor database connections
- Verify static file serving
- Test API endpoints

---

**Ready for production deployment! 🎉**
