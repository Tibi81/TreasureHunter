# models.py
from django.db import models
import uuid
import json

class Game(models.Model):
    GAME_STATUS_CHOICES = [
        ('setup', 'Beállítás'),
        ('separate', 'Külön Fázis'),
        ('together', 'Közös Fázis'),
        ('finished', 'Befejezve'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, default="Halloween Kincskereső")
    status = models.CharField(max_length=20, choices=GAME_STATUS_CHOICES, default='setup')
    meeting_station = models.IntegerField(default=5)  # Találkozási pont (5. állomás)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Játék - {self.name} ({self.status})"

class Team(models.Model):
    TEAM_CHOICES = [
        ('pumpkin', '🎃 Tök Csapat'),
        ('ghost', '👻 Szellem Csapat'),
    ]
    
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=20, choices=TEAM_CHOICES)
    current_station = models.IntegerField(default=1)
    attempts = models.IntegerField(default=0)  # Hibás próbálkozások száma
    help_used = models.BooleanField(default=False)  # Segítség használva-e
    completed_at = models.DateTimeField(null=True, blank=True)  # Mikor érte el a találkozót
    
    def __str__(self):
        return f"{self.get_name_display()} - Állomás {self.current_station}"

class Player(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players')
    name = models.CharField(max_length=50)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.team.get_name_display()})"

class Station(models.Model):
    PHASE_CHOICES = [
        ('separate', 'Külön Fázis'),
        ('together', 'Közös Fázis'),
    ]
    
    number = models.IntegerField(unique=True)
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=10)  # Emoji
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES)
    
    class Meta:
        ordering = ['number']
    
    def __str__(self):
        return f"{self.number}. {self.name} {self.icon}"

class Challenge(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='challenges')
    team_type = models.CharField(max_length=20, choices=Team.TEAM_CHOICES, null=True, blank=True)  # null = közös feladat
    title = models.CharField(max_length=200)
    description = models.TextField()
    qr_code = models.CharField(max_length=100, unique=True)
    help_text = models.TextField()
    
    def __str__(self):
        team_str = f" ({self.get_team_type_display()})" if self.team_type else " (Közös)"
        return f"{self.station.name}{team_str}: {self.title}"

class GameProgress(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)
    attempts_made = models.IntegerField(default=1)
    help_used = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['game', 'team', 'station']
    
    def __str__(self):
        return f"{self.team} - {self.station} (Befejezve: {self.completed_at})"
