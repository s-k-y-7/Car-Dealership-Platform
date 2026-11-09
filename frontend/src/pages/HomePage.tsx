import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Vehicle, Showroom } from '../types';
import { 
  Car, ShieldCheck, Search, Filter, Fuel, Gauge, Award, 
  MapPin, Phone, ArrowRight, Calendar, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

interface HomePageProps {
  onOpenTestDrive: (vehicleId?: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenTestDrive }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<'ALL' | 'NEW' | 'USED'>('ALL');
  const [filterFuel, setFilterFuel] = useState<string>('ALL');
  const [filterTransmission, setFilterTransmission] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [budgetFilter, setBudgetFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        api.get<{ results?: Vehicle[] } | Vehicle[]>('/vehicles/'),
        api.get<{ results?: Showroom[] } | Showroom[]>('/showrooms/')
      ]);
      const vList = Array.isArray(vRes.data) ? vRes.data : (vRes.data.results || []);
      const sList = Array.isArray(sRes.data) ? sRes.data : (sRes.data.results || []);
      setVehicles(vList);
      setShowrooms(sList);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filterType !== 'ALL' && v.vehicle_type !== filterType) return false;
    if (filterFuel !== 'ALL' && v.fuel_type !== filterFuel) return false;
    if (filterTransmission !== 'ALL' && v.transmission !== filterTransmission) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (
        v.model_name.toLowerCase().includes(q) ||
        v.variant.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.stock_id.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    const price = Number(v.ex_showroom_price);
    if (budgetFilter === 'UNDER_10L' && price >= 1000000) return false;
    if (budgetFilter === '10L_20L' && (price < 1000000 || price > 2000000)) return false;
    if (budgetFilter === 'ABOVE_20L' && price <= 2000000) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      {/* 1. HERO SECTION: Editorial Luxury Automotive Experience */}
      <section className="relative bg-[#0B0F19] text-white overflow-hidden">
        {/* Subtle background ambient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-45 transform scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=2000&q=85')" }}
        ></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 py-24 sm:py-32 lg:py-36">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-gray-200">
              <span className="w-2 h-2 rounded-full bg-[#9E1B24]"></span>
              <span>Authorized Brand X Dealer • Lucknow Capital Region</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight text-white leading-none">
              Engineering <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                Meets Precision.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed max-w-xl">
              Experience Brand X's new 2026 fleet and certified pre-owned collection in Lucknow. Transparent city on-road pricing, guaranteed delivery slots, and VIP test-drives across 3 luxury showrooms.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#showroom-inventory"
                className="bg-[#9E1B24] hover:bg-red-800 text-white text-xs font-semibold uppercase tracking-widest px-7 py-3.5 rounded-md shadow-lg transition duration-200 flex items-center gap-2 group"
              >
                <span>Explore Inventory</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <button
                onClick={() => onOpenTestDrive()}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 text-xs font-semibold uppercase tracking-widest px-7 py-3.5 rounded-md transition duration-200 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-red-400" />
                <span>Book VIP Test Drive</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Highlight Banner */}
        <div className="relative z-20 border-t border-white/10 bg-black/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-red-400 font-bold">3</div>
              <div>
                <p className="font-semibold text-white">Luxury Showrooms</p>
                <p className="text-gray-400 text-[11px]">Hazratganj • Gomti Nagar • Kanpur Rd</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-emerald-400 font-bold">160</div>
              <div>
                <p className="font-semibold text-white">Point Certified Inspection</p>
                <p className="text-gray-400 text-[11px]">Pre-Owned Brand Warranty</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-amber-400 font-bold">UP</div>
              <div>
                <p className="font-semibold text-white">Live RTO Pricing Truth</p>
                <p className="text-gray-400 text-[11px]">Zero Hidden Fees Breakdown</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-blue-400 font-bold">2</div>
              <div>
                <p className="font-semibold text-white">Master Service Workshops</p>
                <p className="text-gray-400 text-[11px]">Transport Nagar & Alambagh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INVENTORY & FILTER SECTION */}
      <section id="showroom-inventory" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#9E1B24]">
              Lucknow Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-1">
              Curated Automotive Fleet
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Explore 2026 factory-fresh models and certified pre-owned vehicles ready for immediate delivery.
            </p>
          </div>

          {/* Type Toggle: All vs New vs Certified Used */}
          <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-md transition ${filterType === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              All Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setFilterType('NEW')}
              className={`px-4 py-2 rounded-md transition ${filterType === 'NEW' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              New 2026 Fleet ({vehicles.filter(v => v.vehicle_type === 'NEW').length})
            </button>
            <button
              onClick={() => setFilterType('USED')}
              className={`px-4 py-2 rounded-md transition ${filterType === 'USED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Certified Used ({vehicles.filter(v => v.vehicle_type === 'USED').length})
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by model (e.g. Model H, Model C, ZX)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24] focus:bg-white transition"
              />
            </div>

            {/* Fuel Filter */}
            <div>
              <select
                value={filterFuel}
                onChange={(e) => setFilterFuel(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24] focus:bg-white transition text-gray-700"
              >
                <option value="ALL">All Fuel Types</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Strong Hybrid</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>

            {/* Transmission Filter */}
            <div>
              <select
                value={filterTransmission}
                onChange={(e) => setFilterTransmission(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24] focus:bg-white transition text-gray-700"
              >
                <option value="ALL">All Transmissions</option>
                <option value="AUTOMATIC">Automatic</option>
                <option value="CVT">CVT</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24] focus:bg-white transition text-gray-700"
              >
                <option value="ALL">All Price Ranges</option>
                <option value="UNDER_10L">Under ₹10 Lakhs</option>
                <option value="10L_20L">₹10 Lakhs – ₹20 Lakhs</option>
                <option value="ABOVE_20L">Above ₹20 Lakhs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-[#9E1B24] rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 mt-3 font-medium">Fetching dealership inventory...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-3">
            <Car className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-serif font-bold text-gray-800">No Vehicles Match Your Filter</h3>
            <p className="text-xs text-gray-500">
              Try clearing your search terms or filters to view all available new and certified stock.
            </p>
            <button
              onClick={() => {
                setFilterType('ALL');
                setFilterFuel('ALL');
                setFilterTransmission('ALL');
                setSearchQuery('');
                setBudgetFilter('ALL');
              }}
              className="mt-2 text-xs font-semibold text-[#9E1B24] underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle) => (
              <div 
                key={vehicle.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Vehicle Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img 
                    src={vehicle.hero_image} 
                    alt={`${vehicle.brand} ${vehicle.model_name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/80 text-white backdrop-blur-sm">
                      {vehicle.stock_id}
                    </span>
                    {vehicle.vehicle_type === 'USED' ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700 text-white backdrop-blur-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Certified Pre-Owned
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#9E1B24] text-white backdrop-blur-sm">
                        New 2026 Fleet
                      </span>
                    )}
                  </div>

                  {/* Availability Indicator */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm">
                      {vehicle.availability === 'AVAILABLE' ? 'Ready for Delivery' : vehicle.availability}
                    </span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
                        {vehicle.brand} • {vehicle.year}
                      </span>
                      {vehicle.masked_registration_number && (
                        <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {vehicle.masked_registration_number}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-serif font-bold text-gray-900 group-hover:text-[#9E1B24] transition mt-0.5">
                      {vehicle.model_name} <span className="text-sm font-sans font-normal text-gray-600">{vehicle.variant}</span>
                    </h3>

                    {/* Key Specs Pills */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 my-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-gray-400" />
                        {vehicle.fuel_type}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        {vehicle.transmission}
                      </span>
                      {vehicle.odometer_km ? (
                        <span className="bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1 font-medium text-emerald-700">
                          <Gauge className="w-3 h-3 text-emerald-500" />
                          {vehicle.odometer_km.toLocaleString('en-IN')} km
                        </span>
                      ) : (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {vehicle.fuel_efficiency || '18.4 km/l'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-4 border-t border-gray-100 mt-2">
                    <div className="flex justify-between items-baseline mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 block">
                          Ex-Showroom Price
                        </span>
                        <span className="text-xl font-bold font-serif text-gray-900">
                          ₹{Number(vehicle.ex_showroom_price).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          Lucknow RTO Ready
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className="text-center text-xs font-semibold py-2 px-3 border border-gray-300 hover:border-gray-900 text-gray-800 rounded-md transition hover:bg-gray-50"
                      >
                        Price Breakdown
                      </Link>
                      <button
                        onClick={() => onOpenTestDrive(vehicle.id)}
                        className="text-center text-xs font-semibold py-2 px-3 bg-[#0B0F19] hover:bg-[#9E1B24] text-white rounded-md transition shadow"
                      >
                        Book Test Drive
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. SHOWROOMS & WORKSHOPS DIRECTORY */}
      <section id="showrooms" className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#9E1B24]">
              Lucknow Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-1">
              Showrooms, Workshops & Yard
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Company A operates 3 state-of-the-art showrooms, 2 dedicated workshops, and Lucknow's premier certified pre-owned evaluation yard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showrooms.map((showroom) => (
              <div 
                key={showroom.id} 
                className="p-5 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between"              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                      {showroom.showroom_type.replace('_', ' ')}
                    </span>
                    {showroom.has_test_drive && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Test Drives Available
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-serif font-bold text-gray-900">
                    {showroom.name}
                  </h3>

                  <p className="text-xs text-gray-600 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-[#9E1B24] shrink-0 mt-0.5" />
                    <span>{showroom.address}, {showroom.city_name} — {showroom.pincode}</span>
                  </p>

                  <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-gray-200">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{showroom.phone}</span>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Hours: {showroom.opening_hours}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <button
                    onClick={() => onOpenTestDrive()}
                    className="w-full text-xs font-semibold py-2 bg-white border border-gray-300 hover:border-gray-900 text-gray-800 rounded-md transition"
                  >
                    Schedule Visit / Test Drive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
