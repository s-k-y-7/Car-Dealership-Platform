import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Vehicle, City, OnRoadPrice } from '../types';
import { 
  ShieldCheck, Calendar, ArrowLeft, Fuel, Gauge, Award, 
  MapPin, CheckCircle, Info, ChevronRight, Phone, AlertCircle
} from 'lucide-react';

interface VehicleDetailPageProps {
  onOpenTestDrive: (vehicleId: number) => void;
}

export const VehicleDetailPage: React.FC<VehicleDetailPageProps> = ({ onOpenTestDrive }) => {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [pricing, setPricing] = useState<OnRoadPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    fetchVehicleAndCities();
  }, [id]);

  useEffect(() => {
    if (vehicle && selectedCityId) {
      fetchCityPricing(vehicle.id, selectedCityId);
    }
  }, [selectedCityId]);

  const fetchVehicleAndCities = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([
        api.get<Vehicle>(`/vehicles/${id}/`),
        api.get<{ results?: City[] } | City[]>('/cities/')
      ]);

      setVehicle(vRes.data);
      setActiveImage(vRes.data.hero_image);

      const cityList = Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []);
      setCities(cityList);

      // Default to Lucknow or first city
      const lucknowCity = cityList.find(c => c.name.toLowerCase() === 'lucknow') || cityList[0];
      if (lucknowCity) {
        setSelectedCityId(lucknowCity.id);
        fetchCityPricing(vRes.data.id, lucknowCity.id);
      }
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityPricing = async (vehicleId: number, cityId: number) => {
    setPricingLoading(true);
    try {
      const res = await api.get<OnRoadPrice>(`/vehicles/${vehicleId}/pricing/?city_id=${cityId}`);
      setPricing(res.data);
    } catch (err) {
      console.error("Error fetching city pricing:", err);
      setPricing(null);
    } finally {
      setPricingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-[#9E1B24] rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading vehicle specifications & pricing...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] py-20 px-4 text-center">
        <h2 className="text-xl font-bold font-serif text-gray-900">Vehicle Not Found</h2>
        <p className="text-xs text-gray-500 mt-2">The requested model could not be found in current inventory.</p>
        <Link to="/" className="mt-4 inline-block text-xs font-semibold text-[#9E1B24] underline">
          Return to Showroom
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] pb-24">
      {/* Top Breadcrumb & Return Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between text-xs">
          <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Stock ID:</span>
            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {vehicle.stock_id}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: Large Editorial Photography & Specs (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Main Stage Image */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative aspect-[16/10] bg-gray-100">
                <img
                  src={activeImage || vehicle.hero_image}
                  alt={`${vehicle.brand} ${vehicle.model_name}`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-black/80 text-white backdrop-blur-sm">
                    {vehicle.vehicle_type === 'USED' ? 'Certified Pre-Owned' : 'Brand New 2026 Fleet'}
                  </span>
                  {vehicle.masked_registration_number && (
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-white/90 text-gray-900 shadow-sm backdrop-blur-sm">
                      {vehicle.masked_registration_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {vehicle.gallery && vehicle.gallery.length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-3 overflow-x-auto">
                  <button
                    onClick={() => setActiveImage(vehicle.hero_image)}
                    className={`relative w-20 h-14 rounded overflow-hidden shrink-0 border-2 transition ${activeImage === vehicle.hero_image ? 'border-[#9E1B24]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={vehicle.hero_image} className="w-full h-full object-cover" />
                  </button>
                  {vehicle.gallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative w-20 h-14 rounded overflow-hidden shrink-0 border-2 transition ${activeImage === imgUrl ? 'border-[#9E1B24]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={imgUrl} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Title & Specifications */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#9E1B24]">
                  {vehicle.brand} • Authorized Dealer Edition
                </span>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mt-1">
                  {vehicle.model_name} <span className="text-xl font-sans font-normal text-gray-600">{vehicle.variant}</span>
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Model Year {vehicle.year} • Exterior: {vehicle.color} • Seating: {vehicle.seating_capacity || 5} Occupants
                </p>
              </div>

              {/* Certified Pre-Owned Inspection Report (if used) */}
              {vehicle.vehicle_type === 'USED' && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Brand X Certified 160-Point Inspection Passed
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {vehicle.inspection_report_summary || '160-Point Technical Certification Completed. Full authorized dealer service history verified.'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-emerald-800 font-medium border-t border-emerald-200/60">
                    <div>Odometer: <span className="font-bold">{vehicle.odometer_km?.toLocaleString('en-IN')} km</span></div>
                    <div>Ownership: <span className="font-bold">{vehicle.owner_count || 1}st Owner</span></div>
                    <div>Warranty: <span className="font-bold">Included</span></div>
                  </div>
                </div>
              )}

              {/* Performance & Powertrain Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Powertrain & Performance
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Engine / System</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{vehicle.engine_capacity}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Max Power</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{vehicle.max_power}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Transmission</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{vehicle.transmission}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-500 block">Fuel Efficiency</span>
                    <span className="font-semibold text-emerald-700 mt-0.5 block">{vehicle.fuel_efficiency}</span>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Featured Equipment & Safety Highlights
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicle.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-100">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Admin-Managed City On-Road Price Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24 space-y-6">
              {/* City Selection Header */}
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Live Quotation Engine
                </span>
                <h2 className="text-xl font-serif font-bold text-gray-900 mt-2">
                  City On-Road Price Breakdown
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Calculated using authorized state RTO tariffs and official dealership billing guidelines.
                </p>
              </div>

              {/* City Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select Registration City / RTO
                </label>
                <div>
                  <select
                    value={selectedCityId || ''}
                    onChange={(e) => setSelectedCityId(Number(e.target.value))}
                    className="w-full text-xs px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24] font-medium text-gray-900"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.rto_code}) • {c.state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Breakdown Table (Source of truth from database) */}
              {pricingLoading ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-[#9E1B24] rounded-full animate-spin mb-2"></div>
                  <p>Calculating official city tariff...</p>
                </div>
              ) : pricing ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                    <div className="flex justify-between p-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Ex-Showroom Price</span>
                      <span className="font-bold text-gray-900 font-mono">
                        ₹{Number(pricing.ex_showroom_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-gray-100">
                      <div>
                        <span className="text-gray-700 font-medium">RTO & Road Safety Tax</span>
                        <span className="block text-[10px] text-gray-400">State Registration ({pricing.city_rto})</span>
                      </div>
                      <span className="font-mono text-gray-800">
                        ₹{Number(pricing.road_tax).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-gray-100">
                      <div>
                        <span className="text-gray-700 font-medium">Comprehensive Insurance</span>
                        <span className="block text-[10px] text-gray-400">1 Yr Own Damage + 3 Yr Third Party</span>
                      </div>
                      <span className="font-mono text-gray-800">
                        ₹{Number(pricing.insurance).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-gray-100">
                      <div>
                        <span className="text-gray-700 font-medium">Mandatory Dealer Accessories</span>
                        <span className="block text-[10px] text-gray-400">Mats, Emergency Kit, Mud Flaps</span>
                      </div>
                      <span className="font-mono text-gray-800">
                        ₹{Number(pricing.mandatory_accessories).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 border-b border-gray-100">
                      <div>
                        <span className="text-gray-700 font-medium">FASTag & Smart Card Fees</span>
                        <span className="block text-[10px] text-gray-400">Statutory Govt Charges</span>
                      </div>
                      <span className="font-mono text-gray-800">
                        ₹{Number(pricing.registration_charges).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {Number(pricing.optional_warranty) > 0 && (
                      <div className="flex justify-between p-3 border-b border-gray-100">
                        <span className="text-gray-700 font-medium">Extended Warranty / RSA</span>
                        <span className="font-mono text-gray-800">
                          ₹{Number(pricing.optional_warranty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {/* Final Calculated On-Road Price */}
                    <div className="flex justify-between p-4 bg-gradient-to-r from-gray-900 to-black text-white items-baseline">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                          Total On-Road Price ({pricing.city_name})
                        </span>
                        <span className="text-2xl font-bold font-serif text-white">
                          ₹{Number(pricing.total_on_road_price).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        Guaranteed Quote
                      </span>
                    </div>
                  </div>

                  {/* Validity & Disclaimer */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-md text-[11px] text-amber-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1 text-amber-800">
                      <Info className="w-3.5 h-3.5" /> Quote valid until: {pricing.valid_until}
                    </p>
                    <p className="text-amber-800/80 leading-relaxed text-[10px]">
                      {pricing.disclaimer}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 text-red-700 text-xs rounded-md">
                  Pricing for the selected city is currently undergoing revision by the dealership billing desk.
                </div>
              )}

              {/* Primary Call to Action: Book VIP Test Drive */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => onOpenTestDrive(vehicle.id)}
                  className="w-full bg-[#9E1B24] hover:bg-red-800 text-white font-semibold text-xs uppercase tracking-widest py-3.5 rounded-md shadow-md transition duration-200 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book VIP Test Drive for this car</span>
                </button>

                <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-2">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>Direct Showroom Helpline: +91 (0522) 261-4000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
