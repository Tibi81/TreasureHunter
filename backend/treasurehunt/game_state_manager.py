# game_state_manager.py - Javított verzió
import logging
from django.db.models import Count
from django.utils import timezone
from django.db import transaction
from .models import Game, Team, Player, Station, Challenge, GameProgress

logger = logging.getLogger(__name__)

class GameConstants:
    """Játék konstansok központi helye"""
    SEPARATE_PHASE_STATIONS = 4  # 1-4 állomás (külön fázis)
    MEETING_STATION = 5  # Találkozási pont
    TOGETHER_PHASE_START = 6  # Közös fázis kezdete
    TOTAL_STATIONS = 6  # Összes játék állomás
    SAVE_STATION = 98  # Mentesítő feladat állomás
    MAX_ATTEMPTS = 3  # Maximum próbálkozások száma
    
    # Rugalmas értékek
    MIN_TEAMS = 1
    MAX_TEAMS = 2
    MIN_PLAYERS_PER_TEAM = 1
    MAX_PLAYERS_PER_TEAM = 8  # Maximum 8 játékos egy csapatban
    MIN_TOTAL_PLAYERS = 1
    MAX_TOTAL_PLAYERS = 8


class GameStateManager:
    """Központi játék állapot kezelő - javított verzió"""
    
    def __init__(self, game):
        self.game = game
        self._teams_cache = None
    
    @property
    def teams(self):
        """Cachelt csapatok lekérdezése"""
        if self._teams_cache is None:
            self._teams_cache = self.game.teams.prefetch_related(
                'players',
                'gameprogress_set'
            ).select_related('game').all()
        return self._teams_cache
    
    def invalidate_cache(self):
        """Cache invalidálása"""
        self._teams_cache = None
    
    def get_game_summary(self):
        """Optimalizált játék összefoglaló"""
        teams = self.teams
        all_players = []
        
        for team in teams:
            # Csak az aktív játékosokat vesszük figyelembe
            for player in team.players.filter(is_active=True):
                all_players.append({
                    'name': player.name,
                    'team': team.name,
                    'team_display': team.get_name_display()
                })
        
        # Csapat információk
        teams_info = []
        for team in teams:
            team_players = [p for p in all_players if p['team'] == team.name]
            
            teams_info.append({
                'name': team.name,
                'display_name': team.get_name_display(),
                'players': team_players,
                'player_count': len(team_players),
                'max_players': team.max_players,
                'available_slots': team.max_players - len(team_players),
                'is_full': len(team_players) >= team.max_players,
                'current_station': team.current_station,
                'attempts': team.attempts,
                'help_used': team.help_used,
                'completed_at': team.completed_at,
                'separate_phase_save_used': team.separate_phase_save_used,
                'together_phase_save_used': team.together_phase_save_used
            })
        
        total_players = len(all_players)
        available_slots = self.game.max_players - total_players
        
        return {
            'game': {
                'id': str(self.game.id),
                'game_code': self.game.game_code,
                'name': self.game.name,
                'status': self.game.status,
                'meeting_station': self.game.meeting_station,
                'created_by': self.game.created_by,
                'created_at': self.game.created_at,
                'max_players': self.game.max_players,
                'team_count': self.game.team_count,
                'players_per_team': self.game.players_per_team
            },
            'teams': teams_info,
            'players': all_players,
            'game_info': {
                'total_players': total_players,
                'max_players': self.game.max_players,
                'available_slots': available_slots,
                'is_full': total_players >= self.game.max_players,
                'can_start': self.can_game_start()
            }
        }
    
    def can_game_start(self):
        """Rugalmas játék indíthatóság ellenőrzése"""
        if self.game.status not in ['waiting', 'setup']:
            return False
        
        teams = self.teams
        total_players = sum(team.players.filter(is_active=True).count() for team in teams)
        
        logger.info(f"Játék indíthatóság ellenőrzése: team_count={self.game.team_count}, total_players={total_players}")
        
        if self.game.team_count == 1:
            # Egy csapat játék: minimum 1 játékos bármelyik csapatban
            teams_with_players = 0
            for team in teams:
                if team.players.filter(is_active=True).count() > 0:
                    teams_with_players += 1
            result = teams_with_players >= 1
            logger.info(f"Egy csapat játék indítható: {result} (teams_with_players={teams_with_players})")
            return result
        else:
            # Két csapat: mindkét csapatban minimum 1 játékos
            teams_with_players = 0
            for team in teams:
                if team.players.filter(is_active=True).count() > 0:
                    teams_with_players += 1
            result = teams_with_players >= 2
            logger.info(f"Két csapat játék indítható: {result} (teams_with_players={teams_with_players})")
            return result
    
    def should_auto_transition_to_setup(self):
        """Rugalmas automatikus setup állapotba váltás ellenőrzése"""
        if self.game.status != 'waiting':
            return False
        
        total_players = sum(team.players.filter(is_active=True).count() for team in self.teams)
        
        if self.game.team_count == 1:
            # Egy csapat: minimum 1 játékos
            return total_players >= 1
        else:
            # Két csapat: mindkét csapatban minimum 1 játékos
            teams_with_players = 0
            for team in self.teams:
                if team.players.filter(is_active=True).count() > 0:
                    teams_with_players += 1
            return teams_with_players >= 2
    
    @transaction.atomic
    def start_separate_phase(self):
        """Külön fázis indítása"""
        if not self.can_game_start():
            raise ValueError("A játék nem indítható el")
        
        logger.info(f"Játék indítás: game_id={self.game.id}")
        
        self.game.status = 'separate'
        self.game.save()
        
        # Csapatok alaphelyzetbe állítása
        for team in self.teams:
            team.current_station = 1
            team.attempts = 0
            team.help_used = False
            team.completed_at = None
            team.separate_phase_save_used = False
            team.together_phase_save_used = False
            team.save()
        
        self.invalidate_cache()
    
    def check_meeting_point_transition(self):
        """Találkozási pont elérés ellenőrzése és közös fázisra váltás"""
        if self.game.status != 'separate':
            return False
        
        teams_at_meeting = self.teams.filter(
            current_station=GameConstants.MEETING_STATION,
            completed_at__isnull=False
        ).count()
        
        total_teams = len(self.teams)
        
        if teams_at_meeting >= total_teams:
            # Minden csapat elérte a találkozási pontot
            self._transition_to_together_phase()
            return True
        
        return False
    
    @transaction.atomic
    def _transition_to_together_phase(self):
        """Közös fázisra váltás"""
        logger.info(f"Közös fázisra váltás: game_id={self.game.id}")
        
        self.game.status = 'together'
        self.game.save()
        
        # Minden csapatot továbbléptetjük a közös fázis első állomására
        for team in self.teams:
            if team.completed_at is not None:  # Ha elérte a találkozási pontot
                team.current_station = GameConstants.TOGETHER_PHASE_START
                team.attempts = 0
                team.help_used = False
                team.save()
        
        self.invalidate_cache()
    
    @transaction.atomic
    def advance_team(self, team):
        """Csapat továbbléptetése következő állomásra - javított verzió"""
        logger.info(f"Csapat továbbléptetés: team_id={team.id}, current_station={team.current_station}")
        
        # Ellenőrizzük, hogy elérte-e a találkozási pontot (külön fázisban)
        if (team.current_station == GameConstants.MEETING_STATION and 
            self.game.status == 'separate'):
            return self._handle_meeting_point_arrival(team)
        
        # Normál továbblépés
        team.current_station += 1
        team.attempts = 0
        team.help_used = False
        team.save()
        
        self.invalidate_cache()
        
        # Játék vége ellenőrzés (csak egyszer!)
        if team.current_station > GameConstants.TOTAL_STATIONS:
            self._finish_game()
            return {'game_finished': True}
        
        return {'success': True}
    
    def _handle_meeting_point_arrival(self, team):
        """Találkozási pont elérésének kezelése - javított verzió"""
        # Jelöljük meg, hogy elérte a találkozási pontot
        team.completed_at = timezone.now()
        team.attempts = 0
        team.help_used = False
        team.save()
        
        self.invalidate_cache()
        
        # Konzisztens lekérdezés
        teams_at_meeting = self.teams.filter(
            current_station=GameConstants.MEETING_STATION,
            completed_at__isnull=False
        ).count()
        
        total_teams = len(self.teams)
        
        logger.info(f"Találkozási pont: teams_at_meeting={teams_at_meeting}, total_teams={total_teams}")
        
        if teams_at_meeting == 1:
            # Első csapat
            return {
                'success': True,
                'message': 'Gratulálok! Első csapat vagy, aki elérte a találkozási pontot! Várjatok a másik csapatra! 🎁',
                'bonus': True,
                'waiting_for_other_team': True
            }
        elif teams_at_meeting >= total_teams:
            # Minden csapat elérte
            self._transition_to_together_phase()
            return {
                'success': True,
                'message': 'Minden csapat elérte a találkozási pontot! Most együtt folytatjátok! 🤝',
                'bonus': False,
                'phase_change': 'together'
            }
        else:
            # Közbülső csapat (ha több mint 2 csapat lenne)
            return {
                'success': True,
                'message': f'Elértétek a találkozási pontot! Várjatok a többi csapatra! ({teams_at_meeting}/{total_teams})',
                'bonus': False,
                'waiting_for_other_team': True
            }
    
    def _finish_game(self):
        """Játék befejezése"""
        logger.info(f"Játék befejezés: game_id={self.game.id}")
        self.game.status = 'finished'
        self.game.save()
        self.invalidate_cache()
    
    @transaction.atomic
    def reset_team_to_start(self, team):
        """Csapat visszaállítása az elejére (3 hibás próbálkozás után)"""
        logger.info(f"Csapat újrakezdés: team_id={team.id}")
        team.current_station = 1
        team.attempts = 0
        team.help_used = False
        team.completed_at = None
        team.separate_phase_save_used = False
        team.together_phase_save_used = False
        team.save()
        
        self.invalidate_cache()
    
    def can_use_save(self, team):
        """Ellenőrzi, hogy használhatja-e a mentesítő feladatot"""
        if self.game.status == 'separate':
            return not team.separate_phase_save_used
        elif self.game.status == 'together':
            return not team.together_phase_save_used
        return False
    
    @transaction.atomic
    def use_save(self, team):
        """Mentesítő feladat használata"""
        logger.info(f"Mentesítő feladat használat: team_id={team.id}, game_status={self.game.status}")
        
        if self.game.status == 'separate':
            if team.separate_phase_save_used:
                return False
            team.separate_phase_save_used = True
        elif self.game.status == 'together':
            if team.together_phase_save_used:
                return False
            team.together_phase_save_used = True
        else:
            return False
        
        team.save()
        self.invalidate_cache()
        return True
    
    def get_team_progress_info(self, team):
        """Csapat haladási információk - javított verzió"""
        if self.game.status == 'finished':
            progress = GameConstants.TOTAL_STATIONS
        elif self.game.status == 'separate':
            # Külön fázisban: aktuális állomás - 1
            progress = max(0, team.current_station - 1)
        elif self.game.status == 'together':
            # Közös fázisban
            if team.current_station == GameConstants.MEETING_STATION:
                # Ha még a találkozási ponton van
                progress = GameConstants.SEPARATE_PHASE_STATIONS
            else:
                # Külön fázis + közös fázis eddig teljesített állomásai
                separate_progress = GameConstants.SEPARATE_PHASE_STATIONS
                together_progress = max(0, team.current_station - GameConstants.TOGETHER_PHASE_START)
                progress = separate_progress + together_progress
        else:
            progress = 0
        
        remaining = max(0, GameConstants.TOTAL_STATIONS - progress)
        percentage = round((progress / GameConstants.TOTAL_STATIONS) * 100) if GameConstants.TOTAL_STATIONS > 0 else 0
        
        return {
            'completed_stations': progress,
            'remaining_stations': remaining,
            'progress_percentage': percentage,
            'current_station': team.current_station,
            'can_use_help': not team.help_used and team.attempts > 0,
            'can_use_save': self.can_use_save(team)
        }