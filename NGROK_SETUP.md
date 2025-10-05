# Ngrok beállítás a Treasure Hunter játékhoz

## Miért ngrok?

Az ngrok lehetővé teszi, hogy a helyi szerveredet elérhetővé tedd az interneten anélkül, hogy bonyolult szerver konfigurációt kellene csinálnod. Tökéletes a gyerekekkel való teszteléshez!

## Telepítés

1. **Ngrok letöltése és telepítése:**
   - Menj a https://ngrok.com/download oldalra
   - Töltsd le és telepítsd az ngrok-ot
   - Regisztrálj egy ingyenes fiókot és add meg az auth token-t

2. **Auth token beállítása:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Használat

### Automatikus indítás (ajánlott)

1. **Windows Batch script:**
   ```bash
   start_with_ngrok.bat
   ```

2. **PowerShell script:**
   ```powershell
   .\start_with_ngrok.ps1
   ```

### Ngrok URL beállítása

**Egyszerű megoldás:** Az ngrok URL-t környezeti változóban állítjuk be!

1. **Futtasd a start scriptet:**
   ```bash
   start_with_ngrok.bat
   ```

2. **Add meg az ngrok URL-t** amikor kéri (pl: `https://abc123.ngrok.io`)

3. **A script automatikusan:**
   - Beállítja a környezeti változót
   - Elindítja a backend szervert
   - A Django automatikusan felismeri az ngrok URL-t

**Manuális módszer:**
```bash
cd backend
set NGROK_URL=https://abc123.ngrok.io
myvenv\Scripts\activate
python manage.py runserver
```

### Manuális indítás

1. **Backend szerver indítása:**
   ```bash
   cd backend
   myvenv\Scripts\activate
   python manage.py runserver
   ```

2. **Frontend szerver indítása (új terminálban):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Ngrok indítása (harmadik terminálban):**
   ```bash
   ngrok http 8000
   ```

## Frontend beállítása

1. Nyisd meg a frontend-et: http://localhost:5173
2. Kattints a jobb alsó sarokban lévő "🌐 Ngrok" gombra
3. Másold be az ngrok által generált URL-t (pl: https://abc123.ngrok.io)
4. Mentsd el a beállítást

## Játék megosztása

1. Az ngrok URL-t oszd meg a gyerekeiddel
2. Mindenki ugyanazt az URL-t használja
3. Az admin panelen keresztül kezeld a játékot
4. A játékosok a megosztott linken keresztül csatlakozhatnak

## Fontos megjegyzések

- **Biztonság:** Az ngrok URL nyilvánosan elérhető, csak megbízható emberekkel oszd meg
- **Stabilitás:** Az ingyenes ngrok URL minden újraindításkor változik
- **Teljesítmény:** A játék teljesen működik, de lehet, hogy kicsit lassabb lesz
- **Leállítás:** Amikor kész vagy, állítsd le mind a három szervert

## Hibaelhárítás

- **"Connection refused" hiba:** Ellenőrizd, hogy a backend fut-e (http://localhost:8000)
- **CORS hiba:** A backend már be van állítva az ngrok-hoz
- **URL nem működik:** Ellenőrizd, hogy az ngrok fut-e és a helyes URL-t adtad meg

## Alternatív megoldások

Ha az ngrok nem tetszik, más lehetőségeid:

1. **Cloudflare Tunnel** (ingyenes, stabil URL)
2. **LocalTunnel** (npm csomag)
3. **Serveo** (SSH alapú)
4. **VPS szerver** (pl. DigitalOcean, Linode)

De az ngrok a legegyszerűbb és leggyorsabb megoldás teszteléshez!
