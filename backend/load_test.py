#!/usr/bin/env python3
"""
Treasure Hunter Load Test Script
Teszteli az alkalmazás teljesítményét különböző terhelések mellett
"""

import asyncio
import aiohttp
import time
import statistics
import json
from concurrent.futures import ThreadPoolExecutor
import threading
from datetime import datetime

class LoadTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.results = []
        self.lock = threading.Lock()
        
    def log(self, message):
        """Naplózás timestamp-pel"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] {message}")
    
    async def make_request(self, session, endpoint, method="GET", data=None):
        """Egyetlen kérés küldése és mérése"""
        start_time = time.time()
        
        try:
            if method == "GET":
                async with session.get(f"{self.base_url}{endpoint}") as response:
                    content = await response.text()
                    status_code = response.status
            elif method == "POST":
                async with session.post(f"{self.base_url}{endpoint}", json=data) as response:
                    content = await response.text()
                    status_code = response.status
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # ms
            
            result = {
                'endpoint': endpoint,
                'method': method,
                'status_code': status_code,
                'response_time_ms': response_time,
                'success': 200 <= status_code < 300,
                'timestamp': start_time
            }
            
            with self.lock:
                self.results.append(result)
            
            return result
            
        except Exception as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            result = {
                'endpoint': endpoint,
                'method': method,
                'status_code': 0,
                'response_time_ms': response_time,
                'success': False,
                'error': str(e),
                'timestamp': start_time
            }
            
            with self.lock:
                self.results.append(result)
            
            return result
    
    async def run_concurrent_test(self, endpoint, concurrent_users=10, requests_per_user=10):
        """Párhuzamos felhasználók tesztelése"""
        self.log(f"🚀 Indítás: {concurrent_users} felhasználó, {requests_per_user} kérés/felhasználó")
        
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=50)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            tasks = []
            
            # Minden felhasználó számára kérések létrehozása
            for user_id in range(concurrent_users):
                for req_id in range(requests_per_user):
                    task = self.make_request(session, endpoint)
                    tasks.append(task)
            
            # Összes kérés párhuzamos futtatása
            start_time = time.time()
            results = await asyncio.gather(*tasks, return_exceptions=True)
            end_time = time.time()
            
            total_time = end_time - start_time
            total_requests = len(tasks)
            
            return {
                'total_requests': total_requests,
                'total_time_seconds': total_time,
                'requests_per_second': total_requests / total_time,
                'results': results
            }
    
    def analyze_results(self, test_results):
        """Eredmények elemzése"""
        results = test_results['results']
        
        # Szűrés sikeres kérésekre
        successful_results = [r for r in results if isinstance(r, dict) and r.get('success', False)]
        failed_results = [r for r in results if isinstance(r, dict) and not r.get('success', False)]
        
        if not successful_results:
            return {
                'success_rate': 0,
                'avg_response_time': 0,
                'min_response_time': 0,
                'max_response_time': 0,
                'p95_response_time': 0,
                'failed_requests': len(failed_results),
                'error_summary': {},
                'requests_per_second': test_results['requests_per_second']
            }
        
        response_times = [r['response_time_ms'] for r in successful_results]
        
        # Hiba összesítés
        error_summary = {}
        for result in failed_results:
            error_type = result.get('error', 'Unknown error')
            error_summary[error_type] = error_summary.get(error_type, 0) + 1
        
        return {
            'success_rate': len(successful_results) / len(results) * 100,
            'avg_response_time': statistics.mean(response_times),
            'min_response_time': min(response_times),
            'max_response_time': max(response_times),
            'p95_response_time': statistics.quantiles(response_times, n=20)[18] if len(response_times) > 1 else response_times[0],
            'failed_requests': len(failed_results),
            'error_summary': error_summary,
            'requests_per_second': test_results['requests_per_second']
        }
    
    def print_results(self, test_name, analysis):
        """Eredmények kiírása"""
        print(f"\n{'='*60}")
        print(f"📊 TESZT EREDMÉNYEK: {test_name}")
        print(f"{'='*60}")
        print(f"✅ Sikeres kérések: {analysis['success_rate']:.1f}%")
        print(f"⚡ Kérések/másodperc: {analysis['requests_per_second']:.2f}")
        print(f"⏱️  Átlagos válaszidő: {analysis['avg_response_time']:.2f} ms")
        print(f"📈 Min válaszidő: {analysis['min_response_time']:.2f} ms")
        print(f"📉 Max válaszidő: {analysis['max_response_time']:.2f} ms")
        print(f"🎯 95% válaszidő: {analysis['p95_response_time']:.2f} ms")
        
        if analysis['failed_requests'] > 0:
            print(f"❌ Sikertelen kérések: {analysis['failed_requests']}")
            for error, count in analysis['error_summary'].items():
                print(f"   - {error}: {count}x")
        
        # Teljesítmény értékelés
        if analysis['success_rate'] >= 95 and analysis['avg_response_time'] <= 500:
            print("🟢 KIVÁLÓ teljesítmény")
        elif analysis['success_rate'] >= 90 and analysis['avg_response_time'] <= 1000:
            print("🟡 JOBBAN ÁTLAGOS teljesítmény")
        elif analysis['success_rate'] >= 80:
            print("🟠 ÁTLAGOS teljesítmény")
        else:
            print("🔴 GYENGE teljesítmény")

async def run_load_tests():
    """Fő teszt futtatása"""
    tester = LoadTester()
    
    print("🎮 TREASURE HUNTER TERHELÉSES TESZT")
    print("="*60)
    
    # Tesztelendő végpontok
    test_scenarios = [
        {
            'name': 'Alapvető API végpontok',
            'endpoint': '/api/player/check-session/',
            'concurrent_users': [1, 5, 10, 20, 50],
            'requests_per_user': 10
        },
        {
            'name': 'Játék állapot lekérdezés',
            'endpoint': '/api/game/find/',
            'concurrent_users': [1, 5, 10, 20],
            'requests_per_user': 10
        },
        {
            'name': 'Intenzív terhelés teszt',
            'endpoint': '/api/player/check-session/',
            'concurrent_users': [100],
            'requests_per_user': 5
        }
    ]
    
    for scenario in test_scenarios:
        print(f"\n🧪 TESZT: {scenario['name']}")
        print(f"📍 Végpont: {scenario['endpoint']}")
        
        for concurrent_users in scenario['concurrent_users']:
            print(f"\n👥 {concurrent_users} párhuzamos felhasználó tesztelése...")
            
            # Teszt futtatása
            test_results = await tester.run_concurrent_test(
                scenario['endpoint'],
                concurrent_users,
                scenario['requests_per_user']
            )
            
            # Eredmények elemzése
            analysis = tester.analyze_results(test_results)
            
            # Eredmények kiírása
            tester.print_results(
                f"{scenario['name']} - {concurrent_users} felhasználó",
                analysis
            )
            
            # Rövid szünet a következő teszt előtt
            await asyncio.sleep(2)
    
    print(f"\n{'='*60}")
    print("🏁 TERHELÉSES TESZT BEFEJEZVE")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(run_load_tests())
