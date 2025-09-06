# 🎃 Halloween Kincskereső - Backend

Django REST API a Halloween kincskereső játékhoz.

## 🚀 Gyors indítás

```bash
# Virtuális környezet aktiválása
myvenv\Scripts\activate  # Windows
# vagy
source myvenv/bin/activate  # Linux/Mac

# Függőségek telepítése
pip install -r requirements.txt

# Adatbázis migrálása
python manage.py migrate

# Admin felhasználó létrehozása
python manage.py createsuperuser

# Szerver indítása
python manage.py runserver
```

## 🔧 Admin felület

- URL: http://localhost:8000/admin/
- Bejelentkezés a létrehozott superuser fiókkal

## 📊 Modellek

- **Game** - Játékok kezelése
- **Team** - Csapatok (Tök, Szellem)
- **Player** - Játékosok
- **Station** - Állomások
- **Challenge** - Feladatok
- **GameProgress** - Játék haladás

## 🌐 API végpontok

- `POST /api/game/create/` - Új játék
- `POST /api/game/{id}/join/` - Csatlakozás
- `GET /api/game/{id}/status/` - Játék állapot
- `GET /api/game/{id}/team/{team}/challenge/` - Aktuális feladat
- `POST /api/game/{id}/team/{team}/validate/` - QR validálás
- `POST /api/game/{id}/team/{team}/help/` - Segítség

## 🎯 Játék beállítása

1. **Állomások létrehozása** (Station)
2. **Feladatok hozzáadása** (Challenge)
3. **Játék létrehozása** (Game)
4. **Csapatok hozzáadása** (Team)

Részletes útmutató: [README.md](../README.md)
