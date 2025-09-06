from django.urls import path
from .api import views

urlpatterns = [
    path('api/game/create/', views.create_game, name='create_game'),
    path('api/game/<uuid:game_id>/join/', views.join_game, name='join_game'),
    path('api/game/<uuid:game_id>/status/', views.game_status, name='game_status'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/challenge/', views.get_current_challenge, name='current_challenge'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/validate/', views.validate_qr, name='validate_qr'),
    path('api/game/<uuid:game_id>/team/<str:team_name>/help/', views.get_help, name='get_help'),
]
