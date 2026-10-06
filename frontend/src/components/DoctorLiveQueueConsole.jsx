import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity, Clock, MapPin, CheckCircle2, AlertCircle, RefreshCw,
  Play, FastForward, Bell, Smartphone, User, Stethoscope,
  Send, AlertTriangle, Plus, Check, ChevronRight
} from 'lucide-react';
import { formatPatientId } from '../utils/idUtils';
import { formatStandardTime } from '../utils/dateUtils';
import Tooltip from './Tooltip';

export default function DoctorLiveQueueConsole({ currentUser, isCoordinator = false }) {
  const [sessions, setSessions] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('Emergency consultation in hospital ward');
  const [jumpTokenInput, setJumpTokenInput] = useState('');

  const doctorId = currentUser?.userId;

  useEffect(() => {
    fetchSessions();
  }, [doctorId, isCoordinator]);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchQueueStatus(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  // Polling every 8s
  useEffect(() => {
    if (!selectedScheduleId) return;
    const interval = setInterval(() => {
      fetchQueueStatus(selectedScheduleId, false);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedScheduleId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let res;
      if (isCoordinator) {
        res = await axios.get('/api/schedules/live-queue/today');
      } else {
        res = await axios.get(`/api/schedules/live-queue/doctor/${doctorId}`);
        if (!res.data?.data || res.data.data.length === 0) {
          // Fallback to today's sessions if doctor has none directly mapped
          res = await axios.get('/api/schedules/live-queue/today');
        }
      }

      if (res.data && res.data.success && res.data.data) {
        setSessions(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedScheduleId(res.data.data[0].scheduleId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctor sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async (schedId, showSpinner = true) => {
    try {
      if (showSpinner) setUpdating(true);
      const res = await axios.get(`/api/schedules/${schedId}/live-queue`);
      if (res.data && res.data.success && res.data.data) {
        setQueueData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch queue status:', err);
    } finally {
      if (showSpinner) setUpdating(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setActionMsg({ text: msg, type });
    setTimeout(() => setActionMsg({ text: '', type: 'success' }), 5000);
  };

  const handleFullRefresh = async () => {
    try {
      setLoading(true);
      await fetchSessions();
      if (selectedScheduleId) {
        await fetchQueueStatus(selectedScheduleId, true);
      }
      showNotification('Live Queue Desk successfully synced with hospital server!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error refreshing live queue data.', 'error');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // 1. Arrival Status Update
  const handleUpdateArrival = async (status) => {
    if (!selectedScheduleId) return;
    setUpdating(true);
    try {
      const res = await axios.put(`/api/schedules/${selectedScheduleId}/live-queue/arrival`, {
        doctorArrivalStatus: status,
        broadcastSms: true
      });
      if (res.data && res.data.success) {
        setQueueData(res.data.data);
        showNotification(`Arrival status updated to ${status}. Digital notifications broadcast to patients!`, 'success');
      }
    } catch (err) {
      console.error('Failed to update arrival:', err);
      showNotification('Failed to update arrival status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // 2. Next Token / Jump Token with Strict Doctor Appointment Bounds
  const handleAdvanceToken = async (targetToken = null) => {
    if (!selectedScheduleId || !queueData) return;

    const maxToken = queueData.maxBookedToken || (queueData.queueSlots?.length ? Math.max(...queueData.queueSlots.map(s => s.slotNo)) : (queueData.totalBookedTokens || 0));
    
    // Find uncalled slot in booked roster
    const uncalledSlots = (queueData.queueSlots || []).filter(s => !s.isCompleted && !s.isCurrentToken);
    const nextSlot = uncalledSlots.find(s => s.slotNo > (queueData.currentToken || 0)) || uncalledSlots[0];
    const nextAvailable = queueData.nextAvailableToken || (nextSlot ? nextSlot.slotNo : null);

    const nextToken = targetToken || nextAvailable;

    if (!nextToken && queueData.totalBookedTokens > 0) {
      showNotification(`All ${queueData.totalBookedTokens} booked appointments for this session are already completed!`, 'error');
      return;
    }

    if (maxToken > 0 && nextToken > maxToken) {
      showNotification(`Cannot advance beyond Token #${maxToken}. All booked appointments for this doctor have been reached.`, 'error');
      return;
    }

    setUpdating(true);
    try {
      const res = await axios.put(`/api/schedules/${selectedScheduleId}/live-queue/token`, {
        targetToken: nextToken,
        notifyUpcomingPatients: true
      });
      if (res.data && res.data.success) {
        setQueueData(res.data.data);
        showNotification(`Advanced to Token #${nextToken}. Next-in-line buzzer alerts dispatched!`, 'success');
        setJumpTokenInput('');
      }
    } catch (err) {
      console.error('Failed to advance token:', err);
      showNotification(err.response?.data?.message || 'Failed to advance token.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Conclude Queue (marks final patient and session as completed)
  const handleConcludeQueue = async () => {
    if (!selectedScheduleId) return;
    setUpdating(true);
    try {
      const res = await axios.put(`/api/schedules/${selectedScheduleId}/live-queue/conclude`);
      if (res.data && res.data.success) {
        setQueueData(res.data.data);
        showNotification('Session queue concluded! All patient consultations marked completed.', 'success');
      }
    } catch (err) {
      console.error('Failed to conclude queue:', err);
      showNotification(err.response?.data?.message || 'Failed to conclude queue.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Reset Queue (recalibrates tokens back to #1 for demonstration/re-run)
  const handleResetQueue = async () => {
    if (!selectedScheduleId) return;
    setUpdating(true);
    try {
      const res = await axios.put(`/api/schedules/${selectedScheduleId}/live-queue/reset`);
      if (res.data && res.data.success) {
        setQueueData(res.data.data);
        showNotification('Queue recalibrated back to Token #1. Appointments ready for consultations.', 'success');
      }
    } catch (err) {
      console.error('Failed to reset queue:', err);
      showNotification(err.response?.data?.message || 'Failed to reset queue.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // 3. Report Delay
  const handleReportDelay = async () => {
    if (!selectedScheduleId) return;
    setUpdating(true);
    try {
      const res = await axios.put(`/api/schedules/${selectedScheduleId}/live-queue/delay`, {
        delayMinutes: Number(delayMinutes),
        reasonNote: delayReason,
        broadcastSms: true
      });
      if (res.data && res.data.success) {
        setQueueData(res.data.data);
        showNotification(`Session delay of ${delayMinutes} mins recorded and notification sent to booked patients.`);
      }
    } catch (err) {
      console.error('Failed to record delay:', err);
    } finally {
      setUpdating(false);
    }
  };

  // 4. Send Individual Patient In-App Buzzer Alert
  const handleSendPatientSms = async (patientId, tokenNo, patientName) => {
    if (!selectedScheduleId) return;
    setUpdating(true);
    try {
      const res = await axios.post(`/api/schedules/${selectedScheduleId}/live-queue/send-sms`, {
        scheduleId: selectedScheduleId,
        targetPatientId: patientId,
        targetToken: tokenNo,
        messageType: 'TOKEN_CALLED',
        messageBody: `CareSync Priority Alert: Dr. ${queueData.doctorName} is requesting Token #${tokenNo} (${patientName}) in ${queueData.hospitalLocation} immediately.`
      });
      if (res.data && res.data.success) {
        fetchQueueStatus(selectedScheduleId, false);
        showNotification(`Instant buzzer alert sent to Token #${tokenNo} (${patientName})!`);
      }
    } catch (err) {
      console.error('Failed to send patient notification:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold mb-3">
            <Activity className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>{isCoordinator ? 'Hospital-Wide Live Queue Operations' : 'Doctor Consultation Room Console'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Live Queue & Token Control Desk</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Check-in clinic arrival, advance ongoing tokens in real-time, record delays, and trigger automated instant SMS notifications to upcoming patients.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Tooltip text="Refresh live queue status and patient turn information immediately from server">
            <button
              type="button"
              onClick={handleFullRefresh}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Live Desk'}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`p-4 rounded-2xl border font-bold text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in ${
          actionMsg.type === 'error'
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          {actionMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 2. Session Selector */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider">Active Session:</span>
          {sessions.map((s) => (
            <Tooltip
              key={s.scheduleId}
              text={`Switch active console to Dr. ${s.doctorName}'s session (${formatStandardTime(s.startTime)} - ${formatStandardTime(s.endTime)})`}
            >
              <button
                type="button"
                onClick={() => setSelectedScheduleId(s.scheduleId)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedScheduleId === s.scheduleId
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{s.doctorName}</span>
                <span className="text-[10px] opacity-80">({formatStandardTime(s.startTime)} - {formatStandardTime(s.endTime)})</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  s.doctorArrivalStatus === 'ARRIVED' ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-300 text-slate-800'
                }`}>
                  {s.doctorArrivalStatus}
                </span>
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {queueData ? (
        <>
          {/* 3. Operational Command Grid (Arrival Check-In, Token Controller, Delay Reporter) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel 1: Doctor Arrival & Room Status */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 1: Arrival Check-In</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {queueData.doctorArrivalStatus}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">Clinic Arrival Status</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Updating arrival dispatches instant SMS alerts to all booked patients.
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <p className="font-semibold text-slate-800">
                    Location: <span className="font-normal text-slate-600">{queueData.hospitalLocation}</span>
                  </p>
                  <div className="font-semibold text-slate-800 mt-2 flex items-center justify-between">
                    <span>Arrival Time:</span>
                    <Tooltip text={queueData.doctorArrivalTime ? `Exact check-in recorded at ${formatStandardTime(queueData.doctorArrivalTime, true)}` : 'Doctor has not yet checked in'}>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                        {formatStandardTime(queueData.doctorArrivalTime)}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Tooltip text="Mark Doctor as Arrived: Confirms doctor has reached the clinic room and dispatches arrival SMS & buzzer notifications to all waiting patients." wrapperClassName="w-full">
                  <button
                    type="button"
                    onClick={() => handleUpdateArrival('ARRIVED')}
                    disabled={updating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Arrived</span>
                  </button>
                </Tooltip>

                <Tooltip text="Mark Doctor En-Route: Informs reception and patients that the doctor is currently traveling to the clinic (~15 mins away)." wrapperClassName="w-full">
                  <button
                    type="button"
                    onClick={() => handleUpdateArrival('ON_THE_WAY')}
                    disabled={updating}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mark En-Route</span>
                  </button>
                </Tooltip>

                <Tooltip text="Session In Progress: Sets consultation session as actively ongoing with patients entering the room." wrapperClassName="w-full">
                  <button
                    type="button"
                    onClick={() => handleUpdateArrival('IN_PROGRESS')}
                    disabled={updating}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>In Progress</span>
                  </button>
                </Tooltip>

                <Tooltip text="Conclude Clinic Session: Closes this consultation schedule and finalizes all clinic session records." wrapperClassName="w-full">
                  <button
                    type="button"
                    onClick={() => handleUpdateArrival('COMPLETED')}
                    disabled={updating}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conclude Session</span>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Panel 2: Live Token Counter & Advance Controller (Bounded by Doctor's Booked Appointments) */}
            {(() => {
              const totalBooked = queueData.totalBookedTokens || 0;
              const totalCompleted = queueData.totalCompletedTokens || 0;
              const maxToken = queueData.maxBookedToken || (queueData.queueSlots?.length ? Math.max(...queueData.queueSlots.map(s => s.slotNo)) : totalBooked);
              const currentToken = queueData.currentToken || 0;
              
              // Are all booked patients finished?
              const isQueueFinished = (totalBooked > 0 && totalCompleted >= totalBooked) || Boolean(queueData.isQueueFinished);
              
              // Is the doctor currently consulting the last booked token?
              const isLastTokenInConsultation = !isQueueFinished && currentToken > 0 && currentToken === maxToken && totalBooked > 0;
              
              // Find next uncalled token in sequence
              const uncalledSlots = (queueData.queueSlots || []).filter(s => !s.isCompleted && !s.isCurrentToken);
              const nextSlot = uncalledSlots.find(s => s.slotNo > currentToken) || uncalledSlots[0];
              const nextTokenToCall = queueData.nextAvailableToken || (nextSlot ? nextSlot.slotNo : null);

              return (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 2: Consultation Turn</span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        isQueueFinished 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {totalCompleted} / {totalBooked} Completed
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">Current Consulting Token</h3>

                    {isQueueFinished ? (
                      <div className="my-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 animate-in fade-in">
                        <div className="flex items-center gap-2 font-black text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>All Booked Patients Completed ({totalBooked}/{totalBooked})</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Doctor's appointment list has been fully consulted. Call Next Token is stopped.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-3 my-2">
                        <span className="text-5xl font-black text-emerald-950 tracking-tight">
                          #{String(currentToken).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          {currentToken > 0 ? (isLastTokenInConsultation ? 'Final booked patient in room' : 'Now in consultation room') : 'Ready to start'}
                        </span>
                        {maxToken > 0 && (
                          <span className="text-xs font-bold text-slate-500 ml-auto bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            Max Token: #{maxToken}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-1">
                      {isQueueFinished 
                        ? 'Session queue is finished. You can conclude this clinic session or recalibrate if needed.'
                        : isLastTokenInConsultation 
                        ? 'Consulting the last booked appointment for this session. Complete consultation to finish queue.'
                        : 'Advancing to next token marks current patient complete and triggers SMS alerts to upcoming patients.'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {isQueueFinished ? (
                      <div className="space-y-2">
                        <Tooltip text="Conclude Clinic Session: Marks all remaining patient appointments as completed and finalizes today's clinic." wrapperClassName="w-full">
                          <button
                            type="button"
                            onClick={() => handleUpdateArrival('COMPLETED')}
                            disabled={updating}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Conclude Clinic Session ✓</span>
                          </button>
                        </Tooltip>

                        <Tooltip text="Recalibrate Queue: Resets consultation tokens back to Token #1 and re-opens queue for testing or re-consultation." wrapperClassName="w-full">
                          <button
                            type="button"
                            onClick={handleResetQueue}
                            disabled={updating}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Reset / Recalibrate Queue to Token #1</span>
                          </button>
                        </Tooltip>
                      </div>
                    ) : isLastTokenInConsultation ? (
                      <div className="space-y-2">
                        <Tooltip text={`Complete Final Patient: Completes consultation for final patient #${currentToken} and concludes this session queue.`} wrapperClassName="w-full">
                          <button
                            type="button"
                            onClick={handleConcludeQueue}
                            disabled={updating}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Complete Final Token (#{currentToken}) & Finish Queue</span>
                          </button>
                        </Tooltip>
                      </div>
                    ) : totalBooked === 0 ? (
                      <div className="p-3 bg-slate-100 border border-slate-200 text-slate-500 text-xs text-center rounded-xl font-bold">
                        No booked appointments in this doctor session
                      </div>
                    ) : (
                      <Tooltip text={`Advance Turn: Completes consultation for current token and summons Token #${nextTokenToCall || (currentToken + 1)} into the room with priority alert.`} wrapperClassName="w-full">
                        <button
                          type="button"
                          onClick={() => handleAdvanceToken(nextTokenToCall)}
                          disabled={updating || !nextTokenToCall}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FastForward className="w-4 h-4" />
                          <span>Call Next Token (#{nextTokenToCall || (currentToken + 1)}) ▶</span>
                        </button>
                      </Tooltip>
                    )}

                    {!isQueueFinished && totalBooked > 0 && (
                      <div className="flex items-center gap-2">
                        <Tooltip text={`Enter any booked token number between 1 and ${maxToken} to call out of regular turn order.`} wrapperClassName="w-1/2">
                          <input
                            type="number"
                            min="1"
                            max={maxToken || 1}
                            value={jumpTokenInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (Number(val) >= 1 && Number(val) <= maxToken)) {
                                setJumpTokenInput(val);
                              }
                            }}
                            placeholder={`Jump (1 - ${maxToken})`}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-600"
                          />
                        </Tooltip>

                        <Tooltip text={`Direct Summon: Immediately summons Token #${jumpTokenInput || '...'} into the consultation room out of sequence.`} wrapperClassName="w-1/2">
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseInt(jumpTokenInput, 10);
                              if (num >= 1 && num <= maxToken) {
                                handleAdvanceToken(num);
                              } else {
                                showNotification(`Invalid token! Doctor only has tokens up to #${maxToken}`, 'error');
                              }
                            }}
                            disabled={!jumpTokenInput || updating || parseInt(jumpTokenInput, 10) > maxToken}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-xl text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Call Token #{jumpTokenInput || '?'}
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Panel 3: Delay Recording & Smart Broadcast */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 3: Schedule Delays</span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {queueData.estimatedDelayMinutes > 0 ? `+${queueData.estimatedDelayMinutes}m Delay Active` : 'No Delays'}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">Broadcast Session Delay</h3>
                <p className="text-xs text-slate-500 mt-1">
                  If the doctor is delayed, set delay minutes to auto-adjust patient ETAs and dispatch SMS alert.
                </p>

                <div className="space-y-2.5 mt-3">
                  <div className="flex gap-2">
                    {[10, 15, 20, 30].map((m) => (
                      <Tooltip key={m} text={`Set +${m} minutes unexpected delay for doctor arrival or rounds`} wrapperClassName="flex-1">
                        <button
                          type="button"
                          onClick={() => setDelayMinutes(m)}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            delayMinutes === m
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          +{m}m
                        </button>
                      </Tooltip>
                    ))}
                  </div>

                  <Tooltip text="Specify the reason for the delay (e.g. Ward rounds, emergency case, traffic) to be included in patient SMS updates" wrapperClassName="w-full">
                    <input
                      type="text"
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="Reason (e.g. Ward rounds / Traffic)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-600"
                    />
                  </Tooltip>
                </div>
              </div>

              <div className="pt-2">
                <Tooltip text={`Broadcast Delay: Recalculates estimated appointment times and sends urgent +${delayMinutes}m delay SMS notifications to all waiting patients.`} wrapperClassName="w-full">
                  <button
                    type="button"
                    onClick={handleReportDelay}
                    disabled={updating}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Broadcast +{delayMinutes}m Delay via SMS</span>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* 4. Live Patient Roster & Direct Call Console */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Patient Queue Roster</h3>
                <p className="text-xs text-slate-400">Real-time status of all booked consultation tokens for this session</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {queueData.queueSlots?.length || 0} Booked Tokens
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Token #</th>
                    <th className="py-3 px-3">Patient Details</th>
                    <th className="py-3 px-3">Mobile Contact</th>
                    <th className="py-3 px-3">Slot Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Quick Queue Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueData.queueSlots && queueData.queueSlots.length > 0 ? (
                    queueData.queueSlots.map((slot) => {
                      const isCurrent = slot.isCurrentToken;
                      const isDone = slot.isCompleted;

                      return (
                        <tr
                          key={slot.appointmentId}
                          className={`hover:bg-slate-50 transition ${
                            isCurrent ? 'bg-teal-50/80 font-bold' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <span className={`inline-block font-black text-xs px-2.5 py-1 rounded-lg ${
                              isCurrent
                                ? 'bg-teal-700 text-white'
                                : isDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              #{String(slot.slotNo).padStart(2, '0')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900">{slot.patientName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {formatPatientId(slot.patientId)}
                            </p>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {slot.patientPhone || '0771234567'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {slot.slotTime}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isCurrent
                                ? 'bg-teal-100 text-teal-800 border-teal-300 animate-pulse'
                                : isDone
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {slot.appointmentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                            {isCurrent && (
                              <Tooltip text={`Finish Turn: Mark consultation complete for Token #${slot.slotNo} (${slot.patientName}) and release the room.`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const totalBooked = queueData.totalBookedTokens || 0;
                                    const maxToken = queueData.maxBookedToken || totalBooked;
                                    if (slot.slotNo === maxToken || queueData.totalCompletedTokens + 1 >= totalBooked) {
                                      handleConcludeQueue();
                                    } else {
                                      handleAdvanceToken();
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Finish Turn</span>
                                </button>
                              </Tooltip>
                            )}

                            {!isDone && !isCurrent && (
                              <Tooltip text={`Call Immediately: Summons Token #${slot.slotNo} (${slot.patientName}) into the consultation room right now.`}>
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceToken(slot.slotNo)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer"
                                >
                                  Call Now
                                </button>
                              </Tooltip>
                            )}

                            {isDone && (
                              <Tooltip text={`Recall Patient: Re-call Token #${slot.slotNo} (${slot.patientName}) back to consultation room for follow-up or prescriptions.`}>
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceToken(slot.slotNo)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium text-[10px] transition border border-slate-200 cursor-pointer"
                                >
                                  Recall
                                </button>
                              </Tooltip>
                            )}

                            <Tooltip text={`In-App Buzzer Notice: Send an instant priority alert & buzzer vibration directly to ${slot.patientName}'s device.`}>
                              <button
                                type="button"
                                onClick={() => handleSendPatientSms(slot.patientId, slot.slotNo, slot.patientName)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition border border-slate-300 cursor-pointer"
                              >
                                <Bell className="w-3 h-3 inline mr-1 text-teal-600" />
                                Buzzer Alert
                              </button>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No appointments found for this schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
