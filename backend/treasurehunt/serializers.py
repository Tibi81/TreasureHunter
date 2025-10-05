from rest_framework import serializers
from .models import Game, Team, Player, Station, Challenge

class GameSerializer(serializers.ModelSerializer):
    players_per_team = serializers.ReadOnlyField()
    
    class Meta:
        model = Game
        fields = ['id', 'game_code', 'name', 'status', 'created_at', 'created_by', 
                 'max_players', 'team_count', 'players_per_team']

class PlayerSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Player
        fields = ['id', 'name', 'team', 'team_name', 'joined_at']

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
