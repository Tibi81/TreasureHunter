# Railway PostgreSQL beállítás - Gyors útmutató

## ✅ Amit már megtettünk:

1. **PostgreSQL adatbázis létrehozva a Railway-ban**
2. **settings_production.py módosítva** - PostgreSQL használata beállítva

## 🔗 Összekapcsolás lépései:

### 1. Railway Dashboard megnyitása
Nyisd meg: https://railway.app/dashboard

### 2. PostgreSQL Service megkeresése
- Keresd meg a **PostgreSQL** service-t
- Kattints rá

### 3. DATABASE_URL másolása
- A **Variables** fülön keresd meg a **DATABASE_URL** változót
- Másold ki az értékét (pl: `postgresql://postgres:password@host:port/db`)

### 4. TreasureHunter alkalmazás service
- Válts vissza a **TreasureHunter** service-re
- Menj a **Variables** fülre

### 5. DATABASE_URL hozzáadása
- Kattints az **"Add Variable"** gombra
- Név: `DATABASE_URL`
- Érték: `<az előzőből másolt érték>`
- Mentés!

### 6. Deployment újraindítása
A Railway automatikusan újradeploy-olja az alkalmazást az új adatbázis változóval.

## 🎯 Eredmény:
Az alkalmazás most a PostgreSQL adatbázist fogja használni Railway production környezetben!

