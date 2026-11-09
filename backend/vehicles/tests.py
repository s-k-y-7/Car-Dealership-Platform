from django.test import TestCase
from decimal import Decimal
from datetime import date
from vehicles.models import City, Showroom, ShowroomType, Vehicle, VehicleType, OnRoadPrice

class VehiclePricingTestCase(TestCase):
    def setUp(self):
        self.lucknow = City.objects.create(name='Lucknow', state='Uttar Pradesh', rto_code='UP32')
        self.kanpur = City.objects.create(name='Kanpur', state='Uttar Pradesh', rto_code='UP78')
        
        self.vehicle = Vehicle.objects.create(
            stock_id='TEST-NEW-01',
            vehicle_type=VehicleType.NEW,
            brand='Brand X',
            model_name='Model H',
            variant='ZX',
            year=2026,
            ex_showroom_price=Decimal('1245000.00'),
            hero_image='https://example.com/car.jpg'
        )

        self.price_lucknow = OnRoadPrice.objects.create(
            vehicle=self.vehicle,
            city=self.lucknow,
            ex_showroom_price=Decimal('1245000.00'),
            road_tax=Decimal('124500.00'),
            insurance=Decimal('45000.00'),
            mandatory_accessories=Decimal('15000.00'),
            registration_charges=Decimal('3500.00'),
            optional_warranty=Decimal('12000.00'),
            valid_until=date(2026, 12, 31)
        )

    def test_total_on_road_price_calculation(self):
        """Verifies total on road price is dynamically and accurately computed from database source of truth."""
        expected = (
            Decimal('1245000.00') +
            Decimal('124500.00') +
            Decimal('45000.00') +
            Decimal('15000.00') +
            Decimal('3500.00') +
            Decimal('12000.00')
        )
        self.assertEqual(self.price_lucknow.total_on_road_price, expected)
        self.assertEqual(self.price_lucknow.total_on_road_price, Decimal('1445000.00'))

    def test_masked_registration_number(self):
        """Verifies registration numbers for used cars are masked for privacy."""
        used_car = Vehicle.objects.create(
            stock_id='TEST-UC-01',
            vehicle_type=VehicleType.USED,
            brand='Brand X',
            model_name='Model C',
            variant='VX',
            year=2022,
            ex_showroom_price=Decimal('845000.00'),
            registration_number='UP32-AB-9821',
            hero_image='https://example.com/car.jpg'
        )
        self.assertEqual(used_car.masked_registration_number, 'UP32-**-9821')
