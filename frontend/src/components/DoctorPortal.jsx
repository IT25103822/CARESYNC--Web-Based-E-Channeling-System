import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Stethoscope, Calendar, Clock, FileText, CheckCircle, AlertTriangle, 
  User, RefreshCw, Camera, Star, ChevronDown, ChevronUp, CheckCircle2, Activity,
  Printer, Search, Copy, Check, Eye, ShieldCheck, Phone, Filter
} from 'lucide-react';
import { formatDoctorId, formatPatientId } from '../utils/idUtils';
import { isPastDateTime, isSlotExpired, isSessionCompleted } from '../utils/dateUtils';
import DoctorLiveQueueConsole from './DoctorLiveQueueConsole';
import NotificationManager from './NotificationManager';
import PrescriptionSlipModal from './PrescriptionSlipModal';

export default function DoctorPortal({ activeSection, onSectionChange, currentUser }) {
  const doctorId = currentUser?.userId || 5;
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorFeedbacks, setDoctorFeedbacks] = useState([]);
  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Issued Prescriptions Inspector & Slip Modal state
  const [selectedPrescriptionForModal, setSelectedPrescriptionForModal] = useState(null);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [prescriptionDateFilter, setPrescriptionDateFilter] = useState('ALL');
  const [copiedRxId, setCopiedRxId] = useState(null);

  // Timeslots inspector state (Member 5)
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);
  const [scheduleSlotsMap, setScheduleSlotsMap] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Emergency leave state
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [leaveStatus, setLeaveStatus] = useState('ON_LEAVE');
  const [leaveReason, setLeaveReason] = useState('Urgent personal emergency / hospital duty');

  useEffect(() => {
    fetchDoctorData(doctorId);
  }, [doctorId]);

  const fetchDoctorData = async (targetDocId = doctorId) => {
    setRefreshing(true);
    try {
      const [docRes, schedRes, appRes, prescRes] = await Promise.allSettled([
        axios.get(`/api/doctors/${targetDocId}`),
        axios.get(`/api/schedules/doctor/${targetDocId}`),
        axios.get(`/api/appointments/doctor/${targetDocId}`),
        axios.get(`/api/doctors/prescriptions/doctor/${targetDocId}`)
      ]);

      if (docRes.status === 'fulfilled' && docRes.value.data?.data) {
        setDoctorInfo(docRes.value.data.data);
      }
      if (schedRes.status === 'fulfilled' && schedRes.value.data?.data) {
        setSchedules(schedRes.value.data.data || []);
      }
      if (appRes.status === 'fulfilled' && appRes.value.data?.data) {
        setAppointments(appRes.value.data.data || []);
      }
      if (prescRes.status === 'fulfilled' && prescRes.value.data?.data) {
        setPrescriptions(prescRes.value.data.data || []);
      }

      // 5. Patient Reviews & Feedbacks (Member 3)
      try {
        const fbRes = await axios.get(`/api/feedback/doctor/${targetDocId}`);
        if (fbRes.data?.success) {
          setDoctorFeedbacks(fbRes.data?.data || []);
        }
      } catch (fbErr) {
        console.warn('Feedback fetch error:', fbErr);
      }
    } catch (err) {
      console.error('Error fetching doctor data:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const toggleScheduleSlots = async (scheduleId) => {
    if (expandedScheduleId === scheduleId) {
      setExpandedScheduleId(null);
      return;
    }
    setExpandedScheduleId(scheduleId);
    if (!scheduleSlotsMap[scheduleId]) {
      setSlotsLoading(true);
      try {
        const res = await axios.get(`/api/schedules/${scheduleId}/timeslots`);
        if (res.data?.success) {
          setScheduleSlotsMap(prev => ({ ...prev, [scheduleId]: res.data?.data || [] }));
        }
      } catch (err) {
        console.error('Error loading timeslots:', err);
      } finally {
        setSlotsLoading(false);
      }
    }
  };

  // Doctor self-photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        try {
          setPhotoUploading(true);
          await axios.put(`/api/doctors/${doctorId}`, { profileImage: dataUrl });
          setDoctorInfo(prev => ({ ...prev, profileImage: dataUrl }));
          if (currentUser) currentUser.profileImage = dataUrl;
          alert('Profile picture updated successfully!');
        } catch (err) {
          alert('Failed to update profile picture.');
        } finally {
          setPhotoUploading(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAvailability = async (e) => {
    e.preventDefault();
    if (!selectedScheduleId) return;

    try {
      await axios.put('/api/schedules/availability', {
        scheduleId: parseInt(selectedScheduleId),
        status: leaveStatus,
        reason: leaveReason || 'Doctor marked emergency leave/availability update from portal',
      });
      alert(`Schedule status updated to ${leaveStatus}. Channeling Coordinator and affected patients have been notified automatically!`);
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionModal || !prescriptionText.trim()) return;

    try {
      await axios.post('/api/doctors/prescriptions', {
        appointmentId: prescriptionModal.appointmentId,
        doctorId: doctorId,
        patientId: prescriptionModal.patient.userId,
        details: prescriptionText,
      });
      alert('Prescription successfully recorded & appointment marked as COMPLETED!');
      setPrescriptionModal(null);
      setPrescriptionText('');
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error issuing prescription');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          {/* Doctor Avatar with Upload Capability */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center font-bold text-xl overflow-hidden shadow-md">
              {doctorInfo?.profileImage ? (
                <img src={doctorInfo.profileImage} alt={doctorInfo.fullName} className="w-full h-full object-cover" />
              ) : (
                <Stethoscope className="w-8 h-8 text-teal-200" />
              )}
            </div>
            <label 
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-2 border-white flex items-center justify-center cursor-pointer shadow transition group-hover:scale-105"
              title="Update Profile Picture"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
                disabled={photoUploading}
              />
            </label>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black">{doctorInfo?.fullName || 'Dr. Nuwan Jayawardena'}</span>
              <span className="bg-emerald-400/20 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-300/30 font-mono font-bold">
                {formatDoctorId(doctorInfo || doctorId)} • Verified Consultant
              </span>
              <span className="bg-amber-400/20 text-amber-200 text-xs px-2.5 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-1 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {doctorFeedbacks.length > 0 
                  ? (doctorFeedbacks.reduce((acc, curr) => acc + (curr.rating || 5), 0) / doctorFeedbacks.length).toFixed(1)
                  : '5.0'} Rating ({doctorFeedbacks.length} Reviews)
              </span>
            </div>
            <p className="text-emerald-100 text-sm mt-1">
              Specialization: {doctorInfo?.specialization} • License: {doctorInfo?.medicalLicenseNo} • Hospital: {doctorInfo?.hospitalAffiliation}
            </p>
          </div>
        </div>

        {/* Right side: Notification Manager & Refresh */}
        <div className="flex items-center gap-2.5">
          <NotificationManager currentUser={currentUser} onNavigate={onSectionChange} variant="banner" />
          <button
            type="button"
            onClick={() => fetchDoctorData(doctorId)}
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-white cursor-pointer"
            title="Refresh Doctor Portal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Portal'}</span>
          </button>
        </div>
      </div>

      {/* 1. CONSULTATION SESSIONS (activeSection === 'schedules') */}
      {(activeSection === 'schedules' || !activeSection) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                My Consultation Schedules ({schedules.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Click any session to inspect generated 20-minute timeslots and booking status.</p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full border border-teal-200">
              Upcoming Practice Sessions
            </span>
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No consultation sessions scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((s) => {
                const isExpanded = expandedScheduleId === s.scheduleId;
                const slots = scheduleSlotsMap[s.scheduleId] || s.timeslots || [];
                const bookedCount = slots.filter(sl => sl.slotStatus === 'BOOKED').length;
                const availCount = slots.filter(
                  sl => sl.slotStatus === 'AVAILABLE' && !isSlotExpired(s.scheduleDate, sl.slotTime, sl.slotEndTime, sl.slotStatus)
                ).length;
                const isCompleted = isSessionCompleted(s.scheduleDate, s.endTime, s.status);
                const effectiveStatus = (s.status === 'SCHEDULED' || s.status === 'FULLY_BOOKED') && isCompleted
                  ? 'COMPLETED'
                  : s.status;

                return (
                  <div key={s.scheduleId} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs">
                    <div 
                      onClick={() => toggleScheduleSlots(s.scheduleId)}
                      className="p-4 flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100/70 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{s.scheduleDate}</span>
                          <span className="text-slate-600 font-semibold">({s.startTime} - {s.endTime})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{s.hospitalLocation}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Max: <strong>{s.maxCapacity} slots</strong></span>
                          <span>Booked: <strong className="text-teal-700">{bookedCount}</strong></span>
                          <span>Available: <strong className="text-emerald-600">{availCount}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                          effectiveStatus === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          effectiveStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          effectiveStatus === 'ON_LEAVE' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {effectiveStatus}
                        </span>
                        <button 
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Timeslots Inspector (Member 5) */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 space-y-2.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-700">Live 20-Min Timeslot Roster:</span>
                          <span className="text-slate-400">{slots.length} Total Slots</span>
                        </div>
                        {slotsLoading && slots.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400">Loading timeslots...</div>
                        ) : slots.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400">No timeslots generated for this session.</div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {slots.map((sl) => {
                              const isExpired = isSlotExpired(s.scheduleDate, sl.slotTime, sl.slotEndTime, sl.slotStatus);
                              const displayStatus = (sl.slotStatus === 'AVAILABLE' && isExpired) ? 'EXPIRED' : sl.slotStatus;
                              return (
                                <div 
                                  key={sl.timeslotId || sl.slotNo}
                                  className={`p-2 rounded-xl text-center border text-[11px] font-semibold ${
                                    displayStatus === 'BOOKED'
                                      ? 'bg-teal-50 border-teal-200 text-teal-800'
                                      : displayStatus === 'AVAILABLE'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-70'
                                  }`}
                                >
                                  <div className="font-bold">Slot #{sl.slotNo}</div>
                                  <div className="text-[10px] font-mono">{sl.slotTime}</div>
                                  <span className={`text-[9px] uppercase tracking-wider block mt-0.5 font-bold ${displayStatus === 'EXPIRED' ? 'text-rose-500 not-italic' : ''}`}>
                                    {displayStatus}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Live Queue Action Bar */}
                    <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">Live Clinic Operations</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSectionChange) onSectionChange('live-queue');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Manage Live Queue & SMS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIVE QUEUE CONSOLE (activeSection === 'live-queue') */}
      {activeSection === 'live-queue' && (
        <DoctorLiveQueueConsole currentUser={currentUser} isCoordinator={false} />
      )}

      {/* 2. PATIENT CHANNELING LIST (activeSection === 'patients') */}
      {activeSection === 'patients' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Patient Channeling List ({appointments.length})
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
              Active Queue
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No patient bookings found for your scheduled sessions yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((app) => {
                const isPast = isPastDateTime(app.appointmentDate, app.endTime || app.startTime);
                const effectiveStatus = (app.appointmentStatus === 'CONFIRMED' || app.appointmentStatus === 'RESCHEDULED') && isPast
                  ? 'COMPLETED'
                  : (app.appointmentStatus === 'PENDING_PAYMENT' && isPast ? 'EXPIRED' : app.appointmentStatus);
                const isConcluded = effectiveStatus === 'COMPLETED' || effectiveStatus === 'EXPIRED';

                return (
                  <div key={app.appointmentId} className="py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs hover:bg-slate-50/60 p-2 rounded-xl transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{app.patient?.fullName}</span>
                        <span className="font-mono text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                          {formatPatientId(app.patient)}
                        </span>
                        <span className="text-slate-400">({app.patient?.gender}, Age: {app.patient?.age})</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                          Slot #{app.timeslot?.slotNo} ({app.startTime})
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        Contact: {app.patient?.contactNumber} • Blood Group: <span className="font-bold text-rose-600">{app.patient?.bloodGroup}</span> • Date: <span className="font-semibold text-slate-700">{app.appointmentDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        effectiveStatus === 'COMPLETED' ? 'bg-teal-100 text-teal-800' :
                        effectiveStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        effectiveStatus === 'EXPIRED' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {effectiveStatus}
                      </span>
                      {!isConcluded ? (
                        <button
                          onClick={() => setPrescriptionModal(app)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                        >
                          <FileText className="w-3.5 h-3.5" /> Issue Prescription
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs px-2 py-1">
                          <CheckCircle className="w-4 h-4" /> Concluded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. ISSUED PRESCRIPTIONS (activeSection === 'prescriptions') */}
      {activeSection === 'prescriptions' && (() => {
        const filteredPrescriptions = prescriptions.filter((p) => {
          if (prescriptionSearch) {
            const q = prescriptionSearch.toLowerCase().trim();
            const pName = (p.patient?.fullName || '').toLowerCase();
            const pNic = (p.patient?.nic || '').toLowerCase();
            const pPhone = (p.patient?.contactNumber || p.patient?.contactNo || '').toLowerCase();
            const pId = String(p.patient?.patientId || p.patient?.userId || '').toLowerCase();
            const rxId = `rx-${String(p.prescriptionId || '').padStart(4, '0')}`.toLowerCase();
            const details = (p.details || '').toLowerCase();
            if (!pName.includes(q) && !pNic.includes(q) && !pPhone.includes(q) && !pId.includes(q) && !rxId.includes(q) && !details.includes(q)) {
              return false;
            }
          }
          if (prescriptionDateFilter !== 'ALL' && p.issueDate) {
            const pDate = new Date(p.issueDate);
            const now = new Date();
            if (prescriptionDateFilter === 'TODAY') {
              if (pDate.toDateString() !== now.toDateString()) return false;
            } else if (prescriptionDateFilter === 'WEEK') {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (pDate < weekAgo) return false;
            } else if (prescriptionDateFilter === 'MONTH') {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (pDate < monthAgo) return false;
            }
          }
          return true;
        });

        const copyRxDetails = (p) => {
          const rxNo = `RX-${String(p.prescriptionId || '1').padStart(4, '0')}`;
          const txt = `CareSync Hospital Medical Prescription\nRx Number: ${rxNo}\nPatient: ${p.patient?.fullName || 'Patient'}\nDoctor: ${doctorInfo?.fullName || 'Dr. Consultant'}\nDate: ${p.issueDate}\n\nPRESCRIPTION & ADVICE:\n${p.details || ''}`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt);
            setCopiedRxId(p.prescriptionId);
            setTimeout(() => setCopiedRxId(null), 2000);
          }
        };

        const formatDateTime = (dateStr) => {
          if (!dateStr) return 'N/A';
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return String(dateStr);
          }
        };

        return (
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            {/* Header & Badges */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Issued Clinical Prescriptions & Rx Registry
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {prescriptions.length} Records
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete history of electronic medical prescriptions issued to your channeled patients
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full border border-slate-200">
                  CareSync Verified E-Prescriptions
                </span>
              </div>
            </div>

            {/* Filter & Live Search Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={prescriptionSearch}
                  onChange={(e) => setPrescriptionSearch(e.target.value)}
                  placeholder="Search by patient name, patient ID, phone, Rx number, or medicine..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
                {prescriptionSearch && (
                  <button
                    type="button"
                    onClick={() => setPrescriptionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={prescriptionDateFilter}
                    onChange={(e) => setPrescriptionDateFilter(e.target.value)}
                    className="pl-8 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="TODAY">Issued Today</option>
                    <option value="WEEK">Last 7 Days</option>
                    <option value="MONTH">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prescriptions Grid */}
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No Prescriptions Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {prescriptionSearch || prescriptionDateFilter !== 'ALL'
                    ? 'No issued prescriptions match your search query or date filter. Try clearing your filters.'
                    : 'No prescriptions have been issued yet. When you complete a channeling session and save a prescription, it will securely appear here.'}
                </p>
                {(prescriptionSearch || prescriptionDateFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => { setPrescriptionSearch(''); setPrescriptionDateFilter('ALL'); }}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPrescriptions.map((p) => {
                  const patient = p.patient || p.appointment?.patient || {};
                  const patientIdDisplay = formatPatientId(patient) || `PAT-${String(patient.userId || '0000').padStart(4, '0')}`;
                  const rxNo = `RX-${String(p.prescriptionId || '1').padStart(4, '0')}`;

                  return (
                    <div
                      key={p.prescriptionId}
                      className="rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all p-5 space-y-3.5 text-xs text-left"
                    >
                      {/* Card Header: Rx Badge, Date, Appt Token */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-black text-xs">
                            {rxNo}
                          </span>
                          {p.appointment && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                              Appt #{p.appointment.appointmentId} • Token #{p.appointment.timeslot?.queueNumber || p.appointment.queueNumber || '1'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(p.issueDate)}</span>
                        </div>
                      </div>

                      {/* Patient Demographics Box */}
                      <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                            {(patient.fullName || 'P').slice(0, 1)}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 text-sm">
                                {patient.fullName || 'Unknown Patient'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                                {patientIdDisplay}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                              {patient.age && <span>{patient.age} Yrs</span>}
                              {patient.gender && <span>• {patient.gender}</span>}
                              {patient.bloodGroup && (
                                <span>• Blood: <strong className="text-rose-600">{patient.bloodGroup}</strong></span>
                              )}
                              {patient.nic && <span>• NIC: {patient.nic}</span>}
                            </div>
                          </div>
                        </div>

                        {patient.contactNumber && (
                          <a
                            href={`tel:${patient.contactNumber}`}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 font-mono text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-2xs transition"
                            title="Call Patient"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{patient.contactNumber}</span>
                          </a>
                        )}
                      </div>

                      {/* Clinical Prescription Box (Rx) */}
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs">
                            <span className="font-serif italic text-base leading-none text-emerald-700 font-bold">℞</span>
                            <span>Prescribed Medication & Advice:</span>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                            Consultant Order
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap pl-1 bg-white p-2.5 rounded-lg border border-emerald-100">
                          {p.details}
                        </p>
                      </div>

                      {/* Card Actions: View/Print Rx Slip + Copy */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          CareSync Verified E-Prescription
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyRxDetails(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Copy prescription details"
                          >
                            {copiedRxId === p.prescriptionId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPrescriptionForModal(p)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                            title="View official prescription slip & print"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View / Print Rx Slip</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. EMERGENCY LEAVE / AVAILABILITY (activeSection === 'leave') */}
      {activeSection === 'leave' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Doctor Availability & Emergency Leave Desk
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mark a session as On Leave or Cancelled. All remaining open timeslots will be safely updated in the hospital booking registry.
            </p>
          </div>

          <form onSubmit={handleUpdateAvailability} className="space-y-4 text-xs">
            <div>
              <label className="text-xs font-bold text-slate-700">Select Schedule Session</label>
              <select
                required
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs"
              >
                <option value="">-- Choose Scheduled Session --</option>
                {schedules.map((s) => (
                  <option key={s.scheduleId} value={s.scheduleId}>
                    Schedule #{s.scheduleId} ({s.scheduleDate} - {s.startTime} at {s.hospitalLocation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Session Status</label>
              <select
                value={leaveStatus}
                onChange={(e) => setLeaveStatus(e.target.value)}
                className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs"
              >
                <option value="ON_LEAVE">Emergency Leave (ON_LEAVE)</option>
                <option value="SCHEDULED">Active Available (SCHEDULED)</option>
                <option value="CANCELLED">Cancel Session (CANCELLED)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Reason for Emergency Leave / Absence</label>
              <input
                type="text"
                required
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g. Sudden medical emergency, urgent surgery in hospital ward, sickness"
                className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This explanation will be immediately broadcast to the Channeling Coordinator & booked patients.
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow"
            >
              Update Session Availability
            </button>
          </form>
        </div>
      )}

      {/* 5. PATIENT REVIEWS & FEEDBACK (activeSection === 'feedback') */}
      {activeSection === 'feedback' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                Patient Reviews & Consult Feedback
              </h2>
              <p className="text-xs text-slate-500">
                Verified reviews and ratings submitted by patients following completed appointments (Member 3 - IT25103822)
              </p>
            </div>
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-amber-900 text-xs font-bold shadow-sm">
              <span className="text-lg font-black text-amber-600">
                {doctorFeedbacks.length > 0 
                  ? (doctorFeedbacks.reduce((acc, curr) => acc + (curr.rating || 5), 0) / doctorFeedbacks.length).toFixed(1)
                  : '5.0'}
              </span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                ))}
              </div>
              <span className="text-slate-500 font-normal">({doctorFeedbacks.length} Verified Reviews)</span>
            </div>
          </div>

          {doctorFeedbacks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No Patient Reviews Yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ratings and feedback submitted by patients who have completed appointments with you will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctorFeedbacks.map((fb) => (
                <div key={fb.feedbackId} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs">
                        {fb.patient?.fullName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">
                          {fb.patient?.fullName || 'Verified Patient'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {fb.submittedDate ? new Date(fb.submittedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                          {fb.appointment?.appointmentId && ` • Appointment #${fb.appointment.appointmentId}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-700 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{fb.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl italic border border-slate-100">
                    "{fb.comments || 'No comment provided by patient.'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRESCRIPTION MODAL */}
      {prescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Issue Medical Prescription for {prescriptionModal.patient.fullName}
              </span>
              <button onClick={() => setPrescriptionModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
              <div>Appointment ID: #{prescriptionModal.appointmentId} • Patient ID: <strong className="text-teal-800 font-mono">{formatPatientId(prescriptionModal.patient)}</strong></div>
              <div>Patient Age/Gender: {prescriptionModal.patient.age} / {prescriptionModal.patient.gender}</div>
              <div>Blood Group: {prescriptionModal.patient.bloodGroup}</div>
            </div>

            <form onSubmit={handleIssuePrescription} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Diagnosis & Medication Instructions</label>
                <textarea
                  rows="6"
                  required
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  placeholder="e.g. 1. Tab Paracetamol 500mg TDS x 3 days&#10;2. Tab Amoxicillin 500mg BD x 5 days&#10;Advice: Rest and drink plenty of fluids."
                  className="w-full p-3 mt-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-500 font-mono"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition"
              >
                Sign & Save Prescription
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Official Prescription Slip Modal */}
      {selectedPrescriptionForModal && (
        <PrescriptionSlipModal
          prescription={selectedPrescriptionForModal}
          onClose={() => setSelectedPrescriptionForModal(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
