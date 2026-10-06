import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, PlusCircle, Search, RefreshCw, Edit3, XCircle, 
  BarChart3, TrendingUp, Users, CheckCircle2, Activity, Trash2, 
  AlertTriangle, Stethoscope, AlertCircle, Filter, Download, Printer, RotateCcw, FileText 
} from 'lucide-react';
import { formatDoctorId, formatPatientId } from '../utils/idUtils';
import { formatStandardTime, isPastDateTime, isSlotExpired, isSessionCompleted } from '../utils/dateUtils';
import Tooltip from './Tooltip';
import DoctorLiveQueueConsole from './DoctorLiveQueueConsole';

export default function CoordinatorPortal({ activeSection, onSectionChange, currentUser }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [sessionSearch, setSessionSearch] = useState('');
  const [reportFilter, setReportFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDatePreset, setBookingDatePreset] = useState('ALL');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [sessionDatePreset, setSessionDatePreset] = useState('ALL');
  const [sessionDateFilter, setSessionDateFilter] = useState('');

  // Create session modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newCapacity, setNewCapacity] = useState(10);
  const [newLocation, setNewLocation] = useState('Room 302, Asiri Central Hospital');

  // Custom timeslot generator & state
  const generateSlots = (startStr, endStr, capacity) => {
    const cap = Math.max(1, parseInt(capacity) || 1);
    if (!startStr || !endStr) return [];
    const [sH, sM] = startStr.split(':').map(Number);
    const [eH, eM] = endStr.split(':').map(Number);
    const totalStartMins = (sH || 0) * 60 + (sM || 0);
    const totalEndMins = (eH || 0) * 60 + (eM || 0);
    const diff = Math.max(cap, totalEndMins - totalStartMins);
    const step = Math.max(1, Math.floor(diff / cap));

    const slots = [];
    for (let i = 1; i <= cap; i++) {
      const slotStartMins = totalStartMins + (i - 1) * step;
      const slotEndMins = (i === cap) ? totalEndMins : (totalStartMins + i * step);

      const formatMins = (mins) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      slots.push({
        slotNo: i,
        startTime: formatMins(slotStartMins),
        endTime: formatMins(slotEndMins)
      });
    }
    return slots;
  };

  const [customSlots, setCustomSlots] = useState(() => generateSlots('09:00', '11:00', 10));

  const handleCapacityChange = (cap) => {
    setNewCapacity(cap);
    setCustomSlots(generateSlots(newStartTime, newEndTime, cap));
  };

  const handleStartTimeChange = (st) => {
    setNewStartTime(st);
    setCustomSlots(generateSlots(st, newEndTime, newCapacity));
  };

  const handleEndTimeChange = (et) => {
    setNewEndTime(et);
    setCustomSlots(generateSlots(newStartTime, et, newCapacity));
  };

  const handleSlotTimeChange = (index, field, value) => {
    setCustomSlots(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSlot = () => {
    const nextCap = parseInt(customSlots.length || newCapacity || 0) + 1;
    setNewCapacity(nextCap);
    setCustomSlots(prev => {
      const lastSlot = prev[prev.length - 1];
      let newStart = lastSlot ? lastSlot.endTime : newStartTime;
      let [h, m] = (newStart || '09:00').split(':').map(Number);
      let endMins = (h || 0) * 60 + (m || 0) + 15;
      let newEnd = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
      return [...prev, { slotNo: nextCap, startTime: newStart, endTime: newEnd }];
    });
  };

  const handleRemoveSlot = (index) => {
    if (customSlots.length <= 1) return;
    const nextSlots = customSlots.filter((_, i) => i !== index).map((s, i) => ({ ...s, slotNo: i + 1 }));
    setCustomSlots(nextSlots);
    setNewCapacity(nextSlots.length);
  };

  const handleResetSlots = () => {
    setCustomSlots(generateSlots(newStartTime, newEndTime, newCapacity));
  };

  // Edit session modal state
  const [editingSession, setEditingSession] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('11:00');
  const [editCapacity, setEditCapacity] = useState(10);
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('SCHEDULED');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reschedule modal state
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [rescheduleDoctorSchedules, setRescheduleDoctorSchedules] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const isDateMatching = (dateStr, preset, specificDate) => {
    if (!dateStr) return false;
    const cleanDate = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr).substring(0, 10);

    if (specificDate) {
      return cleanDate === specificDate;
    }

    if (!preset || preset === 'ALL') return true;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (preset === 'TODAY') {
      return cleanDate === todayStr;
    }
    if (preset === 'TOMORROW') {
      const tom = new Date(today);
      tom.setDate(tom.getDate() + 1);
      const tomStr = `${tom.getFullYear()}-${String(tom.getMonth() + 1).padStart(2, '0')}-${String(tom.getDate()).padStart(2, '0')}`;
      return cleanDate === tomStr;
    }
    if (preset === 'UPCOMING') {
      return cleanDate >= todayStr;
    }
    if (preset === 'PAST') {
      return cleanDate < todayStr;
    }
    return true;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [appRes, docRes, schedRes] = await Promise.allSettled([
        axios.get('/api/appointments'),
        axios.get('/api/doctors'),
        axios.get('/api/schedules').catch(() => axios.get('/api/schedules/upcoming'))
      ]);

      if (appRes.status === 'fulfilled' && appRes.value.data?.success) {
        setAppointments(appRes.value.data.data || []);
      }
      if (docRes.status === 'fulfilled' && docRes.value.data?.success) {
        setDoctors(docRes.value.data.data || []);
      }
      if (schedRes.status === 'fulfilled' && schedRes.value.data?.success) {
        setSchedules(schedRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching coordinator data:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const cap = customSlots.length > 0 ? customSlots.length : parseInt(newCapacity);
      const [sH, sM] = newStartTime.split(':').map(Number);
      const [eH, eM] = newEndTime.split(':').map(Number);
      const totalMinutes = Math.max(1, ((eH || 0) * 60 + (eM || 0)) - ((sH || 0) * 60 + (sM || 0)));
      const calculatedDuration = Math.max(1, Math.floor(totalMinutes / cap));

      await axios.post('/api/schedules', {
        doctorId: parseInt(newDoctorId),
        coordinatorId: currentUser?.userId || 2, // Kasun Fernando
        scheduleDate: newDate,
        startTime: newStartTime.length === 5 ? newStartTime + ':00' : newStartTime,
        endTime: newEndTime.length === 5 ? newEndTime + ':00' : newEndTime,
        maxCapacity: cap,
        hospitalLocation: newLocation,
        slotDurationMinutes: calculatedDuration,
        customSlots: customSlots.map(s => ({
          slotNo: s.slotNo,
          startTime: s.startTime.length === 5 ? s.startTime + ':00' : s.startTime,
          endTime: s.endTime.length === 5 ? s.endTime + ':00' : s.endTime
        }))
      });

      alert(`New consultation session created successfully with ${cap} customized timeslots!`);
      setShowSessionModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating consultation session');
    }
  };

  const renderTimeslotConfigurator = () => (
    <div className="pt-2 border-t border-slate-100 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            Timeslots Breakdown ({customSlots.length} Slots Generated)
          </label>
          <p className="text-[11px] text-slate-500">
            Number of slots matches Max Capacity ({customSlots.length}). Set custom start & end time for any slot:
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetSlots}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1 cursor-pointer"
            title="Auto-calculate and distribute evenly between start and end time"
          >
            <RefreshCw className="w-3 h-3 text-teal-600" /> Auto-Distribute
          </button>
          <button
            type="button"
            onClick={handleAddSlot}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition flex items-center gap-1 cursor-pointer"
            title="Add another slot to this session"
          >
            <PlusCircle className="w-3 h-3 text-teal-600" /> + Add Slot
          </button>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/70">
        {customSlots.map((slot, index) => {
          const durationMins = (() => {
            if (!slot.startTime || !slot.endTime) return 0;
            const [sH, sM] = slot.startTime.split(':').map(Number);
            const [eH, eM] = slot.endTime.split(':').map(Number);
            return Math.max(0, (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0)));
          })();

          return (
            <div
              key={slot.slotNo}
              className="flex items-center gap-2 p-1.5 sm:p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs"
            >
              <span className="w-16 font-bold text-slate-700 shrink-0 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-center">
                Slot #{slot.slotNo}
              </span>

              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="flex-1">
                  <input
                    type="time"
                    required
                    value={slot.startTime}
                    onChange={(e) => handleSlotTimeChange(index, 'startTime', e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-teal-500 bg-white"
                    title="Slot Start Time"
                  />
                </div>
                <span className="text-slate-400 font-bold text-[11px] shrink-0">to</span>
                <div className="flex-1">
                  <input
                    type="time"
                    required
                    value={slot.endTime}
                    onChange={(e) => handleSlotTimeChange(index, 'endTime', e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-teal-500 bg-white"
                    title="Slot End Time"
                  />
                </div>
              </div>

              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md shrink-0 border border-teal-100 font-mono">
                {durationMins}m
              </span>

              <button
                type="button"
                onClick={() => handleRemoveSlot(index)}
                disabled={customSlots.length <= 1}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 ${
                  customSlots.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Remove this slot"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleCancel = async (id) => {
    if (!window.confirm(`Cancel Appointment #${id}? This will release the timeslot.`)) return;
    try {
      await axios.put(`/api/appointments/${id}/cancel`);
      alert('Appointment cancelled.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDeleteAppointment = async (app) => {
    const id = app.appointmentId;
    const patientName = app.patient?.fullName || 'the patient';
    const confirmMsg = `Are you sure you want to PERMANENTLY DELETE Appointment #${id} for ${patientName}?\n\nThis will completely purge the booking and its associated records from the database. This action is irreversible. Proceed?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await axios.delete(`/api/appointments/${id}`);
      alert(res.data?.message || `Appointment #${id} permanently deleted successfully.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting appointment');
    }
  };

  const openReschedule = async (app) => {
    setRescheduleAppointment(app);
    try {
      const res = await axios.get(`/api/schedules/doctor/${app.doctor.userId}`);
      if (res.data.success) {
        setRescheduleDoctorSchedules(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeReschedule = async () => {
    if (!selectedNewSlot) {
      alert('Please select a target timeslot.');
      return;
    }

    if (isSlotExpired(selectedNewSlot.schedule?.scheduleDate, selectedNewSlot.slotTime, selectedNewSlot.slotEndTime, selectedNewSlot.slotStatus)) {
      alert('Cannot reschedule: The selected timeslot has already expired.');
      return;
    }

    try {
      await axios.put(`/api/appointments/${rescheduleAppointment.appointmentId}/reschedule`, {
        newScheduleId: selectedNewSlot.schedule.scheduleId,
        newTimeslotId: selectedNewSlot.timeslotId,
        newAppointmentDate: selectedNewSlot.schedule.scheduleDate,
        newStartTime: selectedNewSlot.slotTime,
        newEndTime: selectedNewSlot.slotTime,
      });

      alert('Appointment successfully rescheduled!');
      setRescheduleAppointment(null);
      setSelectedNewSlot(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rescheduling');
    }
  };

  const handleOpenEditSession = (session) => {
    setEditingSession(session);
    setEditDate(session.scheduleDate || '');
    setEditStartTime(session.startTime ? session.startTime.substring(0, 5) : '09:00');
    setEditEndTime(session.endTime ? session.endTime.substring(0, 5) : '11:00');
    setEditCapacity(session.maxCapacity || 10);
    setEditLocation(session.hospitalLocation || '');
    setEditStatus(session.status || session.sessionStatus || 'SCHEDULED');
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    if (!editingSession) return;
    setSavingEdit(true);
    try {
      await axios.put(`/api/schedules/${editingSession.scheduleId}`, {
        scheduleDate: editDate,
        startTime: editStartTime.length === 5 ? editStartTime + ':00' : editStartTime,
        endTime: editEndTime.length === 5 ? editEndTime + ':00' : editEndTime,
        maxCapacity: parseInt(editCapacity),
        hospitalLocation: editLocation,
        status: editStatus,
        sessionStatus: editStatus
      });
      alert('Consultation session updated successfully!');
      setEditingSession(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating consultation session');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReactivateSession = async (session) => {
    if (!window.confirm(`Reactivate Doctor Session #${session.scheduleId} for Dr. ${session.doctor?.fullName || ''}?\n\nThis will restore the session status to SCHEDULED and reopen all unbooked timeslots for patient bookings.`)) return;

    try {
      await axios.put(`/api/schedules/${session.scheduleId}`, {
        scheduleDate: session.scheduleDate,
        startTime: session.startTime,
        endTime: session.endTime,
        maxCapacity: session.maxCapacity,
        hospitalLocation: session.hospitalLocation,
        status: 'SCHEDULED',
        sessionStatus: 'SCHEDULED'
      });
      alert(`Session #${session.scheduleId} has been successfully reactivated! Unbooked timeslots are now open for patient bookings.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error reactivating consultation session');
    }
  };

  const handleDeleteSession = async (session) => {
    const rawStatus = session.status || session.sessionStatus || 'SCHEDULED';
    if (rawStatus === 'CANCELLED') {
      alert(`Session #${session.scheduleId} is already CANCELLED.\n\nHistorical records are preserved for patient care and financial audit compliance. If you wish to restore this session, click the "Reactivate" button.`);
      return;
    }

    const isBooked = (session.currentBookings || 0) > 0;
    const confirmMsg = isBooked
      ? `Session #${session.scheduleId} has ${session.currentBookings} booked patient(s).\n\nTo preserve medical and billing audit records, this session will be marked as CANCELLED and any unbooked timeslots will be closed. Proceed?`
      : `Are you sure you want to permanently delete Session #${session.scheduleId} and all generated timeslots?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await axios.delete(`/api/schedules/${session.scheduleId}`);
      alert(res.data?.message || 'Session deleted or cancelled successfully.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting consultation session');
    }
  };

  const handleExportCSV = (dataToExport) => {
    const list = dataToExport || schedules;
    if (list.length === 0) {
      alert('No sessions available to export.');
      return;
    }
    const headers = ['Session ID', 'Doctor Name', 'Doctor ID', 'Specialization', 'Date', 'Start Time', 'End Time', 'Hospital Location', 'Bookings', 'Capacity', 'Utilization', 'Status'];
    const rows = list.map(s => {
      const cap = s.maxCapacity || 10;
      const booked = s.currentBookings || 0;
      const pct = Math.min(100, Math.round((booked / cap) * 100));
      const raw = s.status || s.sessionStatus || 'SCHEDULED';
      const isComp = isSessionCompleted(s.scheduleDate, s.endTime, raw);
      const eff = (raw === 'SCHEDULED' || raw === 'FULLY_BOOKED') && isComp ? 'COMPLETED' : raw;
      return [
        s.scheduleId,
        `"${(s.doctor?.fullName || '').replace(/"/g, '""')}"`,
        formatDoctorId(s.doctor),
        `"${(s.doctor?.specialization || '').replace(/"/g, '""')}"`,
        s.scheduleDate,
        s.startTime,
        s.endTime,
        `"${(s.hospitalLocation || '').replace(/"/g, '""')}"`,
        booked,
        cap,
        `"${pct}%"`,
        eff
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `doctor_channeling_manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Appointments for All Hospital Bookings
  const filteredAppointments = appointments.filter(app => {
    if (bookingFilter !== 'ALL' && app.appointmentStatus !== bookingFilter) return false;
    if (!isDateMatching(app.appointmentDate, bookingDatePreset, bookingDateFilter)) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase().trim();
      const pName = (app.patient?.fullName || '').toLowerCase();
      const pContact = (app.patient?.contactNumber || '').toLowerCase();
      const dName = (app.doctor?.fullName || '').toLowerCase();
      const idStr = String(app.appointmentId);
      if (!pName.includes(q) && !pContact.includes(q) && !dName.includes(q) && !idStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Filtered Schedules for Doctor Sessions & Leaves
  const filteredSchedules = schedules.filter(s => {
    const rawStatus = s.status || s.sessionStatus || 'SCHEDULED';
    const isCompleted = isSessionCompleted(s.scheduleDate, s.endTime, rawStatus);
    const effectiveStatus = (rawStatus === 'SCHEDULED' || rawStatus === 'FULLY_BOOKED') && isCompleted
      ? 'COMPLETED'
      : rawStatus;
    if (sessionFilter === 'SCHEDULED' && !(effectiveStatus === 'SCHEDULED' && !isCompleted)) return false;
    if (sessionFilter === 'COMPLETED' && !(effectiveStatus === 'COMPLETED' || isCompleted)) return false;
    if (sessionFilter !== 'ALL' && sessionFilter !== 'SCHEDULED' && sessionFilter !== 'COMPLETED' && effectiveStatus !== sessionFilter) return false;

    if (!isDateMatching(s.scheduleDate, sessionDatePreset, sessionDateFilter)) return false;

    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase().trim();
      const docName = (s.doctor?.fullName || '').toLowerCase();
      const spec = (s.doctor?.specialization || '').toLowerCase();
      const loc = (s.hospitalLocation || '').toLowerCase();
      const idStr = String(s.scheduleId);
      if (!docName.includes(q) && !spec.includes(q) && !loc.includes(q) && !idStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">Channeling Operations Dashboard</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Officer: {currentUser?.fullName || 'Kasun Fernando'} • Channeling Coordination & Daily Appointment Logistics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Tooltip text="Refresh hospital bookings, schedules, and live status from server">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </Tooltip>
          <button
            onClick={() => setShowSessionModal(true)}
            className="bg-white text-teal-900 hover:bg-teal-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Doctor Session
          </button>
        </div>
      </div>


      {/* 1. ALL HOSPITAL BOOKINGS (activeSection === 'all-bookings') */}
      {(activeSection === 'all-bookings' || !activeSection) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              All Hospital Bookings ({appointments.length})
            </h2>
            <div className="flex items-center gap-2">
              <Tooltip text="Refresh all bookings immediately">
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={refreshing}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </Tooltip>
              <span className="text-xs bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full border border-teal-200">
                Live Registry
              </span>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setBookingFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  bookingFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter('CONFIRMED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  bookingFilter === 'CONFIRMED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Confirmed ({appointments.filter(a => a.appointmentStatus === 'CONFIRMED').length})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter('RESCHEDULED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  bookingFilter === 'RESCHEDULED'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Rescheduled ({appointments.filter(a => a.appointmentStatus === 'RESCHEDULED').length})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  bookingFilter === 'COMPLETED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                Completed ({appointments.filter(a => a.appointmentStatus === 'COMPLETED').length})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  bookingFilter === 'CANCELLED'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancelled ({appointments.filter(a => a.appointmentStatus === 'CANCELLED').length})
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search patient, doctor, booking #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition"
              />
              {bookingSearch && (
                <button
                  type="button"
                  onClick={() => setBookingSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Date Filtering Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Date:
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1 font-semibold text-[11px]">
                <button
                  type="button"
                  onClick={() => { setBookingDatePreset('ALL'); setBookingDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    bookingDatePreset === 'ALL' && !bookingDateFilter
                      ? 'bg-white text-teal-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  onClick={() => { setBookingDatePreset('TODAY'); setBookingDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    bookingDatePreset === 'TODAY' && !bookingDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => { setBookingDatePreset('TOMORROW'); setBookingDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    bookingDatePreset === 'TOMORROW' && !bookingDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => { setBookingDatePreset('UPCOMING'); setBookingDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    bookingDatePreset === 'UPCOMING' && !bookingDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => { setBookingDatePreset('PAST'); setBookingDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    bookingDatePreset === 'PAST' && !bookingDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Past
                </button>
              </div>

              {/* Exact Date Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-slate-500 font-semibold">Pick Date:</span>
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => {
                    setBookingDateFilter(e.target.value);
                    if (e.target.value) setBookingDatePreset('CUSTOM');
                    else setBookingDatePreset('ALL');
                  }}
                  className="bg-transparent text-xs text-slate-800 font-medium outline-none cursor-pointer"
                />
                {bookingDateFilter && (
                  <button
                    type="button"
                    onClick={() => { setBookingDateFilter(''); setBookingDatePreset('ALL'); }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-1 cursor-pointer"
                    title="Clear selected date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Count & Reset */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                Showing <strong className="text-slate-900">{filteredAppointments.length}</strong> of <strong className="text-slate-900">{appointments.length}</strong>
              </span>
              {(bookingDatePreset !== 'ALL' || bookingDateFilter || bookingFilter !== 'ALL' || bookingSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingFilter('ALL');
                    setBookingSearch('');
                    setBookingDatePreset('ALL');
                    setBookingDateFilter('');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Patient</th>
                  <th className="py-3 px-3">Doctor & Specialization</th>
                  <th className="py-3 px-3">Date & Slot Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700 text-sm">No hospital bookings match criteria</span>
                        <span className="text-xs text-slate-400">
                          Try adjusting your date filter ({bookingDatePreset !== 'ALL' ? bookingDatePreset : 'selected date'}), status, or search query.
                        </span>
                        {(bookingDatePreset !== 'ALL' || bookingDateFilter || bookingFilter !== 'ALL' || bookingSearch) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBookingFilter('ALL');
                              setBookingSearch('');
                              setBookingDatePreset('ALL');
                              setBookingDateFilter('');
                            }}
                            className="mt-1 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-bold text-xs transition cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((app) => (
                    <tr key={app.appointmentId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">#{app.appointmentId}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{app.patient?.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          <span className="font-mono text-emerald-700 font-semibold">{formatPatientId(app.patient)}</span>
                          {app.patient?.contactNumber ? ` • ${app.patient.contactNumber}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {app.doctor?.fullName} <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{formatDoctorId(app.doctor)}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700">{app.doctor?.specialization}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-700">{app.appointmentDate}</div>
                        <div className="text-[11px] text-slate-500">{app.startTime} (Slot #{app.timeslot?.slotNo})</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.appointmentStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          app.appointmentStatus === 'RESCHEDULED' ? 'bg-amber-100 text-amber-800' :
                          app.appointmentStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.appointmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {app.appointmentStatus !== 'CANCELLED' && app.appointmentStatus !== 'COMPLETED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReschedule(app)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold border border-teal-200 transition text-xs cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(app.appointmentId)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <Tooltip text="Permanently delete this booking record from the database">
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(app)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white font-semibold border border-red-200 hover:border-red-600 transition inline-flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTOR SESSIONS & LEAVES MANAGEMENT (activeSection === 'sessions') */}
      {activeSection === 'sessions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-black text-slate-900">
                  Doctor Consultation Sessions & Schedules ({schedules.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Channeling Coordinator full operational control: modify session timings, adjust capacities, edit rooms, or safely cancel schedules.
              </p>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setSessionFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  sessionFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sessions ({schedules.length})
              </button>
              <button
                onClick={() => setSessionFilter('SCHEDULED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  sessionFilter === 'SCHEDULED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Active / Scheduled ({schedules.filter(s => {
                  const raw = s.status || s.sessionStatus || 'SCHEDULED';
                  return raw === 'SCHEDULED' && !isSessionCompleted(s.scheduleDate, s.endTime, raw);
                }).length})
              </button>
              <button
                onClick={() => setSessionFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  sessionFilter === 'COMPLETED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                Completed ({schedules.filter(s => {
                  const raw = s.status || s.sessionStatus || 'SCHEDULED';
                  return raw === 'COMPLETED' || isSessionCompleted(s.scheduleDate, s.endTime, raw);
                }).length})
              </button>
              <button
                onClick={() => setSessionFilter('ON_LEAVE')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  sessionFilter === 'ON_LEAVE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Emergency Leaves ({schedules.filter(s => (s.status === 'ON_LEAVE' || s.sessionStatus === 'ON_LEAVE')).length})
              </button>
              <button
                onClick={() => setSessionFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  sessionFilter === 'CANCELLED'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancelled ({schedules.filter(s => (s.status === 'CANCELLED' || s.sessionStatus === 'CANCELLED')).length})
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Search Doctor, Specialty, Room..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition"
              />
              {sessionSearch && (
                <button
                  type="button"
                  onClick={() => setSessionSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Date Filtering Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Date:
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1 font-semibold text-[11px]">
                <button
                  type="button"
                  onClick={() => { setSessionDatePreset('ALL'); setSessionDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    sessionDatePreset === 'ALL' && !sessionDateFilter
                      ? 'bg-white text-teal-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  onClick={() => { setSessionDatePreset('TODAY'); setSessionDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    sessionDatePreset === 'TODAY' && !sessionDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => { setSessionDatePreset('TOMORROW'); setSessionDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    sessionDatePreset === 'TOMORROW' && !sessionDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => { setSessionDatePreset('UPCOMING'); setSessionDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    sessionDatePreset === 'UPCOMING' && !sessionDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => { setSessionDatePreset('PAST'); setSessionDateFilter(''); }}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    sessionDatePreset === 'PAST' && !sessionDateFilter
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  Past
                </button>
              </div>

              {/* Exact Date Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-slate-500 font-semibold">Pick Date:</span>
                <input
                  type="date"
                  value={sessionDateFilter}
                  onChange={(e) => {
                    setSessionDateFilter(e.target.value);
                    if (e.target.value) setSessionDatePreset('CUSTOM');
                    else setSessionDatePreset('ALL');
                  }}
                  className="bg-transparent text-xs text-slate-800 font-medium outline-none cursor-pointer"
                />
                {sessionDateFilter && (
                  <button
                    type="button"
                    onClick={() => { setSessionDateFilter(''); setSessionDatePreset('ALL'); }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-1 cursor-pointer"
                    title="Clear selected date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Count & Reset */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                Showing <strong className="text-slate-900">{filteredSchedules.length}</strong> of <strong className="text-slate-900">{schedules.length}</strong>
              </span>
              {(sessionDatePreset !== 'ALL' || sessionDateFilter || sessionFilter !== 'ALL' || sessionSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setSessionFilter('ALL');
                    setSessionSearch('');
                    setSessionDatePreset('ALL');
                    setSessionDateFilter('');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Session #</th>
                  <th className="py-3 px-4">Doctor & Specialization</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Hospital Location</th>
                  <th className="py-3 px-4">Bookings / Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700 text-sm">No consultation sessions match criteria</span>
                        <span className="text-xs text-slate-400">
                          Try adjusting your date filter ({sessionDatePreset !== 'ALL' ? sessionDatePreset : 'selected date'}), status, or search query.
                        </span>
                        {(sessionDatePreset !== 'ALL' || sessionDateFilter || sessionFilter !== 'ALL' || sessionSearch) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSessionFilter('ALL');
                              setSessionSearch('');
                              setSessionDatePreset('ALL');
                              setSessionDateFilter('');
                            }}
                            className="mt-1 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-bold text-xs transition cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((s) => {
                    const cap = s.maxCapacity || 10;
                    const booked = s.currentBookings || 0;
                    const pct = Math.min(100, Math.round((booked / cap) * 100));
                    const rawStatus = s.status || s.sessionStatus || 'SCHEDULED';
                    const isCompleted = isSessionCompleted(s.scheduleDate, s.endTime, rawStatus);
                    const effectiveStatus = (rawStatus === 'SCHEDULED' || rawStatus === 'FULLY_BOOKED') && isCompleted
                      ? 'COMPLETED'
                      : rawStatus;

                    return (
                      <tr key={s.scheduleId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          #{s.scheduleId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {s.doctor?.fullName}
                            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              {formatDoctorId(s.doctor)}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            {s.doctor?.specialization}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{s.scheduleDate}</div>
                          <div className="text-[11px] text-slate-500">
                            {formatStandardTime(s.startTime)} - {formatStandardTime(s.endTime)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {s.hospitalLocation}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">
                            {booked} <span className="text-slate-400 font-normal">/ {cap} slots</span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                pct >= 80 ? 'bg-indigo-600' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              effectiveStatus === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-800' :
                              effectiveStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              effectiveStatus === 'ON_LEAVE' ? 'bg-rose-100 text-rose-800 font-black animate-pulse' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {effectiveStatus === 'ON_LEAVE' ? '🚨 DOCTOR ON LEAVE' : effectiveStatus}
                            </span>
                            {s.queueStatusNote && (
                              <div className="text-[10px] text-rose-700 font-medium mt-0.5 line-clamp-1 max-w-[180px]" title={s.queueStatusNote}>
                                {effectiveStatus === 'ON_LEAVE' ? `Reason: ${s.queueStatusNote}` : `Note: ${s.queueStatusNote}`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {rawStatus === 'CANCELLED' ? (
                            <>
                              <Tooltip text="Reactivate session and restore available timeslots for bookings">
                                <button
                                  onClick={() => handleReactivateSession(s)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                                </button>
                              </Tooltip>
                              <Tooltip text="Edit session details">
                                <button
                                  onClick={() => handleOpenEditSession(s)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold border border-teal-200 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                              </Tooltip>
                              <Tooltip text="Audit record protected: click to view status note">
                                <button
                                  onClick={() => handleDeleteSession(s)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-medium border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Cancelled
                                </button>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip text="Edit consultation session date, timings, room, or capacity">
                                <button
                                  onClick={() => handleOpenEditSession(s)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold border border-teal-200 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                              </Tooltip>

                              <Tooltip text="Safely delete or cancel this session">
                                <button
                                  onClick={() => handleDeleteSession(s)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </Tooltip>

                              {(rawStatus === 'SCHEDULED' || effectiveStatus === 'SCHEDULED') && (
                                <Tooltip text="Open Live Queue Operations for this session">
                                  <button
                                    onClick={() => onSectionChange && onSectionChange('live-queue')}
                                    className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition inline-flex items-center cursor-pointer"
                                  >
                                    <Activity className="w-3.5 h-3.5" />
                                  </button>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIVE QUEUE OPERATIONS DESK (activeSection === 'live-queue') */}
      {activeSection === 'live-queue' && (
        <DoctorLiveQueueConsole currentUser={currentUser} isCoordinator={true} />
      )}

      {/* 2. CREATE DOCTOR SESSION (activeSection === 'new-session') */}
      {activeSection === 'new-session' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 max-w-2xl mx-auto">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              Create Doctor Consultation Session
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full border border-teal-200">
              Operations Scheduling
            </span>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">Select Doctor</label>
              <select
                required
                value={newDoctorId}
                onChange={(e) => setNewDoctorId(e.target.value)}
                className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.userId} value={d.userId}>
                    {d.fullName} ({formatDoctorId(d)} - {d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700">Start Time</label>
                <input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">End Time</label>
                <input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700">Max Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newCapacity}
                  onChange={(e) => handleCapacityChange(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Hospital Room / Location</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Timeslot Configurator */}
            {renderTimeslotConfigurator()}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow transition mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Create Session & Generate {customSlots.length} Timeslots
            </button>
          </form>
        </div>
      )}

      {/* 3. RESCHEDULE SLOTS (activeSection === 'reschedule') */}
      {activeSection === 'reschedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Reschedule Slots Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an active patient appointment below to reassign to an alternate available timeslot.
              </p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full border border-teal-200">
              Timeslot Reassignment
            </span>
          </div>

          <div className="space-y-3">
            {(() => {
              const reschedulableApps = appointments.filter(
                a => a.appointmentStatus !== 'CANCELLED' && 
                     a.appointmentStatus !== 'COMPLETED' && 
                     !isPastDateTime(a.appointmentDate, a.endTime || a.startTime)
              );

              if (reschedulableApps.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                    No upcoming appointments available to reschedule.
                  </div>
                );
              }

              return reschedulableApps.map((app) => (
                <div key={app.appointmentId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-800">Booking #{app.appointmentId}</span>
                      <span className="font-bold text-slate-900">• {app.patient?.fullName}</span>
                      <span className="font-mono text-emerald-700 font-semibold text-[11px]">({formatPatientId(app.patient)})</span>
                      <span className="text-slate-500">with {app.doctor?.fullName} ({formatDoctorId(app.doctor)} - {app.doctor?.specialization})</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Scheduled Date: <strong className="text-slate-800">{app.appointmentDate}</strong> at <strong className="text-slate-800">{app.startTime}</strong> (Slot #{app.timeslot?.slotNo})
                    </p>
                  </div>
                  <button
                    onClick={() => openReschedule(app)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition self-end sm:self-auto"
                  >
                    <Clock className="w-3.5 h-3.5" /> Reassign Slot
                  </button>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 4. CHANNELING REPORTS & SUMMARY (activeSection === 'reports') */}
      {activeSection === 'reports' && (
        <div id="printable-channeling-report" className="space-y-6">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-channeling-report, #printable-channeling-report * {
                visibility: visible;
              }
              #printable-channeling-report {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                padding: 10px;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* Printable Official Letterhead (Print-only) */}
          <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">E-CHANNELING HEALTHCARE SYSTEM</h1>
                <p className="text-xs text-slate-600 mt-0.5">Doctor Consultation Session Manifest & Operational Channeling Audit</p>
                <p className="text-[11px] text-slate-500 mt-1">Hospital Location: Asiri Central Hospital, Colombo</p>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono">
                <div>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                <div>Officer: {currentUser?.fullName || 'Kasun Fernando'} (Coordinator ID: #2)</div>
                <div className="text-[10px] text-slate-400 mt-1">Member 4 - IT25103823 Operations Module</div>
              </div>
            </div>
          </div>

          {/* Header (Screen only) */}
          <div className="no-print flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Channeling Reports & Operational Summary
              </h2>
              <p className="text-xs text-slate-500">
                Clinic session capacity, patient booking volume, and live hospital utilization metrics
              </p>
            </div>
            {(() => {
              const activeSchedules = schedules.filter(s => {
                const raw = s.status || s.sessionStatus || 'SCHEDULED';
                return raw === 'SCHEDULED' && !isSessionCompleted(s.scheduleDate, s.endTime, raw);
              });
              const filteredList = schedules.filter(s => {
                const rawStatus = s.status || s.sessionStatus || 'SCHEDULED';
                const isCompleted = isSessionCompleted(s.scheduleDate, s.endTime, rawStatus);
                const effectiveStatus = (rawStatus === 'SCHEDULED' || rawStatus === 'FULLY_BOOKED') && isCompleted
                  ? 'COMPLETED'
                  : rawStatus;

                if (reportFilter === 'SCHEDULED' && !(effectiveStatus === 'SCHEDULED' && !isCompleted)) return false;
                if (reportFilter === 'COMPLETED' && !(effectiveStatus === 'COMPLETED' || isCompleted)) return false;
                if (reportFilter !== 'ALL' && reportFilter !== 'SCHEDULED' && reportFilter !== 'COMPLETED' && effectiveStatus !== reportFilter) return false;

                if (reportSearch.trim()) {
                  const q = reportSearch.toLowerCase().trim();
                  const docName = (s.doctor?.fullName || '').toLowerCase();
                  const spec = (s.doctor?.specialization || '').toLowerCase();
                  const loc = (s.hospitalLocation || '').toLowerCase();
                  const idStr = String(s.scheduleId);
                  if (!docName.includes(q) && !spec.includes(q) && !loc.includes(q) && !idStr.includes(q)) {
                    return false;
                  }
                }
                return true;
              });

              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tooltip text="Sync live report data from server">
                    <button
                      type="button"
                      onClick={fetchData}
                      disabled={refreshing}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
                      <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                  </Tooltip>

                  <Tooltip text="Export current manifest to Excel / CSV format">
                    <button
                      type="button"
                      onClick={() => handleExportCSV(filteredList)}
                      className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-700" />
                      <span>Export CSV</span>
                    </button>
                  </Tooltip>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Manifest / Report</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* KPI Analytics Cards */}
          {(() => {
            const activeSchedules = schedules.filter(s => {
              const raw = s.status || s.sessionStatus || 'SCHEDULED';
              return raw === 'SCHEDULED' && !isSessionCompleted(s.scheduleDate, s.endTime, raw);
            });
            const completedSchedules = schedules.filter(s => {
              const raw = s.status || s.sessionStatus || 'SCHEDULED';
              return raw === 'COMPLETED' || isSessionCompleted(s.scheduleDate, s.endTime, raw);
            });
            const onLeaveSchedules = schedules.filter(s => (s.status === 'ON_LEAVE' || s.sessionStatus === 'ON_LEAVE'));
            const cancelledSchedules = schedules.filter(s => (s.status === 'CANCELLED' || s.sessionStatus === 'CANCELLED'));

            const totalSessions = schedules.length;
            const activeSessionsCount = activeSchedules.length;

            const activeCapacity = activeSchedules.reduce((acc, s) => acc + (s.maxCapacity || 0), 0);
            const totalCapacityAll = schedules.reduce((acc, s) => acc + (s.maxCapacity || 0), 0);

            const activeBookings = appointments.filter(a => a.appointmentStatus === 'CONFIRMED' || a.appointmentStatus === 'RESCHEDULED').length;
            const activeSessionBookings = activeSchedules.reduce((acc, s) => acc + (s.currentBookings || 0), 0);
            const availableActiveSlots = Math.max(0, activeCapacity - activeSessionBookings);
            const utilizationRate = activeCapacity > 0 ? Math.round((activeSessionBookings / activeCapacity) * 100) : 0;

            const confirmedCount = appointments.filter(a => a.appointmentStatus === 'CONFIRMED').length;
            const completedCount = appointments.filter(a => a.appointmentStatus === 'COMPLETED').length;
            const rescheduledCount = appointments.filter(a => a.appointmentStatus === 'RESCHEDULED').length;
            const cancelledCount = appointments.filter(a => a.appointmentStatus === 'CANCELLED').length;

            const filteredReportSchedules = schedules.filter(s => {
              const rawStatus = s.status || s.sessionStatus || 'SCHEDULED';
              const isCompleted = isSessionCompleted(s.scheduleDate, s.endTime, rawStatus);
              const effectiveStatus = (rawStatus === 'SCHEDULED' || rawStatus === 'FULLY_BOOKED') && isCompleted
                ? 'COMPLETED'
                : rawStatus;

              if (reportFilter === 'SCHEDULED' && !(effectiveStatus === 'SCHEDULED' && !isCompleted)) return false;
              if (reportFilter === 'COMPLETED' && !(effectiveStatus === 'COMPLETED' || isCompleted)) return false;
              if (reportFilter !== 'ALL' && reportFilter !== 'SCHEDULED' && reportFilter !== 'COMPLETED' && effectiveStatus !== reportFilter) return false;

              if (reportSearch.trim()) {
                const q = reportSearch.toLowerCase().trim();
                const docName = (s.doctor?.fullName || '').toLowerCase();
                const spec = (s.doctor?.specialization || '').toLowerCase();
                const loc = (s.hospitalLocation || '').toLowerCase();
                const idStr = String(s.scheduleId);
                if (!docName.includes(q) && !spec.includes(q) && !loc.includes(q) && !idStr.includes(q)) {
                  return false;
                }
              }
              return true;
            });

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Active Scheduled Sessions</span>
                    <div className="text-2xl font-black text-slate-800 flex items-baseline gap-2">
                      {activeSessionsCount}
                      <span className="text-xs font-semibold text-slate-400">/ {totalSessions} rosters</span>
                    </div>
                    <span className="text-[11px] text-teal-600 font-semibold block">
                      {activeSessionsCount > 0 ? `${activeSessionsCount} Active Doctor Rosters` : `${cancelledSchedules.length} Cancelled • ${completedSchedules.length} Done`}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Active Slot Capacity</span>
                    <div className="text-2xl font-black text-teal-700">{activeCapacity}</div>
                    <span className="text-[11px] text-slate-500 font-semibold block">
                      {activeCapacity > 0 ? `In active sessions (${totalCapacityAll} all-time)` : `0 open slots (${totalCapacityAll} all-time)`}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Active Patient Bookings</span>
                    <div className="text-2xl font-black text-emerald-600">{activeBookings}</div>
                    <span className="text-[11px] text-emerald-600 font-semibold block">
                      {confirmedCount} Confirmed • {completedCount} Done
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Capacity Utilization</span>
                    <div className="text-2xl font-black text-emerald-700">{utilizationRate}%</div>
                    <span className="text-[11px] text-slate-500 font-semibold block">
                      {activeCapacity > 0 ? `${availableActiveSlots} Slots Available` : '0 Available (No active session)'}
                    </span>
                  </div>
                </div>

                {/* Sub-status badges summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-teal-50/60 p-3.5 rounded-2xl border border-teal-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Confirmed:</span>
                    <strong className="text-slate-900">{confirmedCount}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600">Completed:</span>
                    <strong className="text-slate-900">{completedCount}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600">Rescheduled:</span>
                    <strong className="text-slate-900">{rescheduledCount}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-slate-600">Cancelled:</span>
                    <strong className="text-slate-900">{cancelledCount}</strong>
                  </div>
                </div>

                {/* Filter Tabs & Search in Reports */}
                <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
                    <button
                      onClick={() => setReportFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        reportFilter === 'ALL'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Sessions ({schedules.length})
                    </button>
                    <button
                      onClick={() => setReportFilter('SCHEDULED')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        reportFilter === 'SCHEDULED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      Active / Scheduled ({activeSessionsCount})
                    </button>
                    <button
                      onClick={() => setReportFilter('COMPLETED')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        reportFilter === 'COMPLETED'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-blue-700'
                      }`}
                    >
                      Completed ({completedSchedules.length})
                    </button>
                    <button
                      onClick={() => setReportFilter('ON_LEAVE')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        reportFilter === 'ON_LEAVE'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-rose-700'
                      }`}
                    >
                      Emergency Leaves ({onLeaveSchedules.length})
                    </button>
                    <button
                      onClick={() => setReportFilter('CANCELLED')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        reportFilter === 'CANCELLED'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cancelled ({cancelledSchedules.length})
                    </button>
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="Search manifest by doctor, specialty, room..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    {reportSearch && (
                      <button
                        onClick={() => setReportSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Detailed Session Utilization Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50/70">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      Doctor Session Channeling Utilization Manifest
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Showing {filteredReportSchedules.length} of {schedules.length} Sessions ({activeSessionsCount} Active, {cancelledSchedules.length} Cancelled, {completedSchedules.length} Completed)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Session #</th>
                          <th className="py-3 px-4">Doctor & Specialty</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Hospital Location</th>
                          <th className="py-3 px-4">Bookings / Capacity</th>
                          <th className="py-3 px-4 min-w-[140px]">Utilization</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredReportSchedules.map((s) => {
                          const cap = s.maxCapacity || 10;
                          const booked = s.currentBookings || 0;
                          const pct = Math.min(100, Math.round((booked / cap) * 100));
                          const rawStatus = s.status || s.sessionStatus || 'SCHEDULED';
                          const isCompleted = isSessionCompleted(s.scheduleDate, s.endTime, rawStatus);
                          const effectiveStatus = (rawStatus === 'SCHEDULED' || rawStatus === 'FULLY_BOOKED') && isCompleted
                            ? 'COMPLETED'
                            : rawStatus;

                          return (
                            <tr key={s.scheduleId} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">#{s.scheduleId}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">
                                  {s.doctor?.fullName} <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{formatDoctorId(s.doctor)}</span>
                                </div>
                                <div className="text-[11px] text-emerald-700 font-medium">{s.doctor?.specialization}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-700">{s.scheduleDate}</div>
                                <div className="text-[11px] text-slate-400">{formatStandardTime(s.startTime)} - {formatStandardTime(s.endTime)}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{s.hospitalLocation}</td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800">{booked}</span>
                                <span className="text-slate-400"> / {cap} slots</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full ${
                                        pct >= 80 ? 'bg-indigo-600' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-bold text-[11px] text-slate-700 w-8">{pct}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  effectiveStatus === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-800' :
                                  effectiveStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                  effectiveStatus === 'ON_LEAVE' ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {effectiveStatus === 'ON_LEAVE' ? '🚨 ON LEAVE' : effectiveStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap no-print">
                                {rawStatus === 'CANCELLED' ? (
                                  <>
                                    <Tooltip text="Reactivate session and reopen available timeslots">
                                      <button
                                        onClick={() => handleReactivateSession(s)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 transition inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                                      </button>
                                    </Tooltip>
                                    <Tooltip text="Edit session details">
                                      <button
                                        onClick={() => handleOpenEditSession(s)}
                                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold border border-teal-200 transition inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                      </button>
                                    </Tooltip>
                                    <Tooltip text="Protected record: View audit note">
                                      <button
                                        onClick={() => handleDeleteSession(s)}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-medium border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Cancelled
                                      </button>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <>
                                    <Tooltip text="Edit doctor consultation session">
                                      <button
                                        onClick={() => handleOpenEditSession(s)}
                                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold border border-teal-200 transition inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                      </button>
                                    </Tooltip>
                                    <Tooltip text="Safely delete or cancel session">
                                      <button
                                        onClick={() => handleDeleteSession(s)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Cancel
                                      </button>
                                    </Tooltip>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Create Consultation Session</span>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Select Doctor</label>
                <select
                  required
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.fullName} ({formatDoctorId(d)} - {d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={newCapacity}
                    onChange={(e) => handleCapacityChange(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Hospital Room / Location</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Timeslot Configurator */}
              {renderTimeslotConfigurator()}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Create Session & Generate {customSlots.length} Timeslots
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Reschedule Booking #{rescheduleAppointment.appointmentId}</span>
              <button onClick={() => setRescheduleAppointment(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select an open timeslot for <span className="font-bold text-slate-800">{rescheduleAppointment.doctor.fullName}</span>:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {(() => {
                const upcomingSchedules = rescheduleDoctorSchedules.filter(
                  sched => !isSessionCompleted(sched.scheduleDate, sched.endTime, sched.status)
                );
                const schedulesWithSlots = upcomingSchedules.map(sched => ({
                  sched,
                  availableSlots: (sched.timeslots || []).filter(
                    t => t.slotStatus === 'AVAILABLE' && !isSlotExpired(sched.scheduleDate, t.slotTime, t.slotEndTime, t.slotStatus)
                  )
                })).filter(item => item.availableSlots.length > 0);

                if (schedulesWithSlots.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      No upcoming available sessions or timeslots found for this doctor to reschedule.
                    </div>
                  );
                }

                return schedulesWithSlots.map(({ sched, availableSlots }) => (
                  <div key={sched.scheduleId} className="p-3 border rounded-xl bg-slate-50 text-xs">
                    <div className="font-bold text-slate-800 mb-1">{sched.scheduleDate} ({sched.startTime} - {sched.endTime})</div>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {availableSlots.map((s) => (
                        <button
                          key={s.timeslotId}
                          onClick={() => setSelectedNewSlot({ ...s, schedule: sched })}
                          className={`p-1.5 rounded text-[11px] font-semibold transition ${
                            selectedNewSlot?.timeslotId === s.timeslotId
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 hover:border-teal-400 text-slate-700'
                          }`}
                        >
                          {s.slotTime}
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {selectedNewSlot && (
              <div className="text-xs text-teal-800 bg-teal-50 p-2.5 rounded-lg border border-teal-200">
                Selected: {selectedNewSlot.schedule.scheduleDate} at {selectedNewSlot.slotTime} (Slot #{selectedNewSlot.slotNo})
              </div>
            )}

            <button
              onClick={executeReschedule}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition"
            >
              Execute Atomic Reschedule
            </button>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR CONSULTATION SESSION MODAL */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  Edit Consultation Session #{editingSession.scheduleId}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dr. {editingSession.doctor?.fullName} ({editingSession.doctor?.specialization})
                </p>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block">Session Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">End Time</label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block">Max Patient Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Current Bookings: {editingSession.currentBookings || 0}</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">Session Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-bold"
                  >
                    <option value="SCHEDULED">SCHEDULED (Active)</option>
                    <option value="ON_LEAVE">ON_LEAVE (Doctor Emergency Leave)</option>
                    <option value="CANCELLED">CANCELLED (Cancelled Session)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Hospital Room / Clinic Location</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium"
                  placeholder="e.g. Room 302, Asiri Central Hospital"
                />
              </div>

              {editStatus !== 'SCHEDULED' && (
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Notice:</strong> Changing status to <span className="font-bold underline">{editStatus}</span> will automatically cancel unbooked available timeslots and notify coordinators and patients for rescheduling.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Session Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
