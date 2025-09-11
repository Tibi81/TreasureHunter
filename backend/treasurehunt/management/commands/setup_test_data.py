from django.core.management.base import BaseCommand
from treasurehunt.models import Game, Team, Station, Challenge

class Command(BaseCommand):
    help = 'Teszt adatok létrehozása a Halloween kincskereső játékhoz'

    def handle(self, *args, **options):
        self.stdout.write('🎃 Halloween kincskereső teszt adatok létrehozása...')
        
        # Állomások létrehozása
        stations_data = [
            {'number': 1, 'name': 'Kezdő állomás', 'icon': '🎃', 'phase': 'separate'},
            {'number': 2, 'name': 'Kísértetek kastélya', 'icon': '👻', 'phase': 'separate'},
            {'number': 3, 'name': 'Pókok barlangja', 'icon': '🕷️', 'phase': 'separate'},
            {'number': 4, 'name': 'Denevérek tornya', 'icon': '🦇', 'phase': 'separate'},
            {'number': 5, 'name': 'Találkozási pont', 'icon': '💀', 'phase': 'together'},
            {'number': 6, 'name': 'Boszorkány ház', 'icon': '🧙‍♀️', 'phase': 'together'},
        ]
        
        for station_data in stations_data:
            station, created = Station.objects.get_or_create(
                number=station_data['number'],
                defaults=station_data
            )
            if created:
                self.stdout.write(f'✅ Állomás létrehozva: {station}')
            else:
                self.stdout.write(f'ℹ️  Állomás már létezik: {station}')
        
        # Feladatok létrehozása
        challenges_data = [
            # 1. állomás - Tök Csapat
            {
                'station_number': 1,
                'team_type': 'pumpkin',
                'title': 'Halloween kincskeresés kezdete',
                'description': 'Üdvözöljük a Halloween kincskereső játékban! Az első feladat: találjátok meg a 🎃 jelet a területen és olvassátok be a QR kódot!',
                'qr_code': 'station1_pumpkin',
                'help_text': 'Keressétek a narancssárga tököt a bejáratnál!'
            },
            # 1. állomás - Szellem Csapat
            {
                'station_number': 1,
                'team_type': 'ghost',
                'title': 'Szellemek útja kezdődik',
                'description': 'A szellemek útja itt kezdődik! Keressétek meg a 👻 jelet és olvassátok be a QR kódot!',
                'qr_code': 'station1_ghost',
                'help_text': 'A fehér szellem a kijáratnál vár!'
            },
            # 2. állomás - Tök Csapat
            {
                'station_number': 2,
                'team_type': 'pumpkin',
                'title': 'Kísértetek kastélya',
                'description': 'A kísértetek kastélyában rejtőzik a következő kincs! Keressétek meg a 👻 jelet!',
                'qr_code': 'station2_pumpkin',
                'help_text': 'A kastély tornyában találjátok!'
            },
            # 2. állomás - Szellem Csapat
            {
                'station_number': 2,
                'team_type': 'ghost',
                'title': 'Szellemek otthona',
                'description': 'Itt laknak a szellemek! Keressétek meg a 👻 jelet!',
                'qr_code': 'station2_ghost',
                'help_text': 'A kastély pincéjében rejtőzik!'
            },
            # 3. állomás - Tök Csapat
            {
                'station_number': 3,
                'team_type': 'pumpkin',
                'title': 'Pókok barlangja',
                'description': 'A pókok barlangjában óvatosan! Keressétek meg a 🕷️ jelet!',
                'qr_code': 'station3_pumpkin',
                'help_text': 'A barlang bejáratánál!'
            },
            # 3. állomás - Szellem Csapat
            {
                'station_number': 3,
                'team_type': 'ghost',
                'title': 'Pókháló labirintus',
                'description': 'A pókháló labirintusban keressétek meg a 🕷️ jelet!',
                'qr_code': 'station3_ghost',
                'help_text': 'A barlang mélyén!'
            },
            # 4. állomás - Tök Csapat
            {
                'station_number': 4,
                'team_type': 'pumpkin',
                'title': 'Denevérek tornya',
                'description': 'A denevérek tornyában a végső kincs! Keressétek meg a 🦇 jelet!',
                'qr_code': 'station4_pumpkin',
                'help_text': 'A torony tetején!'
            },
            # 4. állomás - Szellem Csapat
            {
                'station_number': 4,
                'team_type': 'ghost',
                'title': 'Denevér kolónia',
                'description': 'A denevér kolóniában a végső kincs! Keressétek meg a 🦇 jelet!',
                'qr_code': 'station4_ghost',
                'help_text': 'A torony alján!'
            },
            # 5. állomás - Közös feladat
            {
                'station_number': 5,
                'team_type': None,
                'title': 'Találkozási pont',
                'description': 'Gratulálunk! Mindkét csapat elérte a találkozási pontot! Most együttműködve keressétek meg a 💀 jelet!',
                'qr_code': 'station5_together',
                'help_text': 'A központi területen!'
            },
            # 6. állomás - Közös feladat
            {
                'station_number': 6,
                'team_type': None,
                'title': 'Boszorkány ház',
                'description': 'Az utolsó feladat! A boszorkány házban találjátok meg a végső kincset! Keressétek meg a 🧙‍♀️ jelet!',
                'qr_code': 'station6_final',
                'help_text': 'A boszorkány ház kertjében!'
            },
        ]
        
        for challenge_data in challenges_data:
            station = Station.objects.get(number=challenge_data['station_number'])
            challenge, created = Challenge.objects.get_or_create(
                station=station,
                team_type=challenge_data['team_type'],
                defaults={
                    'title': challenge_data['title'],
                    'description': challenge_data['description'],
                    'qr_code': challenge_data['qr_code'],
                    'help_text': challenge_data['help_text']
                }
            )
            if created:
                self.stdout.write(f'✅ Feladat létrehozva: {challenge}')
            else:
                self.stdout.write(f'ℹ️  Feladat már létezik: {challenge}')
        
        # Teszt játék létrehozása
        game, created = Game.objects.get_or_create(
            name='Halloween Kincskereső Teszt',
            defaults={
                'status': 'setup',
                'meeting_station': 5
            }
        )
        
        if created:
            # Csapatok létrehozása
            Team.objects.get_or_create(game=game, name='pumpkin')
            Team.objects.get_or_create(game=game, name='ghost')
            self.stdout.write(f'✅ Teszt játék létrehozva: {game}')
        else:
            self.stdout.write(f'ℹ️  Teszt játék már létezik: {game}')
        
        self.stdout.write('\n🎉 Teszt adatok létrehozása befejezve!')
        self.stdout.write('\n📋 Következő lépések:')
        self.stdout.write('1. Nyisd meg az admin felületet: http://localhost:8000/admin/')
        self.stdout.write('2. Ellenőrizd a létrehozott adatokat')
        self.stdout.write('3. Indítsd el a frontend alkalmazást: npm run dev')
        self.stdout.write('4. Teszteld a játékot!')
        
        self.stdout.write('\n🔑 QR kódok listája:')
        self.stdout.write('• station1_pumpkin - 1. állomás (Tök Csapat)')
        self.stdout.write('• station1_ghost - 1. állomás (Szellem Csapat)')
        self.stdout.write('• station2_pumpkin - 2. állomás (Tök Csapat)')
        self.stdout.write('• station2_ghost - 2. állomás (Szellem Csapat)')
        self.stdout.write('• station3_pumpkin - 3. állomás (Tök Csapat)')
        self.stdout.write('• station3_ghost - 3. állomás (Szellem Csapat)')
        self.stdout.write('• station4_pumpkin - 4. állomás (Tök Csapat)')
        self.stdout.write('• station4_ghost - 4. állomás (Szellem Csapat)')
        self.stdout.write('• station5_together - 5. állomás (Közös)')
        self.stdout.write('• station6_final - 6. állomás (Közös)')
