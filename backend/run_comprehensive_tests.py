#!/usr/bin/env python3
"""
Átfogó teszt futtató script
Futtatja az összes tesztet és generál egy részletes jelentést
"""
import os
import sys
import subprocess
import time
from datetime import datetime

def run_command(command, description):
    """Parancs futtatása és eredmények kiírása"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    print(f"Parancs: {command}")
    print("-" * 60)
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Időtartam: {duration:.2f} másodperc")
        print(f"📊 Visszatérési kód: {result.returncode}")
        
        if result.stdout:
            print("\n📤 STDOUT:")
            print(result.stdout)
        
        if result.stderr:
            print("\n❌ STDERR:")
            print(result.stderr)
        
        return result.returncode == 0, duration
        
    except Exception as e:
        print(f"❌ Hiba a parancs futtatásakor: {e}")
        return False, 0

def main():
    """Fő teszt futtató függvény"""
    print("🎮 TREASURE HUNTER ÁTFOGÓ TESZT FUTTATÓ")
    print("=" * 60)
    print(f"📅 Dátum: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Munkakönyvtár: {os.getcwd()}")
    print("=" * 60)
    
    # Teszt eredmények tárolása
    test_results = []
    
    # 1. Backend egységtesztek
    print("\n🔧 BACKEND EGYSÉGTESZTEK")
    print("-" * 40)
    
    backend_tests = [
        ("python manage.py test treasurehunt.test_comprehensive_game_simulation", "Átfogó játék szimulációs tesztek"),
        ("python manage.py test treasurehunt.test_integration", "Integrációs tesztek"),
        ("python manage.py test treasurehunt.test_flexible_game", "Rugalmas játék tesztek"),
        ("python manage.py test treasurehunt.test_views", "View tesztek"),
        ("python manage.py test treasurehunt.tests", "Alapvető tesztek")
    ]
    
    for command, description in backend_tests:
        success, duration = run_command(command, description)
        test_results.append({
            'name': description,
            'success': success,
            'duration': duration,
            'type': 'backend'
        })
    
    # 2. Backend linting
    print("\n🔍 BACKEND LINTING")
    print("-" * 40)
    
    linting_commands = [
        ("python -m flake8 treasurehunt/ --max-line-length=120", "Flake8 linting"),
        ("python -m black --check treasurehunt/", "Black formátum ellenőrzés"),
        ("python -m isort --check-only treasurehunt/", "Import rendezés ellenőrzés")
    ]
    
    for command, description in linting_commands:
        success, duration = run_command(command, description)
        test_results.append({
            'name': description,
            'success': success,
            'duration': duration,
            'type': 'linting'
        })
    
    # 3. Frontend tesztek (ha elérhető)
    print("\n🎨 FRONTEND TESZTEK")
    print("-" * 40)
    
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
    if os.path.exists(frontend_dir):
        os.chdir(frontend_dir)
        
        frontend_tests = [
            ("npm test", "Frontend tesztek"),
            ("npm run lint", "Frontend linting"),
            ("npm run build", "Frontend build teszt")
        ]
        
        for command, description in frontend_tests:
            success, duration = run_command(command, description)
            test_results.append({
                'name': description,
                'success': success,
                'duration': duration,
                'type': 'frontend'
            })
        
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
    else:
        print("⚠️  Frontend könyvtár nem található, frontend tesztek kihagyva")
    
    # 4. Adatbázis migráció teszt
    print("\n🗄️  ADATBÁZIS MIGRÁCIÓ TESZT")
    print("-" * 40)
    
    db_tests = [
        ("python manage.py makemigrations --dry-run", "Migráció ellenőrzés"),
        ("python manage.py check", "Django konfiguráció ellenőrzés"),
        ("python manage.py validate", "Modell validáció")
    ]
    
    for command, description in db_tests:
        success, duration = run_command(command, description)
        test_results.append({
            'name': description,
            'success': success,
            'duration': duration,
            'type': 'database'
        })
    
    # 5. Teljesítmény teszt
    print("\n⚡ TELJESÍTMÉNY TESZT")
    print("-" * 40)
    
    performance_tests = [
        ("python manage.py test treasurehunt.test_comprehensive_game_simulation.ComprehensiveGameSimulationTest.test_large_game_simulation", "Nagy játék szimuláció"),
        ("python manage.py test treasurehunt.test_comprehensive_game_simulation.PerformanceTest", "Teljesítmény tesztek")
    ]
    
    for command, description in performance_tests:
        success, duration = run_command(command, description)
        test_results.append({
            'name': description,
            'success': success,
            'duration': duration,
            'type': 'performance'
        })
    
    # 6. Eredmények összefoglalása
    print("\n📊 TESZT EREDMÉNYEK ÖSSZEFOGLALÁSA")
    print("=" * 60)
    
    total_tests = len(test_results)
    successful_tests = sum(1 for result in test_results if result['success'])
    failed_tests = total_tests - successful_tests
    total_duration = sum(result['duration'] for result in test_results)
    
    print(f"📈 Összes teszt: {total_tests}")
    print(f"✅ Sikeres: {successful_tests}")
    print(f"❌ Sikertelen: {failed_tests}")
    print(f"📊 Sikerességi arány: {(successful_tests/total_tests)*100:.1f}%")
    print(f"⏱️  Összes időtartam: {total_duration:.2f} másodperc")
    
    # Teszt típusok szerinti bontás
    print("\n📋 TESZT TÍPUSOK SZERINTI BONTÁS:")
    print("-" * 40)
    
    test_types = {}
    for result in test_results:
        test_type = result['type']
        if test_type not in test_types:
            test_types[test_type] = {'total': 0, 'successful': 0}
        test_types[test_type]['total'] += 1
        if result['success']:
            test_types[test_type]['successful'] += 1
    
    for test_type, stats in test_types.items():
        success_rate = (stats['successful'] / stats['total']) * 100
        print(f"   {test_type}: {stats['successful']}/{stats['total']} ({success_rate:.1f}%)")
    
    # Sikertelen tesztek listázása
    if failed_tests > 0:
        print("\n❌ SIKERTELEN TESZTEK:")
        print("-" * 40)
        for result in test_results:
            if not result['success']:
                print(f"   • {result['name']} ({result['type']})")
    
    # Végső értékelés
    print("\n🎯 VÉGSŐ ÉRTÉKELÉS")
    print("=" * 60)
    
    if failed_tests == 0:
        print("🎉 MINDEN TESZT SIKERES!")
        print("✅ A játék készen áll a használatra!")
    elif failed_tests <= total_tests * 0.1:  # 10% alatt sikertelen
        print("⚠️  TÖBBNYIRE SIKERES")
        print("🔧 Néhány kisebb probléma van, de a játék használható")
    else:
        print("❌ SOK SIKERTELEN TESZT")
        print("🚨 A játékban komoly problémák vannak, javítás szükséges")
    
    print(f"\n📅 Teszt befejezve: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Visszatérési kód
    return 0 if failed_tests == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
