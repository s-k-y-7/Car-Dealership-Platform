import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Vehicle, OnRoadPrice, City, Showroom, User } from '../types';
import { 
  Car, DollarSign, Building2, Users, Plus, Edit, Trash2, 
  Check, X, AlertCircle, CheckCircle2, Shield, Search
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'VEHICLES' | 'PRICING' | 'SHOWROOMS' | 'CONSULTANTS'>('VEHICLES');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pricingRules, setPricingRules] = useState<OnRoadPrice[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [consultants, setConsultants] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Vehicle Modal state
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vFormData, setVFormData] = useState({
    stock_id: '',
    vehicle_type: 'NEW',
    brand: 'Brand X',
    model_name: '',
    variant: '',
    year: 2026,
    fuel_type: 'PETROL',
    transmission: 'AUTOMATIC',
    body_type: 'SEDAN',
    color: 'Platinum White Pearl',
    color_hex: '#FFFFFF',
    ex_showroom_price: '',
    availability: 'AVAILABLE',
    hero_image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    registration_number: '',
    odometer_km: '',
    owner_count: 1,
    is_certified: false,
    warranty_info: ''
  });

  // Pricing Modal state
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<OnRoadPrice | null>(null);
  const [pFormData, setPFormData] = useState({
    vehicle: 0,
    city: 0,
    ex_showroom_price: '',
    road_tax: '',
    insurance: '',
    mandatory_accessories: '15000',
    registration_charges: '3500',
    optional_warranty: '0',
    valid_until: '2026-12-31',
    disclaimer: 'Prices are indicative for state RTO registration. Subject to formal dealership invoice date.'
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [vRes, pRes, sRes, cRes, cityRes] = await Promise.all([
        api.get<Vehicle[]>('/admin/vehicles/'),
        api.get<OnRoadPrice[]>('/admin/pricing/'),
        api.get<Showroom[]>('/admin/showrooms/'),
        api.get<User[]>('/consultants/'),
        api.get<City[]>('/cities/')
      ]);

      setVehicles(Array.isArray(vRes.data) ? vRes.data : ((vRes.data as any).results || []));
      setPricingRules(Array.isArray(pRes.data) ? pRes.data : ((pRes.data as any).results || []));
      setShowrooms(Array.isArray(sRes.data) ? sRes.data : ((sRes.data as any).results || []));
      setConsultants(Array.isArray(cRes.data) ? cRes.data : ((cRes.data as any).results || []));
      setCities(Array.isArray(cityRes.data) ? cityRes.data : ((cityRes.data as any).results || []));
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVehicleModal = (veh?: Vehicle) => {
    setErrorMsg(null);
    if (veh) {
      setEditingVehicle(veh);
      setVFormData({
        stock_id: veh.stock_id,
        vehicle_type: veh.vehicle_type,
        brand: veh.brand,
        model_name: veh.model_name,
        variant: veh.variant,
        year: veh.year,
        fuel_type: veh.fuel_type,
        transmission: veh.transmission,
        body_type: veh.body_type,
        color: veh.color,
        color_hex: veh.color_hex || '#FFFFFF',
        ex_showroom_price: String(veh.ex_showroom_price),
        availability: veh.availability,
        hero_image: veh.hero_image,
        registration_number: veh.registration_number || '',
        odometer_km: veh.odometer_km ? String(veh.odometer_km) : '',
        owner_count: veh.owner_count || 1,
        is_certified: !!veh.is_certified,
        warranty_info: veh.warranty_info || ''
      });
    } else {
      setEditingVehicle(null);
      setVFormData({
        stock_id: `NEW-H-${Math.floor(10 + Math.random() * 89)}`,
        vehicle_type: 'NEW',
        brand: 'Brand X',
        model_name: 'Model H',
        variant: 'ZX Executive',
        year: 2026,
        fuel_type: 'PETROL',
        transmission: 'AUTOMATIC',
        body_type: 'SEDAN',
        color: 'Platinum White Pearl',
        color_hex: '#ECEEF1',
        ex_showroom_price: '1245000',
        availability: 'AVAILABLE',
        hero_image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        registration_number: '',
        odometer_km: '',
        owner_count: 1,
        is_certified: false,
        warranty_info: ''
      });
    }
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const payload: any = {
        ...vFormData,
        ex_showroom_price: parseFloat(vFormData.ex_showroom_price),
        odometer_km: vFormData.odometer_km ? parseInt(vFormData.odometer_km) : null,
      };

      if (editingVehicle) {
        await api.put(`/admin/vehicles/${editingVehicle.id}/`, payload);
        setSaveSuccessMsg(`Vehicle ${payload.stock_id} updated successfully.`);
      } else {
        await api.post('/admin/vehicles/', payload);
        setSaveSuccessMsg(`New vehicle ${payload.stock_id} added to inventory.`);
      }

      setVehicleModalOpen(false);
      fetchAllData();
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data ? JSON.stringify(err.response.data) : "Failed to save vehicle.");
    }
  };

  const handleDeleteVehicle = async (id: number, stockId: string) => {
    if (!window.confirm(`Are you sure you want to remove vehicle ${stockId} from inventory?`)) return;
    try {
      await api.delete(`/admin/vehicles/${id}/`);
      setSaveSuccessMsg(`Vehicle ${stockId} deleted from inventory.`);
      fetchAllData();
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("Failed to delete vehicle.");
    }
  };

  const handleOpenPricingModal = (rule?: OnRoadPrice) => {
    setErrorMsg(null);
    if (rule) {
      setEditingPricing(rule);
      setPFormData({
        vehicle: rule.vehicle,
        city: rule.city,
        ex_showroom_price: String(rule.ex_showroom_price),
        road_tax: String(rule.road_tax),
        insurance: String(rule.insurance),
        mandatory_accessories: String(rule.mandatory_accessories),
        registration_charges: String(rule.registration_charges),
        optional_warranty: String(rule.optional_warranty),
        valid_until: rule.valid_until,
        disclaimer: rule.disclaimer
      });
    } else {
      setEditingPricing(null);
      setPFormData({
        vehicle: vehicles[0]?.id || 0,
        city: cities[0]?.id || 0,
        ex_showroom_price: vehicles[0]?.ex_showroom_price || '1245000',
        road_tax: '124500',
        insurance: '45000',
        mandatory_accessories: '15000',
        registration_charges: '3500',
        optional_warranty: '0',
        valid_until: '2026-12-31',
        disclaimer: 'Prices are indicative for state RTO registration. Subject to formal dealership invoice date.'
      });
    }
    setPricingModalOpen(true);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const payload: any = {
        vehicle: Number(pFormData.vehicle),
        city: Number(pFormData.city),
        ex_showroom_price: parseFloat(pFormData.ex_showroom_price),
        road_tax: parseFloat(pFormData.road_tax),
        insurance: parseFloat(pFormData.insurance),
        mandatory_accessories: parseFloat(pFormData.mandatory_accessories),
        registration_charges: parseFloat(pFormData.registration_charges),
        optional_warranty: parseFloat(pFormData.optional_warranty),
        valid_until: pFormData.valid_until,
        disclaimer: pFormData.disclaimer
      };

      if (editingPricing) {
        await api.put(`/admin/pricing/${editingPricing.id}/`, payload);
        setSaveSuccessMsg(`Pricing for city updated. Changes reflect immediately on public vehicle pages!`);
      } else {
        await api.post('/admin/pricing/', payload);
        setSaveSuccessMsg(`New city pricing rule added.`);
      }

      setPricingModalOpen(false);
      fetchAllData();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data ? JSON.stringify(err.response.data) : "Failed to save pricing configuration.");
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] py-24 px-4 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-serif text-gray-900">Administrator Access Required</h2>
        <p className="text-xs text-gray-500 mt-2">
          Your current session does not have administrative privileges to access inventory and tariff configurations.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Banner */}
      <div className="bg-[#0B0F19] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E1B24] bg-red-950/80 border border-red-800 px-2 py-0.5 rounded">
                Authorized General Management
              </span>
              <span className="text-xs text-gray-400">Company A • Brand X Dealership Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              Dealership Operations & Pricing Admin
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Maintain new & used vehicle inventory, configure city-wise RTO on-road pricing truth, and supervise sales staff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-gray-300 font-mono">DB Source of Truth Active</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('VEHICLES')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition ${activeTab === 'VEHICLES' ? 'bg-[#0B0F19] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Car className="w-4 h-4" />
            <span>Vehicles & Inventory ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PRICING')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition ${activeTab === 'PRICING' ? 'bg-[#0B0F19] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <DollarSign className="w-4 h-4" />
            <span>City On-Road Tariffs ({pricingRules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SHOWROOMS')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition ${activeTab === 'SHOWROOMS' ? 'bg-[#0B0F19] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Building2 className="w-4 h-4" />
            <span>Showrooms & Yard ({showrooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CONSULTANTS')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition ${activeTab === 'CONSULTANTS' ? 'bg-[#0B0F19] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-4 h-4" />
            <span>Sales Staff & Load ({consultants.length})</span>
          </button>
        </div>

        {/* TAB 1: VEHICLES & INVENTORY */}
        {activeTab === 'VEHICLES' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900">Vehicle Stock Registry</h3>
                <p className="text-xs text-gray-500">Manage demo units, factory-fresh new vehicles, and certified pre-owned cars.</p>
              </div>
              <button
                onClick={() => handleOpenVehicleModal()}
                className="flex items-center gap-1.5 bg-[#9E1B24] hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-gray-500 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Stock ID</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Model & Variant</th>
                    <th className="py-3 px-3">Year / Fuel</th>
                    <th className="py-3 px-3">Ex-Showroom Price</th>
                    <th className="py-3 px-3">Stock Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">{v.stock_id}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.vehicle_type === 'USED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {v.vehicle_type === 'USED' ? 'Certified Used' : 'New Fleet'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {v.brand} {v.model_name} <span className="text-gray-500 font-normal">{v.variant}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {v.year} • {v.fuel_type} • {v.transmission}
                      </td>
                      <td className="py-3 px-3 font-bold font-mono text-gray-900">
                        ₹{Number(v.ex_showroom_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${v.availability === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {v.availability}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenVehicleModal(v)}
                          className="p-1 text-gray-500 hover:text-gray-900 transition"
                          title="Edit vehicle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id, v.stock_id)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                          title="Delete vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING CONFIGURATION (SOURCE OF TRUTH) */}
        {activeTab === 'PRICING' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900">
                  City-Specific On-Road Tariffs (Source of Truth)
                </h3>
                <p className="text-xs text-gray-500">
                  Road tax (RTO), Insurance, and Mandatory Accessories rules configured here immediately dictate prices on public vehicle pages.
                </p>
              </div>
              <button
                onClick={() => handleOpenPricingModal()}
                className="flex items-center gap-1.5 bg-[#9E1B24] hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pricing Rule</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-gray-500 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Vehicle Stock</th>
                    <th className="py-3 px-3">City / RTO</th>
                    <th className="py-3 px-3">Ex-Showroom</th>
                    <th className="py-3 px-3">RTO Road Tax</th>
                    <th className="py-3 px-3">Insurance</th>
                    <th className="py-3 px-3">Accessories & Fastag</th>
                    <th className="py-3 px-3">Total On-Road</th>
                    <th className="py-3 px-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pricingRules.map((rule) => {
                    const veh = vehicles.find(v => v.id === rule.vehicle);
                    return (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">
                          {veh ? `${veh.model_name} ${veh.variant}` : `Vehicle #${rule.vehicle}`}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-900">{rule.city_name}</span>{' '}
                          <span className="text-[10px] font-mono text-gray-500">({rule.city_rto})</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          ₹{Number(rule.ex_showroom_price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          ₹{Number(rule.road_tax).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          ₹{Number(rule.insurance).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          ₹{(Number(rule.mandatory_accessories) + Number(rule.registration_charges)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-bold font-mono text-[#9E1B24]">
                          ₹{Number(rule.total_on_road_price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenPricingModal(rule)}
                            className="p-1 text-gray-500 hover:text-gray-900 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SHOWROOMS & WORKSHOPS */}
        {activeTab === 'SHOWROOMS' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900">Company A Dealership Network</h3>
              <p className="text-xs text-gray-500">Authorized showrooms, master service centres, and certified used-car yard in Lucknow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showrooms.map((sr) => (
                <div key={sr.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 text-sm">{sr.name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                      {sr.showroom_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600">{sr.address}, {sr.city_name} — {sr.pincode}</p>
                  <p className="text-gray-500">Phone: {sr.phone} • {sr.opening_hours}</p>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    {sr.has_test_drive ? '✓ Demo Car Fleet Assigned' : '• Service Workshop Facility'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONSULTANTS & WORKLOAD */}
        {activeTab === 'CONSULTANTS' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900">Sales Consultant Lead Distribution</h3>
              <p className="text-xs text-gray-500">
                Incoming test drives and website leads are automatically routed via least-active-leads strategy.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-gray-500 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Consultant Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Active Pipeline Leads</th>
                    <th className="py-3 px-3">Auto-Assignment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consultants.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-semibold text-gray-900">{c.full_name || c.username}</td>
                      <td className="py-3 px-3 text-gray-600">{c.email}</td>
                      <td className="py-3 px-3 font-mono text-gray-600">{c.phone}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded">
                          {c.active_leads_count || 0} Open Leads
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          ACTIVE IN ROTATION
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* VEHICLE MODAL */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-base text-gray-900">
                {editingVehicle ? `Edit Vehicle (${editingVehicle.stock_id})` : 'Add Vehicle to Inventory'}
              </h3>
              <button onClick={() => setVehicleModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Stock ID *</label>
                  <input
                    type="text"
                    value={vFormData.stock_id}
                    onChange={(e) => setVFormData({ ...vFormData, stock_id: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-[#9E1B24]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Inventory Type</label>
                  <select
                    value={vFormData.vehicle_type}
                    onChange={(e) => setVFormData({ ...vFormData, vehicle_type: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="NEW">New 2026 Fleet</option>
                    <option value="USED">Certified Pre-Owned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Model Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Model H"
                    value={vFormData.model_name}
                    onChange={(e) => setVFormData({ ...vFormData, model_name: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Variant *</label>
                  <input
                    type="text"
                    placeholder="e.g. ZX CVT Automatic"
                    value={vFormData.variant}
                    onChange={(e) => setVFormData({ ...vFormData, variant: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    value={vFormData.year}
                    onChange={(e) => setVFormData({ ...vFormData, year: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Fuel Type</label>
                  <select
                    value={vFormData.fuel_type}
                    onChange={(e) => setVFormData({ ...vFormData, fuel_type: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Ex-Showroom Price (₹) *</label>
                  <input
                    type="number"
                    value={vFormData.ex_showroom_price}
                    onChange={(e) => setVFormData({ ...vFormData, ex_showroom_price: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Hero Image URL</label>
                <input
                  type="url"
                  value={vFormData.hero_image}
                  onChange={(e) => setVFormData({ ...vFormData, hero_image: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-xs"
                  required
                />
              </div>

              {vFormData.vehicle_type === 'USED' && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1">Registration No. (Masked for buyers)</label>
                      <input
                        type="text"
                        placeholder="e.g. UP32-AB-9821"
                        value={vFormData.registration_number}
                        onChange={(e) => setVFormData({ ...vFormData, registration_number: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Odometer (km)</label>
                      <input
                        type="number"
                        placeholder="e.g. 41200"
                        value={vFormData.odometer_km}
                        onChange={(e) => setVFormData({ ...vFormData, odometer_km: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#9E1B24] text-white font-semibold rounded hover:bg-red-800"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {pricingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-base text-gray-900">
                {editingPricing ? `Edit City Tariff (${editingPricing.city_name})` : 'Add City Pricing Tariff'}
              </h3>
              <button onClick={() => setPricingModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Target Vehicle *</label>
                  <select
                    value={pFormData.vehicle}
                    onChange={(e) => setPFormData({ ...pFormData, vehicle: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model_name} {v.variant}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">City / RTO *</label>
                  <select
                    value={pFormData.city}
                    onChange={(e) => setPFormData({ ...pFormData, city: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded p-2"
                    required
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.rto_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Ex-Showroom Price (₹) *</label>
                  <input
                    type="number"
                    value={pFormData.ex_showroom_price}
                    onChange={(e) => setPFormData({ ...pFormData, ex_showroom_price: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Road Tax (RTO) (₹) *</label>
                  <input
                    type="number"
                    value={pFormData.road_tax}
                    onChange={(e) => setPFormData({ ...pFormData, road_tax: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Insurance (1yr+3yr TP) (₹) *</label>
                  <input
                    type="number"
                    value={pFormData.insurance}
                    onChange={(e) => setPFormData({ ...pFormData, insurance: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Mandatory Accessories (₹)</label>
                  <input
                    type="number"
                    value={pFormData.mandatory_accessories}
                    onChange={(e) => setPFormData({ ...pFormData, mandatory_accessories: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">RTO Legal Disclaimer Text</label>
                <textarea
                  rows={2}
                  value={pFormData.disclaimer}
                  onChange={(e) => setPFormData({ ...pFormData, disclaimer: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPricingModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#9E1B24] text-white font-semibold rounded hover:bg-red-800"
                >
                  Save City Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
