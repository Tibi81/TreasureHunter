# models.py
from django.db import models
import uuid
import json
class Game(models.Model):
    # Egy adott kincskereső játékot reprezentál.
    GAME_STATUS_CHOICES = [
        ('waiting', 'Várakozás játékosokra'),
        ('setup', 'Beállítás'),
        ('separate', 'Külön Fázis'),
        ('together', 'Közös Fázis'),
        ('finished', 'Befejezve'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Egyedi azonosító minden játékhoz
    game_code = models.CharField(max_length=8, unique=True, db_index=True, help_text="Rövid azonosító a játékhoz csatlakozáshoz")  # Játék kód, amivel csatlakozni lehet
    name = models.CharField(max_length=100, default="Halloween Kincskereső")  # Játék neve
    status = models.CharField(max_length=20, choices=GAME_STATUS_CHOICES, default='waiting', db_index=True)  # Játék aktuális állapota
    meeting_station = models.IntegerField(default=5)  # Találkozási pont (állomás sorszáma)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Létrehozás ideje
    created_by = models.CharField(max_length=100, null=True, blank=True, help_text="Admin neve aki létrehozta")  # Admin neve, aki létrehozta a játékot
    
    def __str__(self):
        return "Játék - {} ({})".format(self.name, self.status)
    
    def save(self, *args, **kwargs):
        if not self.game_code:
            self.game_code = self.generate_game_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_game_code():
        """Egyedi játék kód generálása"""
        import random
        import string
        
        while True:
            # 6 karakteres kód generálása (betűk és számok)
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Game.objects.filter(game_code=code).exists():
                return code

class Team(models.Model):
    # Egy csapatot reprezentál egy adott játékban (pl. Tök vagy Szellem csapat).
    TEAM_CHOICES = [
        ('pumpkin', '🎃 Tök Csapat'),
        ('ghost', '👻 Szellem Csapat'),
    ]
    
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='teams', db_index=True)  # Melyik játékhoz tartozik a csapat
    name = models.CharField(max_length=20, choices=TEAM_CHOICES, db_index=True)  # Csapat típusa/neve
    current_station = models.IntegerField(default=1, db_index=True)  # Jelenlegi állomás sorszáma
    attempts = models.IntegerField(default=0)  # Hibás próbálkozások száma az aktuális állomáson
    help_used = models.BooleanField(default=False)  # Használtak-e segítséget az aktuális állomáson
    completed_at = models.DateTimeField(null=True, blank=True, db_index=True)  # Mikor ért célba a csapat (találkozási pont)
    separate_phase_save_used = models.BooleanField(default=False)  # Használták-e a mentesítő feladatot a külön fázisban
    together_phase_save_used = models.BooleanField(default=False)  # Használták-e a mentesítő feladatot a közös fázisban
    
    def __str__(self):
        return "{} - Állomás {}".format(self.get_name_display(), self.current_station)

class Player(models.Model):
    # Egy játékost reprezentál, aki egy csapat tagja.
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players', db_index=True)  # Melyik csapatban van a játékos
    name = models.CharField(max_length=50, db_index=True)  # Játékos neve
    joined_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Belépés ideje
    session_token = models.CharField(max_length=64, null=True, blank=True, unique=True, db_index=True)  # Session token a játékos azonosításához
    token_created_at = models.DateTimeField(null=True, blank=True, db_index=True)  # Mikor lett a token létrehozva
    
    def __str__(self):
        return "{} ({})".format(self.name, self.team.get_name_display())

class Station(models.Model):
    # Egy állomást (helyszínt) reprezentál a játékban.
    PHASE_CHOICES = [
        ('separate', 'Külön Fázis'),
        ('together', 'Közös Fázis'),
        ('meeting', 'Találkozási Pont'),
        ('save', 'Mentesítő Fázis'),
    ]
    
    number = models.IntegerField(unique=True, db_index=True)  # Állomás sorszáma
    name = models.CharField(max_length=50)  # Állomás neve
    icon = models.CharField(max_length=10)  # Állomás ikonja (emoji)
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, db_index=True)  # Melyik fázisban van az állomás (külön/közös)
    
    class Meta:
        ordering = ['number']
    
    def __str__(self):
        return "{}. {} {}".format(self.number, self.name, self.icon)

class Challenge(models.Model):
    # Egy feladatot (kihívást) reprezentál egy adott állomáson.
    TEAM_TYPE_CHOICES = [
        ('pumpkin', '🎃 Tök Csapat'),
        ('ghost', '👻 Szellem Csapat'),
        ('both', '🤝 Mindkét Csapat'),
        (None, 'Közös Feladat'),
    ]
    
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='challenges', db_index=True)  # Melyik állomáshoz tartozik a feladat
    team_type = models.CharField(max_length=20, choices=TEAM_TYPE_CHOICES, null=True, blank=True, db_index=True)  # Melyik csapatnak szól (ha None, akkor közös)
    title = models.CharField(max_length=200)  # Feladat címe
    description = models.TextField()  # Feladat leírása
    qr_code = models.CharField(max_length=100, unique=True, db_index=True)  # Feladathoz tartozó QR kód
    help_text = models.TextField()  # Segítség szövege a feladathoz
    
    def __str__(self):
        team_str = " ({})".format(self.get_team_type_display()) if self.team_type else " (Közös)"
        return "{}{}: {}".format(self.station.name, team_str, self.title)

class GameProgress(models.Model):
    # Egy csapat előrehaladását rögzíti egy adott állomáson, egy adott játékban.
    game = models.ForeignKey(Game, on_delete=models.CASCADE, db_index=True)  # Melyik játékban történt az előrehaladás
    team = models.ForeignKey(Team, on_delete=models.CASCADE, db_index=True)  # Melyik csapatról van szó
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_index=True)  # Melyik állomásról van szó
    completed_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Mikor teljesítették az állomást
    attempts_made = models.IntegerField(default=1)  # Hány próbálkozásból sikerült
    help_used = models.BooleanField(default=False)  # Használtak-e segítséget
    
    class Meta:
        unique_together = ['game', 'team', 'station']  # Egy csapat egy állomást egy játékban csak egyszer teljesíthet
    
    def __str__(self):
        return "{} - {} (Befejezve: {})".format(self.team, self.station, self.completed_at)
