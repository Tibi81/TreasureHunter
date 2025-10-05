# test_flexible_frontend.py
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
import json

from .models import Game, Team, Player, Station, Challenge


class FlexibleGameAPITest(APITestCase):
    """Rugalmas játékosszám és csapat választás API tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.client = Client()
        
        # Állomások létrehozása
        self.station1 = Station.objects.create(
            number=1,
            name="Test Station 1",
            icon="🎃",
            phase="separate"
        )
        self.station2 = Station.objects.create(
            number=2,
            name="Test Station 2",
            icon="👻",
            phase="separate"
        )
        
        # Feladatok létrehozása
        self.challenge1 = Challenge.objects.create(
            station=self.station1,
            team_type='pumpkin',
            title="Test Challenge 1",
            description="Test description 1",
            qr_code="test_qr_1",
            help_text="Test help 1"
        )
        self.challenge2 = Challenge.objects.create(
            station=self.station2,
            team_type='ghost',
            title="Test Challenge 2",
            description="Test description 2",
            qr_code="test_qr_2",
            help_text="Test help 2"
        )
    
    def test_create_game_with_flexible_players(self):
        """Játék létrehozás rugalmas játékosszámmal"""
        test_cases = [
            {'max_players': 2, 'team_count': 1, 'expected_players_per_team': 2},
            {'max_players': 2, 'team_count': 2, 'expected_players_per_team': 1},
            {'max_players': 4, 'team_count': 1, 'expected_players_per_team': 4},
            {'max_players': 4, 'team_count': 2, 'expected_players_per_team': 2},
            {'max_players': 6, 'team_count': 1, 'expected_players_per_team': 6},
            {'max_players': 6, 'team_count': 2, 'expected_players_per_team': 3},
            {'max_players': 8, 'team_count': 1, 'expected_players_per_team': 8},
            {'max_players': 8, 'team_count': 2, 'expected_players_per_team': 4},
        ]
        
        for case in test_cases:
            with self.subTest(**case):
                data = {
                    'name': f"Test Game {case['max_players']}p{case['team_count']}t",
                    'max_players': case['max_players'],
                    'team_count': case['team_count'],
                    'admin_name': 'Test Admin'
                }
                
                response = self.client.post('/api/game/create/', data, format='json')
                
                if response.status_code != status.HTTP_201_CREATED:
                    print(f"Error response: {response.data}")
                
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(response.data['game']['max_players'], case['max_players'])
                self.assertEqual(response.data['game']['team_count'], case['team_count'])
                
                # Ellenőrizzük a létrehozott játékot
                game = Game.objects.get(id=response.data['game']['id'])
                self.assertEqual(game.players_per_team, case['expected_players_per_team'])
    
    def test_game_creation_validation(self):
        """Játék létrehozás validáció tesztelése"""
        # Érvénytelen játékosszám
        invalid_data = {
            'name': 'Invalid Game',
            'max_players': 0,  # Érvénytelen
            'team_count': 1,
            'admin_name': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Érvénytelen csapatszám
        invalid_data = {
            'name': 'Invalid Game',
            'max_players': 4,
            'team_count': 0,  # Érvénytelen
            'admin_name': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_player_registration_with_flexible_teams(self):
        """Játékos regisztráció rugalmas csapatokkal"""
        # 2 csapatos játék 6 játékossal
        game = Game.objects.create(
            name="Flexible Registration Game",
            max_players=6,
            team_count=2
        )
        
        # Csapatok létrehozása
        pumpkin_team = Team.objects.create(
            game=game,
            name='pumpkin',
            max_players=3
        )
        ghost_team = Team.objects.create(
            game=game,
            name='ghost',
            max_players=3
        )
        
        # Játékosok regisztrálása
        players_data = [
            {'name': 'Player 1', 'team': 'pumpkin'},
            {'name': 'Player 2', 'team': 'pumpkin'},
            {'name': 'Player 3', 'team': 'pumpkin'},
            {'name': 'Player 4', 'team': 'ghost'},
            {'name': 'Player 5', 'team': 'ghost'},
            {'name': 'Player 6', 'team': 'ghost'},
        ]
        
        for player_data in players_data:
            data = {
                'game_id': str(game.id),
                'name': player_data['name'],
                'team': player_data['team']
            }
            
            response = self.client.post('/api/game/{}/player/add/'.format(game.id), data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Ellenőrzések
        pumpkin_players = Player.objects.filter(team=pumpkin_team)
        ghost_players = Player.objects.filter(team=ghost_team)
        
        self.assertEqual(pumpkin_players.count(), 3)
        self.assertEqual(ghost_players.count(), 3)
        self.assertEqual(Player.objects.filter(team__game=game).count(), 6)
    
    def test_single_team_game_flow(self):
        """1 csapatos játék teljes folyamata"""
        # Játék létrehozása
        game_data = {
            'name': 'Single Team Game',
            'max_players': 4,
            'team_count': 1,
            'admin_name': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        # Tök csapat már létrejött a game creation során, csak lekérdezzük
        game = Game.objects.get(id=game_id)
        teams = Team.objects.filter(game=game)
        self.assertEqual(teams.count(), 1)
        
        pumpkin_team = teams.get(name='pumpkin')
        
        # Játékosok regisztrálása
        for i in range(4):
            player_data = {
                'game_id': game_id,
                'name': f'Player {i+1}',
                'team': 'pumpkin'
            }
            
            response = self.client.post(f'/api/game/{game_id}/player/add/', player_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Játék indítása
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Ellenőrzések
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.status, 'separate')  # A játék indítás után separate állapotban van
        self.assertEqual(game.team_count, 1)
        self.assertEqual(game.players_per_team, 4)
        self.assertEqual(Team.objects.filter(game=game).count(), 1)
        self.assertEqual(Player.objects.filter(team__game=game).count(), 4)
    
    def test_two_team_game_flow(self):
        """2 csapatos játék teljes folyamata"""
        # Játék létrehozása
        game_data = {
            'name': 'Two Team Game',
            'max_players': 8,
            'team_count': 2,
            'admin_name': 'Test Admin'
        }
        
        response = self.client.post('/api/game/create/', game_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        game_id = response.data['game']['id']
        
        # Csapatok már létrejöttek a game creation során, csak lekérdezzük őket
        game = Game.objects.get(id=game_id)
        teams = Team.objects.filter(game=game)
        self.assertEqual(teams.count(), 2)
        
        pumpkin_team = teams.get(name='pumpkin')
        ghost_team = teams.get(name='ghost')
        
        # Játékosok regisztrálása
        players_data = [
            {'name': 'Pumpkin Player 1', 'team': 'pumpkin'},
            {'name': 'Pumpkin Player 2', 'team': 'pumpkin'},
            {'name': 'Pumpkin Player 3', 'team': 'pumpkin'},
            {'name': 'Pumpkin Player 4', 'team': 'pumpkin'},
            {'name': 'Ghost Player 1', 'team': 'ghost'},
            {'name': 'Ghost Player 2', 'team': 'ghost'},
            {'name': 'Ghost Player 3', 'team': 'ghost'},
            {'name': 'Ghost Player 4', 'team': 'ghost'},
        ]
        
        for player_data in players_data:
            data = {
                'game_id': game_id,
                'name': player_data['name'],
                'team': player_data['team']
            }
            
            response = self.client.post(f'/api/game/{game_id}/player/add/', data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Játék indítása
        response = self.client.post(f'/api/game/{game_id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Ellenőrzések
        game = Game.objects.get(id=game_id)
        self.assertEqual(game.status, 'separate')  # A játék indítás után separate állapotban van
        self.assertEqual(game.team_count, 2)
        self.assertEqual(game.players_per_team, 4)
        self.assertEqual(Team.objects.filter(game=game).count(), 2)
        self.assertEqual(Player.objects.filter(team__game=game).count(), 8)
    
    def test_game_status_with_flexible_setup(self):
        """Játék állapot lekérdezés rugalmas beállítással"""
        # Különböző beállításokkal létrehozott játékok
        games = [
            Game.objects.create(name="Game 2p1t", max_players=2, team_count=1),
            Game.objects.create(name="Game 2p2t", max_players=2, team_count=2),
            Game.objects.create(name="Game 4p1t", max_players=4, team_count=1),
            Game.objects.create(name="Game 4p2t", max_players=4, team_count=2),
            Game.objects.create(name="Game 6p1t", max_players=6, team_count=1),
            Game.objects.create(name="Game 6p2t", max_players=6, team_count=2),
            Game.objects.create(name="Game 8p1t", max_players=8, team_count=1),
            Game.objects.create(name="Game 8p2t", max_players=8, team_count=2),
        ]
        
        for game in games:
            response = self.client.get(f'/api/game/{game.id}/status/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Ellenőrizzük a válasz tartalmát
            self.assertEqual(response.data['game']['max_players'], game.max_players)
            self.assertEqual(response.data['game']['team_count'], game.team_count)
            self.assertEqual(response.data['game']['players_per_team'], game.players_per_team)
    
    def test_edge_case_combinations(self):
        """Szélső esetek kombinációinak tesztelése"""
        edge_cases = [
            # Minimális játékosszám
            {'max_players': 2, 'team_count': 1, 'description': 'Min players, 1 team'},
            {'max_players': 2, 'team_count': 2, 'description': 'Min players, 2 teams'},
            
            # Maximális játékosszám
            {'max_players': 8, 'team_count': 1, 'description': 'Max players, 1 team'},
            {'max_players': 8, 'team_count': 2, 'description': 'Max players, 2 teams'},
            
            # Páratlan játékosszám
            {'max_players': 6, 'team_count': 2, 'description': 'Odd players, 2 teams'},
        ]
        
        for case in edge_cases:
            with self.subTest(**case):
                game_data = {
                    'name': f"Edge Case: {case['description']}",
                    'max_players': case['max_players'],
                    'team_count': case['team_count'],
                    'admin_name': 'Test Admin'
                }
                
                response = self.client.post('/api/game/create/', game_data, format='json')
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                
                # Ellenőrizzük a létrehozott játékot
                game = Game.objects.get(id=response.data['game']['id'])
                self.assertEqual(game.max_players, case['max_players'])
                self.assertEqual(game.team_count, case['team_count'])
                
                # Ellenőrizzük a players_per_team számítást
                expected_players_per_team = case['max_players'] if case['team_count'] == 1 else case['max_players'] // 2
                self.assertEqual(game.players_per_team, expected_players_per_team)
