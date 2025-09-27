# api/game_views.py
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Count
from ..models import Game, Team, Player
from ..serializers import GameSerializer
from ..validators import GameCodeValidator, AdminGameCreationValidator
from ..services import GameStateService
from ..game_state_manager import GameConstants

logger = logging.getLogger(__name__)


@api_view(['GET'])
def find_game_by_code(request, game_code):
    """Játék keresése kód alapján - optimalizált verzió"""
    # Validáció
    validator = GameCodeValidator(data={'game_code': game_code})
    if not validator.is_valid():
        return Response({'error': validator.errors['game_code'][0]}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Prefetch related objects to avoid N+1 queries
        game = Game.objects.prefetch_related('teams__players').get(game_code=validator.validated_data['game_code'])
    except Game.DoesNotExist:
        return Response({'error': 'Nem található játék ezzel a kóddal'}, status=status.HTTP_404_NOT_FOUND)
    
    # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
    data = GameStateService.get_game_summary(game)
    return Response(data)


@api_view(['GET'])
def find_active_game(request):
    """Aktív játék keresése (deprecated - kompatibilitás miatt)"""
    # Keressünk egy setup állapotú játékot
    active_game = Game.objects.filter(status='setup').first()
    
    if active_game:
        # Összes játékos lekérdezése
        all_players = []
        for team in active_game.teams.all():
            for player in team.players.filter(is_active=True):
                all_players.append({
                    'name': player.name,
                    'team': team.name,
                    'team_display': team.get_name_display()
                })
        
        # Csapat információk
        teams_info = []
        for team in active_game.teams.all():
            team_players = [p for p in all_players if p['team'] == team.name]
            teams_info.append({
                'name': team.name,
                'display_name': team.get_name_display(),
                'players': team_players,
                'player_count': len(team_players),
                'max_players': 2,
                'available_slots': 2 - len(team_players)
            })
        
        # Összesített információk
        total_players = len(all_players)
        max_players = 4
        available_slots = max_players - total_players
        
        data = {
            'game': {
                'id': str(active_game.id),
                'name': active_game.name,
                'status': active_game.status
            },
            'teams': teams_info,
            'players': all_players,
            'game_info': {
                'total_players': total_players,
                'max_players': max_players,
                'available_slots': available_slots,
                'is_full': total_players >= max_players
            }
        }
        
        return Response(data)
    else:
        return Response({'error': 'Nincs aktív játék'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def create_game(request):
    """Új játék létrehozása (Admin)"""
    # Validáció
    validator = AdminGameCreationValidator(data=request.data)
    if not validator.is_valid():
        return Response({'error': validator.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = validator.validated_data
    
    # Debug log
    logger.info(f"Játék létrehozása: max_players={validated_data.get('max_players', 4)}, team_count={validated_data.get('team_count', 2)}")
    
    # Játék létrehozása
    game = Game.objects.create(
        name=validated_data['name'],
        created_by=validated_data['admin_name'],
        status='waiting',
        max_players=validated_data.get('max_players', 4),
        team_count=validated_data.get('team_count', 2)
    )
    
    # Rugalmas csapatok létrehozása
    if game.team_count == 1:
        # Egy csapat játék - mindkét csapat elérhető, de csak egy játékos játszik
        Team.objects.create(
            game=game, 
            name='pumpkin',
            max_players=1
        )
        Team.objects.create(
            game=game, 
            name='ghost',
            max_players=1
        )
    else:
        # Két csapat - egyenlő elosztás
        players_per_team = game.max_players // 2
        Team.objects.create(
            game=game, 
            name='pumpkin',
            max_players=players_per_team
        )
        Team.objects.create(
            game=game, 
            name='ghost',
            max_players=players_per_team
        )
    
    # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
    data = GameStateService.get_game_summary(game)
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def start_game(request, game_id):
    """Játék indítása (Admin)"""
    game = get_object_or_404(Game, id=game_id)
    
    # Játék indíthatóság ellenőrzése a szolgáltatáson keresztül
    if not GameStateService.can_game_start(game):
        if game.team_count == 1:
            return Response({'error': 'A játék nem indítható el. Legalább 1 játékos szükséges a főcsapatban'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'A játék nem indítható el. Mindkét csapatban kell lennie legalább egy játékosnak'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Játék indítása a GameStateService-en keresztül
        GameStateService.start_game(game)
        
        # Visszaadjuk a frissített játék adatokat
        data = GameStateService.get_game_summary(game)
        data['message'] = 'Játék sikeresen elindítva!'
        
        return Response(data)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def reset_game(request, game_id):
    """Játék visszaállítása - törli az összes játékost és visszaállítja a játékot"""
    game = get_object_or_404(Game, id=game_id)
    
    # Töröljük az összes játékost
    Player.objects.filter(team__game=game).delete()
    
    # GameStateManager használata a csapatok visszaállításához
    from ..game_state_manager import GameStateManager
    game_manager = GameStateManager(game)
    
    # Visszaállítjuk a csapatokat
    for team in game.teams.all():
        team.current_station = 1
        team.attempts = 0
        team.help_used = False
        team.completed_at = None
        team.separate_phase_save_used = False
        team.together_phase_save_used = False
        team.save()
    
    # Visszaállítjuk a játékot waiting állapotba
    game.status = 'waiting'
    game.save()
    
    # Cache invalidálása
    game_manager.invalidate_cache()
    
    # Visszaadjuk a frissített játék adatokat a GameStateService-en keresztül
    data = GameStateService.get_game_summary(game)
    data['message'] = 'Játék sikeresen visszaállítva!'
    
    return Response(data)


@api_view(['GET'])
def game_status(request, game_id):
    """Játék állapot lekérdezése - optimalizált verzió"""
    # Prefetch related objects to avoid N+1 queries
    game = get_object_or_404(Game.objects.prefetch_related('teams__players'), id=game_id)
    
    # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
    data = GameStateService.get_game_summary(game)
    
    # Session ellenőrzése
    current_player = None
    if (request.session.get('game_id') == str(game_id) and 
        request.session.get('player_name') and 
        request.session.get('team_name')):
        current_player = {
            'name': request.session.get('player_name'),
            'team': request.session.get('team_name')
        }
    
    data['current_player'] = current_player
    return Response(data)


@api_view(['PUT'])
def update_game(request, game_id):
    """Játék szerkesztése (Admin)"""
    game = get_object_or_404(Game, id=game_id)
    
    # Csak a név és admin név szerkeszthető
    if 'name' in request.data:
        game.name = request.data['name']
    if 'created_by' in request.data:
        game.created_by = request.data['created_by']
    
    game.save()
    
    # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
    data = GameStateService.get_game_summary(game)
    return Response(data)


@api_view(['DELETE'])
def delete_game(request, game_id):
    """Játék törlése (Admin)"""
    game = get_object_or_404(Game, id=game_id)
    
    # Játék törlése (a kapcsolódó adatok automatikusan törlődnek CASCADE miatt)
    game.delete()
    
    return Response({'message': 'Játék sikeresen törölve!'})


@api_view(['POST'])
def stop_game(request, game_id):
    """Játék leállítása (Admin)"""
    game = get_object_or_404(Game, id=game_id)
    
    # Csak futó játékokat lehet leállítani
    if game.status not in ['separate', 'together']:
        return Response({'error': 'Csak futó játékokat lehet leállítani'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Játék leállítása - finished állapotba állítjuk
    game.status = 'finished'
    game.save()
    
    # Visszaadjuk a frissített játék adatokat
    data = {
        'game': GameSerializer(game).data,
        'message': 'Játék sikeresen leállítva!'
    }
    
    return Response(data)
