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
            origin = request.headers.get('Origin', '*')
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Headers'] = 'Cache-Control, Accept, Accept-Encoding, Accept-Language, Connection, Host, Origin, Referer, User-Agent, X-CSRFToken'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'  # 24 óra cache
            return response
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """SSE stream minden játékhoz"""
        
        def event_stream():
            # SSE header beállítása
            yield "data: {\"type\": \"connected\", \"message\": \"Általános SSE kapcsolat létrejött\"}\n\n"
            
            try:
                # Egyszerű teszt üzenet
                yield "data: {\"type\": \"test\", \"message\": \"Általános teszt üzenet\", \"timestamp\": " + str(time.time()) + "}\n\n"
                
                # Korlátozott ciklus valós idejű frissítésekhez (Render.com kompatibilis)
                import time
                count = 0
                max_iterations = 60  # Maximum 60 iteráció (300 másodperc = 5 perc) - Render.com optimalizálás
                
                # Események figyelése
                last_event_id = 0
                
                while count < max_iterations:
                    # Események lekérése és küldése
                    try:
                        # Összes játék eseményeinek lekérése
                        all_events = []
                        for game_id in Game.objects.values_list('id', flat=True):
                            events_key = f"game_events_{str(game_id)}"  # UUID -> string konvertálás
                            events = cache.get(events_key, [])
                            all_events.extend(events)
                        
                        # Új események küldése
                        for event in all_events[last_event_id:]:
                            sse_data = {
                                "type": event.get("type", "unknown"),
                                "data": event.get("data", {}),
                                "timestamp": event.get("timestamp", time.time())
                            }
                            yield f"data: {json.dumps(sse_data)}\n\n"
                            logger.info(f"SSE event sent: {event.get('type', 'unknown')}")
                        
                        last_event_id = len(all_events)
                    except Exception as e:
                        logger.error(f"Error processing events: {e}")
                    
                    count += 1
                    time.sleep(5)  # 5 másodpercenként események ellenőrzése (Render.com optimalizálás)
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
            
            max_iterations = 120  # Maximum 120 iteráció (60 másodperc = 1 perc)
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
                    
                    time.sleep(2)  # 2 másodperc polling eseményekhez (kevesebb terhelés)
                    
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
        # response['Connection'] = 'keep-alive'  # WSGI nem támogatja
        origin = request.headers.get('Origin', '*')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Headers'] = 'Cache-Control, Accept, Accept-Encoding, Accept-Language, Connection, Host, Origin, Referer, User-Agent, X-CSRFToken'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'  # 24 óra cache
        
        return response

# Esemény küldő segédfüggvények
def send_game_event(game_id, event_type, data):
    """Esemény küldése az SSE stream-nek"""
    # ✅ JAVÍTOTT: UUID -> string konvertálás
    game_id_str = str(game_id)
    events_key = f"game_events_{game_id_str}"
    events = cache.get(events_key, [])
    
    # ✅ JAVÍTOTT: Data JSON szerializálhatóvá tétele
    def make_json_serializable(obj):
        """Rekurzív függvény UUID objektumok string-ké alakítására"""
        if isinstance(obj, dict):
            return {key: make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [make_json_serializable(item) for item in obj]
        elif hasattr(obj, '__str__') and 'UUID' in str(type(obj)):
            return str(obj)
        else:
            return obj
    
    serializable_data = make_json_serializable(data)
    
    event = {
        "type": event_type,
        "data": serializable_data,
        "timestamp": time.time()
    }
    
    events.append(event)
    
    # Maximum 100 esemény tárolása
    if len(events) > 100:
        events = events[-100:]
    
    cache.set(events_key, events, timeout=3600)  # 1 óra cache
    logger.info(f"Game event sent: {event_type} for game {game_id_str}")

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
                "game_id": instance.team.game.id,
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
                "game_id": instance.team.game.id,
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
            "game_id": instance.team.game.id,
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
