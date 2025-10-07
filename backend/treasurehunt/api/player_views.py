# api/player_views.py
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from ..models import Game, Team, Player
from ..serializers import PlayerSerializer
from ..validators import PlayerRegistrationValidator
from ..services import GameStateService, SessionTokenService
from ..game_state_manager import GameConstants
from ..utils.error_handler import GameErrorHandler, api_error_handler

logger = logging.getLogger(__name__)


@api_view(['POST'])
@api_error_handler
def join_game(request, game_id):
    """Játékos csatlakozás - optimalizált verzió"""
    try:
        # Prefetch related objects to avoid N+1 queries
        game = get_object_or_404(Game.objects.prefetch_related('teams__players'), id=game_id)
        
        # Validáció
        validator = PlayerRegistrationValidator(data=request.data)
        if not validator.is_valid():
            return GameErrorHandler.handle_validation_error(
                f"Érvénytelen adatok: {validator.errors}",
                'player_registration'
            )
        
        validated_data = validator.validated_data
        player_name = validated_data['name']
        team_name = validated_data['team']
        
        team = get_object_or_404(Team, game=game, name=team_name)
        
        # Játék teljes kapacitás ellenőrzése
        total_active_players = sum(team.players.filter(is_active=True).count() for team in game.teams.all())
        if total_active_players >= game.max_players:
            return GameErrorHandler.handle_game_state_error(
                f'A játék már tele van (maximum {game.max_players} játékos)'
            )
        
        # Csapat telítettség ellenőrzése (csak aktív játékosok alapján)
        if team.players.filter(is_active=True).count() >= team.max_players:
            return GameErrorHandler.handle_game_state_error('Ez a csapat már tele van')
        
        player = Player.objects.create(team=team, name=player_name)
        
        # Session token generálása
        session_token = SessionTokenService.generate_token(player)
        
        # Session frissítése
        request.session['game_id'] = str(game.id)
        request.session['player_name'] = player_name
        request.session['team_name'] = team_name
        request.session['session_token'] = session_token
        
        # Automatikus állapotváltás ellenőrzése a szolgáltatáson keresztül
        if GameStateService.should_auto_transition_to_setup(game):
            game.status = 'setup'
            game.save()
        
        # Egyszerűsített válasz - csak a szükséges adatokat adjuk vissza
        return Response({
            'id': player.id,
            'name': player.name,
            'team_name': team.get_name_display(),
            'joined_at': player.joined_at,
            'session_token': session_token,
            'message': 'Sikeresen csatlakoztál a játékhoz!'
        }, status=status.HTTP_201_CREATED)
        
    except Game.DoesNotExist:
        return GameErrorHandler.handle_game_not_found(game_id)
    except Team.DoesNotExist:
        return GameErrorHandler.handle_team_not_found(team_name)
    except ValidationError as e:
        return GameErrorHandler.handle_validation_error(str(e))
    except Exception as e:
        logger.error(f"Unexpected error in join_game: {e}")
        return GameErrorHandler.handle_game_state_error("Váratlan hiba történt a csatlakozáskor")


@api_view(['GET'])
def get_player_status(request):
    """Játékos pozíció lekérdezése session alapján"""
    game_id = request.session.get('game_id')
    player_name = request.session.get('player_name')
    team_name = request.session.get('team_name')
    
    if not all([game_id, player_name, team_name]):
        return Response({'error': 'Nincs aktív játékos'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    try:
        game = Game.objects.get(id=game_id)
        team = Team.objects.get(game=game, name=team_name)
        
        # Ellenőrizzük, hogy a játékos még létezik-e
        player = Player.objects.filter(team=team, name=player_name).first()
        if not player:
            # Ha a játékos nem létezik, töröljük a session-t
            request.session.flush()
            return Response({'error': 'Játékos nem található a játékban'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
        data = GameStateService.get_game_summary(game)
        
        # Jelenlegi játékos információk
        data['current_player'] = {
            'name': player_name,
            'team': team_name,
            'team_display': team.get_name_display()
        }
        
        # Csapat állapot információk
        from ..services import GameLogicService
        team_status = GameLogicService.get_team_status_info(team)
        data['team_status'] = {
            'current_station': team_status['current_station'],
            'attempts': team_status['attempts'],
            'help_used': team_status['help_used'],
            'completed_at': team_status['completed_at']
        }
        
        return Response(data)
    except (Game.DoesNotExist, Team.DoesNotExist):
        # Ha a játék vagy csapat nem létezik, töröljük a session-t
        request.session.flush()
        return Response({'error': 'Játék vagy csapat nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def check_player_session(request):
    """Játékos session ellenőrzése és visszaállítása"""
    game_id = request.session.get('game_id')
    player_name = request.session.get('player_name')
    team_name = request.session.get('team_name')
    
    if not all([game_id, player_name, team_name]):
        return Response({'has_session': False})
    
    try:
        game = Game.objects.get(id=game_id)
        team = Team.objects.get(game=game, name=team_name)
        player = Player.objects.filter(team=team, name=player_name).first()
        
        if not player:
            # Ha a játékos nem létezik, töröljük a session-t
            request.session.flush()
            return Response({'has_session': False})
        
        # Játék összefoglaló lekérdezése
        data = GameStateService.get_game_summary(game)
        data['has_session'] = True
        data['current_player'] = {
            'name': player_name,
            'team': team_name,
            'team_display': team.get_name_display()
        }
        
        return Response(data)
    except (Game.DoesNotExist, Team.DoesNotExist):
        # Ha a játék vagy csapat nem létezik, töröljük a session-t
        request.session.flush()
        return Response({'has_session': False})


@api_view(['POST'])
def exit_game(request):
    """Játékos kilépése a játékból - szüneteltetés (session token megmarad)"""
    # POST body-ból vagy session-ből próbáljuk meg
    session_token = request.data.get('session_token') or request.session.get('session_token')
    
    if not session_token:
        return Response({'error': 'Nincs aktív játékos session'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Játékos keresése token alapján
        player = Player.objects.get(session_token=session_token)
        game = player.team.game
        team = player.team
        
        # Szüneteltetés: játékos inaktív, de token megmarad
        player.is_active = False
        player.save()
        
        # Session törlése (de token megmarad a localStorage-ban)
        request.session.flush()
        
        # Ha szükséges, játék állapot frissítése
        active_players = Player.objects.filter(
            team__game=game, 
            session_token__isnull=False,
            is_active=True
        ).count()
        
        if active_players == 0:
            game.status = 'waiting'
            game.save()
        
        return Response({
            'message': 'Játék szüneteltetve - később folytathatod ugyanitt!',
            'game_status': game.status
        })
        
    except Player.DoesNotExist:
        return Response({'error': 'Játékos nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Hiba a kilépéskor: {e}")
        return Response({'error': 'Hiba történt a kilépés során'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def restore_session(request):
    """Session token alapú visszatérés a játékba"""
    session_token = request.data.get('session_token')
    
    if not session_token:
        return Response({'error': 'Session token szükséges'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Játékos keresése token alapján
        player = Player.objects.select_related('team__game').get(session_token=session_token)
        
        # Token érvényesség ellenőrzése
        if not SessionTokenService.is_valid(player):
            return Response({'error': 'Session token lejárt vagy érvénytelen'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
        
        # Ha a játékos inaktív, aktiváljuk újra (szüneteltetésből visszatérés)
        if not player.is_active:
            player.is_active = True
            player.save()
        
        # Session frissítése
        request.session['game_id'] = str(player.team.game.id)
        request.session['player_name'] = player.name
        request.session['team_name'] = player.team.name
        request.session['session_token'] = session_token
        
        # Játék adatok lekérdezése
        data = GameStateService.get_game_summary(player.team.game)
        data['player'] = PlayerSerializer(player).data
        data['message'] = f'Üdvözöllek vissza, {player.name}!'
        
        return Response(data)
        
    except Player.DoesNotExist:
        return Response({'error': 'Érvénytelen session token'}, 
                       status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Hiba a session visszaállításakor: {e}")
        return Response({'error': 'Hiba történt a session visszaállítása során'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def logout_player(request):
    """Játékos kijelentkezése - végleges kilépés (játékos törlése)"""
    # Próbáljuk POST body-ból, majd session-ből
    session_token = request.data.get('session_token') or request.session.get('session_token')
    
    if not session_token:
        return Response({'error': 'Nincs aktív session'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Játékos keresése
        player = Player.objects.get(session_token=session_token)
        game = player.team.game
        team = player.team
        
        # Játékos törlése (végleges kilépés)
        player.delete()
        
        # Session törlése
        request.session.flush()
        
        # Ha a csapat üres lett, visszaállítjuk a játékot waiting állapotba
        if not team.players.exists():
            game.status = 'waiting'
            game.save()
        
        return Response({'message': 'Sikeresen kijelentkeztél - nem térhetsz vissza ebbe a játékba'})
        
    except Player.DoesNotExist:
        # Ha a játékos nem található, akkor is töröljük a sessiont
        request.session.flush()
        return Response({'message': 'Session törölve'})
    except Exception as e:
        logger.error(f"Hiba a kijelentkezéskor: {e}")
        return Response({'error': 'Hiba történt a kijelentkezés során'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
