import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lead, DashboardKPIs } from '../types';
import { 
  Users, Clock, CheckCircle2, AlertTriangle, AlertCircle, 
  Search, Filter, Calendar, Sparkles, ChevronRight, Phone, Mail, ShieldAlert
} from 'lucide-react';

export const ConsultantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchInbox();
  }, [statusFilter, priorityFilter, sourceFilter]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get<{ kpis: DashboardKPIs; leads: Lead[] }>(`/inbox/?${params.toString()}`);
      setLeads(res.data.leads || []);
      setKpis(res.data.kpis);
    } catch (err) {
      console.error("Error fetching lead inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInbox();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded text-[10px]">NEW</span>;
      case 'ASSIGNED':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded text-[10px]">ASSIGNED</span>;
      case 'CONTACTED':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[10px]">CONTACTED</span>;
      case 'TEST_DRIVE_SCHEDULED':
        return <span className="bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded text-[10px]">TEST DRIVE</span>;
      case 'WON':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px]">WON</span>;
      case 'LOST':
        return <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 rounded text-[10px]">CLOSED</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 font-medium px-2 py-0.5 rounded text-[10px]">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HOT':
        return <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px]">HOT</span>;
      case 'WARM':
        return <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">WARM</span>;
      default:
        return <span className="text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px]">NORMAL</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Banner */}
      <div className="bg-[#0B0F19] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                CRM Command Center
              </span>
              <span className="text-xs text-gray-400">
                {user?.role === 'ADMIN' ? 'All Dealership Leads' : `Assigned to: ${user?.full_name || user?.username}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              Lead Inbox & Response Monitor
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Track customer enquiries, monitor mandatory response timers, and generate personalized AI drafts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2.5 rounded-md transition"
              >
                Go to Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        {/* KPI Ribbon */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Assigned</span>
              <span className="text-2xl font-bold font-serif text-gray-900 mt-0.5 block">{kpis.total_assigned}</span>
              <span className="text-[10px] text-gray-500 mt-1 block">In your pipeline</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">New Enquiries</span>
              <span className="text-2xl font-bold font-serif text-blue-900 mt-0.5 block">{kpis.new_leads}</span>
              <span className="text-[10px] text-blue-500 mt-1 block">Awaiting outreach</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Pending Responses</span>
              <span className="text-2xl font-bold font-serif text-amber-900 mt-0.5 block">{kpis.pending_responses}</span>
              <span className="text-[10px] text-amber-600 font-medium mt-1 block">30 min SLA target</span>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm transition ${kpis.overdue_responses > 0 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${kpis.overdue_responses > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                  Overdue SLA Breaches
                </span>
                {kpis.overdue_responses > 0 && <ShieldAlert className="w-4 h-4 text-red-600" />}
              </div>
              <span className={`text-2xl font-bold font-serif mt-0.5 block ${kpis.overdue_responses > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                {kpis.overdue_responses}
              </span>
              <span className={`text-[10px] mt-1 block ${kpis.overdue_responses > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                {kpis.overdue_responses > 0 ? 'Immediate action required' : 'Zero SLA violations'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">Test Drives Booked</span>
              <span className="text-2xl font-bold font-serif text-teal-900 mt-0.5 block">{kpis.test_drive_scheduled}</span>
              <span className="text-[10px] text-teal-600 mt-1 block">Demo cars reserved</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Converted (Won)</span>
              <span className="text-2xl font-bold font-serif text-emerald-900 mt-0.5 block">{kpis.converted_leads}</span>
              <span className="text-[10px] text-emerald-600 mt-1 block">Orders booked</span>
            </div>
          </div>
        )}

        {/* Filter and Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 text-xs font-semibold">
              {['ALL', 'NEW', 'ASSIGNED', 'CONTACTED', 'TEST_DRIVE_SCHEDULED', 'WON', 'LOST'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md transition ${statusFilter === st ? 'bg-[#0B0F19] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {st === 'TEST_DRIVE_SCHEDULED' ? 'Test Drives' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search buyer, phone, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-gray-500">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-[#9E1B24] rounded-full animate-spin mb-2"></div>
              <p>Refreshing leads and response timers...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">No leads found in this view</p>
              <p className="text-xs text-gray-400">All enquiries have been responded to or match no current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-gray-500 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Lead Ref / Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Vehicle of Interest</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status & Priority</th>
                    <th className="py-3 px-4">Response SLA Timer</th>
                    <th className="py-3 px-4">Assigned Consultant</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr 
                      key={lead.id}
                      onClick={() => navigate(`/consultant/leads/${lead.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition"
                    >
                      {/* Ref & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 block">{lead.lead_reference}</span>
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 block">{lead.customer_name}</span>
                        <span className="text-[11px] text-gray-500 font-mono block">{lead.customer_phone}</span>
                      </td>

                      {/* Interested Vehicle */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800 block">{lead.vehicle_name}</span>
                        <span className="text-[10px] text-gray-400 block">{lead.customer_city}</span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {lead.source.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status & Priority */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div>{getStatusBadge(lead.status)}</div>
                        <div>{getPriorityBadge(lead.priority)}</div>
                      </td>

                      {/* Response SLA Timer */}
                      <td className="py-3.5 px-4">
                        {lead.first_response_at ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Responded in SLA</span>
                          </div>
                        ) : lead.is_response_overdue ? (
                          <div className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded font-bold text-[11px] animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>OVERDUE ({Math.abs(lead.response_timer_minutes_left || 0)}m)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded text-[11px] font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{lead.response_timer_minutes_left}m left</span>
                          </div>
                        )}
                      </td>

                      {/* Assigned Consultant */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-900 block">{lead.consultant_name || 'Unassigned'}</span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/consultant/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 bg-[#0B0F19] hover:bg-[#9E1B24] text-white text-[11px] font-semibold px-3 py-1.5 rounded transition"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>AI Assist</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
