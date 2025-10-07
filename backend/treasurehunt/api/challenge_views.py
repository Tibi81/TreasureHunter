# api/challenge_views.py
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from ..models import Game, Team, Station, Challenge
from ..serializers import ChallengeSerializer
from ..validators import QRCodeValidator
from ..services import ChallengeService
from ..utils.error_handler import GameErrorHandler, api_error_handler

logger = logging.getLogger(__name__)


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
@api_error_handler
def validate_qr(request, game_id, team_name):
    """QR kód validálása"""
    try:
        game = get_object_or_404(Game, id=game_id)
        team = get_object_or_404(Team, game=game, name=team_name)
        
        # Validáció
        validator = QRCodeValidator(data=request.data)
        if not validator.is_valid():
            return GameErrorHandler.handle_validation_error(
                validator.errors['qr_code'][0], 
                'qr_code'
            )
        
        qr_code = validator.validated_data['qr_code']
        
        # QR kód validálása a szolgáltatáson keresztül
        result = ChallengeService.validate_qr_code(game, team, qr_code)
        return Response(result)
        
    except Game.DoesNotExist:
        return GameErrorHandler.handle_game_not_found(game_id)
    except Team.DoesNotExist:
        return GameErrorHandler.handle_team_not_found(team_name)
    except ValidationError as e:
        return GameErrorHandler.handle_validation_error(str(e))
    except Exception as e:
        logger.error(f"Unexpected error in validate_qr: {e}")
        return GameErrorHandler.handle_game_state_error("Váratlan hiba történt a QR kód validálásakor")


@api_view(['POST'])
@api_error_handler
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
