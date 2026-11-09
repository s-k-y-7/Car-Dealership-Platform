from rest_framework import serializers
from .models import City, Showroom, Vehicle, OnRoadPrice

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'state', 'rto_code', 'is_active', 'display_order']


class ShowroomSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = Showroom
        fields = [
            'id', 'name', 'showroom_type', 'city', 'city_name',
            'address', 'pincode', 'phone', 'email', 'opening_hours',
            'has_test_drive', 'is_active'
        ]


class OnRoadPriceSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_rto = serializers.CharField(source='city.rto_code', read_only=True)
    total_on_road_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OnRoadPrice
        fields = [
            'id', 'vehicle', 'city', 'city_name', 'city_rto',
            'ex_showroom_price', 'road_tax', 'insurance',
            'mandatory_accessories', 'registration_charges',
            'optional_warranty', 'total_on_road_price',
            'valid_until', 'disclaimer', 'updated_at'
        ]


class VehicleListSerializer(serializers.ModelSerializer):
    masked_registration_number = serializers.CharField(read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'stock_id', 'vehicle_type', 'brand', 'model_name', 'variant',
            'year', 'fuel_type', 'transmission', 'body_type', 'color', 'color_hex',
            'ex_showroom_price', 'availability', 'is_featured', 'hero_image',
            'fuel_efficiency', 'engine_capacity', 'max_power',
            'odometer_km', 'is_certified', 'masked_registration_number'
        ]


class VehicleDetailSerializer(serializers.ModelSerializer):
    masked_registration_number = serializers.CharField(read_only=True)
    on_road_prices = OnRoadPriceSerializer(many=True, read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'stock_id', 'vehicle_type', 'brand', 'model_name', 'variant',
            'year', 'fuel_type', 'transmission', 'body_type', 'color', 'color_hex',
            'seating_capacity', 'engine_capacity', 'max_power', 'max_torque',
            'fuel_efficiency', 'ex_showroom_price', 'availability', 'is_featured',
            'hero_image', 'gallery', 'features', 'specifications',
            'registration_number', 'masked_registration_number', 'odometer_km',
            'owner_count', 'is_certified', 'warranty_info', 'inspection_report_summary',
            'on_road_prices', 'created_at', 'updated_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Non-admins should not see raw unmasked registration_number
        request = self.context.get('request')
        if not (request and request.user and request.user.is_authenticated and request.user.role == 'ADMIN'):
            data.pop('registration_number', None)
        return data


class VehicleAdminMutationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


class OnRoadPriceAdminMutationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnRoadPrice
        fields = '__all__'
