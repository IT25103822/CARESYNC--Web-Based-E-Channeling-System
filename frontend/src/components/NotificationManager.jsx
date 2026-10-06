import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Bell, BellRing, CheckCheck, Trash2, CheckCircle2, Clock,
  Calendar, Stethoscope, Activity, Star, AlertTriangle,
  FileText, Sparkles, X, ChevronRight, Filter, ShieldCheck,
  CreditCard, ExternalLink, Info
} from 'lucide-react';

/**
 * CareSync Notification Manager
 * Real-time role-based digital notification center with unread counter,
 * role-specific filtering for Patients and Doctors, and interactive actions.
 */
export default function NotificationManager({ currentUser, onNavigate, variant = 'header' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'QUEUE', 'APPOINTMENTS', 'CLINICAL'
  const dropdownRef = useRef(null);

  const role = currentUser?.role || 'PATIENT';
  const userId = currentUser?.role === 'PATIENT'
    ? (currentUser?.userId || (currentUser?.username === 'patient.kasun' ? 9 : 8))
    : (currentUser?.userId || 5);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications', {
        params: { userId, role }
      });
      if (res.data?.success) {
        const items = res.data.data || [];
        setNotifications(items);
        const unread = items.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll for notifications every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId, role]);

  // Mark single as read
  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', null, {
        params: { userId, role }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
      const remainingUnread = notifications.filter(n => n.notificationId !== notificationId && !n.isRead).length;
      setUnreadCount(remainingUnread);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Clear all
  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications in this view?')) return;
    try {
      await axios.delete('/api/notifications/clear-all', {
        params: { userId, role }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };


  // Action click on notification item
  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.notificationId);
    }
    if (onNavigate) {
      const type = notification.messageType || '';
      if (role === 'PATIENT') {
        if (type.includes('TOKEN') || type.includes('DOCTOR') || type.includes('QUEUE') || type.includes('DELAY')) {
          onNavigate('live-queue');
        } else if (type.includes('PRESCRIPTION')) {
          onNavigate('prescriptions');
        } else if (type.includes('BOOKING') || type.includes('APPOINTMENT')) {
          onNavigate('my-appointments');
        } else if (type.includes('REFUND')) {
          onNavigate('refunds');
        }
      } else if (role === 'DOCTOR') {
        if (type.includes('QUEUE') || type.includes('TOKEN')) {
          onNavigate('live-queue');
        } else if (type.includes('FEEDBACK')) {
          onNavigate('feedback');
        } else if (type.includes('BOOKING')) {
          onNavigate('patients');
        } else {
          onNavigate('schedules');
        }
      } else if (role === 'CHANNELING_COORDINATOR') {
        if (type.includes('LEAVE') || type.includes('SESSION')) {
          onNavigate('sessions');
        } else if (type.includes('QUEUE') || type.includes('TOKEN')) {
          onNavigate('live-queue');
        } else if (type.includes('RESCHEDULE')) {
          onNavigate('reschedule');
        } else {
          onNavigate('sessions');
        }
      }
      setIsOpen(false);
    }
  };

  // Helper formatting icon and color
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DOCTOR_LEAVE':
      case 'EMERGENCY_LEAVE':
        return { Icon: AlertTriangle, bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'DOCTOR_ARRIVED':
      case 'DOCTOR_EN_ROUTE':
        return { Icon: Stethoscope, bg: 'bg-teal-100 text-teal-700 border-teal-200' };
      case 'TOKEN_CALLED':
        return { Icon: Activity, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'APPROACHING_TURN':
        return { Icon: Clock, bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'SESSION_DELAYED':
        return { Icon: AlertTriangle, bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'NEW_BOOKING':
        return { Icon: Calendar, bg: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'PATIENT_FEEDBACK':
        return { Icon: Star, bg: 'bg-amber-100 text-amber-700 border-amber-300' };
      case 'PRESCRIPTION_ISSUED':
        return { Icon: FileText, bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'REFUND_STATUS':
        return { Icon: CreditCard, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { Icon: Info, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Relative time helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const now = new Date();
      const sent = new Date(dateStr);
      const diffMins = Math.floor((now - sent) / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  // Filtered items
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'QUEUE') {
      return ['DOCTOR_ARRIVED', 'APPROACHING_TURN', 'TOKEN_CALLED', 'SESSION_DELAYED', 'DOCTOR_EN_ROUTE', 'QUEUE_STATUS_UPDATE', 'DOCTOR_LEAVE', 'EMERGENCY_LEAVE'].includes(n.messageType);
    }
    if (activeFilter === 'APPOINTMENTS') {
      return ['NEW_BOOKING', 'APPOINTMENT_BOOKED', 'CLINIC_SCHEDULE', 'DOCTOR_LEAVE'].includes(n.messageType);
    }
    if (activeFilter === 'CLINICAL') {
      return ['PRESCRIPTION_ISSUED', 'PATIENT_FEEDBACK', 'REFUND_STATUS'].includes(n.messageType);
    }
    return true;
  });

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* TRIGGER BUTTON (Header Pill or Profile Banner Badge) */}
      {variant === 'banner' ? (
        <button
          type="button"
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
          className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition shadow-sm backdrop-blur-sm"
          title="Open Notification Manager"
        >
          <Bell className="w-4 h-4 text-emerald-200" />
          <span>Notification Manager</span>
          {unreadCount > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-black leading-none text-white bg-rose-500 rounded-full shadow-md animate-pulse">
              {unreadCount}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-200/80 font-mono">0</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
          className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs flex items-center justify-center group"
          title={`Notification Manager (${unreadCount} unread)`}
          aria-label="Notification Manager"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-4 h-4 text-rose-500 animate-bounce" />
          ) : (
            <Bell className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
          )}

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm border border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* NOTIFICATION MANAGER DROPDOWN / FLYOUT DRAWER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* 1. Header Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight">Notification Manager</h3>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.2 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30">
                    {role === 'DOCTOR' ? 'Doctor Desk' : (role === 'CHANNELING_COORDINATOR' ? 'Coordinator Desk' : (role === 'ADMINISTRATOR' ? 'Admin Feed' : 'Patient Feed'))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {unreadCount > 0 ? `${unreadCount} unread priority alerts` : 'All alerts up to date'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close Notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Filter Tabs & Actions */}
          <div className="bg-slate-50 p-2.5 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  activeFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('UNREAD')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  activeFilter === 'UNREAD'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Unread ({unreadCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('QUEUE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  activeFilter === 'QUEUE'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Queue
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('APPOINTMENTS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  activeFilter === 'APPOINTMENTS'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Bookings
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Notification Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[440px]">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => {
                const iconInfo = getNotificationIcon(n.messageType);
                const ItemIcon = iconInfo.Icon;

                return (
                  <div
                    key={n.notificationId}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 transition flex gap-3 items-start cursor-pointer hover:bg-slate-50 group relative ${
                      !n.isRead ? 'bg-teal-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Unread Accent Dot */}
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-teal-600 ring-2 ring-teal-200"></span>
                    )}

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${iconInfo.bg}`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title || 'CareSync Alert'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatTimeAgo(n.sentAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {n.messageBody}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 text-[10px]">
                        <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Delivered to portal
                        </span>

                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                          {!n.isRead && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                              className="text-teal-700 hover:underline font-bold text-[10px]"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(n.notificationId, e)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">No Notifications Found</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {activeFilter === 'UNREAD'
                    ? 'You have caught up with all your priority alerts!'
                    : 'Your notifications will appear here when appointments, queue turns, or doctor updates occur.'}
                </p>
              </div>
            )}
          </div>

          {/* 4. Footer info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>CareSync Digital Notification Network</span>
            <span className="font-mono text-emerald-700 font-bold">Live Synced</span>
          </div>
        </div>
      )}
    </div>
  );
}
