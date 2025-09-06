# api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Game, Team, Player, Station, Challenge, GameProgress
from .serializers import GameSerializer, TeamSerializer, PlayerSerializer, ChallengeSerializer

@api_view(['POST'])
def create_game(request):
    """Új játék létrehozása"""
    game = Game.objects.create(name=request.data.get('name', 'Halloween Kincskereső'))
    
    # Alapértelmezett csapatok létrehozása
    Team.objects.create(game=game, name='pumpkin')
    Team.objects.create(game=game, name='ghost')
    
    serializer = GameSerializer(game)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def join_game(request, game_id):
    """Játékos csatlakozás"""
    game = get_object_or_404(Game, id=game_id)
    player_name = request.data.get('name')
    team_name = request.data.get('team')  # 'pumpkin' vagy 'ghost'
    
    if not player_name or not team_name:
        return Response({'error': 'Név és csapat megadása kötelező'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    team = get_object_or_404(Team, game=game, name=team_name)
    
    # Max 2 játékos csapatonként
    if team.players.count() >= 2:
        return Response({'error': 'Ez a csapat már tele van'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    player = Player.objects.create(team=team, name=player_name)
    
    # Ha mind a 4 játékos csatlakozott, indítsuk a játékot
    if game.teams.aggregate(total_players=models.Count('players'))['total_players'] == 4:
        game.status = 'separate'
        game.save()
    
    serializer = PlayerSerializer(player)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def game_status(request, game_id):
    """Játék állapot lekérdezése"""
    game = get_object_or_404(Game, id=game_id)
    
    data = {
        'game': GameSerializer(game).data,
        'teams': TeamSerializer(game.teams.all(), many=True).data,
        'players': []
    }
    
    for team in game.teams.all():
        for player in team.players.all():
            data['players'].append(PlayerSerializer(player).data)
    
    return Response(data)

@api_view(['GET'])
def get_current_challenge(request, game_id, team_name):
    """Aktuális feladat lekérdezése"""
    game = get_object_or_404(Game, id=game_id)
    team = get_object_or_404(Team, game=game, name=team_name)
    
    current_station = Station.objects.get(number=team.current_station)
    
    # Feladat típus meghatározása
    if game.status == 'separate':
        # Külön fázis - csapat specifikus feladat
        challenge = Challenge.objects.filter(
            station=current_station, 
            team_type=team_name
        ).first()
    else:
        # Közös fázis - közös feladat
        challenge = Challenge.objects.filter(
            station=current_station, 
            team_type__isnull=True
        ).first()
    
    if not challenge:
        return Response({'error': 'Nincs feladat ehhez az állomáshoz'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    data = {
        'station': {
            'number': current_station.number,
            'name': current_station.name,
            'icon': current_station.icon
        },
        'challenge': ChallengeSerializer(challenge).data,
        'team_status': {
            'attempts': team.attempts,
            'help_used': team.help_used,
            'can_use_help': not team.help_used and team.attempts > 0
        }
    }
    
    return Response(data)

@api_view(['POST'])
def validate_qr(request, game_id, team_name):
    """QR kód validálása"""
    game = get_object_or_404(Game, id=game_id)
    team = get_object_or_404(Team, game=game, name=team_name)
    qr_code = request.data.get('qr_code')
    
    if not qr_code:
        return Response({'error': 'QR kód megadása kötelező'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    current_station = Station.objects.get(number=team.current_station)
    
    # Helyes QR kód ellenőrzése
    if game.status == 'separate':
        correct_challenge = Challenge.objects.filter(
            station=current_station, 
            team_type=team_name,
            qr_code=qr_code
        ).first()
    else:
        correct_challenge = Challenge.objects.filter(
            station=current_station, 
            team_type__isnull=True,
            qr_code=qr_code
        ).first()
    
    if correct_challenge:
        # Helyes válasz - továbblépés
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
        return Response(response_data)
    
    else:
        # Hibás válasz
        team.attempts += 1
        
        if team.attempts >= 3:
            # 3 hibás próbálkozás - visszaállítás
            team.current_station = 1
            team.attempts = 0
            team.help_used = False
            team.save()
            
            return Response({
                'success': False,
                'message': '3 hibás próbálkozás után újra kell kezdenetek! 😱',
                'reset': True
            })
        else:
            team.save()
            return Response({
                'success': False,
                'message': f'Hibás QR kód! ({team.attempts}/3 próbálkozás)',
                'attempts': team.attempts
            })

@api_view(['POST'])
def get_help(request, game_id, team_name):
    """Segítség kérése"""
    game = get_object_or_404(Game, id=game_id)
    team = get_object_or_404(Team, game=game, name=team_name)
    
    if team.help_used:
        return Response({'error': 'Már használtátok a segítséget ennél az állomásnál'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    current_station = Station.objects.get(number=team.current_station)
    
    if game.status == 'separate':
        challenge = Challenge.objects.get(station=current_station, team_type=team_name)
    else:
        challenge = Challenge.objects.get(station=current_station, team_type__isnull=True)
    
    team.help_used = True
    team.save()
    
    return Response({
        'help_text': challenge.help_text,
        'message': 'Segítség aktiválva! Ezt már nem tudjátok újra használni ennél az állomásnál.'
    })
