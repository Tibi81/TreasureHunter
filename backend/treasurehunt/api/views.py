# api/views.py
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count
from ..models import Game, Team, Player, Station, Challenge, GameProgress
from ..serializers import GameSerializer, TeamSerializer, PlayerSerializer, ChallengeSerializer
from ..validators import GameCodeValidator, PlayerRegistrationValidator, AdminGameCreationValidator, QRCodeValidator
from ..services import GameStateService, ChallengeService, GameLogicService, SessionTokenService
from ..game_state_manager import GameStateManager, GameConstants

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
            for player in team.players.all():
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
    
    # Játék létrehozása
    game = Game.objects.create(
        name=validated_data['name'],
        created_by=validated_data['admin_name'],
        status='waiting'
    )
    
    # Alapértelmezett csapatok létrehozása
    Team.objects.create(game=game, name='pumpkin')
    Team.objects.create(game=game, name='ghost')
    
    # Játék összefoglaló lekérdezése a szolgáltatáson keresztül
    data = GameStateService.get_game_summary(game)
    return Response(data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def start_game(request, game_id):
    """Játék indítása (Admin)"""
    game = get_object_or_404(Game, id=game_id)
    
    # Játék indíthatóság ellenőrzése a szolgáltatáson keresztül
    if not GameStateService.can_game_start(game):
        return Response({'error': 'A játék nem indítható el. Legalább 2 játékos szükséges és minden csapatban kell lennie legalább egy játékosnak'}, 
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

@api_view(['POST'])
def join_game(request, game_id):
    """Játékos csatlakozás - optimalizált verzió"""
    # Prefetch related objects to avoid N+1 queries
    game = get_object_or_404(Game.objects.prefetch_related('teams__players'), id=game_id)
    
    # Validáció
    validator = PlayerRegistrationValidator(data=request.data)
    if not validator.is_valid():
        return Response({'error': validator.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    validated_data = validator.validated_data
    player_name = validated_data['name']
    team_name = validated_data['team']
    
    team = get_object_or_404(Team, game=game, name=team_name)
    
    # Csapat telítettség ellenőrzése
    if team.players.count() >= GameConstants.MAX_PLAYERS_PER_TEAM:
        return Response({'error': 'Ez a csapat már tele van'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
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

@api_view(['GET'])
def get_current_challenge(request, game_id, team_name):
    """Aktuális feladat lekérdezése - optimalizált verzió"""
    # Prefetch related objects to avoid N+1 queries
    game = get_object_or_404(Game.objects.prefetch_related('teams'), id=game_id)
    
    # Csapat létezésének ellenőrzése
    try:
        team = Team.objects.get(game=game, name=team_name)
    except Team.DoesNotExist:
        return Response({'error': 'A csapat még nem létezik'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Ha a játék még nem indult el, ne próbáljunk feladatot betölteni
    if game.status in ['waiting', 'setup']:
        return Response({'error': 'A játék még nem indult el'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Feladat lekérdezése a szolgáltatáson keresztül
    challenge_data = ChallengeService.get_current_challenge_data(game, team)
    
    if not challenge_data:
        return Response({'error': 'Nincs feladat ehhez az állomáshoz'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    return Response(challenge_data)

@api_view(['POST'])
def validate_qr(request, game_id, team_name):
    """QR kód validálása"""
    game = get_object_or_404(Game, id=game_id)
    team = get_object_or_404(Team, game=game, name=team_name)
    
    # Validáció
    validator = QRCodeValidator(data=request.data)
    if not validator.is_valid():
        return Response({'error': validator.errors['qr_code'][0]}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    qr_code = validator.validated_data['qr_code']
    
    # QR kód validálása a szolgáltatáson keresztül
    result = ChallengeService.validate_qr_code(game, team, qr_code)
    return Response(result)

@api_view(['POST'])
def get_help(request, game_id, team_name):
    """Segítség kérése - egyszerűsített verzió"""
    game = get_object_or_404(Game, id=game_id)
    team = get_object_or_404(Team, game=game, name=team_name)
    
    # Egyszerű segítség lekérdezés (nincs korlátozás)
    try:
        current_station = Station.objects.get(number=team.current_station)
        
        # Feladat keresése
        challenge = None
        if game.status == 'separate':
            # Külön fázis: csapat-specifikus feladat
            challenge = Challenge.objects.filter(
                station=current_station,
                team_type=team.name
            ).first()
            if not challenge:
                # Ha nincs csapat-specifikus, próbáljuk a közös feladatot
                challenge = Challenge.objects.filter(
                    station=current_station,
                    team_type='both'
                ).first()
        else:
            # Közös fázis: közös feladat
            challenge = Challenge.objects.filter(
                station=current_station,
                team_type__isnull=True
            ).first()
            if not challenge:
                challenge = Challenge.objects.filter(
                    station=current_station,
                    team_type='both'
                ).first()
        
        if not challenge or not challenge.help_text:
            return Response({'error': 'Nincs segítség elérhető ehhez az állomáshoz'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'help_text': challenge.help_text,
            'message': 'Segítség megjelenítve!'
        })
        
    except Station.DoesNotExist:
        return Response({'error': 'Állomás nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': 'Hiba történt a segítség lekérdezésekor'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    """Játékos kilépése a játékból"""
    game_id = request.session.get('game_id')
    player_name = request.session.get('player_name')
    team_name = request.session.get('team_name')
    
    if not all([game_id, player_name, team_name]):
        return Response({'error': 'Nincs aktív játékos session'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        game = Game.objects.get(id=game_id)
        team = Team.objects.get(game=game, name=team_name)
        player = Player.objects.filter(team=team, name=player_name).first()
        
        if not player:
            # Ha a játékos nem létezik, töröljük a session-t
            request.session.flush()
            return Response({'error': 'Játékos nem található'}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Játékos törlése az adatbázisból
        player.delete()
        
        # Session törlése
        request.session.flush()
        
        # Ha a csapat üres lett, visszaállítjuk a játékot waiting állapotba
        if not team.players.exists():
            game.status = 'waiting'
            game.save()
        
        return Response({
            'message': 'Sikeresen kiléptél a játékból!',
            'game_status': game.status
        })
        
    except (Game.DoesNotExist, Team.DoesNotExist):
        # Ha a játék vagy csapat nem létezik, töröljük a session-t
        request.session.flush()
        return Response({'error': 'Játék vagy csapat nem található'}, 
                       status=status.HTTP_404_NOT_FOUND)

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
        # Játékosok számának lekérdezése - már prefetch-elt
        total_players = sum(team.players.count() for team in game.teams.all())
        
        # Csapatok állapotának lekérdezése - már prefetch-elt
        teams_data = []
        for team in game.teams.all():
            teams_data.append({
                'name': team.name,
                'display_name': team.get_name_display(),
                'player_count': team.players.count(),
                'current_station': team.current_station,
                'players': [{'id': p.id, 'name': p.name} for p in team.players.all()]
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
        
        # Ellenőrizzük, hogy a célcsapat nem tele
        target_team = Team.objects.get(game=game, name=new_team_name)
        if target_team.players.count() >= 2:
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
    
    if team_name not in ['pumpkin', 'ghost']:
        return Response({'error': 'Érvénytelen csapat név'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        team = Team.objects.get(game=game, name=team_name)
        
        # Ellenőrizzük, hogy a csapat nem tele
        if team.players.count() >= 2:
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
    """Játékos kijelentkezése - session token érvénytelenítése"""
    session_token = request.session.get('session_token')
    
    if not session_token:
        return Response({'error': 'Nincs aktív session'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Játékos keresése és token érvénytelenítése
        player = Player.objects.get(session_token=session_token)
        SessionTokenService.invalidate(player)
        
        # Session törlése
        request.session.flush()
        
        return Response({'message': 'Sikeresen kijelentkeztél'})
        
    except Player.DoesNotExist:
        # Ha a játékos nem található, akkor is töröljük a sessiont
        request.session.flush()
        return Response({'message': 'Session törölve'})
    except Exception as e:
        logger.error(f"Hiba a kijelentkezéskor: {e}")
        return Response({'error': 'Hiba történt a kijelentkezés során'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


