# tests.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from unittest.mock import patch
import uuid

from .models import Game, Team, Player, Station, Challenge, GameProgress
from .services import GameLogicService, GameStateService, ChallengeService
from .game_state_manager import GameStateManager, GameConstants


class GameModelTest(TestCase):
    """Game modell tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
    
    def test_game_creation(self):
        """Játék létrehozás tesztelése"""
        self.assertEqual(self.game.name, "Test Game")
        self.assertEqual(self.game.max_players, 4)
        self.assertEqual(self.game.team_count, 2)
        self.assertEqual(self.game.status, 'waiting')
        self.assertIsNotNone(self.game.game_code)
        self.assertEqual(len(self.game.game_code), 6)
    
    def test_game_code_generation(self):
        """Játék kód generálás tesztelése"""
        # Új játék létrehozása kód nélkül
        game = Game(name="Test Game 2")
        game.save()
        
        self.assertIsNotNone(game.game_code)
        self.assertEqual(len(game.game_code), 6)
        self.assertTrue(game.game_code.isalnum())
    
    def test_players_per_team_property(self):
        """Játékosok száma csapatonként property tesztelése"""
        # 2 csapatos játék
        self.assertEqual(self.game.players_per_team, 2)
        
        # 1 csapatos játék
        game_single = Game.objects.create(
            name="Single Team Game",
            max_players=6,
            team_count=1
        )
        self.assertEqual(game_single.players_per_team, 6)
    
    def test_game_str_representation(self):
        """Game __str__ metódus tesztelése"""
        expected = f"Játék - {self.game.name} ({self.game.status})"
        self.assertEqual(str(self.game), expected)


class TeamModelTest(TestCase):
    """Team modell tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        self.team = Team.objects.create(
            game=self.game,
            name='pumpkin',
            max_players=2
        )
    
    def test_team_creation(self):
        """Csapat létrehozás tesztelése"""
        self.assertEqual(self.team.game, self.game)
        self.assertEqual(self.team.name, 'pumpkin')
        self.assertEqual(self.team.current_station, 1)
        self.assertEqual(self.team.attempts, 0)
        self.assertFalse(self.team.help_used)
        self.assertEqual(self.team.max_players, 2)
    
    def test_team_str_representation(self):
        """Team __str__ metódus tesztelése"""
        expected = "🎃 Tök Csapat - Állomás 1"
        self.assertEqual(str(self.team), expected)


class PlayerModelTest(TestCase):
    """Player modell tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        self.team = Team.objects.create(
            game=self.game,
            name='pumpkin',
            max_players=2
        )
        self.player = Player.objects.create(
            team=self.team,
            name="Test Player"
        )
    
    def test_player_creation(self):
        """Játékos létrehozás tesztelése"""
        self.assertEqual(self.player.team, self.team)
        self.assertEqual(self.player.name, "Test Player")
        self.assertIsNotNone(self.player.joined_at)
        self.assertTrue(self.player.is_active)
    
    def test_player_str_representation(self):
        """Player __str__ metódus tesztelése"""
        expected = "Test Player (🎃 Tök Csapat)"
        self.assertEqual(str(self.player), expected)


class StationModelTest(TestCase):
    """Station modell tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.station = Station.objects.create(
            number=1,
            name="Test Station",
            icon="🎃",
            phase="separate"
        )
    
    def test_station_creation(self):
        """Állomás létrehozás tesztelése"""
        self.assertEqual(self.station.number, 1)
        self.assertEqual(self.station.name, "Test Station")
        self.assertEqual(self.station.icon, "🎃")
        self.assertEqual(self.station.phase, "separate")
    
    def test_station_str_representation(self):
        """Station __str__ metódus tesztelése"""
        expected = "1. Test Station 🎃"
        self.assertEqual(str(self.station), expected)
    
    def test_station_ordering(self):
        """Állomások sorrendje tesztelése"""
        station2 = Station.objects.create(
            number=2,
            name="Second Station",
            icon="👻",
            phase="separate"
        )
        station3 = Station.objects.create(
            number=3,
            name="Third Station",
            icon="🕷️",
            phase="together"
        )
        
        stations = list(Station.objects.all())
        self.assertEqual(stations[0].number, 1)
        self.assertEqual(stations[1].number, 2)
        self.assertEqual(stations[2].number, 3)


class ChallengeModelTest(TestCase):
    """Challenge modell tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.station = Station.objects.create(
            number=1,
            name="Test Station",
            icon="🎃",
            phase="separate"
        )
        self.challenge = Challenge.objects.create(
            station=self.station,
            team_type='pumpkin',
            title="Test Challenge",
            description="Test description",
            qr_code="test_qr_123",
            help_text="Test help"
        )
    
    def test_challenge_creation(self):
        """Feladat létrehozás tesztelése"""
        self.assertEqual(self.challenge.station, self.station)
        self.assertEqual(self.challenge.team_type, 'pumpkin')
        self.assertEqual(self.challenge.title, "Test Challenge")
        self.assertEqual(self.challenge.description, "Test description")
        self.assertEqual(self.challenge.qr_code, "test_qr_123")
        self.assertEqual(self.challenge.help_text, "Test help")
    
    def test_challenge_str_representation(self):
        """Challenge __str__ metódus tesztelése"""
        expected = "Test Station (🎃 Tök Csapat): Test Challenge"
        self.assertEqual(str(self.challenge), expected)
    
    def test_common_challenge_str_representation(self):
        """Közös feladat __str__ metódus tesztelése"""
        common_challenge = Challenge.objects.create(
            station=self.station,
            team_type=None,
            title="Common Challenge",
            description="Common description",
            qr_code="common_qr_123",
            help_text="Common help"
        )
        expected = "Test Station (Közös): Common Challenge"
        self.assertEqual(str(common_challenge), expected)


class GameProgressModelTest(TestCase):
    """GameProgress modell tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        self.team = Team.objects.create(
            game=self.game,
            name='pumpkin',
            max_players=2
        )
        self.station = Station.objects.create(
            number=1,
            name="Test Station",
            icon="🎃",
            phase="separate"
        )
        self.progress = GameProgress.objects.create(
            game=self.game,
            team=self.team,
            station=self.station,
            attempts_made=2,
            help_used=True
        )
    
    def test_progress_creation(self):
        """Előrehaladás létrehozás tesztelése"""
        self.assertEqual(self.progress.game, self.game)
        self.assertEqual(self.progress.team, self.team)
        self.assertEqual(self.progress.station, self.station)
        self.assertEqual(self.progress.attempts_made, 2)
        self.assertTrue(self.progress.help_used)
        self.assertIsNotNone(self.progress.completed_at)
    
    def test_progress_str_representation(self):
        """GameProgress __str__ metódus tesztelése"""
        expected = f"🎃 Tök Csapat - Állomás 1 - 1. Test Station 🎃 (Befejezve: {self.progress.completed_at})"
        self.assertEqual(str(self.progress), expected)
    
    def test_unique_together_constraint(self):
        """Egyedi constraint tesztelése"""
        # Ugyanazt a progress-et nem lehet kétszer létrehozni
        with self.assertRaises(IntegrityError):
            GameProgress.objects.create(
                game=self.game,
                team=self.team,
                station=self.station,
                attempts_made=1,
                help_used=False
            )


class GameLogicServiceTest(TestCase):
    """GameLogicService tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        self.team = Team.objects.create(
            game=self.game,
            name='pumpkin',
            max_players=2
        )
    
    def test_get_team_status_info(self):
        """Csapat állapot információk lekérdezése"""
        status_info = GameLogicService.get_team_status_info(self.team)
        
        self.assertEqual(status_info['current_station'], 1)
        self.assertEqual(status_info['attempts'], 0)
        self.assertFalse(status_info['help_used'])
        self.assertEqual(status_info['player_count'], 0)
        self.assertFalse(status_info['is_full'])
    
    def test_get_team_status_info_with_players(self):
        """Csapat állapot információk lekérdezése játékosokkal"""
        # Játékos hozzáadása
        Player.objects.create(team=self.team, name="Test Player")
        
        status_info = GameLogicService.get_team_status_info(self.team)
        
        self.assertEqual(status_info['player_count'], 1)
        self.assertFalse(status_info['is_full'])
        
        # Második játékos hozzáadása
        Player.objects.create(team=self.team, name="Test Player 2")
        
        status_info = GameLogicService.get_team_status_info(self.team)
        
        self.assertEqual(status_info['player_count'], 2)
        self.assertTrue(status_info['is_full'])


class GameStateManagerTest(TestCase):
    """GameStateManager tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        self.manager = GameStateManager(self.game)
    
    def test_game_constants(self):
        """GameConstants tesztelése"""
        self.assertEqual(GameConstants.SEPARATE_PHASE_STATIONS, 4)
        self.assertEqual(GameConstants.MEETING_STATION, 5)
        self.assertEqual(GameConstants.TOGETHER_PHASE_START, 6)
        self.assertEqual(GameConstants.TOTAL_STATIONS, 6)
        self.assertEqual(GameConstants.SAVE_STATION, 98)
        self.assertEqual(GameConstants.MAX_ATTEMPTS, 3)
        self.assertEqual(GameConstants.MIN_TEAMS, 1)
        self.assertEqual(GameConstants.MAX_TEAMS, 2)
        self.assertEqual(GameConstants.MIN_PLAYERS_PER_TEAM, 1)
        self.assertEqual(GameConstants.MAX_PLAYERS_PER_TEAM, 8)
        self.assertEqual(GameConstants.MIN_TOTAL_PLAYERS, 1)
        self.assertEqual(GameConstants.MAX_TOTAL_PLAYERS, 8)


class ModelValidationTest(TestCase):
    """Modell validáció tesztek"""
    
    def test_game_max_players_validation(self):
        """Játék maximum játékosok validációja"""
        # Érvényes értékek
        for players in [1, 2, 3, 4, 5, 6, 7, 8]:
            game = Game.objects.create(
                name=f"Test Game {players}",
                max_players=players,
                team_count=1
            )
            self.assertEqual(game.max_players, players)
    
    def test_game_team_count_validation(self):
        """Játék csapatok száma validációja"""
        # Érvényes értékek
        for teams in [1, 2]:
            game = Game.objects.create(
                name=f"Test Game {teams}",
                max_players=4,
                team_count=teams
            )
            self.assertEqual(game.team_count, teams)
    
    def test_team_name_choices(self):
        """Csapat név választási lehetőségek"""
        game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        
        # Érvényes csapat nevek
        valid_names = ['pumpkin', 'ghost', 'main']
        for name in valid_names:
            team = Team.objects.create(
                game=game,
                name=name,
                max_players=2
            )
            self.assertEqual(team.name, name)
    
    def test_station_phase_choices(self):
        """Állomás fázis választási lehetőségek"""
        valid_phases = ['separate', 'together', 'meeting', 'save']
        for i, phase in enumerate(valid_phases, 1):
            station = Station.objects.create(
                number=i,
                name=f"Test Station {i}",
                icon="🎃",
                phase=phase
            )
            self.assertEqual(station.phase, phase)
    
    def test_challenge_team_type_choices(self):
        """Feladat csapat típus választási lehetőségek"""
        station = Station.objects.create(
            number=1,
            name="Test Station",
            icon="🎃",
            phase="separate"
        )
        
        valid_team_types = ['pumpkin', 'ghost', 'both', None]
        for i, team_type in enumerate(valid_team_types, 1):
            challenge = Challenge.objects.create(
                station=station,
                team_type=team_type,
                title=f"Test Challenge {i}",
                description="Test description",
                qr_code=f"test_qr_{i}",
                help_text="Test help"
            )
            self.assertEqual(challenge.team_type, team_type)


class ModelRelationshipsTest(TestCase):
    """Modell kapcsolatok tesztek"""
    
    def setUp(self):
        """Teszt adatok beállítása"""
        self.game = Game.objects.create(
            name="Test Game",
            max_players=4,
            team_count=2
        )
        self.team = Team.objects.create(
            game=self.game,
            name='pumpkin',
            max_players=2
        )
        self.player = Player.objects.create(
            team=self.team,
            name="Test Player"
        )
        self.station = Station.objects.create(
            number=1,
            name="Test Station",
            icon="🎃",
            phase="separate"
        )
        self.challenge = Challenge.objects.create(
            station=self.station,
            team_type='pumpkin',
            title="Test Challenge",
            description="Test description",
            qr_code="test_qr_123",
            help_text="Test help"
        )
    
    def test_game_team_relationship(self):
        """Játék-csapat kapcsolat tesztelése"""
        self.assertEqual(self.game.teams.count(), 1)
        self.assertEqual(self.game.teams.first(), self.team)
    
    def test_team_player_relationship(self):
        """Csapat-játékos kapcsolat tesztelése"""
        self.assertEqual(self.team.players.count(), 1)
        self.assertEqual(self.team.players.first(), self.player)
    
    def test_station_challenge_relationship(self):
        """Állomás-feladat kapcsolat tesztelése"""
        self.assertEqual(self.station.challenges.count(), 1)
        self.assertEqual(self.station.challenges.first(), self.challenge)
    
    def test_cascade_deletion(self):
        """Kaszkád törlés tesztelése"""
        # Játék törlése -> csapatok és játékosok is törlődnek
        game_id = self.game.id
        self.game.delete()
        
        self.assertFalse(Team.objects.filter(game_id=game_id).exists())
        self.assertFalse(Player.objects.filter(team__game_id=game_id).exists())
        
        # Csapat törlése -> játékosok is törlődnek
        team = Team.objects.create(
            game=Game.objects.create(name="Test Game 2", max_players=4, team_count=2),
            name='pumpkin',
            max_players=2
        )
        player = Player.objects.create(team=team, name="Test Player 2")
        team_id = team.id
        team.delete()
        
        self.assertFalse(Player.objects.filter(team_id=team_id).exists())
        
        # Állomás törlése -> feladatok is törlődnek
        station = Station.objects.create(
            number=2,
            name="Test Station 2",
            icon="👻",
            phase="separate"
        )
        challenge = Challenge.objects.create(
            station=station,
            team_type='ghost',
            title="Test Challenge 2",
            description="Test description",
            qr_code="test_qr_456",
            help_text="Test help"
        )
        station_id = station.id
        station.delete()
        
        self.assertFalse(Challenge.objects.filter(station_id=station_id).exists())
