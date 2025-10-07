# utils/error_handler.py
import logging
import traceback
from typing import Dict, Any, Optional
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError, DatabaseError
from django.http import Http404

logger = logging.getLogger(__name__)


class APIErrorHandler:
    """Központi hibakezelő rendszer az API végpontokhoz"""
    
    @staticmethod
    def handle_exception(exception: Exception, context: str = "") -> Response:
        """
        Általános kivétel kezelése és megfelelő HTTP válasz generálása
        
        Args:
            exception: A kezelt kivétel
            context: Kontextus információ a hibáról
            
        Returns:
            Response: Megfelelő HTTP válasz a hibával
        """
        error_id = f"ERR_{hash(str(exception)) % 10000:04d}"
        
        # Logoljuk a hibát részletesen
        logger.error(
            f"API Error [{error_id}] in {context}: {str(exception)}",
            extra={
                'error_id': error_id,
                'context': context,
                'exception_type': type(exception).__name__,
                'traceback': traceback.format_exc()
            }
        )
        
        # Kivétel típusa alapján megfelelő válasz
        if isinstance(exception, ValidationError):
            return APIErrorHandler._handle_validation_error(exception, error_id)
        elif isinstance(exception, IntegrityError):
            return APIErrorHandler._handle_integrity_error(exception, error_id)
        elif isinstance(exception, DatabaseError):
            return APIErrorHandler._handle_database_error(exception, error_id)
        elif isinstance(exception, Http404):
            return APIErrorHandler._handle_not_found_error(exception, error_id)
        elif isinstance(exception, ValueError):
            return APIErrorHandler._handle_value_error(exception, error_id)
        else:
            return APIErrorHandler._handle_generic_error(exception, error_id)
    
    @staticmethod
    def _handle_validation_error(exception: ValidationError, error_id: str) -> Response:
        """Validációs hibák kezelése"""
        return Response({
            'error': 'Érvénytelen adatok',
            'details': exception.message_dict if hasattr(exception, 'message_dict') else str(exception),
            'error_id': error_id
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def _handle_integrity_error(exception: IntegrityError, error_id: str) -> Response:
        """Adatbázis integritási hibák kezelése"""
        return Response({
            'error': 'Adatbázis hiba - duplikált vagy érvénytelen adatok',
            'error_id': error_id
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def _handle_database_error(exception: DatabaseError, error_id: str) -> Response:
        """Adatbázis hibák kezelése"""
        return Response({
            'error': 'Adatbázis kapcsolati hiba',
            'error_id': error_id
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    def _handle_not_found_error(exception: Http404, error_id: str) -> Response:
        """404 hibák kezelése"""
        return Response({
            'error': 'A kért erőforrás nem található',
            'error_id': error_id
        }, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def _handle_value_error(exception: ValueError, error_id: str) -> Response:
        """Érték hibák kezelése"""
        return Response({
            'error': str(exception),
            'error_id': error_id
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def _handle_generic_error(exception: Exception, error_id: str) -> Response:
        """Általános hibák kezelése"""
        return Response({
            'error': 'Váratlan hiba történt',
            'error_id': error_id
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    def safe_api_call(func, *args, **kwargs):
        """
        Biztonságos API hívás wrapper - automatikus hibakezeléssel
        
        Args:
            func: A meghívandó függvény
            *args: Pozicionális argumentumok
            **kwargs: Kulcsszó argumentumok
            
        Returns:
            Response: API válasz vagy hiba válasz
        """
        try:
            return func(*args, **kwargs)
        except Exception as e:
            context = f"{func.__name__} with args={args}, kwargs={kwargs}"
            return APIErrorHandler.handle_exception(e, context)


class GameErrorHandler(APIErrorHandler):
    """Játék specifikus hibakezelő"""
    
    @staticmethod
    def handle_game_not_found(game_id: str) -> Response:
        """Játék nem található hiba"""
        return Response({
            'error': f'Játék nem található (ID: {game_id})',
            'error_id': 'GAME_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def handle_team_not_found(team_name: str) -> Response:
        """Csapat nem található hiba"""
        return Response({
            'error': f'Csapat nem található: {team_name}',
            'error_id': 'TEAM_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def handle_player_not_found(player_id: int) -> Response:
        """Játékos nem található hiba"""
        return Response({
            'error': f'Játékos nem található (ID: {player_id})',
            'error_id': 'PLAYER_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def handle_game_state_error(message: str) -> Response:
        """Játék állapot hiba"""
        return Response({
            'error': message,
            'error_id': 'GAME_STATE_ERROR'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def handle_validation_error(message: str, field: str = None) -> Response:
        """Validációs hiba játék kontextusban"""
        error_data = {
            'error': message,
            'error_id': 'VALIDATION_ERROR'
        }
        if field:
            error_data['field'] = field
        
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)


def api_error_handler(view_func):
    """
    Decorator API végpontokhoz - automatikus hibakezelés
    
    Használat:
    @api_error_handler
    def my_api_view(request):
        # API logika
        pass
    """
    def wrapper(*args, **kwargs):
        try:
            return view_func(*args, **kwargs)
        except Exception as e:
            context = f"{view_func.__name__} API endpoint"
            return APIErrorHandler.handle_exception(e, context)
    
    return wrapper
