import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Headphones, MessageSquare, CheckCircle, Clock, RefreshCw, 
  X, AlertCircle, User, Phone, Calendar, ArrowRight, ShieldCheck, 
  FileText, Check, ChevronRight, Filter
} from 'lucide-react';
import { formatPatientId } from '../utils/idUtils';

export default function SupportPortal({ activeSection, onSectionChange, currentUser }) {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [detailModalComplaint, setDetailModalComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/complaints');
      if (res.data?.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenResolutionDesk = (complaint) => {
    setSelectedComplaint(complaint);
    setResolutionNotes(complaint.resolutionNotes || '');
    setResolutionStatus(
      complaint.complaintStatus === 'RESOLVED' || complaint.complaintStatus === 'CLOSED'
        ? complaint.complaintStatus
        : 'RESOLVED'
    );
    if (onSectionChange) {
      onSectionChange('resolution');
    }
  };

  const handleOpenDetailModal = (complaint) => {
    setDetailModalComplaint(complaint);
    setSelectedComplaint(complaint);
    setResolutionNotes(complaint.resolutionNotes || '');
    setResolutionStatus(
      complaint.complaintStatus === 'RESOLVED' || complaint.complaintStatus === 'CLOSED'
        ? complaint.complaintStatus
        : 'RESOLVED'
    );
  };

  const handleSaveResolution = async (complaintId, status, notes) => {
    if (!complaintId) return;
    if (!notes || notes.trim() === '') {
      alert('Please provide official resolution notes before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.put(`/api/complaints/${complaintId}/resolve`, {
        customerServiceId: currentUser?.userId || 4, // Malsha Wijeratne
        status: status,
        resolutionNotes: notes,
      });

      if (res.data?.success) {
        alert(`Ticket #${complaintId} successfully marked as ${status}!`);
        setDetailModalComplaint(null);
        setSelectedComplaint(null);
        setResolutionNotes('');
        await fetchComplaints();
        if (onSectionChange && activeSection === 'resolution') {
          onSectionChange('tickets');
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating complaint ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'ALL') return true;
    return c.complaintStatus === statusFilter;
  });

  const pendingCount = complaints.filter(c => c.complaintStatus === 'PENDING').length;
  const inProgressCount = complaints.filter(c => c.complaintStatus === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.complaintStatus === 'RESOLVED' || c.complaintStatus === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black">Customer Service & Patient Support</h1>
            <span className="bg-emerald-400/20 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-300/30">
              Executive: {currentUser?.fullName || 'Malsha Wijeratne'}
            </span>
          </div>
          <p className="text-emerald-100 text-sm mt-1">
            Patient Inquiry Resolution, Complaint Ticketing & Service Quality Tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchComplaints()}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh All Complaints"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-300' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          {onSectionChange && (
            <div className="flex bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => onSectionChange('tickets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeSection === 'tickets' || !activeSection ? 'bg-white text-teal-900 shadow' : 'text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Tickets ({complaints.length})
              </button>
              <button
                onClick={() => onSectionChange('resolution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeSection === 'resolution' ? 'bg-white text-teal-900 shadow' : 'text-white hover:bg-white/10'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" /> Resolution Desk
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            statusFilter === 'ALL' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase">Total Tickets</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{complaints.length}</div>
        </div>
        <div 
          onClick={() => setStatusFilter('PENDING')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            statusFilter === 'PENDING' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-rose-600 uppercase">Pending Review</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{pendingCount}</div>
        </div>
        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            statusFilter === 'IN_PROGRESS' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-amber-600 uppercase">Under Investigation</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</div>
        </div>
        <div 
          onClick={() => setStatusFilter('RESOLVED')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition shadow-sm ${
            statusFilter === 'RESOLVED' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-emerald-600 uppercase">Resolved & Closed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* 1. ALL SUPPORT TICKETS (activeSection === 'tickets') */}
      {(activeSection === 'tickets' || !activeSection) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Patient Support Tickets & Inquiries ({filteredComplaints.length})
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => fetchComplaints()}
                disabled={refreshing}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Refresh Complaints List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses ({complaints.length})</option>
                <option value="PENDING">Pending ({pendingCount})</option>
                <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
                <option value="RESOLVED">Resolved ({resolvedCount})</option>
              </select>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No complaint tickets match the selected status filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComplaints.map((c) => {
                const isResolved = c.complaintStatus === 'RESOLVED' || c.complaintStatus === 'CLOSED';
                return (
                  <div
                    key={c.complaintId}
                    onClick={() => handleOpenDetailModal(c)}
                    className={`p-4 rounded-xl cursor-pointer transition flex flex-col gap-2.5 border hover:shadow-md ${
                      selectedComplaint?.complaintId === c.complaintId
                        ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex justify-between items-start text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">Ticket #{c.complaintId}</span>
                        <span className="bg-white text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                          {c.complaintType}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.complaintStatus === 'PENDING' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        c.complaintStatus === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {c.complaintStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium bg-white p-3 rounded-lg border border-slate-200 line-clamp-3">
                      "{c.description}"
                    </p>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Patient: <strong className="text-slate-700">{c.patient?.fullName || 'Anonymous Patient'}</strong>{' '}
                        {c.patient && (
                          <span className="font-mono text-emerald-700 font-semibold text-[10px]">
                            ({formatPatientId(c.patient)})
                          </span>
                        )}{' '}
                        {c.patient?.contactNumber ? `(${c.patient.contactNumber})` : ''}
                      </span>
                      <span>{formatDate(c.dateSubmitted)}</span>
                    </div>

                    {c.resolutionNotes && (
                      <div className="text-[11px] bg-emerald-50 text-emerald-900 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold">Resolution:</span> {c.resolutionNotes}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium">Click card to view details</span>
                      <div className="flex items-center gap-2">
                        {isResolved ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailModal(c);
                            }}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition flex items-center gap-1 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Details
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResolutionDesk(c);
                            }}
                            className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-lg transition flex items-center gap-1 shadow-sm"
                          >
                            Open in Resolution Desk <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. TICKET RESOLUTION WORKFLOW (activeSection === 'resolution') */}
      {activeSection === 'resolution' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 max-w-2xl mx-auto">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-teal-600" />
              Ticket Resolution Desk
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchComplaints()}
                disabled={refreshing}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Refresh Complaints List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full border border-teal-200">
                Customer Grievance Handling
              </span>
            </div>
          </div>

          {/* Quick Ticket Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Select Ticket to Process</label>
            <select
              value={selectedComplaint?.complaintId || ''}
              onChange={(e) => {
                const found = complaints.find(c => String(c.complaintId) === e.target.value);
                setSelectedComplaint(found || null);
                if (found) {
                  setResolutionNotes(found.resolutionNotes || '');
                  setResolutionStatus(
                    found.complaintStatus === 'RESOLVED' || found.complaintStatus === 'CLOSED'
                      ? found.complaintStatus
                      : 'RESOLVED'
                  );
                }
              }}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-teal-500 bg-slate-50 focus:bg-white"
            >
              <option value="">-- Choose Ticket ({complaints.length} available) --</option>
              {complaints.map((c) => (
                <option key={c.complaintId} value={c.complaintId}>
                  Ticket #{c.complaintId}: [{c.complaintStatus}] {c.patient?.fullName || 'Patient'} ({formatPatientId(c.patient)}) - {c.complaintType}
                </option>
              ))}
            </select>
          </div>

          {selectedComplaint ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveResolution(selectedComplaint.complaintId, resolutionStatus, resolutionNotes);
              }} 
              className="space-y-4 text-xs pt-2"
            >
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-slate-900 text-sm">Reviewing Ticket #{selectedComplaint.complaintId}</div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedComplaint.complaintStatus === 'PENDING' ? 'bg-rose-100 text-rose-800' :
                    selectedComplaint.complaintStatus === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    Current: {selectedComplaint.complaintStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>Category: <strong className="text-slate-800">{selectedComplaint.complaintType}</strong></div>
                  <div>Submitted: <strong className="text-slate-800">{formatDate(selectedComplaint.dateSubmitted)}</strong></div>
                  <div>
                    Patient: <strong className="text-slate-800">{selectedComplaint.patient?.fullName}</strong>{' '}
                    {selectedComplaint.patient && (
                      <span className="font-mono text-emerald-700 font-semibold text-[10px]">
                        ({formatPatientId(selectedComplaint.patient)})
                      </span>
                    )}
                  </div>
                  <div>Contact: <strong className="text-slate-800">{selectedComplaint.patient?.contactNumber || 'N/A'}</strong></div>
                </div>
                <div className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mt-1 italic text-xs leading-relaxed">
                  "{selectedComplaint.description}"
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Set Updated Ticket Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-semibold text-slate-800 bg-white"
                >
                  <option value="IN_PROGRESS">Investigating (IN_PROGRESS)</option>
                  <option value="RESOLVED">Resolved (RESOLVED)</option>
                  <option value="CLOSED">Case Closed (CLOSED)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Resolution Notes & Customer Communication</label>
                <textarea
                  rows="4"
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document actions taken to rectify the patient inquiry, reschedule channeling slot, or process refund..."
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs leading-relaxed"
                ></textarea>
              </div>

              <div className="flex gap-2">
                {onSectionChange && (
                  <button
                    type="button"
                    onClick={() => onSectionChange('tickets')}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs"
                  >
                    Back to Tickets
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Save Ticket Resolution
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Select a complaint ticket from the dropdown above or click "Open in Resolution Desk" from the Tickets list.
            </div>
          )}
        </div>
      )}

      {/* 3. TICKET DETAILS & QUICK RESOLUTION MODAL */}
      {detailModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-slate-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">
                  #{detailModalComplaint.complaintId}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ticket Details & History</h3>
                  <span className="text-[10px] text-slate-400 font-medium">{detailModalComplaint.complaintType}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Info Card */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Patient:
                  </span>
                  <span className="font-bold text-slate-900">
                    {detailModalComplaint.patient?.fullName || 'Anonymous Patient'}{' '}
                    {detailModalComplaint.patient && (
                      <span className="font-mono text-emerald-700 font-semibold text-[10px]">
                        ({formatPatientId(detailModalComplaint.patient)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Phone:
                  </span>
                  <span className="font-semibold text-slate-800">{detailModalComplaint.patient?.contactNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Lodged On:
                  </span>
                  <span className="font-semibold text-slate-800">{formatDate(detailModalComplaint.dateSubmitted)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Current Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    detailModalComplaint.complaintStatus === 'PENDING' ? 'bg-rose-100 text-rose-800' :
                    detailModalComplaint.complaintStatus === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {detailModalComplaint.complaintStatus}
                  </span>
                </div>
              </div>

              {/* Grievance Statement */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Grievance / Inconvenience Statement:</label>
                <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100 text-slate-800 italic leading-relaxed">
                  "{detailModalComplaint.description}"
                </div>
              </div>

              {/* Resolution History if resolved */}
              {detailModalComplaint.resolutionNotes && (
                <div>
                  <label className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Recorded Resolution:
                  </label>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 leading-relaxed font-medium">
                    {detailModalComplaint.resolutionNotes}
                  </div>
                </div>
              )}

              {/* Quick Update Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="font-bold text-slate-700 block">
                  {detailModalComplaint.complaintStatus === 'RESOLVED' ? 'Update or Reopen Ticket:' : 'Quick Resolution:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Status</label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="RESOLVED">Resolved (RESOLVED)</option>
                      <option value="IN_PROGRESS">Investigating (IN_PROGRESS)</option>
                      <option value="CLOSED">Case Closed (CLOSED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Customer Support</label>
                    <div className="p-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 truncate">
                      {currentUser?.fullName || 'Support Desk'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Resolution Notes</label>
                  <textarea
                    rows="3"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter resolution actions or notes..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDetailModalComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <div className="flex gap-2">
                {onSectionChange && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalComplaint(null);
                      handleOpenResolutionDesk(detailModalComplaint);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-1"
                  >
                    Open Desk <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveResolution(detailModalComplaint.complaintId, resolutionStatus, resolutionNotes)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
