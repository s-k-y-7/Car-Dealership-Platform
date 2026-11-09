from django.db import models
from django.utils import timezone
from decimal import Decimal

class City(models.Model):
    name = models.CharField(max_length=100, unique=True)
    state = models.CharField(max_length=100, default='Uttar Pradesh')
    rto_code = models.CharField(max_length=10, blank=True, default='UP32')
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Cities'
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name}, {self.state}"


class ShowroomType(models.TextChoices):
    SHOWROOM = 'SHOWROOM', 'Flagship Showroom'
    SERVICE_WORKSHOP = 'SERVICE_WORKSHOP', 'Service Workshop'
    USED_CAR_YARD = 'USED_CAR_YARD', 'Certified Pre-Owned Yard'


class Showroom(models.Model):
    name = models.CharField(max_length=200)
    showroom_type = models.CharField(
        max_length=30,
        choices=ShowroomType.choices,
        default=ShowroomType.SHOWROOM
    )
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='showrooms')
    address = models.TextField()
    pincode = models.CharField(max_length=10, default='226001')
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, default='')
    opening_hours = models.CharField(max_length=150, default='Mon - Sun: 09:30 AM – 07:30 PM')
    has_test_drive = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['city', 'showroom_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_showroom_type_display()})"


class VehicleType(models.TextChoices):
    NEW = 'NEW', 'New Car'
    USED = 'USED', 'Certified Pre-Owned'


class FuelType(models.TextChoices):
    PETROL = 'PETROL', 'Petrol'
    DIESEL = 'DIESEL', 'Diesel'
    HYBRID = 'HYBRID', 'Strong Hybrid'
    ELECTRIC = 'ELECTRIC', 'Electric'


class TransmissionType(models.TextChoices):
    MANUAL = 'MANUAL', 'Manual'
    AUTOMATIC = 'AUTOMATIC', 'Automatic'
    CVT = 'CVT', 'CVT'
    EV = 'EV', 'Single-Speed Reduction Gear'


class BodyType(models.TextChoices):
    SEDAN = 'SEDAN', 'Sedan'
    SUV = 'SUV', 'Premium SUV'
    HATCHBACK = 'HATCHBACK', 'Luxury Hatchback'


class AvailabilityStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Ready for Delivery'
    BOOKED = 'BOOKED', 'Allocated / In Transit'
    SOLD_OUT = 'SOLD_OUT', 'Sold Out'


class Vehicle(models.Model):
    stock_id = models.CharField(max_length=50, unique=True, db_index=True)
    vehicle_type = models.CharField(
        max_length=10,
        choices=VehicleType.choices,
        default=VehicleType.NEW
    )
    brand = models.CharField(max_length=100, default='Brand X')
    model_name = models.CharField(max_length=100, db_index=True)
    variant = models.CharField(max_length=100)
    year = models.PositiveIntegerField(default=2026)
    
    fuel_type = models.CharField(max_length=20, choices=FuelType.choices, default=FuelType.PETROL)
    transmission = models.CharField(max_length=20, choices=TransmissionType.choices, default=TransmissionType.AUTOMATIC)
    body_type = models.CharField(max_length=20, choices=BodyType.choices, default=BodyType.SEDAN)
    
    color = models.CharField(max_length=50, default='Platinum White Pearl')
    color_hex = models.CharField(max_length=10, default='#F8F9FA')
    seating_capacity = models.PositiveIntegerField(default=5)
    engine_capacity = models.CharField(max_length=50, default='1498 cc i-VTEC')
    max_power = models.CharField(max_length=50, default='121 PS @ 6600 rpm')
    max_torque = models.CharField(max_length=50, default='145 Nm @ 4300 rpm')
    fuel_efficiency = models.CharField(max_length=50, default='18.5 km/l')
    
    ex_showroom_price = models.DecimalField(max_digits=12, decimal_places=2)
    availability = models.CharField(
        max_length=20,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE
    )
    is_featured = models.BooleanField(default=False)
    
    hero_image = models.URLField(max_length=500)
    gallery = models.JSONField(default=list, blank=True)
    features = models.JSONField(default=list, blank=True)
    specifications = models.JSONField(default=dict, blank=True)
    
    # Certified Used Car Specifics
    registration_number = models.CharField(max_length=30, blank=True, default='')
    odometer_km = models.PositiveIntegerField(null=True, blank=True)
    owner_count = models.PositiveIntegerField(null=True, blank=True)
    is_certified = models.BooleanField(default=False)
    warranty_info = models.CharField(max_length=200, blank=True, default='')
    inspection_report_summary = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', 'brand', 'model_name', 'variant']

    @property
    def masked_registration_number(self):
        """Securely mask vehicle registration number e.g. UP32-AB-9821 -> UP32-**-9821"""
        if not self.registration_number:
            return ''
        parts = self.registration_number.replace(' ', '-').split('-')
        if len(parts) >= 3:
            return f"{parts[0]}-**-{parts[-1]}"
        elif len(self.registration_number) > 6:
            return f"{self.registration_number[:4]}****{self.registration_number[-4:]}"
        return self.registration_number

    def __str__(self):
        return f"{self.stock_id} | {self.brand} {self.model_name} {self.variant} ({self.year})"


class OnRoadPrice(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='on_road_prices')
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='pricing_rules')
    
    ex_showroom_price = models.DecimalField(max_digits=12, decimal_places=2)
    road_tax = models.DecimalField(max_digits=10, decimal_places=2, help_text="State RTO registration and road safety tax")
    insurance = models.DecimalField(max_digits=10, decimal_places=2, help_text="1 Year Comprehensive + 3 Years Third Party")
    mandatory_accessories = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('15000.00'), help_text="Dealer floor mats, emergency kit, high security plates")
    registration_charges = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('3500.00'), help_text="FASTag & Smart Card charges")
    optional_warranty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Optional Extended warranty / RSA")
    
    valid_until = models.DateField(default=timezone.now)
    disclaimer = models.TextField(
        default="Prices are indicative for state RTO registration. Includes 1-year comprehensive insurance, road tax, FASTag and mandatory dealer accessories. Actual price may vary depending on insurance add-ons and delivery date."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('vehicle', 'city')
        ordering = ['city', 'vehicle']

    @property
    def total_on_road_price(self):
        return (
            self.ex_showroom_price +
            self.road_tax +
            self.insurance +
            self.mandatory_accessories +
            self.registration_charges +
            self.optional_warranty
        )

    def __str__(self):
        return f"{self.vehicle.stock_id} in {self.city.name}: ₹{self.total_on_road_price:,.2f}"
