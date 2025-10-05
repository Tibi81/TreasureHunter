# api/admin_views.py
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from ..models import Game, Team, Player
from ..serializers import PlayerSerializer
from ..services import GameStateService

logger = logging.getLogger(__name__)


@api_view(['GET'])
def list_games(request):
    """Összes játék listázása (Admin) - optimalizált"""
    # Pagináció paraméterek
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))  # Alapértelmezetten 20 játék per oldal
    offset = (page - 1) * page_size
    
    # Prefetch related objects to avoid N+1 queries
    games = Game.objects.prefetch_related(
        'teams__players'
    ).all().order_by('-created_at')[offset:offset + page_size]
    
    # Összes játék száma (paginációhoz)
    total_games = Game.objects.count()
    
    games_data = []
    for game in games:
        # Játékosok számának lekérdezése - csak aktív játékosok
        total_players = sum(team.players.filter(is_active=True).count() for team in game.teams.all())
        
        # Csapatok állapotának lekérdezése - már prefetch-elt
        teams_data = []
        for team in game.teams.all():
            teams_data.append({
                'name': team.name,
                'display_name': team.get_name_display(),
                'player_count': team.players.filter(is_active=True).count(),
                'current_station': team.current_station,
                'players': [{'id': p.id, 'name': p.name} for p in team.players.filter(is_active=True)]
            })
        
        games_data.append({
            'id': str(game.id),
            'name': game.name,
            'game_code': game.game_code,
            'status': game.status,
            'status_display': game.get_status_display(),
            'created_at': game.created_at,
            'created_by': game.created_by,
            'total_players': total_players,
            'teams': teams_data
        })
    
    return Response({
        'games': games_data,
        'total_count': total_games,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_games + page_size - 1) // page_size
    })


@api_view(['DELETE'])
def remove_player(request, game_id, player_id):
    """Játékos eltávolítása (Admin) - javított verzió"""
    # Prefetch related objects to avoid N+1 queries
    game = get_object_or_404(Game.objects.prefetch_related('teams__players'), id=game_id)
    
    try:
        player = Player.objects.get(id=player_id, team__game=game)
        player_name = player.name
        team_name = player.team.name
        player.delete()
        
        # Ha a csapat üres lett, visszaállítjuk a játékot waiting állapotba
        if not game.teams.filter(name=team_name).first().players.exists():
            game.status = 'waiting'
            game.save()
        
        # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
        data = GameStateService.get_game_summary(game)
        data['message'] = f'Játékos {player_name} eltávolítva!'
        
        return Response(data)
    except Player.DoesNotExist:
        return Response({'error': 'Játékos nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def move_player(request, game_id, player_id):
    """Játékos áthelyezése másik csapatba (Admin) - javított verzió"""
    # Prefetch related objects to avoid N+1 queries
    game = get_object_or_404(Game.objects.prefetch_related('teams__players'), id=game_id)
    
    try:
        player = Player.objects.get(id=player_id, team__game=game)
        new_team_name = request.data.get('new_team')
        
        if not new_team_name or new_team_name not in ['pumpkin', 'ghost']:
            return Response({'error': 'Érvénytelen csapat név'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Ellenőrizzük, hogy a célcsapat nem tele (csak aktív játékosok alapján)
        target_team = Team.objects.get(game=game, name=new_team_name)
        if target_team.players.filter(is_active=True).count() >= target_team.max_players:
            return Response({'error': 'A célcsapat már tele van'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Áthelyezzük a játékost
        old_team_name = player.team.name
        player.team = target_team
        player.save()
        
        # Ha az eredeti csapat üres lett, visszaállítjuk a játékot waiting állapotba
        if not game.teams.filter(name=old_team_name).first().players.exists():
            game.status = 'waiting'
            game.save()
        
        # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
        data = GameStateService.get_game_summary(game)
        data['message'] = f'Játékos áthelyezve a {target_team.get_name_display()} csapatba!'
        
        return Response(data)
    except Player.DoesNotExist:
        return Response({'error': 'Játékos nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)
    except Team.DoesNotExist:
        return Response({'error': 'Célcsapat nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def add_player(request, game_id):
    """Játékos hozzáadása (Admin) - javított verzió"""
    # Prefetch related objects to avoid N+1 queries
    game = get_object_or_404(Game.objects.prefetch_related('teams__players'), id=game_id)
    
    player_name = request.data.get('name')
    team_name = request.data.get('team')
    
    if not player_name or not team_name:
        return Response({'error': 'Játékos név és csapat megadása kötelező'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if team_name not in ['pumpkin', 'ghost', 'main']:
        return Response({'error': 'Érvénytelen csapat név'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        team = Team.objects.get(game=game, name=team_name)
        
        # Ellenőrizzük, hogy a csapat nem tele (csak aktív játékosok alapján)
        if team.players.filter(is_active=True).count() >= team.max_players:
            return Response({'error': 'Ez a csapat már tele van'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Ellenőrizzük, hogy a játékos név egyedi-e a játékban
        if Player.objects.filter(team__game=game, name=player_name).exists():
            return Response({'error': 'Már van ilyen nevű játékos a játékban'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Játékos létrehozása
        player = Player.objects.create(team=team, name=player_name)
        
        # Automatikus állapotváltás ellenőrzése
        if GameStateService.should_auto_transition_to_setup(game):
            game.status = 'setup'
            game.save()
        
        # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
        data = GameStateService.get_game_summary(game)
        data['message'] = f'Játékos {player_name} hozzáadva a {team.get_name_display()} csapathoz!'
        data['player'] = PlayerSerializer(player).data
        
        return Response(data, status=status.HTTP_201_CREATED)
        
    except Team.DoesNotExist:
        return Response({'error': 'Csapat nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)
