from django.core.management.base import BaseCommand
from treasurehunt.models import Station, Challenge

class Command(BaseCommand):
    help = 'Halloween játék alapadatok feltöltése'

    def handle(self, *args, **options):
        # Állomások létrehozása
        stations_data = [
            (1, 'Konyha', '🎃', 'separate'),
            (2, 'Nappali', '👻', 'separate'),
            (3, 'Fürdőszoba', '🕷️', 'separate'),
            (4, 'Hálószoba', '🦇', 'separate'),
            (5, 'Találkozási Pont', '💀', 'together'),
            (6, 'Titkos Kamra', '🧙‍♀️', 'together'),
        ]
        
        for number, name, icon, phase in stations_data:
            station, created = Station.objects.get_or_create(
                number=number,
                defaults={'name': name, 'icon': icon, 'phase': phase}
            )
            if created:
                self.stdout.write(f'Állomás létrehozva: {station}')
        
        # Példa kihívások
        challenges_data = [
            # Konyha - Külön feladatok
            (1, 'pumpkin', 'Tök Tárgy Keresés', 'Keress egy narancssárga tárgyat a konyhában!', 'KITCHEN_PUMPKIN_001', 'Nézz a felső szekrényekben!'),
            (1, 'ghost', 'Szellem Süti', 'Találj meg egy fehér tárgyat a konyhában!', 'KITCHEN_GHOST_001', 'A hűtőben vagy a mosogatónál nézz!'),
            
            # Nappali - Külön feladatok
            (2, 'pumpkin', 'TV Rejtvény', 'Keress egy tökös matricát a nappali valahol!', 'LIVING_PUMPKIN_002', 'A kanapé körül vagy a TV-nél!'),
            (2, 'ghost', 'Könyv Misztérium', 'Találj egy fehér könyvjelzőt!', 'LIVING_GHOST_002', 'A könyvespolcon nézz!'),
            
            # Közös feladatok
            (5, None, 'Találkozás', 'Várjatok egymásra! Együtt tovább!', 'MEETING_POINT_005', 'Itt várjatok a másik csapatra!'),
            (6, None, 'Végső Kincs', 'Keressétek meg a Halloween kincsesládát!', 'FINAL_TREASURE_006', 'A legsötétebb sarokban van elrejtve!'),
        ]
        
        for station_num, team_type, title, desc, qr, help_text in challenges_data:
            station = Station.objects.get(number=station_num)
            challenge, created = Challenge.objects.get_or_create(
                station=station,
                team_type=team_type,
                defaults={
                    'title': title,
                    'description': desc,
                    'qr_code': qr,
                    'help_text': help_text
                }
            )
            if created:
                self.stdout.write(f'Feladat létrehozva: {challenge}')
        
        self.stdout.write(self.style.SUCCESS('Halloween játék adatok sikeresen feltöltve!'))