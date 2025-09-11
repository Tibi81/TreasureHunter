# validators.py
from rest_framework import serializers
from django.core.exceptions import ValidationError

class GameCodeValidator(serializers.Serializer):
    """Játék kód validálása"""
    game_code = serializers.CharField(max_length=6, min_length=6)
    
    def validate_game_code(self, value):
        if not value:
            raise serializers.ValidationError("Add meg a játék kódot!")
        
        if len(value) != 6:
            raise serializers.ValidationError("A játék kódnak 6 karakter hosszúnak kell lennie!")
        
        # Csak betűk és számok engedélyezettek
        if not value.isalnum():
            raise serializers.ValidationError("A játék kód csak betűket és számokat tartalmazhat!")
        
        return value.upper()

class PlayerRegistrationValidator(serializers.Serializer):
    """Játékos regisztráció validálása"""
    name = serializers.CharField(max_length=20, min_length=2)
    team = serializers.ChoiceField(choices=['pumpkin', 'ghost'])
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg a neved!")
        
        value = value.strip()
        
        if len(value) < 2:
            raise serializers.ValidationError("A névnek legalább 2 karakter hosszúnak kell lennie!")
        
        if len(value) > 20:
            raise serializers.ValidationError("A név nem lehet hosszabb 20 karakternél!")
        
        # Speciális karakterek ellenőrzése
        if not value.replace(' ', '').replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError("A név csak betűket, számokat, szóközöket, kötőjeleket és aláhúzásokat tartalmazhat!")
        
        return value

class AdminGameCreationValidator(serializers.Serializer):
    """Admin játék létrehozás validálása"""
    name = serializers.CharField(max_length=100, min_length=3)
    admin_name = serializers.CharField(max_length=100, min_length=2)
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg a játék nevét!")
        
        value = value.strip()
        
        if len(value) < 3:
            raise serializers.ValidationError("A játék neve legalább 3 karakter hosszúnak kell lennie!")
        
        if len(value) > 100:
            raise serializers.ValidationError("A játék neve nem lehet hosszabb 100 karakternél!")
        
        return value
    
    def validate_admin_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg az admin nevét!")
        
        value = value.strip()
        
        if len(value) < 2:
            raise serializers.ValidationError("Az admin neve legalább 2 karakter hosszúnak kell lennie!")
        
        if len(value) > 100:
            raise serializers.ValidationError("Az admin neve nem lehet hosszabb 100 karakternél!")
        
        return value

class QRCodeValidator(serializers.Serializer):
    """QR kód validálása"""
    qr_code = serializers.CharField(max_length=100, min_length=1)
    
    def validate_qr_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Add meg a QR kódot!")
        
        return value.strip()
