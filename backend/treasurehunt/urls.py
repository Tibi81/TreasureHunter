from django.urls import path
from .api import views

urlpatterns = [
    # Játék keresés
    path('api/game/find/', views.find_active_game, name='find_active_game'),
    path('api/game/code/<str:game_code>/', views.find_game_by_code, name='find_game_by_code'),
    
    # Játék létrehozás és kezelés
    path('api/game/create/', views.create_game, name='create_game'),
    path('api/game/<uuid:game_id>/start/', views.start_game, name='start_game'),
    path('api/game/<uuid:game_id>/reset/', views.reset_game, name='reset_game'),
    path('api/game/<uuid:game_id>/stop/', views.stop_game, name='stop_game'),
    path('api/game/<uuid:game_id>/update/', views.update_game, name='update_game'),
    path('api/game/<uuid:game_id>/delete/', views.delete_game, name='delete_game'),
    
    # Admin funkciók
    path('api/admin/games/', views.list_games, name='list_games'),
    path('api/game/<uuid:game_id>/player/<int:player_id>/remove/', views.remove_player, name='remove_player'),
    path('api/game/<uuid:game_id>/player/<int:player_id>/move/', views.move_player, name='move_player'),
    path('api/game/<uuid:game_id>/player/add/', views.add_player, name='add_player'),
    
    # Játékos funkciók
    path('api/game/<uuid:game_id>/join/', views.join_game, name='join_game'),
    path('api/game/<uuid:game_id>/status/', views.game_status, name='game_status'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/challenge/', views.get_current_challenge, name='current_challenge'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/validate/', views.validate_qr, name='validate_qr'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/help/', views.get_help, name='get_help'),
    path('api/player/status/', views.get_player_status, name='get_player_status'),
    path('api/player/check-session/', views.check_player_session, name='check_player_session'),
    path('api/player/exit/', views.exit_game, name='exit_game'),
    
    # Session token funkciók
    path('api/player/restore-session/', views.restore_session, name='restore_session'),
    path('api/player/logout/', views.logout_player, name='logout_player'),

]
