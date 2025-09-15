# 🎃 Halloween Kincskereső Játék 👻

Egy interaktív QR kód alapú kincskereső játék Halloween témában, Django backend-del és React frontend-del.

## 🚀 Funkciók

- **Csapatok**: 2 csapat (🎃 Tök Csapat és 👻 Szellem Csapat)
- **Játékosok**: Maximum 4 játékos (2-2 fő csapatonként)
- **Játék fázisok**: Külön versenyzés → Közös együttműködés
- **QR kódok**: Minden állomáson QR kód beolvasás szükséges
- **Segítség rendszer**: 1 segítség állomásonként
- **Admin felület**: Teljes játékkezelés Django admin-ban

## 📋 Előfeltételek

- Python 3.8+
- Node.js 16+
- npm vagy yarn

## 🛠️ Telepítés és futtatás

### Backend (Django)

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

# Szerver indítása
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend

# Függőségek telepítése
npm install

# Fejlesztői szerver indítása
npm run dev

# Vagy production build
npm run build
```

## 🎮 Játék használata

1. **Játékos csatlakozás**: Nyisd meg a frontend alkalmazást
2. **Név megadása**: Add meg a játékosneved
3. **Csapat választás**: Válassz a 🎃 Tök Csapat vagy 👻 Szellem Csapat között
4. **Játék indítása**: Amikor mindkét csapatban van 2 játékos, az admin indítja a játékot.
5. **QR kód beolvasás**: Minden állomáson be kell olvasni a QR kódot
6. **Segítség kérése**: Ha elakadsz, kérhetsz segítséget (1x állomásonként)

## 🔧 Admin felület beállítása

### 1. Admin felület elérése
- URL: `http://localhost:8000/admin/`
- Bejelentkezés a létrehozott superuser fiókkal

### 2. Állomások beállítása (Station)

Minden állomást külön be kell állítani:

| Állomás | Név | Ikon | Fázis |
|---------|-----|------|-------|
| 1 | Kezdő állomás | 🎃 | Külön Fázis |
| 2 | Kísértetek kastélya | 👻 | Külön Fázis |
| 3 | Pókok barlangja | 🕷️ | Külön Fázis |
| 4 | Denevérek tornya | 🦇 | Külön Fázis |
| 5 | Találkozási pont | 💀 | Közös Fázis |
| 6 | Boszorkány ház | 🧙‍♀️ | Közös Fázis |

### 3. Feladatok létrehozása (Challenge)

Minden állomáshoz feladatokat kell létrehozni:

#### Állomás 1 - Kezdő állomás
- **Csapat típus**: Tök Csapat
- **Cím**: "Halloween kincskeresés kezdete"
- **Leírás**: "Üdvözöljük a Halloween kincskereső játékban! Az első feladat: találjátok meg a 🎃 jelet a területen és olvassátok be a QR kódot!"
- **QR kód**: `station1_pumpkin`
- **Segítség**: "Keressétek a narancssárga tököt a bejáratnál!"

#### Állomás 1 - Kezdő állomás (Szellem Csapat)
- **Csapat típus**: Szellem Csapat
- **Cím**: "Szellemek útja kezdődik"
- **Leírás**: "A szellemek útja itt kezdődik! Keressétek meg a 👻 jelet és olvassátok be a QR kódot!"
- **QR kód**: `station1_ghost`
- **Segítség**: "A fehér szellem a kijáratnál vár!"

#### Állomás 2 - Kísértetek kastélya
- **Csapat típus**: Tök Csapat
- **Cím**: "Kísértetek kastélya"
- **Leírás**: "A kísértetek kastélyában rejtőzik a következő kincs! Keressétek meg a 👻 jelet!"
- **QR kód**: `station2_pumpkin`
- **Segítség**: "A kastély tornyában találjátok!"

#### Állomás 2 - Kísértetek kastélya (Szellem Csapat)
- **Csapat típus**: Szellem Csapat
- **Cím**: "Szellemek otthona"
- **Leírás**: "Itt laknak a szellemek! Keressétek meg a 👻 jelet!"
- **QR kód**: `station2_ghost`
- **Segítség**: "A kastély pincéjében rejtőzik!"

#### Állomás 3 - Pókok barlangja
- **Csapat típus**: Tök Csapat
- **Cím**: "Pókok barlangja"
- **Leírás**: "A pókok barlangjában óvatosan! Keressétek meg a 🕷️ jelet!"
- **QR kód**: `station3_pumpkin`
- **Segítség**: "A barlang bejáratánál!"

#### Állomás 3 - Pókok barlangja (Szellem Csapat)
- **Csapat típus**: Szellem Csapat
- **Cím**: "Pókháló labirintus"
- **Leírás**: "A pókháló labirintusban keressétek meg a 🕷️ jelet!"
- **QR kód**: `station3_ghost`
- **Segítség**: "A barlang mélyén!"

#### Állomás 4 - Denevérek tornya
- **Csapat típus**: Tök Csapat
- **Cím**: "Denevérek tornya"
- **Leírás**: "A denevérek tornyában a végső kincs! Keressétek meg a 🦇 jelet!"
- **QR kód**: `station4_pumpkin`
- **Segítség**: "A torony tetején!"

#### Állomás 4 - Denevérek tornya (Szellem Csapat)
- **Csapat típus**: Szellem Csapat
- **Cím**: "Denevér kolónia"
- **Leírás**: "A denevér kolóniában a végső kincs! Keressétek meg a 🦇 jelet!"
- **QR kód**: `station4_ghost`
- **Segítség**: "A torony alján!"

#### Állomás 5 - Találkozási pont (Közös)
- **Csapat típus**: (üres - közös feladat)
- **Cím**: "Találkozási pont"
- **Leírás**: "Gratulálunk! Mindkét csapat elérte a találkozási pontot! Most együttműködve keressétek meg a 💀 jelet!"
- **QR kód**: `station5_together`
- **Segítség**: "A központi területen!"

#### Állomás 6 - Boszorkány ház (Közös)
- **Csapat típus**: (üres - közös feladat)
- **Cím**: "Boszorkány ház"
- **Leírás**: "Az utolsó feladat! A boszorkány házban találjátok meg a végső kincset! Keressétek meg a 🧙‍♀️ jelet!"
- **QR kód**: `station6_final`
- **Segítség**: "A boszorkány ház kertjében!"

### 4. Játék létrehozása (Game)

1. **Új játék létrehozása**:
   - Név: "Halloween Kincskereső"
   - Állapot: "Beállítás"
   - Találkozási pont: 5

2. **Csapatok létrehozása**:
   - Tök Csapat (pumpkin)
   - Szellem Csapat (ghost)

### 5. Játékosok hozzáadása (Player)

- Minden csapathoz maximum 2 játékost lehet hozzáadni
- A játékosok neveit a frontend-en keresztül lehet megadni

## 🎯 Játék menete

### 1. Beállítás fázis
- Admin létrehozza a játékot és csapatokat
- Játékosok csatlakoznak a frontend-en keresztül
- Amikor mindkét csapatban van 2 játékos, a játék automatikusan elindul

### 2. Külön fázis (1-4. állomás)
- A csapatok versenyeznek egymással
- Minden csapat a saját feladatait oldja meg
- A cél: minél gyorsabban elérni a 4. állomást

### 3. Közös fázis (5-6. állomás)
- A csapatok együttműködnek
- Közös feladatok megoldása
- A végső cél: a 6. állomás elérése

## 🔍 QR kódok generálása

A QR kódokat bármilyen QR kód generátorral létrehozhatod:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QR Code Monkey](https://www.qrcode-monkey.com/)

**Fontos**: A QR kódoknak pontosan egyezniük kell az admin felületen beállított értékekkel!

## 🛠️ Fejlesztői információk

### Backend API végpontok
- `POST /api/game/create/` - Új játék létrehozása
- `POST /api/game/{id}/join/` - Játékos csatlakozás
- `GET /api/game/{id}/status/` - Játék állapot lekérdezése
- `GET /api/game/{id}/team/{team}/challenge/` - Aktuális feladat
- `POST /api/game/{id}/team/{team}/validate/` - QR kód validálás
- `POST /api/game/{id}/team/{team}/help/` - Segítség kérése

### Frontend komponensek
- `App.jsx` - Fő alkalmazás komponens
- `PlayerJoin.jsx` - Játékos csatlakozás
- `GameMap.jsx` - Játék térkép
- `ChallengePanel.jsx` - Feladat panel
- `GameResults.jsx` - Eredmények megjelenítése

## 🐛 Hibaelhárítás

### Gyakori problémák

1. **"Hálózati hiba" üzenet**
   - Ellenőrizd, hogy a Django szerver fut-e (`python manage.py runserver`)
   - A frontend `http://localhost:8000`-re mutat

2. **QR kód nem működik**
   - Ellenőrizd, hogy a QR kód pontosan egyezik-e az admin felületen beállított értékkel
   - A QR kód kis- és nagybetű érzékeny

3. **Játék nem indul el**
   - Ellenőrizd, hogy mindkét csapatban van-e 2 játékos
   - Az admin felületen ellenőrizd a játék állapotát

4. **Admin felület nem elérhető**
   - Ellenőrizd, hogy létrehoztad-e a superuser fiókot
   - Próbáld meg újra: `python manage.py createsuperuser`

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
