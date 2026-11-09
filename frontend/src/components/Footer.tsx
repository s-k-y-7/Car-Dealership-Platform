import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Award, Wrench } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B0F19] text-gray-400 text-sm border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#9E1B24] text-white flex items-center justify-center font-serif font-bold text-lg">
                BX
              </div>
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                BRAND X <span className="text-xs text-[#9E1B24] font-sans font-normal ml-1">LUCKNOW</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Company A is the authorized dealer for Brand X in Lucknow, managing three premier luxury showrooms, two master service workshops, and a state-of-the-art certified pre-owned evaluation yard.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-gray-300">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Excellence in Customer Experience 2025–2026</span>
            </div>
          </div>

          {/* Showroom Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-widest uppercase">Showrooms</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#9E1B24] shrink-0 mt-0.5" />
                <span>Hazratganj Flagship: Plot 14-16, M.G. Marg</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#9E1B24] shrink-0 mt-0.5" />
                <span>Gomti Nagar Experience: Vibhuti Khand (Opp. Hyatt)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#9E1B24] shrink-0 mt-0.5" />
                <span>Kanpur Road Showroom: Bargawan Metro Station</span>
              </li>
            </ul>
          </div>

          {/* Workshops & Yard */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-widest uppercase">Workshops & Yard</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Transport Nagar Mega Workshop: Phase 2 Ind. Area</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Alambagh Certified Yard & Workshop: VIP Road</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Mon – Sun: 09:30 AM – 08:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Direct Assistance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-widest uppercase">VIP Concierge</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sales Desk: +91 (0522) 261-4000</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>24x7 Roadside Assistance: 1800-BRANDX-UP</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>concierge@brandx-lucknow.com</span>
              </li>
            </ul>
            <div className="pt-2 text-[11px] text-gray-500">
              Prices published comply with Uttar Pradesh Transport Department guidelines.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Company A (Brand X Authorized Dealer). All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-400">
            <span>Privacy Policy</span>
            <span>Terms of Sale</span>
            <span>RTO Compliance Notice</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
