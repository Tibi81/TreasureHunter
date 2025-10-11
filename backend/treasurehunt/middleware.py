# middleware.py
import logging
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


class CustomRateThrottle(SimpleRateThrottle):
    """
    Egyedi rate limiter a Treasure Hunter alkalmazáshoz
    """
    scope = 'api'
    
    def get_cache_key(self, request, view):
        """
        Rate limiting kulcs generálása IP és endpoint alapján
        """
        # IP cím lekérdezése
        ip = self.get_ident(request)
        
        # Endpoint azonosítás
        endpoint = request.path_info
        
        # Rate limiting kulcs: IP + endpoint
        return f"rate_limit_{ip}_{endpoint}"
    
    def get_ident(self, request):
        """
        Kliens azonosítás IP cím alapján
        """
        # Proxy mögötti IP címek kezelése
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        
        return ip


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware a Treasure Hunter alkalmazáshoz
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Rate limiting ellenőrzés minden kérésnél - hibakezeléssel
        """
        # Csak API végpontokra alkalmazzuk
        if not request.path_info.startswith('/api/'):
            return None
        
        try:
            # IP cím lekérdezése
            ip = self.get_client_ip(request)
            
            # Rate limiting kulcsok
            general_key = f"rate_limit_general_{ip}"
            endpoint_key = f"rate_limit_endpoint_{ip}_{request.path_info}"
            
            # Általános rate limiting (1000 kérés/óra - fejlesztéshez jelentősen növelve)
            general_count = cache.get(general_key, 0)
            if general_count >= 1000:
                logger.warning(f"Rate limit exceeded for IP {ip} - general limit")
                return self.rate_limit_response("Általános kérési limit túllépve")
            
            # Endpoint specifikus rate limiting
            endpoint_count = cache.get(endpoint_key, 0)
            endpoint_limit = self.get_endpoint_limit(request.path_info)
            
            if endpoint_count >= endpoint_limit:
                logger.warning(f"Rate limit exceeded for IP {ip} - endpoint {request.path_info}")
                return self.rate_limit_response(f"Endpoint limit túllépve: {endpoint_limit} kérés/óra")
            
            # Számlálók növelése
            cache.set(general_key, general_count + 1, 3600)  # 1 óra
            cache.set(endpoint_key, endpoint_count + 1, 3600)  # 1 óra
            
        except Exception as e:
            # Cache hiba esetén rate limiting kihagyása
            logger.warning(f"Rate limiting cache error, skipping: {e}")
            # Nem blokkoljuk a kérést, csak naplózzuk
        
        return None
    
    def get_client_ip(self, request):
        """
        Kliens IP cím lekérdezése proxy támogatással
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def get_endpoint_limit(self, path_info):
        """
        Endpoint specifikus limit meghatározása
        """
        # QR kód validálás - szigorúbb limit
        if '/validate/' in path_info:
            return 20
        
        # Játék műveletek - közepes limit
        if any(x in path_info for x in ['/join/', '/start/', '/stop/', '/reset/']):
            return 50
        
        # Általános API végpontok - alapértelmezett limit
        return 200
    
    def rate_limit_response(self, message):
        """
        Rate limit túllépés esetén visszaadott válasz
        """
        return JsonResponse({
            'error': 'Rate limit túllépve',
            'message': message,
            'retry_after': 3600,  # Másodpercben
            'error_code': 'RATE_LIMIT_EXCEEDED'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)


class CacheHeadersMiddleware(MiddlewareMixin):
    """
    Cache header-ek beállítása a válaszokhoz
    """
    
    def process_response(self, request, response):
        """
        Cache header-ek hozzáadása
        """
        # Csak GET kérésekhez és sikeres válaszokhoz
        if request.method == 'GET' and response.status_code == 200:
            # API végpontokhoz rövid cache
            if request.path_info.startswith('/api/'):
                response['Cache-Control'] = 'public, max-age=60'  # 1 perc
            # Statikus tartalomhoz hosszabb cache
            elif request.path_info.startswith('/static/'):
                response['Cache-Control'] = 'public, max-age=3600'  # 1 óra
        
        return response
