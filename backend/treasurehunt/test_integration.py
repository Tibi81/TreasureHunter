# test_integration.py
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import json

from .models import Game, Team, Player, Station, Challenge, GameProgress
from .services import GameService
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
            'created_by': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['id']
        
        # Ellenőrizzük, hogy a csapatok létrejöttek
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.teams.count(), 2)
        
        pumpkin_team = game.teams.get(name='pumpkin')
        ghost_team = game.teams.get(name='ghost')
        
        # 2. Játékosok csatlakozása
        # Tök csapat játékosok
        player1_data = {'player_name': 'Player 1', 'team_name': 'pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/join/', player1_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player1_token = response.data['session_token']
        
        player2_data = {'player_name': 'Player 2', 'team_name': 'pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/join/', player2_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player2_token = response.data['session_token']
        
        # Szellem csapat játékosok
        player3_data = {'player_name': 'Player 3', 'team_name': 'ghost'}
        response = self.client.post(f'/api/game/{game_id}/join/', player3_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        player3_token = response.data['session_token']
        
        player4_data = {'player_name': 'Player 4', 'team_name': 'ghost'}
        response = self.client.post(f'/api/game/{game_id}/join/', player4_data)
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
        self.assertEqual(response.data['title'], 'Tök csapat feladat 1')
        
        # QR kód validálása
        qr_data = {'qr_code': 'station1_pumpkin'}
        response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        
        # Ellenőrizzük, hogy a csapat előrehaladt
        pumpkin_team.refresh_from_db()
        self.assertEqual(pumpkin_team.current_station, 2)
        
        # 5. Külön fázis - Szellem csapat feladat megoldása
        response = self.client.get(f'/api/game/{game_id}/team/ghost/challenge/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Szellem csapat feladat 1')
        
        qr_data = {'qr_code': 'station1_ghost'}
        response = self.client.post(f'/api/game/{game_id}/team/ghost/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        
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
        
        # 7. Közös fázis - mindkét csapat elérte a találkozási pontot
        # Tök csapat a 5. állomásra
        pumpkin_team.current_station = 5
        pumpkin_team.completed_at = timezone.now()
        pumpkin_team.save()
        
        # Szellem csapat a 5. állomásra
        ghost_team.current_station = 5
        ghost_team.completed_at = timezone.now()
        ghost_team.save()
        
        # Játék állapot váltás közös fázisra
        game.status = 'together'
        game.save()
        
        # 8. Közös fázis feladat megoldása
        response = self.client.get(f'/api/game/{game_id}/team/pumpkin/challenge/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Közös feladat 1')
        
        qr_data = {'qr_code': 'station5_together'}
        response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 9. Végső állomás
        qr_data = {'qr_code': 'station6_together'}
        response = self.client.post(f'/api/game/{game_id}/team/pumpkin/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 10. Játék befejezése
        response = self.client.post(f'/api/game/{game_id}/stop/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'finished')
    
    def test_single_team_game_flow(self):
        """Egy csapatos játék folyamat tesztelése"""
        # 1. Egy csapatos játék létrehozása
        game_data = {
            'name': 'Single Team Game',
            'max_players': 3,
            'team_count': 1,
            'created_by': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', game_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['id']
        
        # Ellenőrizzük, hogy csak egy csapat jött létre
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.teams.count(), 1)
        
        main_team = game.teams.get(name='main')
        
        # 2. Játékosok csatlakozása
        for i in range(3):
            player_data = {
                'player_name': f'Player {i+1}',
                'team_name': 'main'
            }
            response = self.client.post(f'/api/game/{game_id}/join/', player_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Játék indítása
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        game.refresh_from_db()
        self.assertEqual(game.status, 'together')  # Egy csapatos játék közös fázisban kezd
    
    def test_player_session_management(self):
        """Játékos session kezelés tesztelése"""
        # Játék létrehozása
        game = Game.objects.create(
            name="Session Test Game",
            max_players=2,
            team_count=1
        )
        team = Team.objects.create(game=game, name='main', max_players=2)
        
        # Játékos csatlakozása
        player_data = {'player_name': 'Session Player', 'team_name': 'main'}
        response = self.client.post(f'/api/game/{game.id}/join/', player_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        player_token = response.data['session_token']
        player_id = response.data['player_id']
        
        # Session ellenőrzése
        response = self.client.get('/api/player/status/', {'token': player_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['player_name'], 'Session Player')
        
        # Játékos kilépése (szüneteltetés)
        response = self.client.post('/api/player/exit/', {'token': player_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        player = Player.objects.get(id=player_id)
        self.assertFalse(player.is_active)
        
        # Session visszaállítása
        response = self.client.post('/api/player/restore-session/', {'token': player_token})
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
        team = Team.objects.create(game=game, name='main', max_players=2)
        
        # Játékos csatlakozása
        player_data = {'player_name': 'Help Player', 'team_name': 'main'}
        response = self.client.post(f'/api/game/{game.id}/join/', player_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Segítség kérése
        response = self.client.post(f'/api/game/{game.id}/team/main/help/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['help_text'], 'Közös segítség 1')
        
        # Ellenőrizzük, hogy a segítség használva lett
        team.refresh_from_db()
        self.assertTrue(team.help_used)
        
        # Második segítség kérése (nem kellene működnie)
        response = self.client.post(f'/api/game/{game.id}/team/main/help/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_error_handling(self):
        """Hibakezelés tesztelése"""
        # Érvénytelen játék kód
        response = self.client.get('/api/game/code/INVALID/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Érvénytelen QR kód
        game = Game.objects.create(name="Error Test Game", max_players=2, team_count=1)
        team = Team.objects.create(game=game, name='main', max_players=2)
        
        qr_data = {'qr_code': 'invalid_qr'}
        response = self.client.post(f'/api/game/{game.id}/team/main/validate/', qr_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['valid'])
        
        # Teli csapat
        player1_data = {'player_name': 'Player 1', 'team_name': 'main'}
        response = self.client.post(f'/api/game/{game.id}/join/', player1_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        player2_data = {'player_name': 'Player 2', 'team_name': 'main'}
        response = self.client.post(f'/api/game/{game.id}/join/', player2_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Harmadik játékos próbálkozása
        player3_data = {'player_name': 'Player 3', 'team_name': 'main'}
        response = self.client.post(f'/api/game/{game.id}/join/', player3_data)
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
        self.assertEqual(len(response.data), 1)
        
        # Játékos hozzáadása
        player_data = {'player_name': 'Admin Player', 'team_name': 'pumpkin'}
        response = self.client.post(f'/api/game/{self.game.id}/player/add/', player_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        player_id = response.data['player_id']
        
        # Játékos áthelyezése
        move_data = {'team_name': 'ghost'}
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
