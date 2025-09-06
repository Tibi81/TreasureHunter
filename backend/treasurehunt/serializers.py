from rest_framework import serializers
from .models import Game, Team, Player, Station, Challenge

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'name', 'status', 'created_at']

class PlayerSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.get_name_display', read_only=True)
    
    class Meta:
        model = Player
        fields = ['id', 'name', 'team_name', 'joined_at']

class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    display_name = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Team
        fields = ['name', 'display_name', 'current_station', 'attempts', 'help_used', 'completed_at', 'players']

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ['number', 'name', 'icon', 'phase']

class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ['title', 'description']  # QR kódot és segítséget nem adjuk vissza biztonsági okokból
