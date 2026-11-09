import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Vehicle, Showroom } from '../types';
import { X, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Car, Shield } from 'lucide-react';

interface TestDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicleId?: number;
}

const TIME_SLOTS = [
  "10:00 AM - 11:00 AM",
  "11:30 AM - 12:30 PM",
  "02:00 PM - 03:00 PM",
  "04:00 PM - 05:00 PM",
  "05:30 PM - 06:30 PM"
];

export const TestDriveModal: React.FC<TestDriveModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicleId
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [vehicleId, setVehicleId] = useState<number | ''>(preselectedVehicleId || '');
  const [showroomId, setShowroomId] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    bookingReference: string;
    leadReference: string;
    consultant: string;
  } | null>(null);

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessData(null);
      setDate(minDateStr);
      fetchPrerequisites();
    }
  }, [isOpen, preselectedVehicleId]);

  const fetchPrerequisites = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        api.get<{ results?: Vehicle[] } | Vehicle[]>('/vehicles/'),
        api.get<{ results?: Showroom[] } | Showroom[]>('/showrooms/?type=SHOWROOM')
      ]);

      const vList = Array.isArray(vRes.data) ? vRes.data : (vRes.data.results || []);
      const sList = Array.isArray(sRes.data) ? sRes.data : (sRes.data.results || []);

      setVehicles(vList);
      setShowrooms(sList);

      if (preselectedVehicleId) {
        setVehicleId(preselectedVehicleId);
      } else if (vList.length > 0) {
        setVehicleId(vList[0].id);
      }

      if (sList.length > 0) {
        setShowroomId(sList[0].id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load available vehicles or showrooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleId || !showroomId || !date || !timeSlot || !name || !phone) {
      setErrorMsg("Please complete all mandatory contact, showroom and slot selections.");
      return;
    }

    if (!consent) {
      setErrorMsg("Please provide consent to book and process test-drive scheduling.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/test-drive/', {
        vehicle: vehicleId,
        showroom: showroomId,
        preferred_date: date,
        time_slot: timeSlot,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        notes: notes,
        consent_given: consent
      });

      setSuccessData({
        bookingReference: res.data.booking_reference,
        leadReference: res.data.lead_reference,
        consultant: res.data.assigned_consultant
      });
    } catch (err: any) {
      if (err.response?.data?.non_field_errors) {
        setErrorMsg(err.response.data.non_field_errors[0]);
      } else if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else if (typeof err.response?.data === 'object') {
        const firstKey = Object.keys(err.response.data)[0];
        const val = err.response.data[firstKey];
        setErrorMsg(Array.isArray(val) ? val[0] : String(val));
      } else {
        setErrorMsg("Unable to book test drive. Please verify your selected slot or contact the showroom.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-[#0B0F19] text-white p-6 flex justify-between items-start">
          <div>
            <span className="text-[10px] tracking-widest uppercase text-red-400 font-semibold">
              VIP Experience • Company A Brand X Lucknow
            </span>
            <h2 className="text-xl font-bold font-serif mt-1">Book an Exclusive Test Drive</h2>
            <p className="text-xs text-gray-400 mt-1">
              Select your preferred Brand X model, flagship showroom, and private driving window.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successData ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Test Drive Confirmed!</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Your reservation has been secured. Our demo vehicle will be prepped and sanitized for your visit.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Booking Reference:</span>
                  <span className="font-bold text-gray-900">{successData.bookingReference}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Lead Tracking Code:</span>
                  <span className="font-semibold text-gray-900">{successData.leadReference}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 font-medium">Dedicated Consultant:</span>
                  <span className="font-bold text-[#9E1B24]">{successData.consultant}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="bg-[#0B0F19] hover:bg-[#9E1B24] text-white text-xs font-semibold px-6 py-2.5 rounded-md transition"
                >
                  Close & Return to Showroom
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center text-sm text-gray-500">Loading showroom options...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vehicle Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Select Vehicle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={vehicleId}
                        onChange={(e) => setVehicleId(Number(e.target.value))}
                        className="w-full text-xs border border-gray-300 rounded-md p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
                        required
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} {v.model_name} {v.variant} ({v.year}) - ₹{Number(v.ex_showroom_price).toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Showroom Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Select Showroom <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={showroomId}
                        onChange={(e) => setShowroomId(Number(e.target.value))}
                        className="w-full text-xs border border-gray-300 rounded-md p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
                        required
                      >
                        {showrooms.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.address.split(',')[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={minDateStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-md p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
                        required
                      />
                    </div>

                    {/* Time Slot Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Available Time Slot <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-md p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
                        required
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-800 mb-2">Driver Contact Information</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-600 mb-1">Full Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ananya Dixit"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-[#9E1B24]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-600 mb-1">Mobile Phone *</label>
                        <input
                          type="tel"
                          placeholder="+91 94150..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-[#9E1B24]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-600 mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-[#9E1B24]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Specific Driving Preferences or Exchange Inquiries (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Want to test highway ADAS features, or bring current car for exchange appraisal"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-[#9E1B24]"
                    />
                  </div>

                  {/* Consent & Data Protection */}
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-500">
                    <input
                      type="checkbox"
                      id="td-consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 rounded text-[#9E1B24] focus:ring-[#9E1B24]"
                      required
                    />
                    <label htmlFor="td-consent" className="cursor-pointer">
                      I agree to the test-drive terms, confirm I hold a valid Indian driving license, and consent to Company A processing my details for appointment coordination.
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-[#9E1B24] hover:bg-red-800 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition shadow disabled:opacity-50"
                    >
                      {submitting ? 'Confirming Reservation...' : 'Confirm VIP Booking'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
