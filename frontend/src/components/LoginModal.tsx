import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { X, Shield, UserCheck, Key, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, demoLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(username, password);
      onClose();
    } catch {
      setErrorMsg("Invalid username or password. Please verify credentials or use a 1-click Demo Account below.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await demoLogin(role);
      onClose();
    } catch {
      setErrorMsg("Could not connect to authentication server. Please check backend status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-[#0B0F19] text-white p-6 flex justify-between items-start">
          <div>
            <span className="text-[10px] tracking-widest uppercase text-red-400 font-semibold">
              Authorized Portal
            </span>
            <h2 className="text-xl font-bold font-serif mt-1">Sign In to Dealership Suite</h2>
            <p className="text-xs text-gray-400 mt-1">
              Select a demo role or login with your authorized credentials.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-Click Quick Demo Accounts */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              1-Click Demo Profiles
            </p>
            <div className="grid grid-cols-1 gap-2">
              {/* Sales Consultant */}
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('CONSULTANT')}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#9E1B24] hover:bg-red-50/40 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    RV
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#9E1B24]">
                      Rohit Verma
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Senior Sales Consultant (Assigned Leads & AI Assistant)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#9E1B24] transition-transform group-hover:translate-x-1" />
              </button>

              {/* Administrator */}
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('ADMIN')}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#9E1B24] hover:bg-red-50/40 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    VS
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#9E1B24]">
                      Vikramaditya Singhania
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Dealership Administrator (Inventory, Pricing & All Leads)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#9E1B24] transition-transform group-hover:translate-x-1" />
              </button>

              {/* Buyer */}
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('BUYER')}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#9E1B24] hover:bg-red-50/40 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#9E1B24]">
                      Ananya Dixit
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Registered Buyer (Browsing & Test Drive History)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#9E1B24] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <hr className="w-full border-gray-200" />
            <span className="absolute bg-white px-2 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
              Or standard credentials
            </span>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleManualLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                placeholder="e.g. admin or rohit.verma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-[#9E1B24]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-[#9E1B24]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B0F19] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-md transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
