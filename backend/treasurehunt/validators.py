# validators.py
from rest_framework import serializers
from django.core.exceptions import ValidationError
import re
import html

class GameCodeValidator(serializers.Serializer):
    """Játék kód validálása - erősített biztonsági ellenőrzésekkel"""
    game_code = serializers.CharField(max_length=6, min_length=6)
    
    def validate_game_code(self, value):
        if not value:
            raise serializers.ValidationError("Add meg a játék kódot!")
        
        # HTML escape a biztonság érdekében
        value = html.escape(value.strip())
        
        if len(value) != 6:
            raise serializers.ValidationError("A játék kódnak 6 karakter hosszúnak kell lennie!")
        
        # Csak betűk és számok engedélyezettek
        if not value.isalnum():
            raise serializers.ValidationError("A játék kód csak betűket és számokat tartalmazhat!")
        
        # SQL injection védelem - csak alfanumerikus karakterek
        if not re.match(r'^[A-Za-z0-9]+$', value):
            raise serializers.ValidationError("A játék kód csak betűket és számokat tartalmazhat!")
        
        # XSS védelem - nincs HTML/script tag
        if re.search(r'<[^>]*>', value):
            raise serializers.ValidationError("A játék kód nem tartalmazhat HTML kódot!")
        
        return value.upper()

class PlayerRegistrationValidator(serializers.Serializer):
    """Játékos regisztráció validálása - erősített biztonsági ellenőrzésekkel"""
    name = serializers.CharField(max_length=20, min_length=2)
    team = serializers.ChoiceField(choices=['pumpkin', 'ghost'])
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg a neved!")
        
        # HTML escape a biztonság érdekében
        value = html.escape(value.strip())
        
        if len(value) < 2:
            raise serializers.ValidationError("A névnek legalább 2 karakter hosszúnak kell lennie!")
        
        if len(value) > 20:
            raise serializers.ValidationError("A név nem lehet hosszabb 20 karakternél!")
        
        # XSS védelem - nincs HTML/script tag
        if re.search(r'<[^>]*>', value):
            raise serializers.ValidationError("A név nem tartalmazhat HTML kódot!")
        
        # SQL injection védelem - csak biztonságos karakterek
        if not re.match(r'^[a-zA-Z0-9\s\-_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$', value):
            raise serializers.ValidationError("A név csak betűket, számokat, szóközöket, kötőjeleket és aláhúzásokat tartalmazhat!")
        
        # Speciális karakterek ellenőrzése
        if not value.replace(' ', '').replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError("A név csak betűket, számokat, szóközöket, kötőjeleket és aláhúzásokat tartalmazhat!")
        
        return value
    
    def validate_team(self, value):
        # Csak engedélyezett csapat nevek
        allowed_teams = ['pumpkin', 'ghost']
        if value not in allowed_teams:
            raise serializers.ValidationError("Érvénytelen csapat név!")
        
        return value

class AdminGameCreationValidator(serializers.Serializer):
    """Admin játék létrehozás validálása - erősített biztonsági ellenőrzésekkel"""
    name = serializers.CharField(max_length=100, min_length=3)
    admin_name = serializers.CharField(max_length=100, min_length=2)
    max_players = serializers.IntegerField(min_value=1, max_value=8, required=False, default=4)
    team_count = serializers.IntegerField(min_value=1, max_value=2, required=False, default=2)
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg a játék nevét!")
        
        # HTML escape a biztonság érdekében
        value = html.escape(value.strip())
        
        if len(value) < 3:
            raise serializers.ValidationError("A játék neve legalább 3 karakter hosszúnak kell lennie!")
        
        if len(value) > 100:
            raise serializers.ValidationError("A játék neve nem lehet hosszabb 100 karakternél!")
        
        # XSS védelem - nincs HTML/script tag
        if re.search(r'<[^>]*>', value):
            raise serializers.ValidationError("A játék neve nem tartalmazhat HTML kódot!")
        
        # SQL injection védelem - csak biztonságos karakterek
        if not re.match(r'^[a-zA-Z0-9\s\-_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$', value):
            raise serializers.ValidationError("A játék neve csak betűket, számokat, szóközöket, kötőjeleket és aláhúzásokat tartalmazhat!")
        
        return value
    
    def validate_admin_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg az admin nevét!")
        
        # HTML escape a biztonság érdekében
        value = html.escape(value.strip())
        
        if len(value) < 2:
            raise serializers.ValidationError("Az admin neve legalább 2 karakter hosszúnak kell lennie!")
        
        if len(value) > 100:
            raise serializers.ValidationError("Az admin neve nem lehet hosszabb 100 karakternél!")
        
        # XSS védelem - nincs HTML/script tag
        if re.search(r'<[^>]*>', value):
            raise serializers.ValidationError("Az admin neve nem tartalmazhat HTML kódot!")
        
        # SQL injection védelem - csak biztonságos karakterek
        if not re.match(r'^[a-zA-Z0-9\s\-_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$', value):
            raise serializers.ValidationError("Az admin neve csak betűket, számokat, szóközöket, kötőjeleket és aláhúzásokat tartalmazhat!")
        
        return value
    
    def validate_max_players(self, value):
        if value < 1 or value > 8:
            raise serializers.ValidationError("A játékosok száma 1 és 8 között kell legyen!")
        return value
    
    def validate_team_count(self, value):
        if value < 1 or value > 2:
            raise serializers.ValidationError("A csapatok száma 1 vagy 2 lehet!")
        return value

class QRCodeValidator(serializers.Serializer):
    """QR kód validálása - erősített biztonsági ellenőrzésekkel"""
    qr_code = serializers.CharField(max_length=100, min_length=1)
    
    def validate_qr_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg a QR kódot!")
        
        # HTML escape a biztonság érdekében
        value = html.escape(value.strip())
        
        # XSS védelem - nincs HTML/script tag
        if re.search(r'<[^>]*>', value):
            raise serializers.ValidationError("A QR kód nem tartalmazhat HTML kódot!")
        
        # SQL injection védelem - csak biztonságos karakterek
        if not re.match(r'^[a-zA-Z0-9\s\-_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$', value):
            raise serializers.ValidationError("A QR kód csak betűket, számokat, szóközöket, kötőjeleket és aláhúzásokat tartalmazhat!")
        
        return value
