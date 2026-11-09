from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import City, Showroom, Vehicle, OnRoadPrice
from .serializers import (
    CitySerializer, ShowroomSerializer,
    VehicleListSerializer, VehicleDetailSerializer,
    VehicleAdminMutationSerializer, OnRoadPriceSerializer,
    OnRoadPriceAdminMutationSerializer
)

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class CityListView(generics.ListAPIView):
    queryset = City.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]


class ShowroomListView(generics.ListAPIView):
    serializer_class = ShowroomSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Showroom.objects.filter(is_active=True)
        city_id = self.request.query_params.get('city')
        type_param = self.request.query_params.get('type')
        if city_id:
            qs = qs.filter(city_id=city_id)
        if type_param:
            qs = qs.filter(showroom_type=type_param)
        return qs.order_by('city', 'name')


class VehicleListView(generics.ListAPIView):
    serializer_class = VehicleListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Vehicle.objects.all()
        params = self.request.query_params
        
        # Filtering
        v_type = params.get('type')
        if v_type:
            qs = qs.filter(vehicle_type=v_type.upper())
            
        model = params.get('model')
        if model:
            qs = qs.filter(model_name__icontains=model)
            
        fuel = params.get('fuel')
        if fuel:
            qs = qs.filter(fuel_type=fuel.upper())
            
        transmission = params.get('transmission')
        if transmission:
            qs = qs.filter(transmission=transmission.upper())
            
        body = params.get('body')
        if body:
            qs = qs.filter(body_type=body.upper())
            
        min_price = params.get('min_price')
        if min_price:
            try:
                qs = qs.filter(ex_showroom_price__gte=float(min_price))
            except ValueError:
                pass
                
        max_price = params.get('max_price')
        if max_price:
            try:
                qs = qs.filter(ex_showroom_price__lte=float(max_price))
            except ValueError:
                pass
                
        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(model_name__icontains=search) |
                Q(variant__icontains=search) |
                Q(brand__icontains=search) |
                Q(stock_id__icontains=search)
            )

        featured = params.get('featured')
        if featured and featured.lower() in ['true', '1']:
            qs = qs.filter(is_featured=True)

        return qs.order_by('-is_featured', 'brand', 'model_name', 'variant')


class VehicleDetailView(generics.RetrieveAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

    def get_object(self):
        lookup = self.kwargs.get('id')
        if lookup.isdigit():
            return get_object_or_404(Vehicle, id=lookup)
        return get_object_or_404(Vehicle, stock_id=lookup)


class VehiclePriceBreakdownView(APIView):
    """
    Get city-specific on-road price breakdown for a vehicle.
    Source of truth is admin-managed OnRoadPrice table.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, vehicle_id):
        if vehicle_id.isdigit():
            vehicle = get_object_or_404(Vehicle, id=vehicle_id)
        else:
            vehicle = get_object_or_404(Vehicle, stock_id=vehicle_id)

        city_id = request.query_params.get('city_id')
        city_name = request.query_params.get('city_name')

        price_query = OnRoadPrice.objects.filter(vehicle=vehicle)
        if city_id:
            price_query = price_query.filter(city_id=city_id)
        elif city_name:
            price_query = price_query.filter(city__name__iexact=city_name)
        else:
            # Default to Lucknow
            price_query = price_query.filter(city__name__iexact='Lucknow')

        price = price_query.first()
        if not price:
            # Fallback to any available city price for this vehicle
            price = OnRoadPrice.objects.filter(vehicle=vehicle).first()

        if not price:
            return Response(
                {'detail': 'On-road pricing configuration not found for the selected city.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OnRoadPriceSerializer(price)
        return Response(serializer.data)


# ===================== ADMIN MANAGEMENT VIEWS =====================

class AdminVehicleListCreateView(generics.ListCreateAPIView):
    queryset = Vehicle.objects.all().order_by('-created_at')
    permission_classes = [IsAdminUserRole]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VehicleAdminMutationSerializer
        return VehicleDetailSerializer


class AdminVehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleAdminMutationSerializer
    permission_classes = [IsAdminUserRole]
    lookup_field = 'id'


class AdminOnRoadPriceListCreateView(generics.ListCreateAPIView):
    queryset = OnRoadPrice.objects.all().select_related('vehicle', 'city').order_by('city__name', 'vehicle__model_name')
    permission_classes = [IsAdminUserRole]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OnRoadPriceAdminMutationSerializer
        return OnRoadPriceSerializer


class AdminOnRoadPriceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OnRoadPrice.objects.all()
    serializer_class = OnRoadPriceAdminMutationSerializer
    permission_classes = [IsAdminUserRole]
    lookup_field = 'id'


class AdminShowroomListCreateView(generics.ListCreateAPIView):
    queryset = Showroom.objects.all().select_related('city').order_by('name')
    serializer_class = ShowroomSerializer
    permission_classes = [IsAdminUserRole]


class AdminShowroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Showroom.objects.all()
    serializer_class = ShowroomSerializer
    permission_classes = [IsAdminUserRole]
    lookup_field = 'id'
