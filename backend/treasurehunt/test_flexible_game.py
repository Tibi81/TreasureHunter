# test_flexible_game.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from unittest.mock import patch
import uuid

from .models import Game, Team, Player, Station, Challenge, GameProgress
from .services import GameLogicService, GameStateService, ChallengeService


class FlexibleGameTest(TestCase):
    """Rugalmas játékosszám és csapat választás tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
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
    
    def test_game_creation_with_different_player_counts(self):
        """Különböző játékosszámokkal való játék létrehozás tesztelése"""
        test_cases = [
            (2, 1, 2),  # 2 játékos, 1 csapat, 2 játékos/csapat
            (2, 2, 1),  # 2 játékos, 2 csapat, 1 játékos/csapat
            (4, 1, 4),  # 4 játékos, 1 csapat, 4 játékos/csapat
            (4, 2, 2),  # 4 játékos, 2 csapat, 2 játékos/csapat
            (6, 1, 6),  # 6 játékos, 1 csapat, 6 játékos/csapat
            (6, 2, 3),  # 6 játékos, 2 csapat, 3 játékos/csapat
            (8, 1, 8),  # 8 játékos, 1 csapat, 8 játékos/csapat
            (8, 2, 4),  # 8 játékos, 2 csapat, 4 játékos/csapat
        ]
        
        for max_players, team_count, expected_players_per_team in test_cases:
            with self.subTest(max_players=max_players, team_count=team_count):
                game = Game.objects.create(
                    name=f"Test Game {max_players}p{team_count}t",
                    max_players=max_players,
                    team_count=team_count
                )
                
                self.assertEqual(game.max_players, max_players)
                self.assertEqual(game.team_count, team_count)
                self.assertEqual(game.players_per_team, expected_players_per_team)
    
    def test_players_per_team_property(self):
        """players_per_team property tesztelése különböző kombinációkban"""
        # 1 csapatos játékok
        game_1_team_2_players = Game.objects.create(
            name="1 Team 2 Players",
            max_players=2,
            team_count=1
        )
        self.assertEqual(game_1_team_2_players.players_per_team, 2)
        
        game_1_team_4_players = Game.objects.create(
            name="1 Team 4 Players",
            max_players=4,
            team_count=1
        )
        self.assertEqual(game_1_team_4_players.players_per_team, 4)
        
        # 2 csapatos játékok
        game_2_team_2_players = Game.objects.create(
            name="2 Teams 2 Players",
            max_players=2,
            team_count=2
        )
        self.assertEqual(game_2_team_2_players.players_per_team, 1)
        
        game_2_team_4_players = Game.objects.create(
            name="2 Teams 4 Players",
            max_players=4,
            team_count=2
        )
        self.assertEqual(game_2_team_4_players.players_per_team, 2)
        
        game_2_team_6_players = Game.objects.create(
            name="2 Teams 6 Players",
            max_players=6,
            team_count=2
        )
        self.assertEqual(game_2_team_6_players.players_per_team, 3)
        
        game_2_team_8_players = Game.objects.create(
            name="2 Teams 8 Players",
            max_players=8,
            team_count=2
        )
        self.assertEqual(game_2_team_8_players.players_per_team, 4)
    
    def test_team_creation_with_flexible_players(self):
        """Csapatok létrehozása rugalmas játékosszámmal"""
        # 2 csapatos játék 4 játékossal
        game = Game.objects.create(
            name="Flexible Game",
            max_players=4,
            team_count=2
        )
        
        # Csapatok létrehozása
        pumpkin_team = Team.objects.create(
            game=game,
            name='pumpkin',
            max_players=2
        )
        ghost_team = Team.objects.create(
            game=game,
            name='ghost',
            max_players=2
        )
        
        self.assertEqual(pumpkin_team.max_players, 2)
        self.assertEqual(ghost_team.max_players, 2)
        self.assertEqual(game.players_per_team, 2)
    
    def test_player_registration_with_flexible_teams(self):
        """Játékos regisztráció rugalmas csapatokkal"""
        # 2 csapatos játék 6 játékossal
        game = Game.objects.create(
            name="Flexible Team Game",
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
        players = []
        for i in range(6):
            player = Player.objects.create(
                name=f"Player {i+1}",
                team=pumpkin_team if i < 3 else ghost_team
            )
            players.append(player)
        
        # Ellenőrzések
        pumpkin_players = Player.objects.filter(team=pumpkin_team)
        ghost_players = Player.objects.filter(team=ghost_team)
        
        self.assertEqual(pumpkin_players.count(), 3)
        self.assertEqual(ghost_players.count(), 3)
        self.assertEqual(Player.objects.filter(team__game=game).count(), 6)
    
    def test_single_team_game(self):
        """1 csapatos játék tesztelése"""
        game = Game.objects.create(
            name="Single Team Game",
            max_players=4,
            team_count=1
        )
        
        # Tök csapat létrehozása
        pumpkin_team = Team.objects.create(
            game=game,
            name='pumpkin',
            max_players=4
        )
        
        # Játékosok regisztrálása
        for i in range(4):
            Player.objects.create(
                name=f"Player {i+1}",
                team=pumpkin_team
            )
        
        # Ellenőrzések
        self.assertEqual(game.team_count, 1)
        self.assertEqual(game.players_per_team, 4)
        self.assertEqual(Team.objects.filter(game=game).count(), 1)
        self.assertEqual(Player.objects.filter(team__game=game).count(), 4)
    
    def test_game_logic_with_flexible_setup(self):
        """Játék logika tesztelése rugalmas beállítással"""
        # 2 csapatos játék 8 játékossal
        game = Game.objects.create(
            name="Logic Test Game",
            max_players=8,
            team_count=2
        )
        
        # Csapatok létrehozása
        pumpkin_team = Team.objects.create(
            game=game,
            name='pumpkin',
            max_players=4
        )
        ghost_team = Team.objects.create(
            game=game,
            name='ghost',
            max_players=4
        )
        
        # Játékosok regisztrálása
        for i in range(8):
            Player.objects.create(
                name=f"Player {i+1}",
                team=pumpkin_team if i < 4 else ghost_team
            )
        
        # Játék indítása
        game.status = 'setup'
        game.save()
        
        # GameLogicService tesztelése - statikus metódusokkal
        pumpkin_status = GameLogicService.get_team_status_info(pumpkin_team)
        ghost_status = GameLogicService.get_team_status_info(ghost_team)
        
        # Ellenőrzések
        self.assertEqual(game.max_players, 8)
        self.assertEqual(game.team_count, 2)
        self.assertEqual(game.players_per_team, 4)
        self.assertEqual(Team.objects.filter(game=game).count(), 2)
        self.assertEqual(Player.objects.filter(team__game=game).count(), 8)
        
        # Csapat állapot ellenőrzése
        self.assertEqual(pumpkin_status['player_count'], 4)
        self.assertEqual(ghost_status['player_count'], 4)
    
    def test_edge_cases(self):
        """Szélső esetek tesztelése"""
        # Minimális játékosszám
        min_game = Game.objects.create(
            name="Min Game",
            max_players=2,
            team_count=1
        )
        self.assertEqual(min_game.players_per_team, 2)
        
        # Maximális játékosszám
        max_game = Game.objects.create(
            name="Max Game",
            max_players=8,
            team_count=2
        )
        self.assertEqual(max_game.players_per_team, 4)
        
        # Páratlan játékosszám 2 csapattal
        odd_game = Game.objects.create(
            name="Odd Game",
            max_players=6,
            team_count=2
        )
        self.assertEqual(odd_game.players_per_team, 3)
    
    def test_game_validation(self):
        """Játék validáció tesztelése"""
        # Érvénytelen játékosszám
        with self.assertRaises(ValidationError):
            game = Game(
                name="Invalid Game",
                max_players=0,  # Érvénytelen
                team_count=1
            )
            game.full_clean()
        
        # Érvénytelen csapatszám
        with self.assertRaises(ValidationError):
            game = Game(
                name="Invalid Game",
                max_players=4,
                team_count=0  # Érvénytelen
            )
            game.full_clean()
    
    def test_team_max_players_sync(self):
        """Csapat max_players mező szinkronizálása"""
        game = Game.objects.create(
            name="Sync Test Game",
            max_players=6,
            team_count=2
        )
        
        # Csapatok létrehozása
        pumpkin_team = Team.objects.create(
            game=game,
            name='pumpkin',
            max_players=3  # Manuálisan beállítva
        )
        ghost_team = Team.objects.create(
            game=game,
            name='ghost',
            max_players=3  # Manuálisan beállítva
        )
        
        # Ellenőrzés
        self.assertEqual(pumpkin_team.max_players, 3)
        self.assertEqual(ghost_team.max_players, 3)
        self.assertEqual(game.players_per_team, 3)
