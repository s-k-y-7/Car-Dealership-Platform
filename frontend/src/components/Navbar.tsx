import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Car, ShieldCheck, Calendar, User as UserIcon, LogOut,
  MapPin, ChevronDown, LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  onOpenTestDrive: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTestDrive, onOpenLogin }) => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdown, setUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown on route change
  useEffect(() => {
    setUserDropdown(false);
  }, [location.pathname, location.search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserDropdown(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /**
   * Navigate to a section on the homepage.
   * If already on '/', scroll the section into view directly.
   * Otherwise navigate to '/?section=<id>' and let HomePage scroll on mount.
   */
  const goToSection = (sectionId: string, typeFilter?: string) => {
    if (location.pathname === '/') {
      // Already on homepage — apply filter param and scroll
      const params = new URLSearchParams(location.search);
      if (typeFilter) params.set('type', typeFilter);
      else params.delete('type');
      navigate({ pathname: '/', search: params.toString() }, { replace: true });
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('section', sectionId);
      navigate({ pathname: '/', search: params.toString() });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all shadow-sm">
      {/* Top Banner: Dealership Identity */}
      <div className="bg-[#0B0F19] text-gray-300 text-xs py-1.5 px-4 sm:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-white tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              COMPANY A — BRAND X AUTHORIZED DEALER
            </span>
            <span className="hidden md:inline text-gray-500">|</span>
            <span className="hidden md:flex items-center gap-1 text-gray-300">
              <MapPin className="w-3 h-3 text-[#9E1B24]" />
              Lucknow: 3 Showrooms • 2 Service Centres • 1 Certified Yard
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden lg:inline text-gray-400">Direct Sales & VIP Bookings:</span>
            <a href="tel:+915222614000" className="text-white hover:text-red-400 font-semibold transition">
              +91 (0522) 261-4000
            </a>
            {user ? (
              <div className="flex items-center gap-2 bg-gray-800/80 px-2.5 py-0.5 rounded border border-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-white font-medium capitalize">{user.role.toLowerCase()}: {user.full_name || user.username}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <span>Demo switch:</span>
                <button 
                  onClick={() => demoLogin('CONSULTANT')} 
                  className="text-gray-300 hover:text-white underline decoration-[#9E1B24] decoration-2"
                >
                  Consultant
                </button>
                <span>/</span>
                <button 
                  onClick={() => demoLogin('ADMIN')} 
                  className="text-gray-300 hover:text-white underline decoration-[#9E1B24] decoration-2"
                >
                  Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-[#0B0F19] text-white flex items-center justify-center font-serif text-xl font-bold tracking-wider shadow group-hover:bg-[#9E1B24] transition duration-300">
            BX
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#0B0F19] leading-tight font-serif uppercase">
              Brand X <span className="text-[#9E1B24] font-sans font-light text-sm ml-1 tracking-normal">Lucknow</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase text-gray-500 font-medium">
              Authorized Dealer • Company A
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          <button
            onClick={() => goToSection('showroom-inventory')}
            className="hover:text-[#9E1B24] transition flex items-center gap-1"
          >
            <Car className="w-4 h-4 text-gray-400" />
            Showroom & Inventory
          </button>
          <button
            onClick={() => goToSection('showrooms')}
            className="hover:text-[#9E1B24] transition flex items-center gap-1"
          >
            <MapPin className="w-4 h-4 text-gray-400" /> Dealership Locations
          </button>
        </div>

        {/* Actions & User Role Controls */}
        <div className="flex items-center gap-3">
          {/* If Consultant or Admin, show direct link to CRM/Admin dashboard */}
          {user?.role === 'CONSULTANT' && (
            <Link
              to="/consultant/inbox"
              className="flex items-center gap-2 bg-[#0B0F19] text-white text-xs font-semibold px-3.5 py-2 rounded-md hover:bg-black transition shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Lead Inbox CRM</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="flex items-center gap-2 bg-[#9E1B24] text-white text-xs font-semibold px-3.5 py-2 rounded-md hover:bg-red-800 transition shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
              <span>Admin Center</span>
            </Link>
          )}

          <button
            onClick={onOpenTestDrive}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-[#9E1B24] hover:to-red-800 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-md shadow transition duration-200"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Test Drive</span>
          </button>

          {/* User Account / Login Button */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition"
              >
                <UserIcon className="w-3.5 h-3.5 text-gray-600" />
                <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name || user.username}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-medium">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-[#9E1B24]">
                      {user.role} ROLE
                    </span>
                  </div>

                  {user.role === 'BUYER' && (
                    <Link
                      to="/my-account"
                      onClick={() => setUserDropdown(false)}
                      className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      My Account & Bookings
                    </Link>
                  )}

                  {user.role === 'CONSULTANT' && (
                    <Link
                      to="/consultant/inbox"
                      onClick={() => setUserDropdown(false)}
                      className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Consultant Lead Inbox
                    </Link>
                  )}

                  {user.role === 'ADMIN' && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Vehicle & Pricing Admin
                      </Link>
                      <Link
                        to="/consultant/inbox"
                        onClick={() => setUserDropdown(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        All Leads CRM View
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="text-xs font-semibold text-gray-800 hover:text-[#9E1B24] border border-gray-300 hover:border-[#9E1B24] px-3.5 py-2 rounded-md transition"
            >
              Sign In / Demo
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
