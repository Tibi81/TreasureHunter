# test_integration.py
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
import json

from .models import Game, Team, Player, Station, Challenge, GameProgress
from .services import GameStateService
from .session_token_services import SessionTokenService


class GameFlowIntegrationTest(APITestCase):
    """Teljes játék folyamat integrációs tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.client = Client()
        
        # Állomások létrehozása
        self.station1 = Station.objects.create(
            number=1,
            name="Kezdő állomás",
            icon="🎃",
            phase="separate"
        )
        self.station2 = Station.objects.create(
            number=2,
            name="Második állomás",
            icon="👻",
            phase="separate"
        )
        self.station3 = Station.objects.create(
            number=3,
            name="Harmadik állomás",
            icon="🎭",
            phase="separate"
        )
        self.station5 = Station.objects.create(
            number=5,
            name="Találkozási pont",
            icon="💀",
            phase="together"
        )
        self.station6 = Station.objects.create(
            number=6,
            name="Végső állomás",
            icon="🧙‍♀️",
            phase="together"
        )
        
        # Feladatok létrehozása
        self.challenge1_pumpkin = Challenge.objects.create(
            station=self.station1,
            team_type='pumpkin',
            title="Tök csapat feladat 1",
            description="Első feladat a tök csapatnak",
            qr_code="station1_pumpkin",
            help_text="Segítség 1"
        )
        self.challenge1_ghost = Challenge.objects.create(
            station=self.station1,
            team_type='ghost',
            title="Szellem csapat feladat 1",
            description="Első feladat a szellem csapatnak",
            qr_code="station1_ghost",
            help_text="Segítség 1"
        )
        self.challenge2_pumpkin = Challenge.objects.create(
            station=self.station2,
            team_type='pumpkin',
            title="Tök csapat feladat 2",
            description="Második feladat a tök csapatnak",
            qr_code="station2_pumpkin",
            help_text="Segítség 2"
        )
        self.challenge2_ghost = Challenge.objects.create(
            station=self.station2,
            team_type='ghost',
            title="Szellem csapat feladat 2",
            description="Második feladat a szellem csapatnak",
            qr_code="station2_ghost",
            help_text="Segítség 2"
        )
        self.challenge3_pumpkin = Challenge.objects.create(
            station=self.station3,
            team_type='pumpkin',
            title="Tök csapat feladat 3",
            description="Harmadik feladat a tök csapatnak",
            qr_code="station3_pumpkin",
            help_text="Segítség 3"
        )
        self.challenge3_ghost = Challenge.objects.create(
            station=self.station3,
            team_type='ghost',
            title="Szellem csapat feladat 3",
            description="Harmadik feladat a szellem csapatnak",
            qr_code="station3_ghost",
            help_text="Segítség 3"
        )
        self.challenge5_together = Challenge.objects.create(
            station=self.station5,
            team_type=None,
            title="Közös feladat 1",
            description="Első közös feladat",
            qr_code="station5_together",
            help_text="Közös segítség 1"
        )
        self.challenge6_together = Challenge.objects.create(
            station=self.station6,
            team_type=None,
            title="Közös feladat 2",
            description="Második közös feladat",
            qr_code="station6_together",
            help_text="Közös segítség 2"
        )
    
    def test_complete_game_flow_two_teams(self):
        """Teljes játék folyamat tesztelése 2 csapatos játékban"""
        # 1. Játék létrehozása
        game_data = {
            'name': 'Integration Test Game',
            'max_players': 4,
            'team_count': 2,
            'admin_name': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        # Ellenőrizzük, hogy a csapatok létrejöttek
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.teams.count(), 2)
        
        pumpkin_team = game.teams.get(name='pumpkin')
        ghost_team = game.teams.get(name='ghost')
        
        # 2. Játékosok csatlakozása
        # Tök csapat játékosok
        player1_data = {'name': 'Player 1', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/join/', player1_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player1_token = response.data['session_token']
        
        player2_data = {'name': 'Player 2', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/join/', player2_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player2_token = response.data['session_token']
        
        # Szellem csapat játékosok
        player3_data = {'name': 'Player 3', 'team': 'ghost'}
        response = self.client.post(f'/api/game/{game_id}/join/', player3_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player3_token = response.data['session_token']
        
        player4_data = {'name': 'Player 4', 'team': 'ghost'}
        response = self.client.post(f'/api/game/{game_id}/join/', player4_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player4_token = response.data['session_token']
        
        # Ellenőrizzük, hogy minden játékos csatlakozott
        self.assertEqual(Player.objects.filter(team__game=game).count(), 4)
        
        # 3. Játék indítása
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'separate')
        
        # 4. Külön fázis - Tök csapat feladat megoldása
        # Aktuális feladat lekérdezése
        response = self.client.get(f'/api/game/{game_id}/team/pumpkin/challenge/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['challenge']['title'], 'Tök csapat feladat 1')
        
        # QR kód validálása
        qr_data = {'qr_code': 'station1_pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Ellenőrizzük, hogy a csapat előrehaladt
        pumpkin_team.refresh_from_db()
        self.assertEqual(pumpkin_team.current_station, 2)
        
        # 5. Külön fázis - Szellem csapat feladat megoldása
        response = self.client.get(f'/api/game/{game_id}/team/ghost/challenge/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['challenge']['title'], 'Szellem csapat feladat 1')
        
        qr_data = {'qr_code': 'station1_ghost'}
        response = self.client.post(f'/api/game/{game_id}/team/ghost/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        ghost_team.refresh_from_db()
        self.assertEqual(ghost_team.current_station, 2)
        
        # 6. Második állomás - mindkét csapat
        # Tök csapat
        qr_data = {'qr_code': 'station2_pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Szellem csapat
        qr_data = {'qr_code': 'station2_ghost'}
        response = self.client.post(f'/api/game/{game_id}/team/ghost/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 7. Közös fázis - A csapatokat a 6-os állomásra állítjuk (together fázis)
        # Manuálisan állítjuk a csapatokat a 6-os állomásra, hogy together fázisba kerüljenek
        pumpkin_team.current_station = 6
        pumpkin_team.completed_at = timezone.now()
        pumpkin_team.save()
        
        ghost_team.current_station = 6
        ghost_team.completed_at = timezone.now()
        ghost_team.save()
        
        # Játék állapot váltás közös fázisra
        game.status = 'together'
        game.save()
        
        # 8. Közös fázis feladat megoldása - a csapatok már a 6-os állomáson vannak (together fázis)
        game.refresh_from_db()
        pumpkin_team.refresh_from_db()
        
        response = self.client.get(f'/api/game/{game_id}/team/pumpkin/challenge/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # A csapatok már a 6-os állomáson vannak, tehát 'Közös feladat 2' jelenik meg
        self.assertEqual(response.data['challenge']['title'], 'Közös feladat 2')
        
        # Validáljuk a 6-os állomást
        qr_data = {'qr_code': 'station6_together'}
        response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 10. Játék befejezése ellenőrzése
        # A játék már automatikusan befejeződött, ellenőrizzük az állapotot
        game.refresh_from_db()
        self.assertEqual(game.status, 'finished')
        print("   ✅ Játék automatikusan befejeződött")
        
        # Próbáljuk meg leállítani a már befejezett játékot (400 hibát kell adnia)
        response = self.client.post(f'/api/game/{game_id}/stop/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Csak futó játékokat lehet leállítani', response.data['error'])
        print("   ✅ Befejezett játék leállítása 400 hibát ad (helyes)")
    
    def test_single_team_game_flow(self):
        """Egy csapatos játék folyamat tesztelése"""
        # 1. Egy csapatos játék létrehozása
        game_data = {
            'name': 'Single Team Game',
            'max_players': 3,
            'team_count': 1,
            'admin_name': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        # Ellenőrizzük, hogy csak egy csapat jött létre
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.teams.count(), 1)
        
        main_team = game.teams.get(name='pumpkin')  # 1 csapatos játéknál is 'pumpkin' a csapat neve
        
        # 2. Játékosok csatlakozása
        for i in range(3):
            player_data = {
                'name': f'Player {i+1}',
                'team': 'pumpkin'
            }
            response = self.client.post(f'/api/game/{game_id}/join/', player_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Játék indítása
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'separate')  # Egy csapatos játék is separate fázisban kezd, aztán together-re vált
    
    def test_player_session_management(self):
        """Játékos session kezelés tesztelése"""
        # Játék létrehozása
        game = Game.objects.create(
            name="Session Test Game",
            max_players=2,
            team_count=1
        )
        team = Team.objects.create(game=game, name='pumpkin', max_players=2)
        
        # Játékos csatlakozása
        player_data = {'name': 'Session Player', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game.id}/join/', player_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        player_token = response.data['session_token']
        player_id = response.data['id']
        
        # Session ellenőrzése
        response = self.client.get('/api/player/status/', {'token': player_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_player']['name'], 'Session Player')
        
        # Játékos kilépése (szüneteltetés)
        response = self.client.post('/api/player/exit/', {'token': player_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        player = Player.objects.get(id=player_id)
        self.assertFalse(player.is_active)
        
        # Session visszaállítása
        response = self.client.post('/api/player/restore-session/', {'session_token': player_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        player.refresh_from_db()
        self.assertTrue(player.is_active)
        
        # Végleges kijelentkezés
        response = self.client.post('/api/player/logout/', {'token': player_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Ellenőrizzük, hogy a játékos törlődött
        self.assertFalse(Player.objects.filter(id=player_id).exists())
    
    def test_help_system(self):
        """Segítség rendszer tesztelése"""
        # Játék létrehozása
        game = Game.objects.create(
            name="Help Test Game",
            max_players=2,
            team_count=1
        )
        team = Team.objects.create(game=game, name='pumpkin', max_players=2)
        
        # Játékos csatlakozása
        player_data = {'name': 'Help Player', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game.id}/join/', player_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Játék indítása (hogy legyen állomás és feladat)
        Player.objects.create(team=team, name='Player 2')  # Még egy játékos, hogy indítható legyen
        response = self.client.post(f'/api/game/{game.id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Segítség kérése - az 1. állomáshoz van challenge (a setUp-ban létrehozva)
        response = self.client.post(f'/api/game/{game.id}/team/pumpkin/help/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['help_text'], 'Segítség 1')  # challenge1_pumpkin help_text-je
    
    def test_error_handling(self):
        """Hibakezelés tesztelése"""
        # Érvénytelen játék kód
        response = self.client.get('/api/game/code/INVALID/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  # Validációs hiba
        
        # Érvénytelen QR kód
        game = Game.objects.create(name="Error Test Game", max_players=2, team_count=1)
        team = Team.objects.create(game=game, name='pumpkin', max_players=2)
        
        qr_data = {'qr_code': 'invalid_qr'}
        response = self.client.post(f'/api/game/{game.id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # 200 OK, de success: False
        self.assertFalse(response.data['success'])
        
        # Teli csapat
        player1_data = {'name': 'Player 1', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game.id}/join/', player1_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        player2_data = {'name': 'Player 2', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game.id}/join/', player2_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Harmadik játékos próbálkozása
        player3_data = {'name': 'Player 3', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{game.id}/join/', player3_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminIntegrationTest(APITestCase):
    """Admin funkciók integrációs tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.client = Client()
        self.game = Game.objects.create(
            name="Admin Test Game",
            max_players=4,
            team_count=2
        )
        self.pumpkin_team = Team.objects.create(
            game=self.game,
            name='pumpkin',
            max_players=2
        )
        self.ghost_team = Team.objects.create(
            game=self.game,
            name='ghost',
            max_players=2
        )
    
    def test_admin_game_management(self):
        """Admin játék kezelés tesztelése"""
        # Játékok listázása
        response = self.client.get('/api/admin/games/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['games']), 1)
        
        # Játékos hozzáadása
        player_data = {'name': 'Admin Player', 'team': 'pumpkin'}
        response = self.client.post(f'/api/game/{self.game.id}/player/add/', player_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        player_id = response.data['player']['id']
        
        # Játékos áthelyezése
        move_data = {'new_team': 'ghost'}
        response = self.client.post(f'/api/game/{self.game.id}/player/{player_id}/move/', move_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Ellenőrizzük, hogy a játékos áthelyeződött
        player = Player.objects.get(id=player_id)
        self.assertEqual(player.team, self.ghost_team)
        
        # Játékos eltávolítása
        response = self.client.delete(f'/api/game/{self.game.id}/player/{player_id}/remove/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Ellenőrizzük, hogy a játékos törlődött
        self.assertFalse(Player.objects.filter(id=player_id).exists())
    
    def test_game_state_transitions(self):
        """Játék állapot váltások tesztelése"""
        # Játékosok hozzáadása mindkét csapathoz (hogy indítható legyen a játék)
        Player.objects.create(team=self.pumpkin_team, name='Player 1')
        Player.objects.create(team=self.ghost_team, name='Player 2')
        
        # Játék indítása
        response = self.client.post(f'/api/game/{self.game.id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.status, 'separate')
        
        # Játék leállítása
        response = self.client.post(f'/api/game/{self.game.id}/stop/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.status, 'finished')
        
        # Játék visszaállítása
        response = self.client.delete(f'/api/game/{self.game.id}/reset/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.game.refresh_from_db()
        self.assertEqual(self.game.status, 'waiting')
