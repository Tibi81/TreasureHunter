# services.py - Teljes verzió külön egyéni és közös büntetés kezeléssel
import logging
from django.db.models import Count
from django.db import transaction
from django.core.cache import cache
from .models import Game, Team, Player, Station, Challenge, GameProgress
from django.utils import timezone
from .game_state_manager import GameStateManager, GameConstants
from .session_token_services import SessionTokenService

logger = logging.getLogger(__name__)

class GameLogicService:
    """Játék logika szolgáltatások - egyszerűsített verzió"""
    
    @staticmethod
    def get_team_status_info(team):
        game_manager = GameStateManager(team.game)
        progress_info = game_manager.get_team_progress_info(team)
        
        return {
            'current_station': team.current_station,
            'attempts': team.attempts,
            'help_used': team.help_used,
            'completed_at': team.completed_at,
            'is_full': team.players.filter(is_active=True).count() >= team.max_players,
            'player_count': team.players.filter(is_active=True).count(),
            'can_use_help': progress_info['can_use_help'],
            'can_use_save': progress_info['can_use_save'],
            **progress_info
        }

class GameStateService:
    """Játék állapot kezelési szolgáltatások - Redis cache optimalizálással"""
    
    @staticmethod
    def get_game_summary(game):
        """
        Játék összefoglaló lekérdezése CACHE NÉLKÜL - mindig friss adatbázis
        """
        try:
            # ✅ CACHE TELJESEN KIKAPCSOLVA - mindig friss adatbázis
            logger.debug(f"Getting game summary from database: {game.id}")
            game_manager = GameStateManager(game)
            data = game_manager.get_game_summary()
            return data
            
        except Exception as e:
            # Cache hiba esetén közvetlenül adatbázisból
            logger.warning(f"Database error, using fallback: {e}")
            game_manager = GameStateManager(game)
            return game_manager.get_game_summary()
    
    @staticmethod
    def invalidate_game_cache(game_id):
        """
        Játék cache-jének invalidálása
        """
        cache_key = f"game_summary_{game_id}"
        cache.delete(cache_key)
        logger.info(f"Game cache invalidated: {game_id}")
    
    @staticmethod
    def can_game_start(game):
        game_manager = GameStateManager(game)
        return game_manager.can_game_start()
    
    @staticmethod
    def should_auto_transition_to_setup(game):
        game_manager = GameStateManager(game)
        return game_manager.should_auto_transition_to_setup()
    
    @staticmethod
    def start_game(game):
        game_manager = GameStateManager(game)
        # Közvetlenül separate fázisba kerüljön
        game_manager.start_separate_phase()
        
        # SSE üzenet küldése a játék indításáról
        from .sse_views import send_game_event
        send_game_event(
            game.id,
            "game_started",
            {
                "game_id": str(game.id),
                "game_name": game.name,
                "status": game.status,
                "message": "A játék elindult! 🎮"
            }
        )

class ChallengeService:
    """Feladat kezelési szolgáltatások"""

    @staticmethod
    def get_current_challenge_data(game, team):
        try:
            if team.attempts >= GameConstants.MAX_ATTEMPTS:
                if ChallengeService.can_use_save(game, team):
                    return ChallengeService.get_save_challenge_data(game, team)
                else:
                    return {
                        'error': 'Túl sok hiba! Újra kell kezdenetek! 😱',
                        'reset_required': True
                    }
            return ChallengeService._get_normal_challenge(game, team)
        except Exception as e:
            logger.error(f"Hiba a feladat adatok lekérdezésében: {e}")
            return {
                'error': 'Váratlan hiba történt a feladat betöltésekor!',
                'technical_error': True
            }

    @staticmethod
    def _get_challenge_for_team_and_station(station, team, game_status):
        challenge_filters = []
        if game_status == 'separate':
            challenge_filters = [
                {'team_type': team.name},
                {'team_type': 'both'},
                {'team_type__isnull': True}
            ]
        elif game_status == 'together':
            challenge_filters = [
                {'team_type__isnull': True},
                {'team_type': 'both'}
            ]
        
        logger.info(f"Feladat keresés: station={station.number}, team={team.name}, game_status={game_status}")
        
        for filter_dict in challenge_filters:
            if filter_dict is not None:
                challenge = Challenge.objects.filter(
                    station=station,
                    **filter_dict
                ).first()
                if challenge:
                    logger.info(f"Feladat találva: {challenge.title}, team_type={challenge.team_type}")
                    return challenge
                else:
                    logger.info(f"Nincs feladat: {filter_dict}")
        
        logger.warning(f"Nincs feladat találva: station={station.number}, team={team.name}, game_status={game_status}")
        return None

    @staticmethod
    def _get_normal_challenge(game, team):
        try:
            current_station = Station.objects.get(number=team.current_station)
        except Station.DoesNotExist:
            logger.error(f"Állomás nem található: {team.current_station}")
            return None
        station_to_show = current_station
        challenge = None

        if (game.status == 'together' and team.current_station == GameConstants.MEETING_STATION):
            try:
                station_to_show = Station.objects.get(number=GameConstants.TOGETHER_PHASE_START)
                challenge = ChallengeService._get_challenge_for_team_and_station(
                    station_to_show, team, game.status
                )
            except Station.DoesNotExist:
                logger.error(f"Közös fázis kezdő állomás nem található: {GameConstants.TOGETHER_PHASE_START}")
                return None
        else:
            challenge = ChallengeService._get_challenge_for_team_and_station(
                current_station, team, game.status
            )

        if not challenge:
            logger.warning(f"Feladat nem található: station={current_station.number}, team={team.name}, game_status={game.status}")
            return None
        team_status = GameLogicService.get_team_status_info(team)
        return {
            'station': {
                'number': station_to_show.number,
                'name': station_to_show.name,
                'icon': station_to_show.icon
            },
            'challenge': {
                'title': challenge.title,
                'description': challenge.description
            },
            'team_type': challenge.team_type,
            'team_status': team_status,
            'is_penalty': False
        }

    @staticmethod
    def validate_qr_code(game, team, qr_code):
        if not qr_code or not qr_code.strip():
            return {
                'success': False,
                'message': 'Érvénytelen QR kód!',
                'error': True
            }
        try:
            logger.info(f"QR kód validálás: game={game.id}, team={team.id}, qr={qr_code}")
            game_manager = GameStateManager(game)
            needs_save = team.attempts >= GameConstants.MAX_ATTEMPTS
            if needs_save:
                if ChallengeService.can_use_save(game, team):
                    return ChallengeService._validate_save_qr(game_manager, team, qr_code)
                else:
                    game_manager.reset_team_to_start(team)
                    return {
                        'success': False,
                        'message': 'Túl sok hiba! Újra kell kezdenetek! 😱',
                        'reset': True
                    }
            return ChallengeService._validate_normal_qr(game_manager, team, qr_code)
        except Exception as e:
            logger.error(f"Hiba a QR kód validálásában: {e}")
            return {
                'success': False,
                'message': 'Váratlan hiba történt!',
                'error': True
            }

    @staticmethod
    @transaction.atomic
    def _validate_save_qr(game_manager, team, qr_code):
        try:
            save_station = Station.objects.get(number=GameConstants.SAVE_STATION)
            correct_challenge = ChallengeService._get_challenge_for_team_and_station(
                save_station, team, game_manager.game.status
            )
            if correct_challenge and correct_challenge.qr_code == qr_code:
                GameProgress.objects.create(
                    game=game_manager.game,
                    team=team,
                    station=save_station,
                    attempts_made=team.attempts,
                    help_used=team.help_used
                )
                ChallengeService.use_save(game_manager.game, team)
                team.attempts = 0
                team.help_used = False
                team.save()
                logger.info(f"Mentesítő feladat sikeresen megoldva: team={team.id}")
                result = game_manager.advance_team(team)
                if isinstance(result, dict):
                    result['save_completed'] = True
                    if not result.get('message'):
                        result['message'] = 'Gratulálok! Sikeresen megoldottátok a mentesítő feladatot! 🎉'
                return result
            else:
                logger.info(f"Hibás QR kód mentesítő feladatnál: team={team.id}")
                game_manager.reset_team_to_start(team)
                return {
                    'success': False,
                    'message': 'Hibás QR kód a mentesítő feladatnál! Újra kell kezdenetek! 😱',
                    'reset': True
                }
        except Station.DoesNotExist:
            logger.error(f"Mentesítő állomás nem található: {GameConstants.SAVE_STATION}")
            return {
                'success': False,
                'message': 'Hiba történt a mentesítő feladat feldolgozása során!',
                'error': True
            }

    @staticmethod
    @transaction.atomic
    def _validate_normal_qr(game_manager, team, qr_code):
        try:
            current_station = Station.objects.get(number=team.current_station)
        except Station.DoesNotExist:
            logger.error(f"Állomás nem található QR validáláskor: {team.current_station}")
            return {
                'success': False,
                'message': 'Hiba történt az állomás megtalálása során!',
                'error': True
            }
        
        logger.info(f"QR validálás: team={team.name}, station={current_station.number}, qr={qr_code}")
        
        correct_challenge = ChallengeService._get_challenge_for_team_and_station(
            current_station, team, game_manager.game.status
        )
        
        if correct_challenge:
            logger.info(f"Megfelelő feladat: {correct_challenge.title}, qr={correct_challenge.qr_code}")
        else:
            logger.warning(f"Nincs megfelelő feladat: station={current_station.number}, team={team.name}")
        
        if correct_challenge and correct_challenge.qr_code == qr_code:
            # Ellenőrizzük, hogy már létezik-e GameProgress rekord
            game_progress, created = GameProgress.objects.get_or_create(
                game=game_manager.game,
                team=team,
                station=current_station,
                defaults={
                    'attempts_made': team.attempts + 1,
                    'help_used': team.help_used
                }
            )
            
            # Ha már létezett, frissítjük az adatokat
            if not created:
                game_progress.attempts_made = team.attempts + 1
                game_progress.help_used = team.help_used
                game_progress.save()
            result = game_manager.advance_team(team)
            if result.get('game_finished'):
                return {
                    'success': True,
                    'message': 'Gratulálok! Befejezettétek a játékot! 🎃👻',
                    'game_finished': True
                }
            return { **result, 'success': True }
        else:
            team.attempts += 1
            team.save()
            logger.info(f"Hibás QR kód: team={team.id}, attempts={team.attempts}")
            if team.attempts >= GameConstants.MAX_ATTEMPTS:
                if ChallengeService.can_use_save(game_manager.game, team):
                    return {
                        'success': False,
                        'message': f'{GameConstants.MAX_ATTEMPTS} hibás próbálkozás! Most egy mentesítő feladatot kell megoldanotok! 🆘',
                        'save_required': True
                    }
                else:
                    game_manager.reset_team_to_start(team)
                    return {
                        'success': False,
                        'message': f'{GameConstants.MAX_ATTEMPTS} hibás próbálkozás! Újra kell kezdenetek! 😱',
                        'reset': True
                    }
            else:
                return {
                    'success': False,
                    'message': f'Hibás QR kód! ({team.attempts}/{GameConstants.MAX_ATTEMPTS} próbálkozás)',
                    'attempts': team.attempts
                }


    @staticmethod
    def get_help_text(game, team):
        try:
            challenge_data = ChallengeService.get_current_challenge_data(game, team)
            if not challenge_data or challenge_data.get('error') or challenge_data.get('reset_required'):
                return None
            
            challenge = None
            if challenge_data.get('is_save'):
                try:
                    save_station = Station.objects.get(number=GameConstants.SAVE_STATION)
                    challenge = ChallengeService._get_challenge_for_team_and_station(
                        save_station, team, game.status
                    )
                except Station.DoesNotExist:
                    return None
            else:
                try:
                    station_number = challenge_data['station']['number']
                    current_station = Station.objects.get(number=station_number)
                    challenge = ChallengeService._get_challenge_for_team_and_station(
                        current_station, team, game.status
                    )
                except Station.DoesNotExist:
                    return None
            
            return challenge.help_text if challenge else None
        except Exception as e:
            logger.error(f"Hiba a help text lekérdezésében: {e}")
            return None

    @staticmethod
    @transaction.atomic
    def use_help(team):
        if team.help_used:
            return False
        logger.info(f"Segítség használat: team={team.id}")
        team.help_used = True
        team.save()
        return True

    @staticmethod
    def can_use_save(game, team):
        game_manager = GameStateManager(game)
        return game_manager.can_use_save(team)

    @staticmethod
    def use_save(game, team):
        game_manager = GameStateManager(game)
        return game_manager.use_save(team)

    @staticmethod
    def get_save_challenge_data(game, team):
        try:
            save_station = Station.objects.get(number=GameConstants.SAVE_STATION)
            challenge = ChallengeService._get_challenge_for_team_and_station(
                save_station, team, game.status
            )
            if not challenge:
                logger.warning(f"Mentesítő feladat nem található: team={team.name}, game_status={game.status}")
                return None
            team_status = GameLogicService.get_team_status_info(team)
            return {
                'station': {
                    'number': save_station.number,
                    'name': save_station.name,
                    'icon': save_station.icon
                },
                'challenge': {
                    'title': challenge.title,
                    'description': challenge.description
                },
                'team_type': challenge.team_type,
                'team_status': team_status,
                'is_save': True
            }
        except Station.DoesNotExist:
            logger.error(f"Mentesítő állomás nem található: {GameConstants.SAVE_STATION}")
            return None
        except Exception as e:
            logger.error(f"Hiba a mentesítő feladat lekérdezésében: {e}")
            return None