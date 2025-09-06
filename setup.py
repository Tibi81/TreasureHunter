#!/usr/bin/env python3
"""
Halloween Kincskereső Játék - Automatikus telepítő script
"""

import os
import sys
import subprocess
import platform

def run_command(command, cwd=None):
    """Futtat egy parancsot és visszaadja az eredményt"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    print("🎃 Halloween Kincskereső Játék - Telepítő 👻")
    print("=" * 50)
    
    # Python ellenőrzése
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ szükséges!")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} észlelve")
    
    # Backend telepítése
    print("\n🔧 Backend telepítése...")
    
    # Virtuális környezet létrehozása
    venv_name = "myvenv"
    if not os.path.exists(venv_name):
        success, output = run_command(f"python -m venv {venv_name}")
        if not success:
            print(f"❌ Virtuális környezet létrehozása sikertelen: {output}")
            sys.exit(1)
        print("✅ Virtuális környezet létrehozva")
    
    # Aktiválási parancs meghatározása
    if platform.system() == "Windows":
        activate_cmd = f"{venv_name}\\Scripts\\activate"
        pip_cmd = f"{venv_name}\\Scripts\\pip"
        python_cmd = f"{venv_name}\\Scripts\\python"
    else:
        activate_cmd = f"source {venv_name}/bin/activate"
        pip_cmd = f"{venv_name}/bin/pip"
        python_cmd = f"{venv_name}/bin/python"
    
    # Függőségek telepítése
    success, output = run_command(f"{pip_cmd} install -r backend/requirements.txt")
    if not success:
        print(f"❌ Függőségek telepítése sikertelen: {output}")
        sys.exit(1)
    print("✅ Backend függőségek telepítve")
    
    # Adatbázis migrálása
    success, output = run_command(f"{python_cmd} manage.py migrate", cwd="backend")
    if not success:
        print(f"❌ Adatbázis migrálása sikertelen: {output}")
        sys.exit(1)
    print("✅ Adatbázis migrálva")
    
    # Frontend telepítése
    print("\n🎨 Frontend telepítése...")
    
    # Node.js ellenőrzése
    success, output = run_command("node --version")
    if not success:
        print("❌ Node.js nincs telepítve! Kérlek telepítsd a https://nodejs.org/ oldalról")
        sys.exit(1)
    
    print(f"✅ Node.js {output.strip()} észlelve")
    
    # npm függőségek telepítése
    success, output = run_command("npm install", cwd="frontend")
    if not success:
        print(f"❌ Frontend függőségek telepítése sikertelen: {output}")
        sys.exit(1)
    print("✅ Frontend függőségek telepítve")
    
    print("\n🎉 Telepítés befejezve!")
    print("\n📋 Következő lépések:")
    print("1. Admin felhasználó létrehozása:")
    print(f"   {python_cmd} manage.py createsuperuser")
    print("2. Backend szerver indítása:")
    print(f"   {python_cmd} manage.py runserver")
    print("3. Frontend szerver indítása (új terminálban):")
    print("   cd frontend && npm run dev")
    print("4. Admin felület: http://localhost:8000/admin/")
    print("5. Játék: http://localhost:5173/")
    
    print("\n📖 Részletes útmutató: README.md")

if __name__ == "__main__":
    main()
