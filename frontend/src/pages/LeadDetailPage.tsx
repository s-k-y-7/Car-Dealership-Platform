import ReactMarkdown from 'react-markdown';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lead, LeadActivity } from '../types';
import { 
  ArrowLeft, Sparkles, Send, Copy, Check, Clock, AlertCircle, 
  CheckCircle2, Phone, Mail, MapPin, User, Car, MessageSquare, Shield, Info
} from 'lucide-react';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  // Status & Note mutation states
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  // AI Workspace states
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<{
    summary: string;
    provider: string;
    model: string;
    is_fallback: boolean;
  } | null>(null);
  const [aiDraftResult, setAiDraftResult] = useState<{
    draft: string;
    provider: string;
    model: string;
    is_fallback: boolean;
  } | null>(null);
  const [editableDraft, setEditableDraft] = useState<string>('');
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [draftLogged, setDraftLogged] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await api.get<Lead>(`/leads/${id}/`);
      setLead(res.data);
      setSelectedStatus(res.data.status);

      // Prepopulate AI results if previous AI interactions exist
      if (res.data.ai_interactions && res.data.ai_interactions.length > 0) {
        const lastSummary = res.data.ai_interactions.filter(i => i.action_type === 'SUMMARY').reverse()[0];
        if (lastSummary) {
          setAiSummaryResult({
            summary: lastSummary.response_text,
            provider: lastSummary.provider,
            model: lastSummary.model,
            is_fallback: lastSummary.is_fallback
          });
        }
        const lastDraft = res.data.ai_interactions.filter(i => i.action_type === 'FIRST_REPLY').reverse()[0];
        if (lastDraft) {
          setAiDraftResult({
            draft: lastDraft.response_text,
            provider: lastDraft.provider,
            model: lastDraft.model,
            is_fallback: lastDraft.is_fallback
          });
          setEditableDraft(lastDraft.response_text);
        }
      }
    } catch (err) {
      console.error("Error fetching lead:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch<Lead>(`/leads/${lead.id}/status/`, {
        status: newStatus,
        note: `Status updated by ${user?.full_name || user?.username}`
      });
      setLead(res.data);
      setSelectedStatus(res.data.status);
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/leads/${lead.id}/note/`, { note: newNote });
      setNewNote('');
      fetchLead(); // refresh activity list
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!lead) return;
    setAiSummaryLoading(true);
    try {
      const res = await api.post(`/leads/${lead.id}/ai-summary/`);
      setAiSummaryResult(res.data);
      fetchLead();
    } catch (err) {
      console.error("Error generating AI summary:", err);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!lead) return;
    setAiDraftLoading(true);
    try {
      const res = await api.post(`/leads/${lead.id}/ai-draft/`);
      setAiDraftResult(res.data);
      setEditableDraft(res.data.draft);
      setDraftLogged(false);
      fetchLead();
    } catch (err) {
      console.error("Error generating AI draft:", err);
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(editableDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleLogSentReply = async () => {
    if (!lead || !editableDraft.trim()) return;
    try {
      await api.post(`/leads/${lead.id}/note/`, {
        note: `[OUTBOUND FIRST REPLY SENT TO CUSTOMER via Consultant]:\n${editableDraft}`
      });
      // Mark lead as Contacted if still New/Assigned
      if (['NEW', 'ASSIGNED'].includes(lead.status)) {
        await handleStatusChange('CONTACTED');
      }
      setDraftLogged(true);
      fetchLead();
    } catch (err) {
      console.error("Error logging reply:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-[#9E1B24] rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading lead dossier & activity logs...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] py-20 px-4 text-center">
        <h2 className="text-xl font-bold font-serif text-gray-900">Lead Not Found</h2>
        <p className="text-xs text-gray-500 mt-2">You may not be authorized to view this lead, or it has been removed.</p>
        <Link to="/consultant/inbox" className="mt-4 inline-block text-xs font-semibold text-[#9E1B24] underline">
          Return to Lead Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/consultant/inbox"
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {lead.lead_reference}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase">
                  {lead.source.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-xl font-serif font-bold text-gray-900 mt-0.5">
                {lead.customer_name}
              </h1>
            </div>
          </div>

          {/* Quick Status Control */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500">Lead Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="text-xs font-semibold py-2 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
            >
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="CONTACTED">CONTACTED (Stops Timer)</option>
              <option value="TEST_DRIVE_SCHEDULED">TEST DRIVE SCHEDULED</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="WON">WON (Order Booked)</option>
              <option value="LOST">LOST (Closed)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 5 COLS: Customer Dossier, Vehicle Info, Activity Timeline */}
          <div className="lg:col-span-5 space-y-6">
            {/* Customer Contact & SLA Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Customer Profile
                </h3>
                {lead.first_response_at ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> First Response Logged
                  </span>
                ) : lead.is_response_overdue ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" /> SLA Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    <Clock className="w-3.5 h-3.5" /> {lead.response_timer_minutes_left}m remaining
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-800">
                  <Phone className="w-3.5 h-3.5 text-[#9E1B24]" />
                  <a href={`tel:${lead.customer_phone}`} className="font-mono font-semibold hover:underline">
                    {lead.customer_phone}
                  </a>
                </div>
                {lead.customer_email && (
                  <div className="flex items-center gap-2 text-gray-800">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`mailto:${lead.customer_email}`} className="hover:underline">
                      {lead.customer_email}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-800">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>City: {lead.customer_city}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Assigned Consultant: {lead.consultant_details?.full_name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Stated Notes / Requirements */}
              <div className="pt-3 border-t border-gray-100 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Customer Notes & Budget
                </span>
                <p className="text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-100 leading-relaxed">
                  {lead.requirements_notes || 'No custom notes provided by customer.'}
                </p>
                {lead.budget_range && (
                  <div className="mt-2 text-[11px] text-gray-600">
                    Stated Budget: <span className="font-semibold text-gray-900">{lead.budget_range}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle of Interest Card */}
            {lead.vehicle_details && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Vehicle of Interest
                </h3>
                <div className="flex gap-4 items-center">
                  <img
                    src={lead.vehicle_details.hero_image}
                    alt={lead.vehicle_details.model_name}
                    className="w-20 h-14 object-cover rounded-md border border-gray-200"
                  />
                  <div>
                    <h4 className="text-sm font-serif font-bold text-gray-900">
                      {lead.vehicle_details.brand} {lead.vehicle_details.model_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {lead.vehicle_details.variant} • {lead.vehicle_details.fuel_type} • {lead.vehicle_details.transmission}
                    </p>
                    <p className="text-xs font-bold text-[#9E1B24] mt-0.5">
                      ₹{Number(lead.vehicle_details.ex_showroom_price).toLocaleString('en-IN')} (Ex-showroom)
                    </p>
                  </div>
                </div>

                {lead.test_drive_booking && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs space-y-1 text-teal-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-teal-700" />
                      VIP Test Drive Scheduled
                    </div>
                    <p>Showroom: {lead.test_drive_booking.showroom_details?.name || 'Dealership Showroom'}</p>
                    <p>Date & Window: {lead.test_drive_booking.preferred_date} ({lead.test_drive_booking.time_slot})</p>
                    <p className="text-[10px] text-teal-700">Ref: {lead.test_drive_booking.booking_reference}</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity History & Note Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Activity History & CRM Notes
              </h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Log a call note or update on customer discussion..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9E1B24]"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="text-xs font-semibold px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-black transition disabled:opacity-40"
                >
                  {addingNote ? 'Saving...' : 'Add Note'}
                </button>
              </form>

              {/* Activity Timeline List */}
              <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
                {lead.activities && lead.activities.map((act) => (
                  <div key={act.id} className="text-xs border-l-2 border-[#9E1B24] pl-3 py-1 space-y-0.5">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span className="font-semibold text-gray-700">{act.activity_type.replace('_', ' ')}</span>
                      <span>{new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-gray-700 text-xs whitespace-pre-wrap">{act.details}</p>
                    {act.performer_name && (
                      <span className="text-[10px] text-gray-400">By {act.performer_name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: Dedicated AI Assistance Workspace */}
          <div className="lg:col-span-7 space-y-6">
            {/* AI Workspace Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#0B0F19] to-gray-900 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Brand X AI Dealership Copilot
                    </span>
                    <h2 className="text-xl font-serif font-bold text-white mt-1">
                      Enquiry Intelligence & Reply Drafter
                    </h2>
                    <p className="text-xs text-gray-300 mt-1">
                      Summarize buyer intent, highlight missing requirements, and generate an editable reply draft.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={aiSummaryLoading}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-lg backdrop-blur-md border border-white/20 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{aiSummaryLoading ? 'Analyzing Enquiry...' : '1. Summarize Requirements'}</span>
                  </button>

                  <button
                    onClick={handleGenerateDraft}
                    disabled={aiDraftLoading}
                    className="flex items-center gap-2 bg-[#9E1B24] hover:bg-red-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow transition disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{aiDraftLoading ? 'Composing Draft...' : '2. Generate First Reply Draft'}</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Notice on AI Transparency & Policy */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Dealership AI Compliance Guardrail:</span> All AI drafts are suggestions for the sales consultant to review and edit. AI never sends messages automatically and never invents unverified discounts or delivery dates.
                  </div>
                </div>

                {/* AI ACTION 1: Buyer Requirements Summary */}
                {aiSummaryResult && (
                  <div className="border border-gray-200 rounded-xl p-5 bg-[#FAFAFA] space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Buyer Requirements & Intent Analysis
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        {aiSummaryResult.provider}
                      </span>
                    </div>

                    <div className="text-xs text-gray-800 leading-relaxed font-sans bg-white p-4 rounded-lg border border-gray-200 shadow-sm prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          strong: ({ children }) => (
                            <strong className="font-bold text-gray-900">{children}</strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                        }}
                      >
                        {aiSummaryResult.summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* AI ACTION 2: Editable Personalized First-Reply Draft */}
                {aiDraftResult && (
                  <div className="border border-gray-200 rounded-xl p-5 bg-[#FAFAFA] space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#9E1B24]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Personalized First-Reply Draft (Editable Before Sending)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        {aiDraftResult.provider}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500">
                      Review and fine-tune the drafted response before sending to the customer via Email or WhatsApp.
                    </p>

                    <textarea
                      rows={10}
                      value={editableDraft}
                      onChange={(e) => setEditableDraft(e.target.value)}
                      className="w-full text-xs p-3.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#9E1B24] font-sans leading-relaxed"
                    />

                    <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCopyDraft}
                          className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition"
                        >
                          {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {draftLogged ? (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Logged to CRM & Timer Stopped!
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleLogSentReply}
                            className="flex items-center gap-2 px-5 py-2 bg-[#9E1B24] hover:bg-red-800 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition shadow"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Log as Sent First Reply</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!aiSummaryResult && !aiDraftResult && (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <Sparkles className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-xs font-medium text-gray-600">No AI analysis initiated for this lead yet.</p>
                    <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                      Click "1. Summarize Requirements" or "2. Generate First Reply Draft" to analyze this enquiry.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
