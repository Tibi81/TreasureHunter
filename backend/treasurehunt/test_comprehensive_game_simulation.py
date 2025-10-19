# test_comprehensive_game_simulation.py
"""
Átfogó játék szimulációs tesztek
Szimulálja a teljes játék folyamatot a jelenlegi környezetben és beállításokban
"""
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from django.core.cache import cache
import json
import uuid

from .models import Game, Team, Player, Station, Challenge, GameProgress
from .services import GameStateService, ChallengeService
from .game_state_manager import GameStateManager, GameConstants


class ComprehensiveGameSimulationTest(APITestCase):
    """Átfogó játék szimulációs tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.client = Client()
        cache.clear()  # Cache törlése
        
        # Állomások létrehozása a jelenlegi játék logikához
        self.stations = []
        for i in range(1, 7):
            phase = "separate" if i <= 4 else "together" if i == 5 else "together"
            station = Station.objects.create(
                number=i,
                name=f"Állomás {i}",
                icon="🎃" if i <= 2 else "👻" if i <= 4 else "💀" if i == 5 else "🧙‍♀️",
                phase=phase
            )
            self.stations.append(station)
        
        # Feladatok létrehozása
        self.challenges = []
        
        # Külön fázis feladatok (1-4. állomás)
        for station_num in range(1, 5):
            station = self.stations[station_num - 1]
            
            # Tök csapat feladat
            challenge_pumpkin = Challenge.objects.create(
                station=station,
                team_type='pumpkin',
                title=f"Tök csapat feladat {station_num}",
                description=f"Tök csapat feladat leírása {station_num}. állomáson",
                qr_code=f"station{station_num}_pumpkin",
                help_text=f"Tök csapat segítség {station_num}"
            )
            self.challenges.append(challenge_pumpkin)
            
            # Szellem csapat feladat
            challenge_ghost = Challenge.objects.create(
                station=station,
                team_type='ghost',
                title=f"Szellem csapat feladat {station_num}",
                description=f"Szellem csapat feladat leírása {station_num}. állomáson",
                qr_code=f"station{station_num}_ghost",
                help_text=f"Szellem csapat segítség {station_num}"
            )
            self.challenges.append(challenge_ghost)
        
        # Közös fázis feladatok (5-6. állomás)
        for station_num in range(5, 7):
            station = self.stations[station_num - 1]
            
            challenge_together = Challenge.objects.create(
                station=station,
                team_type=None,  # Közös feladat
                title=f"Közös feladat {station_num}",
                description=f"Közös feladat leírása {station_num}. állomáson",
                qr_code=f"station{station_num}_together",
                help_text=f"Közös segítség {station_num}"
            )
            self.challenges.append(challenge_together)
    
    def test_complete_two_team_game_simulation(self):
        """Teljes 2 csapatos játék szimulációja"""
        print("\n🎮 2 CSAPATOS JÁTÉK SZIMULÁCIÓ")
        print("=" * 50)
        
        # 1. Játék létrehozása
        print("1. Játék létrehozása...")
        game_data = {
            'name': 'Szimulációs Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 4,
            'team_count': 2
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        game_code = response.data['game']['game_code']
        
        print(f"   ✅ Játék létrehozva: {game_id}")
        print(f"   ✅ Játék kód: {game_code}")
        
        # Ellenőrizzük a játék állapotát
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.status, 'waiting')
        self.assertEqual(game.teams.count(), 2)
        
        # 2. Játékosok csatlakozása
        print("\n2. Játékosok csatlakozása...")
        
        # Tök csapat játékosok
        players_data = [
            {'name': 'Tök Játékos 1', 'team': 'pumpkin'},
            {'name': 'Tök Játékos 2', 'team': 'pumpkin'},
            {'name': 'Szellem Játékos 1', 'team': 'ghost'},
            {'name': 'Szellem Játékos 2', 'team': 'ghost'}
        ]
        
        player_tokens = []
        for player_data in players_data:
            response = self.client.post(f'/api/game/{game_id}/join/', player_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            player_tokens.append(response.data['session_token'])
            print(f"   ✅ {player_data['name']} csatlakozott a {player_data['team']} csapathoz")
        
        # Ellenőrizzük, hogy minden játékos csatlakozott
        self.assertEqual(Player.objects.filter(team__game=game, is_active=True).count(), 4)
        
        # 3. Játék indítása
        print("\n3. Játék indítása...")
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'separate')
        print("   ✅ Játék elindult - separate fázis")
        
        # 4. Külön fázis szimulációja
        print("\n4. Külön fázis szimulációja...")
        
        # Tök csapat haladása
        print("   🎃 Tök csapat haladása:")
        for station_num in range(1, 5):
            # Aktuális feladat lekérdezése
            response = self.client.get(f'/api/game/{game_id}/team/pumpkin/challenge/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            challenge_data = response.data
            print(f"      Állomás {station_num}: {challenge_data['challenge']['title']}")
            
            # QR kód validálása
            qr_data = {'qr_code': f'station{station_num}_pumpkin'}
            response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
            print(f"      ✅ QR kód validálva: {qr_data['qr_code']}")
            
            # Csapat állapot ellenőrzése
            pumpkin_team = Team.objects.get(game=game, name='pumpkin')
            self.assertEqual(pumpkin_team.current_station, station_num + 1)
        
        # Szellem csapat haladása
        print("   👻 Szellem csapat haladása:")
        for station_num in range(1, 5):
            # Aktuális feladat lekérdezése
            response = self.client.get(f'/api/game/{game_id}/team/ghost/challenge/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            challenge_data = response.data
            print(f"      Állomás {station_num}: {challenge_data['challenge']['title']}")
            
            # QR kód validálása
            qr_data = {'qr_code': f'station{station_num}_ghost'}
            response = self.client.post(f'/api/game/{game_id}/team/ghost/validate/', qr_data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
            print(f"      ✅ QR kód validálva: {qr_data['qr_code']}")
            
            # Csapat állapot ellenőrzése
            ghost_team = Team.objects.get(game=game, name='ghost')
            self.assertEqual(ghost_team.current_station, station_num + 1)
        
        # 5. Találkozási pont elérése
        print("\n5. Találkozási pont elérése...")
        
        # Mindkét csapat eléri a 5. állomást (találkozási pont)
        pumpkin_team = Team.objects.get(game=game, name='pumpkin')
        ghost_team = Team.objects.get(game=game, name='ghost')
        
        pumpkin_team.current_station = 5
        pumpkin_team.completed_at = timezone.now()
        pumpkin_team.save()
        
        ghost_team.current_station = 5
        ghost_team.completed_at = timezone.now()
        ghost_team.save()
        
        print("   ✅ Mindkét csapat elérte a találkozási pontot")
        
        # 6. Közös fázisra váltás
        print("\n6. Közös fázisra váltás...")
        
        # GameStateManager használata a közös fázisra váltáshoz
        game_manager = GameStateManager(game)
        game_manager._transition_to_together_phase()
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'together')
        print("   ✅ Játék átváltott a közös fázisba")
        
        # 7. Közös fázis szimulációja
        print("\n7. Közös fázis szimulációja...")
        
        # Közös feladatok megoldása
        for station_num in range(6, 7):  # 6. állomás
            # Aktuális feladat lekérdezése
            response = self.client.get(f'/api/game/{game_id}/team/pumpkin/challenge/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            challenge_data = response.data
            print(f"   Közös feladat {station_num}: {challenge_data['challenge']['title']}")
            
            # QR kód validálása
            qr_data = {'qr_code': f'station{station_num}_together'}
            response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
            print(f"   ✅ Közös QR kód validálva: {qr_data['qr_code']}")
        
        # 8. Játék befejezése ellenőrzése
        print("\n8. Játék befejezése ellenőrzése...")
        
        # A játék már automatikusan befejeződött, ellenőrizzük az állapotot
        game.refresh_from_db()
        self.assertEqual(game.status, 'finished')
        print("   ✅ Játék automatikusan befejeződött")
        
        # Próbáljuk meg leállítani a már befejezett játékot (400 hibát kell adnia)
        response = self.client.post(f'/api/game/{game_id}/stop/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print("   ✅ Befejezett játék leállítása helyesen 400 hibát ad")
        
        print("\n🎉 2 CSAPATOS JÁTÉK SZIMULÁCIÓ SIKERES!")
        print("=" * 50)
    
    def test_single_team_game_simulation(self):
        """1 csapatos játék szimulációja"""
        print("\n🎮 1 CSAPATOS JÁTÉK SZIMULÁCIÓ")
        print("=" * 50)
        
        # 1. Játék létrehozása
        print("1. Játék létrehozása...")
        game_data = {
            'name': 'Egy Csapatos Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 3,
            'team_count': 1
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        game_code = response.data['game']['game_code']
        
        print(f"   ✅ Játék létrehozva: {game_id}")
        print(f"   ✅ Játék kód: {game_code}")
        
        # Ellenőrizzük a játék állapotát
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.status, 'waiting')
        self.assertEqual(game.teams.count(), 1)
        
        # 2. Játékosok csatlakozása
        print("\n2. Játékosok csatlakozása...")
        
        players_data = [
            {'name': 'Játékos 1', 'team': 'pumpkin'},
            {'name': 'Játékos 2', 'team': 'pumpkin'},
            {'name': 'Játékos 3', 'team': 'pumpkin'}
        ]
        
        for player_data in players_data:
            response = self.client.post(f'/api/game/{game_id}/join/', player_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            print(f"   ✅ {player_data['name']} csatlakozott")
        
        # 3. Játék indítása
        print("\n3. Játék indítása...")
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'separate')
        print("   ✅ Játék elindult - separate fázis")
        
        # 4. Játék folyamat szimulációja
        print("\n4. Játék folyamat szimulációja...")
        
        # Csapat haladása
        for station_num in range(1, 5):
            # Aktuális feladat lekérdezése
            response = self.client.get(f'/api/game/{game_id}/team/pumpkin/challenge/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            challenge_data = response.data
            print(f"   Állomás {station_num}: {challenge_data['challenge']['title']}")
            
            # QR kód validálása
            qr_data = {'qr_code': f'station{station_num}_pumpkin'}
            response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['success'])
            print(f"   ✅ QR kód validálva: {qr_data['qr_code']}")
        
        print("\n🎉 1 CSAPATOS JÁTÉK SZIMULÁCIÓ SIKERES!")
        print("=" * 50)
    
    def test_game_code_search_simulation(self):
        """Játék kód keresés szimulációja"""
        print("\n🔍 JÁTÉK KÓD KERESÉS SZIMULÁCIÓ")
        print("=" * 50)
        
        # 1. Játék létrehozása
        print("1. Játék létrehozása...")
        game_data = {
            'name': 'Keresési Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 4,
            'team_count': 2
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        game_code = response.data['game']['game_code']
        
        print(f"   ✅ Játék létrehozva: {game_id}")
        print(f"   ✅ Játék kód: {game_code}")
        
        # 2. Játék kód keresése
        print(f"\n2. Játék kód keresése: {game_code}")
        response = self.client.get(f'/api/game/code/{game_code}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        found_game = response.data['game']
        self.assertEqual(found_game['id'], game_id)
        self.assertEqual(found_game['game_code'], game_code)
        print(f"   ✅ Játék megtalálva: {found_game['name']}")
        
        # 3. Hibás kód keresése
        print("\n3. Hibás kód keresése...")
        response = self.client.get('/api/game/code/INVALID/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print("   ✅ Hibás kód esetén 400 hiba (validációs hiba)")
        
        print("\n🎉 JÁTÉK KÓD KERESÉS SZIMULÁCIÓ SIKERES!")
        print("=" * 50)
    
    def test_sse_events_simulation(self):
        """SSE események szimulációja"""
        print("\n📡 SSE ESEMÉNYEK SZIMULÁCIÓJA")
        print("=" * 50)
        
        # 1. Játék létrehozása
        print("1. Játék létrehozása...")
        game_data = {
            'name': 'SSE Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 2,
            'team_count': 1
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        print(f"   ✅ Játék létrehozva: {game_id}")
        
        # 2. SSE kapcsolat tesztelése
        print("\n2. SSE kapcsolat tesztelése...")
        
        # Általános SSE endpoint
        response = self.client.get('/api/sse/general/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Általános SSE endpoint elérhető")
        
        # Játék-specifikus SSE endpoint
        response = self.client.get(f'/api/sse/game/{game_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print(f"   ✅ Játék SSE endpoint elérhető: {game_id}")
        
        print("\n🎉 SSE ESEMÉNYEK SZIMULÁCIÓJA SIKERES!")
        print("=" * 50)
    
    def test_error_handling_simulation(self):
        """Hibakezelés szimulációja"""
        print("\n❌ HIBÁKEZELÉS SZIMULÁCIÓJA")
        print("=" * 50)
        
        # 1. Hibás játék kód
        print("1. Hibás játék kód tesztelése...")
        response = self.client.get('/api/game/code/NONEXISTENT/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print("   ✅ Hibás játék kód esetén 400 hiba (validációs hiba)")
        
        # 2. Hibás QR kód
        print("\n2. Hibás QR kód tesztelése...")
        game = Game.objects.create(
            name="Hibakezelési Teszt",
            max_players=2,
            team_count=1
        )
        team = Team.objects.create(game=game, name='pumpkin', max_players=2)
        
        # Játék indítása, hogy legyen feladat
        game.status = 'separate'
        game.save()
        
        qr_data = {'qr_code': 'invalid_qr_code'}
        response = self.client.post(f'/api/game/{game.id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['success'])
        print("   ✅ Hibás QR kód esetén 200 hiba (helyes)")
        
        # 3. Teli csapat
        print("\n3. Teli csapat tesztelése...")
        
        # Játékosok hozzáadása a csapathoz
        for i in range(2):
            Player.objects.create(
                name=f"Játékos {i+1}",
                team=team
            )
        
        # Harmadik játékos próbálkozása
        player_data = {'name': 'Játékos 3', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game.id}/join/', player_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        print("   ✅ Teli csapat esetén 400 hiba")
        
        print("\n🎉 HIBÁKEZELÉS SZIMULÁCIÓJA SIKERES!")
        print("=" * 50)
    
    def test_admin_operations_simulation(self):
        """Admin műveletek szimulációja"""
        print("\n🛠️ ADMIN MŰVELETEK SZIMULÁCIÓJA")
        print("=" * 50)
        
        # 1. Játék létrehozása
        print("1. Játék létrehozása...")
        game_data = {
            'name': 'Admin Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 4,
            'team_count': 2
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        print(f"   ✅ Játék létrehozva: {game_id}")
        
        # 2. Játékok listázása
        print("\n2. Játékok listázása...")
        response = self.client.get('/api/admin/games/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        games = response.data['games']
        self.assertEqual(len(games), 1)
        print(f"   ✅ {len(games)} játék listázva")
        
        # 3. Játékos hozzáadása
        print("\n3. Játékos hozzáadása...")
        player_data = {
            'name': 'Admin Játékos',
            'team': 'pumpkin'
        }
        response = self.client.post(f'/api/game/{game_id}/player/add/', player_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player_id = response.data['player']['id']
        print(f"   ✅ Játékos hozzáadva: {player_id}")
        
        # 4. Játékos áthelyezése
        print("\n4. Játékos áthelyezése...")
        move_data = {'new_team': 'ghost'}
        response = self.client.post(f'/api/game/{game_id}/player/{player_id}/move/', move_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Játékos áthelyezve")
        
        # 5. Játékos eltávolítása
        print("\n5. Játékos eltávolítása...")
        response = self.client.delete(f'/api/game/{game_id}/player/{player_id}/remove/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Játékos eltávolítva")
        
        # 6. Játék törlése
        print("\n6. Játék törlése...")
        response = self.client.delete(f'/api/game/{game_id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Játék törölve")
        
        print("\n🎉 ADMIN MŰVELETEK SZIMULÁCIÓJA SIKERES!")
        print("=" * 50)


class GameStateTransitionTest(APITestCase):
    """Játék állapot váltások tesztelése"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.client = Client()
        cache.clear()
    
    def test_game_state_transitions(self):
        """Játék állapot váltások tesztelése"""
        print("\n🔄 JÁTÉK ÁLLAPOT VÁLTÁSOK TESZTELÉSE")
        print("=" * 50)
        
        # 1. Játék létrehozása
        print("1. Játék létrehozása...")
        game_data = {
            'name': 'Állapot Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 2,
            'team_count': 1
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.status, 'waiting')
        print(f"   ✅ Játék létrehozva - állapot: {game.status}")
        
        # 2. Játékos hozzáadása
        print("\n2. Játékos hozzáadása...")
        player_data = {'name': 'Teszt Játékos', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/join/', player_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        print("   ✅ Játékos hozzáadva")
        
        # 3. Játék indítása
        print("\n3. Játék indítása...")
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'separate')
        print(f"   ✅ Játék elindult - állapot: {game.status}")
        
        # 4. Játék leállítása
        print("\n4. Játék leállítása...")
        response = self.client.post(f'/api/game/{game_id}/stop/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'finished')
        print(f"   ✅ Játék leállítva - állapot: {game.status}")
        
        # 5. Játék visszaállítása
        print("\n5. Játék visszaállítása...")
        response = self.client.delete(f'/api/game/{game_id}/reset/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'waiting')
        print(f"   ✅ Játék visszaállítva - állapot: {game.status}")
        
        print("\n🎉 JÁTÉK ÁLLAPOT VÁLTÁSOK TESZTELÉSE SIKERES!")
        print("=" * 50)


class PerformanceTest(APITestCase):
    """Teljesítmény tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.client = Client()
        cache.clear()
    
    def test_concurrent_game_creation(self):
        """Párhuzamos játék létrehozás tesztelése"""
        print("\n⚡ PÁRHUZAMOS JÁTÉK LÉTREHOZÁS TESZTELÉSE")
        print("=" * 50)
        
        # 5 játék létrehozása párhuzamosan
        games_data = []
        for i in range(5):
            games_data.append({
                'name': f'Párhuzamos Játék {i+1}',
                'admin_name': f'Admin {i+1}',
                'max_players': 4,
                'team_count': 2
            })
        
        print(f"1. {len(games_data)} játék létrehozása...")
        
        created_games = []
        for i, game_data in enumerate(games_data):
            response = self.client.post('/api/game/create/', game_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_games.append(response.data['game']['id'])
            print(f"   ✅ Játék {i+1} létrehozva")
        
        # Ellenőrizzük, hogy minden játék létrejött
        self.assertEqual(Game.objects.count(), 5)
        print(f"   ✅ Összesen {Game.objects.count()} játék létrehozva")
        
        print("\n🎉 PÁRHUZAMOS JÁTÉK LÉTREHOZÁS TESZTELÉSE SIKERES!")
        print("=" * 50)
    
    def test_large_game_simulation(self):
        """Nagy játék szimulációja (8 játékos, 2 csapat)"""
        print("\n⚡ NAGY JÁTÉK SZIMULÁCIÓJA")
        print("=" * 50)
        
        # 1. Nagy játék létrehozása
        print("1. Nagy játék létrehozása (8 játékos, 2 csapat)...")
        game_data = {
            'name': 'Nagy Teszt Játék',
            'admin_name': 'Teszt Admin',
            'max_players': 8,
            'team_count': 2
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        print(f"   ✅ Nagy játék létrehozva: {game_id}")
        
        # 2. 8 játékos csatlakoztatása
        print("\n2. 8 játékos csatlakoztatása...")
        
        for i in range(8):
            team_name = 'pumpkin' if i < 4 else 'ghost'
            player_data = {
                'name': f'Nagy Játékos {i+1}',
                'team': team_name
            }
            response = self.client.post(f'/api/game/{game_id}/join/', player_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            print(f"   ✅ {player_data['name']} csatlakozott a {team_name} csapathoz")
        
        # Ellenőrizzük a játékosok számát
        game = Game.objects.get(id=game_id)
        self.assertEqual(Player.objects.filter(team__game=game, is_active=True).count(), 8)
        print(f"   ✅ Összesen {Player.objects.filter(team__game=game, is_active=True).count()} játékos csatlakozott")
        
        # 3. Játék indítása
        print("\n3. Játék indítása...")
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'separate')
        print("   ✅ Nagy játék elindult")
        
        print("\n🎉 NAGY JÁTÉK SZIMULÁCIÓJA SIKERES!")
        print("=" * 50)
