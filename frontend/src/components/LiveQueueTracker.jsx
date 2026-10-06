import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity, Clock, MapPin, CheckCircle2, AlertCircle, RefreshCw,
  Bell, Smartphone, ShieldCheck, ChevronRight, User, Stethoscope,
  Sparkles, Send, CheckCircle, Flame, Calendar
} from 'lucide-react';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';
import { formatStandardTime } from '../utils/dateUtils';
import Tooltip from './Tooltip';

export default function LiveQueueTracker({ currentUser, targetScheduleId = null, onClose = null }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(targetScheduleId);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientNotifications, setPatientNotifications] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const patientId = currentUser?.userId || (currentUser?.username === 'patient.kasun' ? 9 : 8);

  useEffect(() => {
    fetchActiveSessions();
    fetchPatientNotifications();
  }, [patientId]);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchQueueStatus(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  // Polling for live real-time synchronization
  useEffect(() => {
    if (!autoRefresh || !selectedScheduleId) return;
    const interval = setInterval(() => {
      fetchQueueStatus(selectedScheduleId, false);
      fetchPatientNotifications();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedScheduleId]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/schedules/live-queue/today');
      if (res.data && res.data.success && res.data.data) {
        setSchedules(res.data.data);
        if (!selectedScheduleId && res.data.data.length > 0) {
          // If user passed targetScheduleId, pick it; else default to first active
          const found = targetScheduleId 
            ? res.data.data.find(s => s.scheduleId === targetScheduleId) 
            : res.data.data[0];
          setSelectedScheduleId(found ? found.scheduleId : res.data.data[0].scheduleId);
        }
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async (schedId, showSpinner = true) => {
    try {
      if (showSpinner) setRefreshing(true);
      const res = await axios.get(`/api/schedules/${schedId}/live-queue`);
      if (res.data && res.data.success && res.data.data) {
        setQueueData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load queue status:', err);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  const fetchPatientNotifications = async () => {
    try {
      const res = await axios.get(`/api/schedules/live-queue/patient/${patientId}/notifications`);
      if (res.data && res.data.success && res.data.data) {
        setPatientNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load patient SMS notifications:', err);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.allSettled([
        fetchActiveSessions(),
        selectedScheduleId ? fetchQueueStatus(selectedScheduleId, false) : Promise.resolve(),
        fetchPatientNotifications()
      ]);
    } finally {
      setRefreshing(false);
    }
  };


  // Find current patient's slot in the active schedule
  const myQueueSlot = queueData?.queueSlots?.find(s => s.patientId === patientId);
  const currentToken = queueData?.currentToken || 0;
  const isMyTurn = myQueueSlot && myQueueSlot.slotNo === currentToken;
  const isMyTurnPassed = myQueueSlot && (myQueueSlot.isCompleted || (currentToken > myQueueSlot.slotNo));
  const tokensAhead = myQueueSlot && !isMyTurnPassed && !isMyTurn 
    ? Math.max(0, myQueueSlot.slotNo - currentToken)
    : 0;

  // Arrival badge helpers
  const getArrivalBadge = (status, time) => {
    switch (status) {
      case 'ARRIVED':
      case 'IN_PROGRESS':
        return {
          label: `Doctor Arrived (${time ? formatStandardTime(time) : 'Present'})`,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          sub: 'In Consultation Room'
        };
      case 'ON_THE_WAY':
        return {
          label: 'Doctor En-Route (~15 Mins Away)',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500 animate-ping',
          sub: 'Traveling to Clinic'
        };
      case 'COMPLETED':
        return {
          label: 'Session Concluded',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          sub: 'All consultations completed'
        };
      default:
        return {
          label: 'Expected Shortly (Not Checked-In)',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          sub: 'Scheduled consultation session'
        };
    }
  };

  const arrivalInfo = getArrivalBadge(queueData?.doctorArrivalStatus, queueData?.doctorArrivalTime);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Session Selector */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold mb-3 backdrop-blur-xs">
              <Activity className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>Real-Time E-Channeling Tracker</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Live Queue & Smart Token Tracking</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Track your doctor's exact clinic arrival, ongoing consultation token in real-time, and view automated instant SMS alerts dispatched directly to your mobile phone before your turn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Tooltip text="Manually refresh real-time queue tokens and doctor arrival status">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </Tooltip>

            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Auto-Sync: ON (8s)</span>
            </span>

            {onClose && (
              <Tooltip text="Close this live queue tracker view and return to previous dashboard">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close View
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Schedule Selector Chips */}
        {schedules.length > 1 && (
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-2">Select Live Clinic Session:</p>
            <div className="flex flex-wrap gap-2">
              {schedules.map((s) => {
                const isSelected = s.scheduleId === selectedScheduleId;
                return (
                  <Tooltip
                    key={s.scheduleId}
                    text={`View live queue & token status for Dr. ${s.doctorName} (${s.specialization})`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedScheduleId(s.scheduleId)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-white text-emerald-900 shadow-md scale-102'
                          : 'bg-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{s.doctorName}</span>
                      <span className="text-[10px] opacity-75">({s.specialization})</span>
                      {s.doctorArrivalStatus === 'ARRIVED' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading && !queueData ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Connecting to Hospital Live Queue Server...</p>
        </div>
      ) : queueData ? (
        <>
          {/* 2. Top Metric Cards (Doctor Arrival, Ongoing Token, Patient's Token & ETA) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Doctor Arrival Status */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doctor Arrival Status</span>
                <span className={`w-2.5 h-2.5 rounded-full ${arrivalInfo.dot}`}></span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${arrivalInfo.color}`}>
                  {arrivalInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{queueData.hospitalLocation}</span>
              </p>
              {queueData.queueStatusNote && (
                <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 italic">
                  "{queueData.queueStatusNote}"
                </div>
              )}
            </div>

            {/* Card 2: Ongoing Consultation Token */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currently Consulting</span>
                {queueData.isQueueFinished || (queueData.totalBookedTokens > 0 && queueData.totalCompletedTokens >= queueData.totalBookedTokens) ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    ALL DONE ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse">
                    IN ROOM
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  #{String(currentToken).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  / {queueData.totalBookedTokens} Booked
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {queueData.isQueueFinished || (queueData.totalBookedTokens > 0 && queueData.totalCompletedTokens >= queueData.totalBookedTokens)
                  ? 'All booked patient consultations completed.'
                  : currentToken > 0 ? `Consultation active with Dr. ${queueData.doctorName}` : 'Doctor preparing room'}
              </p>
            </div>

            {/* Card 3: Patient's Personal Token Status */}
            <div className={`rounded-2xl p-5 border shadow-xs relative ${
              isMyTurn
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : myQueueSlot
                ? 'bg-teal-50/60 border-teal-200'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Assigned Token</span>
                {myQueueSlot && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    isMyTurn
                      ? 'bg-emerald-600 text-white border-emerald-600 animate-bounce'
                      : isMyTurnPassed
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-teal-100 text-teal-800 border-teal-300'
                  }`}>
                    {isMyTurn ? 'CALLING NOW!' : isMyTurnPassed ? 'COMPLETED' : 'WAITING'}
                  </span>
                )}
              </div>

              {myQueueSlot ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-emerald-950 tracking-tight">
                      #{String(myQueueSlot.slotNo).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">
                      {isMyTurn
                        ? '🔔 PROCEED TO ROOM NOW'
                        : isMyTurnPassed
                        ? 'Consultation Done'
                        : `${tokensAhead} Patient${tokensAhead === 1 ? '' : 's'} Ahead`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-medium truncate">
                    Patient: {myQueueSlot.patientName}
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-sm font-bold text-slate-700">No booking in this session</p>
                  <p className="text-xs text-slate-400 mt-1">Viewing public clinic live display</p>
                </div>
              )}
            </div>

            {/* Card 4: Estimated Wait Time & Delay */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Wait Time</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {myQueueSlot ? (isMyTurnPassed ? '0' : `~${myQueueSlot.estimatedWaitMinutes}`) : '~10'}
                </span>
                <span className="text-xs text-slate-500 font-bold">Minutes</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {queueData.estimatedDelayMinutes > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    +{queueData.estimatedDelayMinutes}m Clinic Delay Added
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Running On Schedule
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Turn Attention Banner (If patient is Next or Currently In Room) */}
          {isMyTurn && (
            <div className="bg-emerald-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Flame className="w-7 h-7 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">IT'S YOUR TURN! PLEASE ENTER ROOM</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Dr. {queueData.doctorName} is waiting for Token #{myQueueSlot.slotNo} in {queueData.hospitalLocation}.
                  </p>
                </div>
              </div>
              <span className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-xs shrink-0">
                Token #{myQueueSlot.slotNo}
              </span>
            </div>
          )}

          {myQueueSlot && tokensAhead === 1 && !isMyTurn && (
            <div className="bg-amber-500 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">YOU ARE NEXT IN LINE!</h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Please stand near the door of {queueData.hospitalLocation}. You will be called in approx. 10 minutes.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white text-amber-900 font-extrabold text-xs shadow-xs shrink-0">
                1 Patient Ahead
              </span>
            </div>
          )}

          {/* 4. Visual Queue Stepper & Progress Timeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Visual Token Progression Timeline</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow every token's real-time journey from waiting lobby into the consultation room.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-600 animate-pulse"></span> In Room
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span> Your Turn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-200"></span> Waiting
                </span>
              </div>
            </div>

            {/* Stepper Grid / Horizontal Flow */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {queueData.queueSlots && queueData.queueSlots.length > 0 ? (
                queueData.queueSlots.map((slot) => {
                  const isCurrent = slot.isCurrentToken;
                  const isDone = slot.isCompleted;
                  const isMe = slot.patientId === patientId;

                  let cardStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                  let badge = 'Waiting';
                  let badgeStyle = 'bg-slate-200 text-slate-600';

                  if (isDone) {
                    cardStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-900';
                    badge = 'Completed';
                    badgeStyle = 'bg-emerald-100 text-emerald-800';
                  } else if (isCurrent) {
                    cardStyle = 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20 scale-102 ring-2 ring-teal-400/40';
                    badge = 'IN ROOM';
                    badgeStyle = 'bg-white text-teal-900 font-black';
                  } else if (isMe) {
                    cardStyle = 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/50';
                    badge = 'YOUR TURN';
                    badgeStyle = 'bg-amber-200 text-amber-900 font-bold';
                  }

                  return (
                    <div
                      key={slot.appointmentId}
                      className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${cardStyle}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono">Slot #{slot.slotNo}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${badgeStyle}`}>
                          {badge}
                        </span>
                      </div>

                      <div className="my-1">
                        <span className="text-2xl font-black tracking-tight">#{String(slot.slotNo).padStart(2, '0')}</span>
                        <p className="text-[11px] font-semibold truncate mt-0.5">
                          {isMe ? '⭐ You (' + (slot.patientName || 'Me') + ')' : slot.patientName}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-black/5 mt-2 flex items-center justify-between text-[10px] opacity-80">
                        <span>{slot.slotTime || 'Scheduled'}</span>
                        {!isDone && !isCurrent && (
                          <span className="font-bold">~{slot.estimatedWaitMinutes}m wait</span>
                        )}
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {isCurrent && <Stethoscope className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs font-medium">
                  No active booked tokens found for this session yet.
                </div>
              )}
            </div>
          </div>

          {/* 5. Smart Digital Notifications & Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Notification Feed */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Live Queue Notification Feed</h3>
                    <p className="text-xs text-slate-400">Real-time alerts synced with your CareSync Notification Manager</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip text="Refresh live notifications feed">
                    <button
                      type="button"
                      onClick={() => fetchPatientNotifications()}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {patientNotifications.length} Delivered
                  </span>
                </div>
              </div>

              {/* Notification List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {patientNotifications.length > 0 ? (
                  patientNotifications.map((notif) => (
                    <div
                      key={notif.notificationId}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-white hover:shadow-xs transition"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-emerald-600" />
                            To: {notif.recipientName || 'Patient'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {(notif.messageType || 'ALERT').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {notif.messageBody}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40 text-[10px] text-slate-400">
                        <span>Delivered to Notification Manager</span>
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle className="w-3 h-3" /> Active & Delivered
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No live queue alerts recorded yet for this session.
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Instant Live Notification Test Simulation Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Notification Center</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">Smart In-App Alerts</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  CareSync delivers automatic priority alerts directly to your profile header:
                </p>

                <ul className="text-xs text-slate-300 space-y-2.5 mt-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Doctor Clinic Arrival:</strong> Instant alert when consultant arrives & checks into room.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Approaching Turn (2 Tokens Away):</strong> Reminder to report to consultation waiting lounge.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Next In Line & Room Call:</strong> Immediate buzzer to enter the consultation suite.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 mb-2">Connected Patient Profile:</p>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">User:</span>
                  <span className="font-bold text-white">{currentUser?.fullName || 'Registered Patient'}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Automated alerts broadcast when token advances in doctor clinic.</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
