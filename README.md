# 🎃 Halloween Kincskereső Játék 👻

Egy interaktív QR kód alapú kincskereső játék Halloween témában, Django backend-del és React frontend-del.

## ⚠️ Fontos közlemény

**A `main` ág jelenleg nem stabil** - ismert hibák vannak benne (lassú kommunikáció, CORS problémák).  
**Használd a `refactor` ágat** - ez a stabil, működőképes verzió.

## 🚀 Gyors kezdés

```bash
git clone https://github.com/your-username/TreasureHunter.git
cd TreasureHunter
git checkout refactor
```

## 📋 Ágak állapota

- ✅ **`refactor`** - Stabil, ajánlott használatra (jelenlegi)
- ⚠️ **`main`** - Fejlesztés alatt, hibák vannak
- 🚀 **`production`** - Production deployment konfiguráció

## 🚀 Funkciók

### 🎮 Játék funkciók
- **Rugalmas csapat beállítás**: 1-2 csapat választható
- **Konfigurálható játékosok**: 1-8 játékos (admin által beállítható)
- **Játék módok**: 
  - **1 csapat**: Egyedül vagy együttműködés
  - **2 csapat**: Verseny mód (külön fázis → közös fázis)
- **QR kódok**: Minden állomáson QR kód beolvasás szükséges
- **Segítség rendszer**: 1 segítség állomásonként
- **Mentés rendszer**: 1 mentés külön fázisban, 1 mentés közös fázisban
- **Session kezelés**: Játékosok kiléphetnek és visszatérhetnek
- **Valós idejű progress**: Mindkét csapat haladásának megjelenítése

### 🛠️ Admin funkciók
- **Teljes játékkezelés**: Játék létrehozás, szerkesztés, törlés
- **Rugalmas játék konfiguráció**: Csapatok és játékosok számának beállítása
- **Játékos kezelés**: Hozzáadás, eltávolítás, áthelyezés
- **Valós idejű monitoring**: Csapatok haladásának követése
- **Játék állapot kezelés**: Indítás, leállítás, visszaállítás
- **Modern admin felület**: React alapú, felhasználóbarát

### 🔐 Biztonsági funkciók
- **Session token rendszer**: Biztonságos játékos azonosítás
- **Token lejárat**: Automatikus session kezelés
- **Kilépés opciók**: Szüneteltetés vagy végleges kijelentkezés
- **Adatbázis optimalizálás**: Indexek és prefetch optimalizálás

## 📋 Előfeltételek

- Python 3.8+
- Node.js 16+
- npm vagy yarn

## 🛠️ Telepítés és futtatás

### 1. Repository klónozása és ág választása

```bash
# Repository klónozása
git clone https://github.com/your-username/TreasureHunter.git
cd TreasureHunter

# Stabil ág használata (FONTOS!)
git checkout refactor
```

### 2. Backend (Django) - Egyben deployment

```bash
# Virtuális környezet létrehozása
python -m venv myvenv

# Aktiválás (Windows)
myvenv\Scripts\activate

# Aktiválás (Linux/Mac)
source myvenv/bin/activate

# Függőségek telepítése
cd backend
pip install -r requirements.txt

# Adatbázis migrálása
python manage.py migrate

# Admin felhasználó létrehozása
python manage.py createsuperuser

# Teszt adatok betöltése (opcionális)
python manage.py setup_test_data

# Frontend build (egyben deployment)
cd ../frontend
npm install
npm run build

# Szerver indítása (Django szolgálja a frontend-et)
cd ../backend
python manage.py runserver
```

### 3. Alkalmazás elérése

- **Játékosok**: `http://localhost:8000`
- **Admin felület**: `http://localhost:8000/admin`

> **Megjegyzés**: A `refactor` ágban a Django szerver szolgálja a React frontend-et statikus fájlként. Nincs szükség külön frontend szerverre!

## 🎮 Játék használata

### Játékosok számára

1. **Játékos csatlakozás**: 
   - Nyisd meg a frontend alkalmazást: `http://localhost:8000` (Django szerver)
   - Add meg a játék kódját
   - Add meg a játékosneved és válassz csapatot

2. **Játék menete**:
   - **QR kód beolvasás**: Minden állomáson be kell olvasni a QR kódot
   - **Segítség kérése**: Ha elakadsz, kérhetsz segítséget (1x állomásonként)
   - **Mentés használata**: 1x külön fázisban, 1x közös fázisban
   - **Progress követés**: Láthatod mindkét csapat haladását

3. **Kilépés opciók**:
   - **Szüneteltetés**: Később folytathatod ugyanitt (session token megmarad)
   - **Kijelentkezés**: Végleges kilépés (nem térhetsz vissza)

### Adminok számára

1. **Admin felület elérése**: 
   - URL: `http://localhost:8000/admin`
   - Bejelentkezés a létrehozott admin fiókkal

2. **Játék létrehozása**:
   - Új játék létrehozása
   - Csapatok és játékosok számának beállítása (1-2 csapat, 1-8 játékos)
   - Csapatok automatikus létrehozása
   - Játékosok hozzáadása

3. **Játék kezelése**:
   - Játék indítása/leállítása
   - Játékosok kezelése (hozzáadás, eltávolítás, áthelyezés)
   - Valós idejű progress monitoring
   - Játék visszaállítása

## 🏗️ Architektúra

### Backend struktúra
```
backend/
├── treasurehunt/
│   ├── api/
│   │   ├── game_views.py      # Játék kezelési API
│   │   ├── player_views.py    # Játékos kezelési API
│   │   ├── challenge_views.py # Feladat kezelési API
│   │   └── admin_views.py     # Admin API
│   ├── models.py              # Adatbázis modellek
│   ├── services.py            # Üzleti logika
│   ├── game_state_manager.py  # Játék állapot kezelés
│   └── session_token_services.py # Session kezelés
```

### Frontend struktúra
```
frontend/src/
├── components/
│   ├── admin/                 # Admin komponensek
│   ├── ProgressDisplay.jsx    # Haladás megjelenítés
│   ├── ChallengePanel.jsx     # Feladat panel
│   ├── GameExitDialog.jsx     # Kilépés dialógus
│   └── Toast.jsx              # Értesítések
├── services/
│   └── api.js                 # API kommunikáció
└── utils/
    └── gameUtils.js           # Segédfunkciók
```

## ⚙️ Játék konfiguráció

### Játék módok

#### 1 csapatos játék
- **Játékosok**: 1-8 játékos
- **Csapatok**: 1 csapat (🎮 Főcsapat)
- **Játékmenet**: Egyedül vagy együttműködés
- **Fázisok**: Csak közös fázis (5-6. állomás)

#### 2 csapatos játék (verseny)
- **Játékosok**: 2, 4, 6, vagy 8 játékos
- **Csapatok**: 2 csapat (🎃 Tök Csapat és 👻 Szellem Csapat)
- **Játékmenet**: Verseny → Együttműködés
- **Fázisok**: Külön fázis (1-4. állomás) → Közös fázis (5-6. állomás)

### Játékos elosztás
- **1 csapat**: Minden játékos ugyanabban a csapatban
- **2 csapat**: Játékosok egyenlően elosztva (pl. 4 játékos = 2-2 fő/csapat)

## 🔧 Admin felület beállítása

### 1. Állomások beállítása (Station)

Minden állomást külön be kell állítani:

| Állomás | Név | Ikon | Fázis |
|---------|-----|------|-------|
| 1 | Kezdő állomás | 🎃 | Külön Fázis |
| 2 | Kísértetek kastélya | 👻 | Külön Fázis |
| 3 | Pókok barlangja | 🕷️ | Külön Fázis |
| 4 | Denevérek tornya | 🦇 | Külön Fázis |
| 5 | Találkozási pont | 💀 | Közös Fázis |
| 6 | Boszorkány ház | 🧙‍♀️ | Közös Fázis |

### 2. Feladatok létrehozása (Challenge)

Minden állomáshoz feladatokat kell létrehozni:

#### Külön fázis feladatok (1-4. állomás)
- **Csapat típus**: Tök Csapat vagy Szellem Csapat
- **Cím**: Feladat címe
- **Leírás**: Részletes feladat leírás
- **QR kód**: Egyedi azonosító (pl. `station1_pumpkin`)
- **Segítség**: Segítség szöveg

#### Közös fázis feladatok (5-6. állomás)
- **Csapat típus**: (üres - közös feladat)
- **Cím**: Feladat címe
- **Leírás**: Részletes feladat leírás
- **QR kód**: Egyedi azonosító (pl. `station5_together`)
- **Segítség**: Segítség szöveg

### 3. Teszt adatok betöltése

```bash
# Halloween témájú teszt adatok
python manage.py setup_halloween_game

# Vagy általános teszt adatok
python manage.py setup_test_data
```

## 🎯 Játék menete

### 1. Beállítás fázis
- Admin létrehozza a játékot és beállítja a csapatok/játékosok számát
- Csapatok automatikusan létrejönnek a beállítások alapján
- Játékosok csatlakoznak a frontend-en keresztül
- A játék automatikusan elindul, amikor elegendő játékos csatlakozott

### 2. Külön fázis (1-4. állomás) - Csak 2 csapatos játékban
- A csapatok versenyeznek egymással
- Minden csapat a saját feladatait oldja meg
- A cél: minél gyorsabban elérni a 4. állomást
- 1 mentés használható

### 3. Közös fázis (5-6. állomás)
- **2 csapatos játék**: A csapatok együttműködnek
- **1 csapatos játék**: A játékos(ok) együtt dolgoznak
- Közös feladatok megoldása
- A végső cél: a 6. állomás elérése
- 1 mentés használható

## 🔍 QR kódok generálása

A QR kódokat bármilyen QR kód generátorral létrehozhatod:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QR Code Monkey](https://www.qrcode-monkey.com/)

**Fontos**: A QR kódoknak pontosan egyezniük kell az admin felületen beállított értékekkel!

## 🛠️ Fejlesztői információk

### Backend API végpontok

#### Játék kezelés
- `GET /api/game/find/` - Aktív játék keresése
- `GET /api/game/code/<code>/` - Játék keresése kód alapján
- `POST /api/game/create/` - Új játék létrehozása
- `POST /api/game/<id>/start/` - Játék indítása
- `DELETE /api/game/<id>/reset/` - Játék visszaállítása
- `POST /api/game/<id>/stop/` - Játék leállítása
- `GET /api/game/<id>/status/` - Játék állapot lekérdezése

#### Játékos kezelés
- `POST /api/game/<id>/join/` - Játékos csatlakozás
- `GET /api/player/status/` - Játékos állapot lekérdezése
- `POST /api/player/check-session/` - Session ellenőrzés
- `POST /api/player/exit/` - Játék szüneteltetése
- `POST /api/player/restore-session/` - Session visszaállítása
- `POST /api/player/logout/` - Végleges kijelentkezés

#### Feladat kezelés
- `GET /api/game/<id>/team/<team>/challenge/` - Aktuális feladat
- `POST /api/game/<id>/team/<team>/validate/` - QR kód validálás
- `POST /api/game/<id>/team/<team>/help/` - Segítség kérése

#### Admin funkciók
- `GET /api/admin/games/` - Játékok listázása
- `POST /api/game/<id>/player/add/` - Játékos hozzáadása
- `DELETE /api/game/<id>/player/<player_id>/remove/` - Játékos eltávolítása
- `POST /api/game/<id>/player/<player_id>/move/` - Játékos áthelyezése

### Frontend komponensek

#### Fő komponensek
- `App.jsx` - Fő alkalmazás komponens
- `Welcome.jsx` - Kezdőoldal
- `PlayerRegistration.jsx` - Játékos regisztráció
- `AdminPanel.jsx` - Admin felület

#### Játék komponensek
- `ProgressDisplay.jsx` - Haladás megjelenítés (minden csapat)
- `ChallengePanel.jsx` - Feladat panel
- `GameResults.jsx` - Eredmények megjelenítése
- `GameExitDialog.jsx` - Kilépés dialógus
- `Toast.jsx` - Értesítések

#### Admin komponensek
- `GameList.jsx` - Játékok listája
- `GameManage.jsx` - Játék kezelés
- `GameCreate.jsx` - Játék létrehozás
- `PlayerAddModal.jsx` - Játékos hozzáadás

## 🐛 Hibaelhárítás

### Gyakori problémák

1. **"Hálózati hiba" üzenet**
   - Ellenőrizd, hogy a Django szerver fut-e (`python manage.py runserver`)
   - A frontend `http://localhost:8000`-re mutat

2. **QR kód nem működik**
   - Ellenőrizd, hogy a QR kód pontosan egyezik-e az admin felületen beállított értékkel
   - A QR kód kis- és nagybetű érzékeny

3. **Játék nem indul el**
   - Ellenőrizd, hogy elegendő játékos csatlakozott-e (a beállított számnak megfelelően)
   - Az admin felületen ellenőrizd a játék állapotát és konfigurációját

4. **Admin felület nem elérhető**
   - Ellenőrizd, hogy létrehoztad-e a superuser fiókot
   - Próbáld meg újra: `python manage.py createsuperuser`

5. **Session token hibák**
   - Töröld a localStorage-t a böngészőben
   - Próbáld meg újra bejelentkezni

6. **Progress nem frissül**
   - Frissítsd az oldalt (F5)
   - Ellenőrizd a böngésző konzolt hibákért

## 📝 Licenc

MIT License - szabadon használható és módosítható.

## 🤝 Közreműködés

Ha szeretnél hozzájárulni a projekthez:
1. Fork-old a repository-t
2. Készíts egy új branch-et
3. Commit-old a változtatásaidat
4. Push-old a branch-et
5. Nyiss egy Pull Request-et

## 📞 Kapcsolat

Ha bármilyen kérdésed van, nyiss egy Issue-t a GitHub repository-ban.

---

**Jó szórakozást a kincskereséshez! 🎃👻**