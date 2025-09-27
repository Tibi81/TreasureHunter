from django.urls import path
from .api import game_views, player_views, challenge_views, admin_views

urlpatterns = [
    # Játék keresés
    path('api/game/find/', game_views.find_active_game, name='find_active_game'),
    path('api/game/code/<str:game_code>/', game_views.find_game_by_code, name='find_game_by_code'),
    
    # Játék létrehozás és kezelés
    path('api/game/create/', game_views.create_game, name='create_game'),
    path('api/game/<uuid:game_id>/start/', game_views.start_game, name='start_game'),
    path('api/game/<uuid:game_id>/reset/', game_views.reset_game, name='reset_game'),
    path('api/game/<uuid:game_id>/stop/', game_views.stop_game, name='stop_game'),
    path('api/game/<uuid:game_id>/update/', game_views.update_game, name='update_game'),
    path('api/game/<uuid:game_id>/delete/', game_views.delete_game, name='delete_game'),
    
    # Admin funkciók
    path('api/admin/games/', admin_views.list_games, name='list_games'),
    path('api/game/<uuid:game_id>/player/<int:player_id>/remove/', admin_views.remove_player, name='remove_player'),
    path('api/game/<uuid:game_id>/player/<int:player_id>/move/', admin_views.move_player, name='move_player'),
    path('api/game/<uuid:game_id>/player/add/', admin_views.add_player, name='add_player'),
    
    # Játékos funkciók
    path('api/game/<uuid:game_id>/join/', player_views.join_game, name='join_game'),
    path('api/game/<uuid:game_id>/status/', game_views.game_status, name='game_status'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/challenge/', challenge_views.get_current_challenge, name='current_challenge'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/validate/', challenge_views.validate_qr, name='validate_qr'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/help/', challenge_views.get_help, name='get_help'),
    path('api/player/status/', player_views.get_player_status, name='get_player_status'),
    path('api/player/check-session/', player_views.check_player_session, name='check_player_session'),
    path('api/player/exit/', player_views.exit_game, name='exit_game'),
    
    # Session token funkciók
    path('api/player/restore-session/', player_views.restore_session, name='restore_session'),
    path('api/player/logout/', player_views.logout_player, name='logout_player'),

]
