# SSE Views for real-time game updates
import json
import time
import threading
from django.http import StreamingHttpResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.core.cache import cache
from .models import Game, Player
from .services import GameStateService
import logging

logger = logging.getLogger(__name__)

class GameSSEView(View):
    """
    Server-Sent Events endpoint for real-time game updates
    """
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET", "OPTIONS"]))
    def dispatch(self, request, *args, **kwargs):
        if request.method == 'OPTIONS':
            response = HttpResponse()
            origin = request.headers.get('Origin', '*')
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Headers'] = 'Cache-Control, Accept, Accept-Encoding, Accept-Language, Connection, Host, Origin, Referer, User-Agent, X-CSRFToken'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'  # 24 óra cache
            return response
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request, game_id):
        """SSE stream for game updates"""
        
        def event_stream():
            # SSE header beállítása
            yield "data: {\"type\": \"connected\", \"message\": \"SSE kapcsolat létrejött\"}\n\n"
            
            try:
                # Egyszerű teszt üzenet
                yield "data: {\"type\": \"test\", \"message\": \"Teszt üzenet\", \"game_id\": \"" + str(game_id) + "\"}\n\n"
                
                # Végtelen ciklus teszteléshez
                import time
                for i in range(5):  # Csak 5 üzenetet küldünk teszteléshez
                    time.sleep(1)
                    yield f"data: {{\"type\": \"heartbeat\", \"count\": {i + 1}, \"game_id\": \"{game_id}\"}}\n\n"
                
            except Exception as e:
                logger.error(f"SSE stream error: {e}")
                yield f"data: {{\"type\": \"error\", \"message\": \"{str(e)}\"}}\n\n"
        
        # SSE response beállítása
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        
        # SSE headers
        response['Cache-Control'] = 'no-cache'
        # response['Connection'] = 'keep-alive'  # WSGI nem támogatja
        origin = request.headers.get('Origin', '*')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Headers'] = 'Cache-Control, Accept, Accept-Encoding, Accept-Language, Connection, Host, Origin, Referer, User-Agent, X-CSRFToken'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'  # 24 óra cache
        
        return response

class GeneralSSEView(View):
    """
    Általános SSE endpoint minden játékhoz
    """
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["GET", "OPTIONS"]))
    def dispatch(self, request, *args, **kwargs):
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Headers'] = 'Cache-Control, Accept, Accept-Encoding, Accept-Language, Connection, Host, Origin, Referer, User-Agent'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Credentials'] = 'false'
            return response
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """SSE stream minden játékhoz"""
        
        def event_stream():
            # SSE header beállítása
            yield "data: {\"type\": \"connected\", \"message\": \"Általános SSE kapcsolat létrejött\"}\n\n"
            
            try:
                # Egyszerű teszt üzenet
                yield "data: {\"type\": \"test\", \"message\": \"Általános teszt üzenet\"}\n\n"
                
                # Korlátozott ciklus valós idejű frissítésekhez (Render.com kompatibilis)
                import time
                count = 0
                max_iterations = 300  # Maximum 300 iteráció (3000 másodperc = ~50 perc)
                
                while count < max_iterations:
                    # Ellenőrizzük, hogy a kliens még kapcsolódva van-e
                    if request.META.get('HTTP_CONNECTION') == 'close':
                        logger.info("SSE kapcsolat lezárva a kliens által")
                        break
                    
                    count += 1
                    time.sleep(10)  # 10 másodpercenként heartbeat
                    yield f"data: {{\"type\": \"heartbeat\", \"count\": {count}, \"message\": \"Általános heartbeat\", \"timestamp\": {time.time()}}}\n\n"
                
                # Ha elértük a maximum iterációt, küldjünk egy újracsatlakozási üzenetet
                yield "data: {\"type\": \"reconnect\", \"message\": \"SSE kapcsolat újracsatlakozásra szorul\"}\n\n"
                
            except Exception as e:
                logger.error(f"General SSE stream error: {e}")
                yield f"data: {{\"type\": \"error\", \"message\": \"{str(e)}\"}}\n\n"
        
        # SSE response beállítása
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        
        # SSE headers
        response['Cache-Control'] = 'no-cache'
        # response['Connection'] = 'keep-alive'  # WSGI nem támogatja
        origin = request.headers.get('Origin', '*')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Headers'] = 'Cache-Control, Accept, Accept-Encoding, Accept-Language, Connection, Host, Origin, Referer, User-Agent, X-CSRFToken'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'  # 24 óra cache
        
        return response

class GameEventsSSEView(View):
    """
    SSE endpoint for specific game events (player join, game start, etc.)
    """
    
    def get(self, request, game_id):
        """SSE stream for game events only"""
        
        def event_stream():
            yield "data: {\"type\": \"events_connected\", \"message\": \"Események stream elindult\"}\n\n"
            
            # Cache kulcs az eseményekhez
            events_key = f"game_events_{game_id}"
            last_event_id = 0
            
            max_iterations = 600  # Maximum 600 iteráció (300 másodperc = 5 perc)
            iteration_count = 0
            
            while iteration_count < max_iterations:
                try:
                    # Események lekérése a cache-ből
                    events = cache.get(events_key, [])
                    
                    # Új események küldése
                    for event in events[last_event_id:]:
                        sse_data = {
                            "type": "game_event",
                            "event": event,
                            "timestamp": time.time()
                        }
                        yield f"data: {json.dumps(sse_data)}\n\n"
                    
                    last_event_id = len(events)
                    iteration_count += 1
                    
                    time.sleep(0.5)  # 500ms polling eseményekhez
                    
                except Exception as e:
                    logger.error(f"Events SSE stream error: {e}")
                    break
            
            # Ha elértük a maximum iterációt, küldjünk egy újracsatlakozási üzenetet
            yield "data: {\"type\": \"reconnect\", \"message\": \"Game SSE kapcsolat újracsatlakozásra szorul\"}\n\n"
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        
        return response

# Esemény küldő segédfüggvények
def send_game_event(game_id, event_type, data):
    """Esemény küldése az SSE stream-nek"""
    events_key = f"game_events_{game_id}"
    events = cache.get(events_key, [])
    
    event = {
        "type": event_type,
        "data": data,
        "timestamp": time.time()
    }
    
    events.append(event)
    
    # Maximum 100 esemény tárolása
    if len(events) > 100:
        events = events[-100:]
    
    cache.set(events_key, events, timeout=3600)  # 1 óra cache
    logger.info(f"Game event sent: {event_type} for game {game_id}")

# Signal handlers az eseményekhez
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Player)
def player_saved(sender, instance, created, **kwargs):
    """Játékos mentése esemény"""
    if created:
        send_game_event(
            instance.team.game.id,
            "player_joined",
            {
                "player_id": instance.id,
                "player_name": instance.name,
                "team": instance.team.name
            }
        )
    else:
        send_game_event(
            instance.team.game.id,
            "player_updated",
            {
                "player_id": instance.id,
                "player_name": instance.name,
                "team": instance.team.name
            }
        )

@receiver(post_delete, sender=Player)
def player_deleted(sender, instance, **kwargs):
    """Játékos törlése esemény"""
    send_game_event(
        instance.team.game.id,
        "player_left",
        {
            "player_id": instance.id,
            "player_name": instance.name,
            "team": instance.team.name
        }
    )

@receiver(post_save, sender=Game)
def game_saved(sender, instance, created, **kwargs):
    """Játék mentése esemény"""
    if created:
        send_game_event(
            instance.id,
            "game_created",
            {
                "game_id": instance.id,
                "game_name": instance.name,
                "status": instance.status
            }
        )
    else:
        send_game_event(
            instance.id,
            "game_updated",
            {
                "game_id": instance.id,
                "game_name": instance.name,
                "status": instance.status
            }
        )
