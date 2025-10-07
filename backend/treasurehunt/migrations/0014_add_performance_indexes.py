# Generated manually for performance optimization
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('treasurehunt', '0013_game_max_players_game_team_count_team_max_players_and_more'),
    ]

    operations = [
        # Composite indexes for frequently used query patterns
        
        # Game queries optimization
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_game_status_created_at ON treasurehunt_game (status, created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_game_status_created_at;"
        ),
        
        # Team queries optimization
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_team_game_name ON treasurehunt_team (game_id, name);",
            reverse_sql="DROP INDEX IF EXISTS idx_team_game_name;"
        ),
        
        # Player queries optimization
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_player_team_active ON treasurehunt_player (team_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_player_team_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_player_session_token ON treasurehunt_player (session_token) WHERE session_token IS NOT NULL;",
            reverse_sql="DROP INDEX IF EXISTS idx_player_session_token;"
        ),
        
        # Challenge queries optimization
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_challenge_station_team_type ON treasurehunt_challenge (station_id, team_type);",
            reverse_sql="DROP INDEX IF EXISTS idx_challenge_station_team_type;"
        ),
        
        # GameProgress queries optimization
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_gameprogress_game_team ON treasurehunt_gameprogress (game_id, team_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_gameprogress_game_team;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_gameprogress_team_station ON treasurehunt_gameprogress (team_id, station_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_gameprogress_team_station;"
        ),
        
        # Station queries optimization
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_station_phase_number ON treasurehunt_station (phase, number);",
            reverse_sql="DROP INDEX IF EXISTS idx_station_phase_number;"
        ),
    ]
