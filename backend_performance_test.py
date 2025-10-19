# backend_performance_test.py - Backend API Performance Test
import time
import requests
import json
from datetime import datetime

# Test configuration
BASE_URL = "https://treasurehunter-mz1x.onrender.com"
# BASE_URL = "http://127.0.0.1:8000"  # Local testing

class BackendPerformanceTest:
    def __init__(self):
        self.session = requests.Session()
        self.csrf_token = None
        self.test_results = {}
        
    def get_csrf_token(self):
        """Get CSRF token for POST requests"""
        try:
            response = self.session.get(f"{BASE_URL}/api/csrf-token/")
            if response.status_code == 200:
                data = response.json()
                self.csrf_token = data.get('csrf_token')
                if self.csrf_token:
                    print(f"✅ CSRF token obtained: {self.csrf_token[:10]}...")
                    return True
                else:
                    print(f"❌ CSRF token not found in response: {data}")
                    return False
            else:
                print(f"❌ Failed to get CSRF token: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ CSRF token error: {e}")
            return False
    
    def test_game_creation(self):
        """Test game creation performance"""
        print("\n🚀 TESTING GAME CREATION PERFORMANCE")
        print("=" * 50)
        
        if not self.get_csrf_token():
            return False
            
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': self.csrf_token
        }
        
        data = {
            'name': f'PerformanceTestGame{datetime.now().strftime("%H%M%S")}',
            'admin_name': 'PerformanceTestAdmin',
            'max_players': 4,
            'team_count': 2
        }
        
        # Measure API call time
        start_time = time.time()
        
        try:
            response = self.session.post(
                f"{BASE_URL}/api/game/create/",
                headers=headers,
                json=data,
                timeout=60  # 60 second timeout
            )
            
            end_time = time.time()
            duration = (end_time - start_time) * 1000  # Convert to milliseconds
            
            print(f"📡 API Response Time: {duration:.2f}ms")
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 201:
                response_data = response.json()
                game_id = response_data.get('game', {}).get('id')
                print(f"✅ Game created successfully: {game_id}")
                print(f"🎯 Performance: {'✅ EXCELLENT' if duration < 1000 else '⚠️ ACCEPTABLE' if duration < 5000 else '❌ SLOW'}")
                
                self.test_results['create_game'] = {
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'success': True,
                    'game_id': game_id
                }
                return game_id
            else:
                print(f"❌ Game creation failed: {response.text}")
                self.test_results['create_game'] = {
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'success': False,
                    'error': response.text
                }
                return None
                
        except requests.exceptions.Timeout:
            print("❌ Request timed out (>60s)")
            self.test_results['create_game'] = {
                'duration_ms': 60000,
                'status_code': 408,
                'success': False,
                'error': 'Timeout'
            }
            return None
        except Exception as e:
            print(f"❌ Request error: {e}")
            self.test_results['create_game'] = {
                'duration_ms': 0,
                'status_code': 0,
                'success': False,
                'error': str(e)
            }
            return None
    
    def test_game_deletion(self, game_id):
        """Test game deletion performance"""
        print("\n🗑️ TESTING GAME DELETION PERFORMANCE")
        print("=" * 50)
        
        if not game_id:
            print("❌ No game ID provided for deletion test")
            return False
            
        headers = {
            'X-CSRFToken': self.csrf_token
        }
        
        # Measure API call time
        start_time = time.time()
        
        try:
            response = self.session.delete(
                f"{BASE_URL}/api/game/{game_id}/delete/",
                headers=headers,
                timeout=60  # 60 second timeout
            )
            
            end_time = time.time()
            duration = (end_time - start_time) * 1000  # Convert to milliseconds
            
            print(f"📡 API Response Time: {duration:.2f}ms")
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ Game deleted successfully")
                print(f"🎯 Performance: {'✅ EXCELLENT' if duration < 1000 else '⚠️ ACCEPTABLE' if duration < 5000 else '❌ SLOW'}")
                
                self.test_results['delete_game'] = {
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'success': True
                }
                return True
            else:
                print(f"❌ Game deletion failed: {response.text}")
                self.test_results['delete_game'] = {
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'success': False,
                    'error': response.text
                }
                return False
                
        except requests.exceptions.Timeout:
            print("❌ Request timed out (>60s)")
            self.test_results['delete_game'] = {
                'duration_ms': 60000,
                'status_code': 408,
                'success': False,
                'error': 'Timeout'
            }
            return False
        except Exception as e:
            print(f"❌ Request error: {e}")
            self.test_results['delete_game'] = {
                'duration_ms': 0,
                'status_code': 0,
                'success': False,
                'error': str(e)
            }
            return False
    
    def test_games_list(self):
        """Test games list performance"""
        print("\n📋 TESTING GAMES LIST PERFORMANCE")
        print("=" * 50)
        
        # Measure API call time
        start_time = time.time()
        
        try:
            response = self.session.get(
                f"{BASE_URL}/api/admin/games/",
                timeout=30
            )
            
            end_time = time.time()
            duration = (end_time - start_time) * 1000  # Convert to milliseconds
            
            print(f"📡 API Response Time: {duration:.2f}ms")
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                games_count = len(data.get('games', []))
                print(f"✅ Games list retrieved: {games_count} games")
                print(f"🎯 Performance: {'✅ EXCELLENT' if duration < 500 else '⚠️ ACCEPTABLE' if duration < 2000 else '❌ SLOW'}")
                
                self.test_results['list_games'] = {
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'success': True,
                    'games_count': games_count
                }
                return True
            else:
                print(f"❌ Games list failed: {response.text}")
                self.test_results['list_games'] = {
                    'duration_ms': duration,
                    'status_code': response.status_code,
                    'success': False,
                    'error': response.text
                }
                return False
                
        except Exception as e:
            print(f"❌ Request error: {e}")
            self.test_results['list_games'] = {
                'duration_ms': 0,
                'status_code': 0,
                'success': False,
                'error': str(e)
            }
            return False
    
    def run_all_tests(self):
        """Run all performance tests"""
        print("🧪 BACKEND PERFORMANCE TEST SUITE")
        print("=" * 60)
        print(f"🌐 Testing URL: {BASE_URL}")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test 1: Games list
        self.test_games_list()
        
        # Test 2: Game creation
        game_id = self.test_game_creation()
        
        # Test 3: Game deletion (if creation was successful)
        if game_id:
            self.test_game_deletion(game_id)
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n📋 PERFORMANCE TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results.values() if result['success'])
        
        print(f"📊 Tests run: {total_tests}")
        print(f"✅ Successful: {successful_tests}")
        print(f"❌ Failed: {total_tests - successful_tests}")
        
        print("\n📈 DETAILED RESULTS:")
        for test_name, result in self.test_results.items():
            status = "✅" if result['success'] else "❌"
            duration = result['duration_ms']
            
            if duration < 1000:
                perf = "EXCELLENT"
            elif duration < 5000:
                perf = "ACCEPTABLE"
            else:
                perf = "SLOW"
            
            print(f"  {status} {test_name}: {duration:.2f}ms ({perf})")
        
        # Overall assessment
        avg_duration = sum(r['duration_ms'] for r in self.test_results.values()) / len(self.test_results)
        
        print(f"\n🏆 OVERALL ASSESSMENT:")
        print(f"   Average response time: {avg_duration:.2f}ms")
        
        if avg_duration < 1000:
            print("   🎉 PERFORMANCE: EXCELLENT!")
        elif avg_duration < 5000:
            print("   ⚠️ PERFORMANCE: ACCEPTABLE")
        else:
            print("   ❌ PERFORMANCE: NEEDS IMPROVEMENT")
        
        # Critical issues
        critical_issues = []
        for test_name, result in self.test_results.items():
            if not result['success']:
                critical_issues.append(f"{test_name}: {result.get('error', 'Unknown error')}")
            elif result['duration_ms'] > 10000:  # >10 seconds
                critical_issues.append(f"{test_name}: Very slow ({result['duration_ms']:.2f}ms)")
        
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   - {issue}")
        else:
            print(f"\n✅ NO CRITICAL ISSUES FOUND")

if __name__ == "__main__":
    tester = BackendPerformanceTest()
    tester.run_all_tests()
