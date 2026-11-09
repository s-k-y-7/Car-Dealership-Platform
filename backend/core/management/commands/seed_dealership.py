from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from vehicles.models import City, Showroom, ShowroomType, Vehicle, VehicleType, FuelType, TransmissionType, BodyType, AvailabilityStatus, OnRoadPrice
from leads.models import TestDriveBooking, BookingStatus, Lead, LeadSource, LeadStatus, LeadPriority, LeadActivity, AIInteraction

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds Company A Brand X Dealership demo database with realistic showroom data, pricing, leads, and users.'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding for Company A Brand X Dealership (Lucknow)...")

        # 1. Create Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@brandx-lucknow.com',
                'full_name': 'Vikramaditya Singhania',
                'role': 'ADMIN',
                'phone': '+91 98390 11001',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        consultant1, _ = User.objects.get_or_create(
            username='rohit.verma',
            defaults={
                'email': 'rohit.verma@brandx-lucknow.com',
                'full_name': 'Rohit Verma',
                'role': 'CONSULTANT',
                'phone': '+91 98390 22002',
                'is_active_consultant': True,
            }
        )
        consultant1.set_password('consultant123')
        consultant1.save()

        consultant2, _ = User.objects.get_or_create(
            username='priya.sharma',
            defaults={
                'email': 'priya.sharma@brandx-lucknow.com',
                'full_name': 'Priya Sharma',
                'role': 'CONSULTANT',
                'phone': '+91 98390 33003',
                'is_active_consultant': True,
            }
        )
        consultant2.set_password('consultant123')
        consultant2.save()

        buyer1, _ = User.objects.get_or_create(
            username='ananya.dixit',
            defaults={
                'email': 'ananya.dixit@example.com',
                'full_name': 'Ananya Dixit',
                'role': 'BUYER',
                'phone': '+91 94150 44004',
            }
        )
        buyer1.set_password('buyer123')
        buyer1.save()

        self.stdout.write("Created demo users (admin, rohit.verma, priya.sharma, ananya.dixit).")

        # 2. Create Cities
        lucknow, _ = City.objects.get_or_create(
            name='Lucknow',
            defaults={'state': 'Uttar Pradesh', 'rto_code': 'UP32', 'display_order': 1}
        )
        kanpur, _ = City.objects.get_or_create(
            name='Kanpur',
            defaults={'state': 'Uttar Pradesh', 'rto_code': 'UP78', 'display_order': 2}
        )
        varanasi, _ = City.objects.get_or_create(
            name='Varanasi',
            defaults={'state': 'Uttar Pradesh', 'rto_code': 'UP65', 'display_order': 3}
        )
        noida, _ = City.objects.get_or_create(
            name='Noida',
            defaults={'state': 'Uttar Pradesh', 'rto_code': 'UP16', 'display_order': 4}
        )

        # 3. Create Showrooms for Company A (3 showrooms, 2 workshops, 1 certified yard in Lucknow)
        sr1, _ = Showroom.objects.get_or_create(
            name='Brand X Hazratganj Flagship Showroom',
            defaults={
                'showroom_type': ShowroomType.SHOWROOM,
                'city': lucknow,
                'address': 'Plot 14-16, Mahatma Gandhi Marg, Hazratganj',
                'pincode': '226001',
                'phone': '+91 522 261 4000',
                'email': 'hazratganj@brandx-lucknow.com',
                'opening_hours': 'Mon - Sun: 09:30 AM – 08:00 PM',
                'has_test_drive': True,
            }
        )

        sr2, _ = Showroom.objects.get_or_create(
            name='Brand X Gomti Nagar Experience Centre',
            defaults={
                'showroom_type': ShowroomType.SHOWROOM,
                'city': lucknow,
                'address': 'TCG-4/4, Vibhuti Khand, Gomti Nagar (Opp. Hyatt Regency)',
                'pincode': '226010',
                'phone': '+91 522 272 8000',
                'email': 'gomtinagar@brandx-lucknow.com',
                'opening_hours': 'Mon - Sun: 09:30 AM – 08:30 PM',
                'has_test_drive': True,
            }
        )

        sr3, _ = Showroom.objects.get_or_create(
            name='Brand X Kanpur Road Showroom',
            defaults={
                'showroom_type': ShowroomType.SHOWROOM,
                'city': lucknow,
                'address': 'Sector B, Bargawan, Near Alambagh Metro Station, Kanpur Road',
                'pincode': '226005',
                'phone': '+91 522 245 9000',
                'email': 'kanpurroad@brandx-lucknow.com',
                'opening_hours': 'Mon - Sun: 09:30 AM – 07:30 PM',
                'has_test_drive': True,
            }
        )

        ws1, _ = Showroom.objects.get_or_create(
            name='Brand X Transport Nagar Mega Service Workshop',
            defaults={
                'showroom_type': ShowroomType.SERVICE_WORKSHOP,
                'city': lucknow,
                'address': 'Phase 2, Transport Nagar Industrial Area',
                'pincode': '226012',
                'phone': '+91 522 243 1100',
                'email': 'service.tnagar@brandx-lucknow.com',
                'opening_hours': 'Mon - Sat: 08:30 AM – 06:30 PM',
                'has_test_drive': False,
            }
        )

        yard1, _ = Showroom.objects.get_or_create(
            name='Brand X Alambagh Workshop & Certified Pre-Owned Yard',
            defaults={
                'showroom_type': ShowroomType.USED_CAR_YARD,
                'city': lucknow,
                'address': 'Khasra 412, VIP Road, Near Awadh Rotary, Alambagh',
                'pincode': '226005',
                'phone': '+91 522 245 3300',
                'email': 'certified.alambagh@brandx-lucknow.com',
                'opening_hours': 'Mon - Sun: 09:30 AM – 07:30 PM',
                'has_test_drive': True,
            }
        )

        self.stdout.write("Created Lucknow showrooms, workshops and certified yard.")

        # 4. Create Vehicles (including exact required models)
        # NEW-H-02: Model H, ZX automatic, petrol, 2026, ₹12,45,000 ex-showroom
        veh1, _ = Vehicle.objects.get_or_create(
            stock_id='NEW-H-02',
            defaults={
                'vehicle_type': VehicleType.NEW,
                'brand': 'Brand X',
                'model_name': 'Model H',
                'variant': 'ZX CVT Automatic',
                'year': 2026,
                'fuel_type': FuelType.PETROL,
                'transmission': TransmissionType.CVT,
                'body_type': BodyType.SEDAN,
                'color': 'Platinum White Pearl',
                'color_hex': '#ECEEF1',
                'seating_capacity': 5,
                'engine_capacity': '1.5L i-VTEC DOHC',
                'max_power': '121 PS @ 6600 rpm',
                'max_torque': '145 Nm @ 4300 rpm',
                'fuel_efficiency': '18.4 km/l',
                'ex_showroom_price': Decimal('1245000.00'),
                'availability': AvailabilityStatus.AVAILABLE,
                'is_featured': True,
                'hero_image': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
                ],
                'features': [
                    'Level-2 ADAS Sensing Suite',
                    'One-Touch Electric Sunroof',
                    'LaneWatch Blind Spot Camera',
                    '10.25-inch Touchscreen with Wireless Apple CarPlay',
                    '6 Airbags Standard Safety Package',
                    'Smart Keyless Entry with Walk Away Auto Lock'
                ],
                'specifications': {
                    'Engine': '1498 cc, 4 Cylinders Inline DOHC',
                    'Transmission': '7-Speed Paddle Shift CVT',
                    'Boot Space': '506 Litres',
                    'Ground Clearance': '165 mm',
                    'Fuel Tank': '40 Litres',
                    'Brakes': 'Front Ventilated Disc / Rear Solid Disc'
                }
            }
        )

        # UC-1182: Model C, VX, diesel, 2022, 41,200 km, ₹8,45,000
        veh2, _ = Vehicle.objects.get_or_create(
            stock_id='UC-1182',
            defaults={
                'vehicle_type': VehicleType.USED,
                'brand': 'Brand X',
                'model_name': 'Model C',
                'variant': 'VX Manual',
                'year': 2022,
                'fuel_type': FuelType.DIESEL,
                'transmission': TransmissionType.MANUAL,
                'body_type': BodyType.SUV,
                'color': 'Meteoroid Grey Metallic',
                'color_hex': '#555A60',
                'seating_capacity': 5,
                'engine_capacity': '1.5L i-DTEC Turbo',
                'max_power': '100 PS @ 3600 rpm',
                'max_torque': '200 Nm @ 1750 rpm',
                'fuel_efficiency': '24.1 km/l',
                'ex_showroom_price': Decimal('845000.00'),
                'availability': AvailabilityStatus.AVAILABLE,
                'is_featured': True,
                'registration_number': 'UP32-DX-4412',
                'odometer_km': 41200,
                'owner_count': 1,
                'is_certified': True,
                'warranty_info': '1 Year / 15,000 km Brand Certified Comprehensive Warranty + 3 Free Services',
                'inspection_report_summary': '160-Point Dealer Certified Technical Inspection Passed. Non-accidental structure, clean service history at Brand X Hazratganj workshop. 80% tyre life remaining.',
                'hero_image': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
                ],
                'features': [
                    'Touchscreen Audio with Android Auto',
                    'Dual SRS Front Airbags',
                    'Automatic Climate Control',
                    'Rear Parking Sensors & Multi-angle Camera',
                    'Alloy Wheels'
                ],
                'specifications': {
                    'Odometer': '41,200 km (Verified)',
                    'Ownership': 'Single Owner (Private Individual)',
                    'Insurance Validity': 'Zero-Depreciation till Nov 2026',
                    'Service History': 'Full Dealership Authorized Logbook'
                }
            }
        )

        # UC-1190: Model S, LX, petrol, 2021, 58,600 km, ₹5,12,000
        veh3, _ = Vehicle.objects.get_or_create(
            stock_id='UC-1190',
            defaults={
                'vehicle_type': VehicleType.USED,
                'brand': 'Brand X',
                'model_name': 'Model S',
                'variant': 'LX Executive',
                'year': 2021,
                'fuel_type': FuelType.PETROL,
                'transmission': TransmissionType.MANUAL,
                'body_type': BodyType.HATCHBACK,
                'color': 'Lunar Silver',
                'color_hex': '#D4D6D9',
                'seating_capacity': 5,
                'engine_capacity': '1.2L i-VTEC',
                'max_power': '90 PS @ 6000 rpm',
                'max_torque': '110 Nm @ 4800 rpm',
                'fuel_efficiency': '19.2 km/l',
                'ex_showroom_price': Decimal('512000.00'),
                'availability': AvailabilityStatus.AVAILABLE,
                'is_featured': False,
                'registration_number': 'UP32-BN-8819',
                'odometer_km': 58600,
                'owner_count': 1,
                'is_certified': True,
                'warranty_info': '6 Months Engine & Transmission Warranty with 24x7 Roadside Assistance',
                'inspection_report_summary': '160-Point Certified Inspection Completed. Genuine mileage verified via DMS logs. Suspension and battery in prime condition.',
                'hero_image': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80'
                ],
                'features': [
                    'Power Steering & Power Windows',
                    'Keyless Remote Entry',
                    'ABS with EBD Safety',
                    'Electrically Adjustable ORVMs'
                ],
                'specifications': {
                    'Odometer': '58,600 km',
                    'Ownership': '1st Owner',
                    'Fuel Economy': '19.2 km/l ARAI tested'
                }
            }
        )

        # Additional vehicle: Model E Strong Hybrid 2026
        veh4, _ = Vehicle.objects.get_or_create(
            stock_id='NEW-E-01',
            defaults={
                'vehicle_type': VehicleType.NEW,
                'brand': 'Brand X',
                'model_name': 'Model E',
                'variant': 'e:HEV ZX Strong Hybrid',
                'year': 2026,
                'fuel_type': FuelType.HYBRID,
                'transmission': TransmissionType.EV,
                'body_type': BodyType.SEDAN,
                'color': 'Radiant Red Metallic',
                'color_hex': '#9E1B24',
                'seating_capacity': 5,
                'engine_capacity': '1.5L Atkinson Cycle + Dual Motor Hybrid',
                'max_power': '126 PS Combined System Output',
                'max_torque': '253 Nm Instant Electric Torque',
                'fuel_efficiency': '27.13 km/l',
                'ex_showroom_price': Decimal('1985000.00'),
                'availability': AvailabilityStatus.AVAILABLE,
                'is_featured': True,
                'hero_image': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80'
                ],
                'features': [
                    'Dual Motor Electric Drive Hybrid',
                    'Full ADAS 2.0 with Adaptive Cruise & Stop-and-Go',
                    'Electric Parking Brake with Auto Brake Hold',
                    'Pure EV Silent Driving Mode',
                    '8-Speaker Premium Surround Sound'
                ],
                'specifications': {
                    'Powertrain': 'Self-Charging Electric Hybrid System',
                    'Battery Warranty': '8 Years / 1,60,000 km Brand Guarantee',
                    'Top Speed': '180 km/h',
                    'Emission Standard': 'BS6 Phase 2 (Real Driving Emissions)'
                }
            }
        )

        # Additional vehicle: Model V Prestige SUV 2026
        veh5, _ = Vehicle.objects.get_or_create(
            stock_id='NEW-V-05',
            defaults={
                'vehicle_type': VehicleType.NEW,
                'brand': 'Brand X',
                'model_name': 'Model V',
                'variant': 'VX Prestige All-Wheel Drive',
                'year': 2026,
                'fuel_type': FuelType.PETROL,
                'transmission': TransmissionType.AUTOMATIC,
                'body_type': BodyType.SUV,
                'color': 'Obsidian Crystal Black',
                'color_hex': '#1C1D1F',
                'seating_capacity': 7,
                'engine_capacity': '2.0L Turbocharged i-VTEC',
                'max_power': '190 PS @ 5800 rpm',
                'max_torque': '300 Nm @ 1800-4500 rpm',
                'fuel_efficiency': '15.2 km/l',
                'ex_showroom_price': Decimal('2890000.00'),
                'availability': AvailabilityStatus.AVAILABLE,
                'is_featured': True,
                'hero_image': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
                ],
                'features': [
                    'Panoramic Skyroof with Ambient Lighting',
                    'Intelligent Real-Time AWD System',
                    'Ventilated Front Seats with Memory',
                    '12-Speaker Bose Audio System',
                    '360-Degree Surround Camera'
                ],
                'specifications': {
                    'Drive System': 'Real-Time All Wheel Drive (AWD)',
                    'Ground Clearance': '210 mm',
                    'Towing Capacity': '1,500 kg',
                    'Seating': '3-Row Ergonomic Luxury'
                }
            }
        )

        self.stdout.write("Created demo vehicles (NEW-H-02, UC-1182, UC-1190, NEW-E-01, NEW-V-05).")

        # 5. Create On-Road Pricing Source of Truth for each vehicle across cities
        pricing_data = [
            # NEW-H-02
            (veh1, lucknow, Decimal('1245000.00'), Decimal('124500.00'), Decimal('45200.00'), Decimal('15000.00'), Decimal('3500.00'), Decimal('12000.00')),
            (veh1, kanpur, Decimal('1245000.00'), Decimal('125000.00'), Decimal('45500.00'), Decimal('15000.00'), Decimal('3800.00'), Decimal('12000.00')),
            (veh1, varanasi, Decimal('1245000.00'), Decimal('124800.00'), Decimal('45200.00'), Decimal('15000.00'), Decimal('3500.00'), Decimal('12000.00')),
            (veh1, noida, Decimal('1245000.00'), Decimal('128000.00'), Decimal('46000.00'), Decimal('15000.00'), Decimal('4200.00'), Decimal('12000.00')),

            # UC-1182 (Used car: RTO transfer charge + warranty pack)
            (veh2, lucknow, Decimal('845000.00'), Decimal('22500.00'), Decimal('24800.00'), Decimal('8500.00'), Decimal('2500.00'), Decimal('0.00')),
            (veh2, kanpur, Decimal('845000.00'), Decimal('23000.00'), Decimal('25000.00'), Decimal('8500.00'), Decimal('2500.00'), Decimal('0.00')),

            # UC-1190
            (veh3, lucknow, Decimal('512000.00'), Decimal('16200.00'), Decimal('18400.00'), Decimal('6500.00'), Decimal('2000.00'), Decimal('0.00')),
            (veh3, kanpur, Decimal('512000.00'), Decimal('16500.00'), Decimal('18600.00'), Decimal('6500.00'), Decimal('2000.00'), Decimal('0.00')),

            # NEW-E-01 Strong Hybrid (UP EV & Hybrid RTO Subsidy 50% waiver applied!)
            (veh4, lucknow, Decimal('1985000.00'), Decimal('99250.00'), Decimal('62400.00'), Decimal('18500.00'), Decimal('4000.00'), Decimal('18000.00')),
            (veh4, noida, Decimal('1985000.00'), Decimal('115000.00'), Decimal('64000.00'), Decimal('18500.00'), Decimal('4500.00'), Decimal('18000.00')),

            # NEW-V-05
            (veh5, lucknow, Decimal('2890000.00'), Decimal('289000.00'), Decimal('88500.00'), Decimal('22000.00'), Decimal('5000.00'), Decimal('25000.00')),
        ]

        for v, city, ex_sh, rto, ins, acc, reg, opt in pricing_data:
            OnRoadPrice.objects.update_or_create(
                vehicle=v,
                city=city,
                defaults={
                    'ex_showroom_price': ex_sh,
                    'road_tax': rto,
                    'insurance': ins,
                    'mandatory_accessories': acc,
                    'registration_charges': reg,
                    'optional_warranty': opt,
                    'valid_until': date(2026, 12, 31),
                    'disclaimer': f"Authorized Brand X on-road pricing for {city.name} RTO. Road tax and insurance reflect current Uttar Pradesh Motor Vehicle Department notifications."
                }
            )

        self.stdout.write("Created city-wise On-Road pricing table (source of truth).")

        # 6. Create Test Drive Bookings & Realistic Leads
        # Booking 1: Ananya Dixit for Model H at Hazratganj
        td1, _ = TestDriveBooking.objects.get_or_create(
            booking_reference='TD-2611-001',
            defaults={
                'vehicle': veh1,
                'showroom': sr1,
                'customer_name': 'Ananya Dixit',
                'customer_phone': '+91 94150 44004',
                'customer_email': 'ananya.dixit@example.com',
                'preferred_date': timezone.now().date() + timedelta(days=2),
                'time_slot': '11:30 AM - 12:30 PM',
                'status': BookingStatus.CONFIRMED,
                'notes': 'Interested in exchanging 2018 hatchback. Would like to test ADAS features on Lohia Path stretch.',
                'consent_given': True
            }
        )

        lead1, _ = Lead.objects.get_or_create(
            lead_reference='LD-2611-001',
            defaults={
                'source': LeadSource.TEST_DRIVE,
                'customer_name': 'Ananya Dixit',
                'customer_phone': '+91 94150 44004',
                'customer_email': 'ananya.dixit@example.com',
                'customer_city': 'Lucknow',
                'interested_vehicle': veh1,
                'test_drive_booking': td1,
                'budget_range': '₹14,00,000 - ₹15,00,000 On-Road',
                'requirements_notes': 'Wants white automatic sedan. Inquired about delivery timeframe before year end. Wants exchange evaluation for existing car.',
                'status': LeadStatus.CONTACTED,
                'priority': LeadPriority.HOT,
                'assigned_consultant': consultant1,
                'assigned_at': timezone.now() - timedelta(hours=3),
                'first_response_at': timezone.now() - timedelta(hours=2, minutes=45),
                'response_due_minutes': 30,
                'consent_data_processing': True
            }
        )

        LeadActivity.objects.get_or_create(
            lead=lead1,
            activity_type=LeadActivity.ActivityType.TEST_DRIVE_BOOKED,
            defaults={'details': 'Test drive requested for Model H ZX at Hazratganj Flagship.'}
        )
        LeadActivity.objects.get_or_create(
            lead=lead1,
            activity_type=LeadActivity.ActivityType.CALL_LOGGED,
            defaults={
                'performed_by': consultant1,
                'details': 'Spoke with customer; confirmed slot for Thursday 11:30 AM. Vehicle prepped in bay 2.'
            }
        )

        # Lead 2: NEW Lead with active response timer (created 8 minutes ago, 22 minutes left)
        lead2, _ = Lead.objects.get_or_create(
            lead_reference='LD-2611-002',
            defaults={
                'source': LeadSource.WEBSITE_ENQUIRY,
                'customer_name': 'Dr. Rajeshwar Tandon',
                'customer_phone': '+91 98391 55667',
                'customer_email': 'dr.tandon.kgmu@gmail.com',
                'customer_city': 'Lucknow',
                'interested_vehicle': veh4, # Strong hybrid
                'budget_range': '₹22,00,000 On-Road',
                'requirements_notes': 'Interested in Model E Strong Hybrid. Daily commute 45 km across Lucknow. Enquiring about fuel savings and hybrid road tax rebate in UP.',
                'status': LeadStatus.ASSIGNED,
                'priority': LeadPriority.HOT,
                'assigned_consultant': consultant2,
                'assigned_at': timezone.now() - timedelta(minutes=8),
                'first_response_at': None,
                'response_due_minutes': 30,
                'consent_data_processing': True
            }
        )
        LeadActivity.objects.get_or_create(
            lead=lead2,
            activity_type=LeadActivity.ActivityType.NOTE_ADDED,
            defaults={'details': 'Incoming portal inquiry for Model E Strong Hybrid auto-assigned to Priya Sharma.'}
        )

        # Lead 3: OVERDUE response timer lead (assigned 45 minutes ago, response target breached!)
        lead3, _ = Lead.objects.get_or_create(
            lead_reference='LD-2611-003',
            defaults={
                'source': LeadSource.USED_CAR_INQUIRY,
                'customer_name': 'Alok Ranjan Srivastava',
                'customer_phone': '+91 99182 33445',
                'customer_email': 'alok.srivastava@yahoo.com',
                'customer_city': 'Lucknow',
                'interested_vehicle': veh2, # UC-1182
                'budget_range': '₹8,00,000 - ₹8,50,000',
                'requirements_notes': 'Saw UC-1182 Model C Diesel on used car portal. Wants to verify if non-accidental certificate and service records are on file.',
                'status': LeadStatus.ASSIGNED,
                'priority': LeadPriority.HOT,
                'assigned_consultant': consultant1,
                'assigned_at': timezone.now() - timedelta(minutes=48),
                'first_response_at': None,
                'response_due_minutes': 30,
                'consent_data_processing': True
            }
        )
        LeadActivity.objects.get_or_create(
            lead=lead3,
            activity_type=LeadActivity.ActivityType.NOTE_ADDED,
            defaults={'details': 'Used car inquiry for UC-1182 received. Awaiting consultant initial response.'}
        )

        # Lead 4: Converted / Deal Won Lead
        lead4, _ = Lead.objects.get_or_create(
            lead_reference='LD-2611-004',
            defaults={
                'source': LeadSource.WALK_IN,
                'customer_name': 'Sunita Mehrotra',
                'customer_phone': '+91 94151 77889',
                'customer_email': 'sunita.mehrotra@outlook.com',
                'customer_city': 'Lucknow',
                'interested_vehicle': veh5,
                'budget_range': '₹32,00,000',
                'requirements_notes': 'VIP Walk-in at Gomti Nagar centre. Booked Model V AWD Obsidian Black for Dhanteras delivery.',
                'status': LeadStatus.WON,
                'priority': LeadPriority.HOT,
                'assigned_consultant': consultant2,
                'assigned_at': timezone.now() - timedelta(days=5),
                'first_response_at': timezone.now() - timedelta(days=5, hours=-1),
                'response_due_minutes': 30,
                'consent_data_processing': True
            }
        )
        LeadActivity.objects.get_or_create(
            lead=lead4,
            activity_type=LeadActivity.ActivityType.STATUS_CHANGE,
            defaults={'details': 'Booking advance payment received. Vehicle allocated in stock.'}
        )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
