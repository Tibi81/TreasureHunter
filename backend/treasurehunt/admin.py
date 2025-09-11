from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import Game, Team, Player, Station, Challenge, GameProgress


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'meeting_station', 'created_at', 'teams_count', 'progress_summary']
    list_filter = ['status', 'created_at']
    search_fields = ['name']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Alapinformációk', {
            'fields': ('id', 'name', 'status', 'meeting_station', 'created_at')
        }),
    )
    
    def teams_count(self, obj):
        return obj.teams.count()
    teams_count.short_description = 'Csapatok száma'
    
    def progress_summary(self, obj):
        total_teams = obj.teams.count()
        completed_teams = obj.teams.filter(completed_at__isnull=False).count()
        if total_teams > 0:
            percentage = (completed_teams / total_teams) * 100
            percentage_str = "{:.1f}".format(percentage)
            return format_html(
                '<span style="color: {};">{}/{} ({}%)</span>',
                'green' if percentage == 100 else 'orange' if percentage > 0 else 'red',
                completed_teams, total_teams, percentage_str
            )
        return 'Nincs csapat'
    progress_summary.short_description = 'Haladás'


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'game_link', 'current_station', 'attempts', 'help_used', 'completed_at', 'players_count']
    list_filter = ['name', 'help_used', 'game__status', 'current_station']
    search_fields = ['name', 'game__name']
    readonly_fields = ['completed_at']
    ordering = ['game', 'name']
    
    fieldsets = (
        ('Csapat információk', {
            'fields': ('game', 'name', 'current_station', 'attempts', 'help_used', 'completed_at')
        }),
    )
    
    def game_link(self, obj):
        url = reverse('admin:treasurehunt_game_change', args=[obj.game.id])
        return format_html('<a href="{}">{}</a>', url, obj.game.name)
    game_link.short_description = 'Játék'
    
    def players_count(self, obj):
        return obj.players.count()
    players_count.short_description = 'Játékosok száma'


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'team_link', 'joined_at']
    list_filter = ['team__name', 'joined_at', 'team__game__status']
    search_fields = ['name', 'team__name', 'team__game__name']
    readonly_fields = ['joined_at']
    ordering = ['team', 'name']
    
    fieldsets = (
        ('Játékos információk', {
            'fields': ('team', 'name', 'joined_at')
        }),
    )
    
    def team_link(self, obj):
        url = reverse('admin:treasurehunt_team_change', args=[obj.team.id])
        return format_html('<a href="{}">{}</a>', url, obj.team)
    team_link.short_description = 'Csapat'


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'icon', 'phase', 'challenges_count']
    list_filter = ['phase', 'number']
    search_fields = ['name', 'number']
    ordering = ['number']
    
    fieldsets = (
        ('Állomás információk', {
            'fields': ('number', 'name', 'icon', 'phase')
        }),
    )
    
    def challenges_count(self, obj):
        return obj.challenges.count()
    challenges_count.short_description = 'Feladatok száma'


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'station_link', 'team_type_display', 'qr_code', 'has_help']
    list_filter = ['station__phase', 'team_type', 'station__number']
    search_fields = ['title', 'description', 'qr_code', 'station__name']
    ordering = ['station__number', 'team_type']
    
    fieldsets = (
        ('Feladat alapinformációi', {
            'fields': ('station', 'team_type', 'title', 'description')
        }),
        ('QR kód és segítség', {
            'fields': ('qr_code', 'help_text')
        }),
    )
    
    def station_link(self, obj):
        url = reverse('admin:treasurehunt_station_change', args=[obj.station.id])
        return format_html('<a href="{}">{}</a>', url, obj.station)
    station_link.short_description = 'Állomás'
    
    def team_type_display(self, obj):
        if obj.team_type:
            return obj.get_team_type_display()
        return 'Közös feladat'
    team_type_display.short_description = 'Csapat típus'
    
    def has_help(self, obj):
        return 'Igen' if obj.help_text else 'Nem'
    has_help.short_description = 'Van segítség'


@admin.register(GameProgress)
class GameProgressAdmin(admin.ModelAdmin):
    list_display = ['team_link', 'station_link', 'completed_at', 'attempts_made', 'help_used']
    list_filter = ['help_used', 'completed_at', 'team__name', 'station__phase']
    search_fields = ['team__name', 'station__name', 'game__name']
    readonly_fields = ['completed_at']
    ordering = ['-completed_at']
    
    fieldsets = (
        ('Haladás információk', {
            'fields': ('game', 'team', 'station', 'completed_at', 'attempts_made', 'help_used')
        }),
    )
    
    def team_link(self, obj):
        url = reverse('admin:treasurehunt_team_change', args=[obj.team.id])
        return format_html('<a href="{}">{}</a>', url, obj.team)
    team_link.short_description = 'Csapat'
    
    def station_link(self, obj):
        url = reverse('admin:treasurehunt_station_change', args=[obj.station.id])
        return format_html('<a href="{}">{}</a>', url, obj.station)
    station_link.short_description = 'Állomás'


# Admin oldal testreszabása
admin.site.site_header = "Treasure Hunter Admin"
admin.site.site_title = "Treasure Hunter Admin"
admin.site.index_title = "Kincskereső Játék Adminisztráció"