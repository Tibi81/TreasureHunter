#!/bin/bash
# Production Deployment Script
# Futtatás: ./deploy.sh

echo "🚀 Treasure Hunter Production Deployment"
echo "========================================"

# 1. Environment ellenőrzés
echo "📋 Environment ellenőrzés..."
if [ -z "$SECRET_KEY" ]; then
    echo "❌ SECRET_KEY environment variable hiányzik!"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable hiányzik!"
    exit 1
fi

# 2. Dependencies telepítése
echo "📦 Dependencies telepítése..."
pip install -r requirements.txt

# 3. Static files összegyűjtése
echo "📁 Static files összegyűjtése..."
python manage.py collectstatic --noinput

# 4. Database migrációk
echo "🗄️ Database migrációk..."
python manage.py migrate

# 5. Superuser létrehozása (opcionális)
echo "👤 Superuser létrehozása..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Superuser létrehozva: admin/admin123')
else:
    print('ℹ️ Superuser már létezik')
"

# 6. Logs könyvtár létrehozása
echo "📝 Logs könyvtár létrehozása..."
mkdir -p logs
chmod 755 logs

echo "✅ Deployment befejezve!"
echo "🚀 A szolgáltatás elindítható a következő paranccsal:"
echo "gunicorn --config gunicorn.conf.py config.wsgi:application"
