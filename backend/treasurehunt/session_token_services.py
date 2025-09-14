import secrets
from datetime import timedelta
from django.utils import timezone


class SessionTokenService:
    TOKEN_EXPIRY_DAYS = 7

    @staticmethod
    def generate_token(player):
        """Biztonságos session token létrehozása"""
        token = secrets.token_urlsafe(32)
        player.session_token = token
        player.token_created_at = timezone.now()
        player.save()
        return token

    @staticmethod
    def is_valid(player):
        """Érvényesség ellenőrzése"""
        if not player.session_token or not player.token_created_at:
            return False
        return timezone.now() - player.token_created_at <= timedelta(days=SessionTokenService.TOKEN_EXPIRY_DAYS)

    @staticmethod
    def invalidate(player):
        """Token érvénytelenítése"""
        player.session_token = None
        player.token_created_at = None
        player.save()
