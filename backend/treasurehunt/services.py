# services.py
from django.db.models import Count
from .models import Game, Team, Player, Station, Challenge, GameProgress
from django.utils import timezone

class GameLogicService:
    """Játék logika szolgáltatások"""
    
    @staticmethod
    def calculate_team_progress(team, game_status):
        """Csapat haladásának kiszámítása"""
        if game_status == 'finished':
            return 6  # Összes állomás befejezve
        elif game_status == 'separate':
            return max(0, team.current_station - 1)
        elif game_status == 'together':
            # 4 külön fázis + közös fázis állomások
            return 4 + max(0, team.current_station - 5)
        return 0
    
    @staticmethod
    def get_remaining_stations(team, game_status):
        """Hátralévő állomások száma"""
        total_stations = 6
        completed = GameLogicService.calculate_team_progress(team, game_status)
        return max(0, total_stations - completed)
    
    @staticmethod
    def get_progress_percentage(team, game_status):
        """Haladás százaléka"""
        total_stations = 6
        completed = GameLogicService.calculate_team_progress(team, game_status)
        return round((completed / total_stations) * 100)
    
    @staticmethod
    def can_team_use_help(team):
        """Döntés arról, hogy a csapat használhatja-e a segítséget"""
        return not team.help_used and team.attempts > 0
    
    @staticmethod
    def is_team_full(team):
        """Döntés arról, hogy a csapat tele van-e"""
        return team.players.count() >= 2
    
    @staticmethod
    def get_team_status_info(team):
        """Csapat állapot információk összegyűjtése"""
        return {
            'current_station': team.current_station,
            'attempts': team.attempts,
            'help_used': team.help_used,
            'completed_at': team.completed_at,
            'is_full': GameLogicService.is_team_full(team),
            'player_count': team.players.count(),
            'can_use_help': GameLogicService.can_team_use_help(team)
        }

class GameStateService:
    """Játék állapot kezelési szolgáltatások"""
    
    @staticmethod
    def get_game_summary(game):
        """Játék összefoglaló információk - optimalizált verzió"""
        # Prefetch related objects to avoid N+1 queries
        teams = game.teams.prefetch_related('players').all()
        all_players = []
        
        for team in teams:
            for player in team.players.all():
                all_players.append({
                    'name': player.name,
                    'team': team.name,
                    'team_display': team.get_name_display()
                })
        
        # Csapat információk
        teams_info = []
        for team in teams:
            team_players = [p for p in all_players if p['team'] == team.name]
            team_status = GameLogicService.get_team_status_info(team)
            
            teams_info.append({
                'name': team.name,
                'display_name': team.get_name_display(),
                'players': team_players,
                'player_count': team_status['player_count'],
                'max_players': 2,
                'available_slots': 2 - team_status['player_count'],
                'is_full': team_status['is_full'],
                'current_station': team_status['current_station'],
                'attempts': team_status['attempts'],
                'help_used': team_status['help_used'],
                'completed_at': team_status['completed_at']
            })
        
        # Összesített információk
        total_players = len(all_players)
        max_players = 4
        available_slots = max_players - total_players
        
        return {
            'game': {
                'id': str(game.id),
                'game_code': game.game_code,
                'name': game.name,
                'status': game.status,
                'created_by': game.created_by,
                'created_at': game.created_at
            },
            'teams': teams_info,
            'players': all_players,
            'game_info': {
                'total_players': total_players,
                'max_players': max_players,
                'available_slots': available_slots,
                'is_full': total_players >= max_players,
                'can_start': GameStateService.can_game_start(game)
            }
        }
    
    @staticmethod
    def can_game_start(game):
        """Döntés arról, hogy a játék elindítható-e - optimalizált verzió"""
        if game.status not in ['waiting', 'setup']:
            return False
        
        # Prefetch players to avoid N+1 queries
        teams = game.teams.prefetch_related('players').all()
        
        # Legalább 2 játékos szükséges
        total_players = sum(team.players.count() for team in teams)
        if total_players < 2:
            return False
        
        # Minden csapatban kell lennie legalább egy játékosnak
        for team in teams:
            if team.players.count() == 0:
                return False
        
        return True
    
    @staticmethod
    def should_auto_transition_to_setup(game):
        """Döntés arról, hogy a játék automatikusan át kell-e állítani setup állapotba - optimalizált verzió"""
        if game.status != 'waiting':
            return False
        
        # Prefetch players to avoid N+1 queries
        teams = game.teams.prefetch_related('players').all()
        total_players = sum(team.players.count() for team in teams)
        return total_players >= 1  # Már 1 játékos is elég

class ChallengeService:
    """Feladat kezelési szolgáltatások"""
    
    @staticmethod
    def get_current_challenge_data(game, team):
        """Aktuális feladat adatainak lekérdezése"""
        current_station = Station.objects.get(number=team.current_station)
        
        # Feladat típus meghatározása
        if game.status == 'separate':
            # Külön fázis: csapat-specifikus feladat
            challenge = Challenge.objects.filter(
                station=current_station, 
                team_type=team.name
            ).first()
            
            # Ha nincs csapat-specifikus feladat, próbáljuk a közös feladatot (5. feladat)
            if not challenge and current_station.phase == 'together':
                challenge = Challenge.objects.filter(
                    station=current_station, 
                    team_type__isnull=True
                ).first()
        elif game.status == 'together':
            # Közös fázis: közös feladatok
            challenge = Challenge.objects.filter(
                station=current_station, 
                team_type__isnull=True
            ).first()
        else:
            return None
        
        if not challenge:
            return None
        
        team_status = GameLogicService.get_team_status_info(team)
        
        return {
            'station': {
                'number': current_station.number,
                'name': current_station.name,
                'icon': current_station.icon
            },
            'challenge': {
                'title': challenge.title,
                'description': challenge.description
            },
            'team_type': challenge.team_type,
            'team_status': team_status
        }
    
    @staticmethod
    def validate_qr_code(game, team, qr_code):
        """QR kód validálása és feldolgozása"""
        current_station = Station.objects.get(number=team.current_station)
        
        # Helyes QR kód ellenőrzése
        if game.status == 'separate':
            # Külön fázis: csapat-specifikus feladat
            correct_challenge = Challenge.objects.filter(
                station=current_station, 
                team_type=team.name,
                qr_code=qr_code
            ).first()
            
            # Ha nincs csapat-specifikus feladat, próbáljuk a közös feladatot (5. feladat)
            if not correct_challenge and current_station.phase == 'together':
                correct_challenge = Challenge.objects.filter(
                    station=current_station, 
                    team_type__isnull=True,
                    qr_code=qr_code
                ).first()
        else:
            # Közös fázis: közös feladatok
            correct_challenge = Challenge.objects.filter(
                station=current_station, 
                team_type__isnull=True,
                qr_code=qr_code
            ).first()
        
        if correct_challenge:
            return ChallengeService._handle_correct_qr(game, team, current_station)
        else:
            return ChallengeService._handle_incorrect_qr(team)
    
    @staticmethod
    def _handle_correct_qr(game, team, current_station):
        """Helyes QR kód feldolgozása"""
        # Játék haladás rögzítése
        GameProgress.objects.create(
            game=game,
            team=team,
            station=current_station,
            attempts_made=team.attempts + 1,
            help_used=team.help_used
        )
        
        # Következő állomás
        team.current_station += 1
        team.attempts = 0
        team.help_used = False
        
        # Ellenőrizzük, hogy elérte-e a találkozási pontot
        if team.current_station == game.meeting_station and game.status == 'separate':
            team.completed_at = timezone.now()
            
            # Ha ez az első csapat, aki elérte
            if not game.teams.filter(completed_at__isnull=False).exclude(id=team.id).exists():
                response_data = {
                    'success': True,
                    'message': 'Gratulálok! Első csapat vagy, aki elérte a találkozási pontot! 🎁',
                    'bonus': True
                }
            else:
                response_data = {
                    'success': True,
                    'message': 'Elértétek a találkozási pontot!',
                    'bonus': False
                }
            
            # Ha mindkét csapat elérte, váltás közös fázisra
            if game.teams.filter(completed_at__isnull=False).count() == 2:
                game.status = 'together'
                game.save()
                response_data['phase_change'] = 'together'
        
        elif team.current_station > Station.objects.count():
            # Játék vége
            game.status = 'finished'
            game.save()
            response_data = {
                'success': True,
                'message': 'Gratulálok! Befejezettétek a játékot! 🎃👻',
                'game_finished': True
            }
        else:
            response_data = {
                'success': True,
                'message': 'Helyes! Menjetek a következő állomásra!'
            }
        
        team.save()
        return response_data
    
    @staticmethod
    def _handle_incorrect_qr(team):
        """Hibás QR kód feldolgozása"""
        team.attempts += 1
        
        if team.attempts >= 3:
            # 3 hibás próbálkozás - visszaállítás
            team.current_station = 1
            team.attempts = 0
            team.help_used = False
            team.save()
            
            return {
                'success': False,
                'message': '3 hibás próbálkozás után újra kell kezdenetek! 😱',
                'reset': True
            }
        else:
            team.save()
            return {
                'success': False,
                'message': f'Hibás QR kód! ({team.attempts}/3 próbálkozás)',
                'attempts': team.attempts
            }
