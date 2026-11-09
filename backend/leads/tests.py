from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from vehicles.models import City, Showroom, Vehicle, VehicleType
from leads.models import TestDriveBooking, Lead, LeadSource, LeadStatus, LeadPriority
from leads.views import auto_assign_lead
from core.ai_service import generate_lead_summary, generate_first_reply_draft

User = get_user_model()

class LeadWorkflowTestCase(TestCase):
    def setUp(self):
        self.city = City.objects.create(name='Lucknow', state='Uttar Pradesh')
        self.showroom = Showroom.objects.create(
            name='Hazratganj Flagship',
            city=self.city,
            address='M.G. Marg',
            phone='+91 522 261 4000'
        )
        self.vehicle = Vehicle.objects.create(
            stock_id='TEST-TD-01',
            vehicle_type=VehicleType.NEW,
            brand='Brand X',
            model_name='Model H',
            variant='ZX',
            year=2026,
            ex_showroom_price=Decimal('1245000.00'),
            hero_image='https://example.com/car.jpg'
        )
        # Create 2 consultants with different lead loads
        self.consultant1 = User.objects.create_user(
            username='consultant.a',
            role='CONSULTANT',
            full_name='Consultant A',
            phone='+91 98390 00001'
        )
        self.consultant2 = User.objects.create_user(
            username='consultant.b',
            role='CONSULTANT',
            full_name='Consultant B',
            phone='+91 98390 00002'
        )
        # Give consultant1 an active lead so consultant2 has fewer active leads
        Lead.objects.create(
            customer_name='Existing Customer',
            customer_phone='9999999999',
            status=LeadStatus.CONTACTED,
            assigned_consultant=self.consultant1
        )

    def test_duplicate_test_drive_booking_prevention(self):
        """Verifies duplicate bookings for same vehicle, showroom, date, and slot are rejected."""
        booking_date = timezone.now().date() + timedelta(days=2)
        slot = "10:00 AM - 11:00 AM"

        # First booking succeeds
        TestDriveBooking.objects.create(
            vehicle=self.vehicle,
            showroom=self.showroom,
            customer_name='John Doe',
            customer_phone='9876543210',
            customer_email='john@example.com',
            preferred_date=booking_date,
            time_slot=slot
        )

        # Attempt duplicate booking
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            TestDriveBooking.objects.create(
                vehicle=self.vehicle,
                showroom=self.showroom,
                customer_name='Jane Smith',
                customer_phone='9123456789',
                customer_email='jane@example.com',
                preferred_date=booking_date,
                time_slot=slot
            )

    def test_auto_assignment_least_active_consultant(self):
        """Verifies lead is assigned to consultant with least active leads."""
        new_lead = Lead.objects.create(
            customer_name='Prospective Buyer',
            customer_phone='9876500000',
            status=LeadStatus.NEW
        )
        assigned = auto_assign_lead(new_lead)
        self.assertEqual(assigned, self.consultant2)
        self.assertEqual(new_lead.assigned_consultant, self.consultant2)
        self.assertEqual(new_lead.status, LeadStatus.ASSIGNED)

    def test_lead_response_timer(self):
        """Verifies overdue status and remaining minutes calculation."""
        # Active lead created 10 minutes ago with 30 min SLA
        recent_lead = Lead.objects.create(
            customer_name='Recent Lead',
            customer_phone='9876500001',
            status=LeadStatus.NEW,
            response_due_minutes=30
        )
        recent_lead.assigned_at = timezone.now() - timedelta(minutes=10)
        recent_lead.save()

        self.assertFalse(recent_lead.is_response_overdue)
        self.assertAlmostEqual(recent_lead.response_timer_minutes_left, 20.0, delta=1.0)

        # Overdue lead assigned 40 minutes ago
        overdue_lead = Lead.objects.create(
            customer_name='Overdue Lead',
            customer_phone='9876500002',
            status=LeadStatus.ASSIGNED,
            response_due_minutes=30
        )
        overdue_lead.assigned_at = timezone.now() - timedelta(minutes=40)
        overdue_lead.save()

        self.assertTrue(overdue_lead.is_response_overdue)
        self.assertLess(overdue_lead.response_timer_minutes_left, 0)

    def test_ai_fallback_handles_missing_info_transparently(self):
        """Verifies AI summary highlights missing information without fabricating data."""
        lead = Lead.objects.create(
            customer_name='Vikram Seth',
            customer_phone='9876543210',
            customer_city='Lucknow',
            interested_vehicle=self.vehicle,
            budget_range='',  # Missing
            requirements_notes='Looking for test drive and pricing details'
        )
        summary_result = generate_lead_summary(lead)
        self.assertIn('summary', summary_result)
        self.assertIn('Identified Missing / Ambiguous Details', summary_result['summary'])
        self.assertIn('Budget', summary_result['summary'])
        self.assertTrue(summary_result['is_fallback'])

        draft_result = generate_first_reply_draft(lead, self.consultant1)
        self.assertIn('draft', draft_result)
        self.assertIn('Vikram Seth', draft_result['draft'])
        self.assertIn('Consultant A', draft_result['draft'])
        self.assertTrue(draft_result['is_fallback'])
