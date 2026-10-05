import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck, UserCheck, Users, Calendar, Check, X, RefreshCw,
  UserPlus, FileCheck, Edit3, Search, AlertCircle, CheckCircle, Eye, EyeOff,
  User, Camera, UserX, Stethoscope, KeyRound, Wand2, Copy,
  Shield, Headphones, CreditCard, Filter, Plus, Building, Briefcase, Trash2, ShieldOff,
  Star, MessageSquare, Quote, Sparkles, Activity, FileText, Clock, AlertTriangle, ShieldAlert,
  Download, Terminal, ArrowUpDown, ChevronRight, Info, Printer
} from 'lucide-react';
import { calculateAgeFromDob } from '../utils/dateUtils';
import { formatPatientId, formatDoctorId, formatStaffId, formatCustomId } from '../utils/idUtils';
import PrescriptionSlipModal from './PrescriptionSlipModal';

export const ALL_ADMIN_PERMISSIONS = [
  { id: 'MANAGE_USERS', label: 'Manage System Users & Staff Roles', desc: 'Add staff, edit roles, configure permissions, toggle status' },
  { id: 'MANAGE_DOCTORS', label: 'Manage Doctors & SLMC Licenses', desc: 'Approve doctor registrations & manage clinical profiles' },
  { id: 'MANAGE_PATIENTS', label: 'Manage Patients', desc: 'View, edit, and update patient clinical profiles' },
  { id: 'VIEW_ANALYTICS', label: 'View System Analytics & KPIs', desc: 'Access financial overview, appointment stats & platform metrics' },
  { id: 'DELETE_RECORDS', label: 'Permanently Delete Records', desc: 'Hard-delete doctors, patients, and staff accounts' },
];

export default function AdminPortal({ activeSection, currentUser }) {
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Hospital Issued Prescriptions Registry state
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [prescriptionDoctorFilter, setPrescriptionDoctorFilter] = useState('ALL');
  const [prescriptionPatientFilter, setPrescriptionPatientFilter] = useState('ALL');
  const [prescriptionDateFilter, setPrescriptionDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'
  const [prescriptionCustomStart, setPrescriptionCustomStart] = useState('');
  const [prescriptionCustomEnd, setPrescriptionCustomEnd] = useState('');
  const [prescriptionViewMode, setPrescriptionViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedPrescriptionForModal, setSelectedPrescriptionForModal] = useState(null);
  const [copiedRxId, setCopiedRxId] = useState(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Feedback & Reviews Management State (Admin)
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('ALL');
  const [feedbackFeaturedFilter, setFeedbackFeaturedFilter] = useState('ALL');
  const [feedbackActionLoading, setFeedbackActionLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // System Audit Logs State
  const [allLogs, setAllLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState('ALL');
  const [logSeverityFilter, setLogSeverityFilter] = useState('ALL');
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logTimeFilter, setLogTimeFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM'
  const [logCustomStartDate, setLogCustomStartDate] = useState('');
  const [logCustomEndDate, setLogCustomEndDate] = useState('');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);
  const [copiedLogJson, setCopiedLogJson] = useState(false);

  // Granular Admin Permissions State
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState([
    'MANAGE_USERS', 'MANAGE_DOCTORS', 'MANAGE_PATIENTS', 'VIEW_ANALYTICS', 'DELETE_RECORDS'
  ]);
  const [editingAdminPermissionsUser, setEditingAdminPermissionsUser] = useState(null);
  const [permissionModalSelected, setPermissionModalSelected] = useState([]);
  const [permissionSaving, setPermissionSaving] = useState(false);

  // Staff & Role-Based Users state (Administrator)
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffError, setAddStaffError] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [newStaffForm, setNewStaffForm] = useState({
    username: '',
    password: 'password123',
    fullName: '',
    contactNumber: '',
    nic: '',
    role: 'CHANNELING_COORDINATOR',
    department: 'Channeling Operations'
  });

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    contactNumber: '',
    department: '',
    role: 'CHANNELING_COORDINATOR'
  });
  const [editStaffLoading, setEditStaffLoading] = useState(false);

  // Edit Patient Modal State
  const [editingPatient, setEditingPatient] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
    age: 0,
    gender: '',
    isActive: true,
    profileImage: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // New Doctor form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [nic, setNic] = useState('');
  const [medicalLicenseNo, setMedicalLicenseNo] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [qualifications, setQualifications] = useState('MBBS, MD');
  const [consultationFee, setConsultationFee] = useState(3000);
  const [hospitalAffiliation, setHospitalAffiliation] = useState('Asiri Hospital');
  const [doctorProfileImage, setDoctorProfileImage] = useState('');

  // Edit Doctor Modal State (Admin can modify registered doctor details)
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editDoctorForm, setEditDoctorForm] = useState({
    fullName: '',
    contactNumber: '',
    specialization: 'Cardiology',
    qualifications: '',
    medicalLicenseNo: '',
    consultationFee: 3000,
    hospitalAffiliation: '',
    profileImage: '',
    isActive: true,
    isApproved: true
  });
  const [editDoctorLoading, setEditDoctorLoading] = useState(false);
  const [editDoctorSuccessMsg, setEditDoctorSuccessMsg] = useState('');

  // Quick generate strong temporary password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let gen = 'Doc@';
    for (let i = 0; i < 6; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setShowDoctorPassword(true);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const results = await Promise.allSettled([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/doctors/pending'),
        axios.get('/api/admin/doctors/all'),
        axios.get('/api/patients'),
        axios.get('/api/admin/staff'),
        axios.get('/api/admin/users/all'),
        axios.get('/api/feedback'),
        axios.get('/api/admin/logs'),
        axios.get('/api/admin/logs/stats'),
        axios.get('/api/admin/prescriptions')
      ]);

      if (results[0].status === 'fulfilled' && results[0].value.data?.success) {
        setStats(results[0].value.data.data);
      }
      if (results[1].status === 'fulfilled' && results[1].value.data?.success) {
        setPendingDoctors(results[1].value.data.data || []);
      }
      if (results[2].status === 'fulfilled' && results[2].value.data?.success) {
        setAllDoctors(results[2].value.data.data || []);
      }
      if (results[3].status === 'fulfilled' && results[3].value.data?.success) {
        setAllPatients(results[3].value.data.data || []);
      }
      if (results[4]?.status === 'fulfilled' && results[4].value.data?.success) {
        setAllStaff(results[4].value.data.data || []);
      }
      if (results[5]?.status === 'fulfilled' && results[5].value.data?.success) {
        setAllUsers(results[5].value.data.data || []);
      }
      if (results[6]?.status === 'fulfilled' && results[6].value.data?.success) {
        setAllFeedbacks(results[6].value.data.data || []);
      }
      if (results[7]?.status === 'fulfilled' && results[7].value.data?.success) {
        setAllLogs(results[7].value.data.data || []);
      }
      if (results[8]?.status === 'fulfilled' && results[8].value.data?.success) {
        setLogStats(results[8].value.data.data || null);
      }
      if (results[9]?.status === 'fulfilled' && results[9].value.data?.success) {
        setAllPrescriptions(results[9].value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const res = await axios.get('/api/admin/prescriptions');
      if (res.data?.success) {
        setAllPrescriptions(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin prescriptions:', err);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.allSettled([
        axios.get('/api/admin/logs'),
        axios.get('/api/admin/logs/stats')
      ]);
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.success) {
        setAllLogs(logsRes.value.data.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setLogStats(statsRes.value.data.data || null);
      }
    } catch (err) {
      console.error('Error fetching system logs:', err);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'system-logs') {
      fetchLogs();
    } else if (activeSection === 'prescriptions') {
      fetchPrescriptions();
    }
  }, [activeSection]);

  const formatLogTimestamp = (ts) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return ts;
    }
  };

  const formatRelativeTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const diffMs = Date.now() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMINISTRATOR':
        return { bg: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-600', label: 'Administrator' };
      case 'CHANNELING_COORDINATOR':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-600', label: 'Channeling Coordinator' };
      case 'FINANCE_OFFICER':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600', label: 'Finance Officer' };
      case 'CUSTOMER_SERVICE_EXECUTIVE':
      case 'CUSTOMER_SERVICE':
        return { bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', dot: 'bg-cyan-600', label: 'Support Executive' };
      case 'DOCTOR':
        return { bg: 'bg-teal-100 text-teal-800 border-teal-300', dot: 'bg-teal-600', label: 'Medical Doctor' };
      case 'PATIENT':
        return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', dot: 'bg-indigo-600', label: 'Patient' };
      case 'SYSTEM':
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500', label: 'System Service' };
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'SUCCESS':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: CheckCircle, label: 'SUCCESS', desc: 'Operation Completed Successfully' };
      case 'WARNING':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300', icon: AlertTriangle, label: 'WARNING', desc: 'Attention / Warning Alert' };
      case 'CRITICAL':
        return { bg: 'bg-rose-50 text-rose-800 border-rose-300', icon: ShieldAlert, label: 'CRITICAL', desc: 'Critical System Alert' };
      case 'INFO':
      default:
        return { bg: 'bg-sky-50 text-sky-800 border-sky-300', icon: Info, label: 'INFO', desc: 'Routine Informational Record' };
    }
  };

  // Helper to determine if a log's timestamp falls within the selected time window
  const matchesTimeFilter = (timestamp, timeFilter, customStart, customEnd) => {
    if (!timeFilter || timeFilter === 'ALL') return true;
    if (!timestamp) return false;
    const logDate = new Date(timestamp);
    if (isNaN(logDate.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeFilter === 'TODAY') {
      return logDate >= startOfToday && logDate <= endOfToday;
    }

    if (timeFilter === 'YESTERDAY') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return logDate >= startOfYesterday && logDate <= endOfYesterday;
    }

    if (timeFilter === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return logDate >= sevenDaysAgo;
    }

    if (timeFilter === 'LAST_30_DAYS') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return logDate >= thirtyDaysAgo;
    }

    if (timeFilter === 'THIS_MONTH') {
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    }

    if (timeFilter === 'CUSTOM') {
      if (customStart && customEnd) {
        const start = new Date(customStart + 'T00:00:00');
        const end = new Date(customEnd + 'T23:59:59');
        return logDate >= start && logDate <= end;
      } else if (customStart) {
        const start = new Date(customStart + 'T00:00:00');
        const end = new Date(customStart + 'T23:59:59');
        return logDate >= start && logDate <= end;
      } else if (customEnd) {
        const end = new Date(customEnd + 'T23:59:59');
        return logDate <= end;
      }
      return true;
    }

    return true;
  };

  const handleExportLogs = (format = 'json', exportList = null) => {
    const list = Array.isArray(exportList) ? exportList : allLogs;
    if (!list || list.length === 0) {
      alert("No logs available to export for the currently selected filter.");
      return;
    }

    const dateTag = new Date().toISOString().slice(0, 10);
    const isFiltered = list.length !== allLogs.length;
    const filterTag = isFiltered ? `_filtered_${list.length}_records` : '_all';

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `caresync_system_logs${filterTag}_${dateTag}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['LogId', 'FormattedTimestamp', 'RawTimestamp', 'PerformerName', 'PerformerRole', 'UserId', 'ActionType', 'EntityName', 'EntityId', 'Description', 'Severity', 'IpAddress'];
      const rows = list.map(l => [
        l.logId,
        `"${formatLogTimestamp(l.timestamp)}"`,
        `"${l.timestamp || ''}"`,
        `"${(l.performerName || '').replace(/"/g, '""')}"`,
        `"${(l.performerRole || '').replace(/"/g, '""')}"`,
        l.userId || '',
        `"${(l.actionType || '').replace(/"/g, '""')}"`,
        `"${(l.entityName || '').replace(/"/g, '""')}"`,
        l.entityId || '',
        `"${(l.description || '').replace(/"/g, '""')}"`,
        `"${(l.severity || '').replace(/"/g, '""')}"`,
        `"${(l.ipAddress || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodeURI(csvContent));
      downloadAnchor.setAttribute("download", `caresync_system_logs${filterTag}_${dateTag}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const fetchFeedbacks = async () => {
    setFeedbackLoading(true);
    try {
      const res = await axios.get('/api/feedback');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAllFeedbacks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleToggleFeedbackFeatured = async (feedbackId, currentStatus) => {
    setFeedbackActionLoading(feedbackId);
    try {
      const targetState = !currentStatus;
      const res = await axios.put(`/api/feedback/${feedbackId}/toggle-featured`, {
        isFeatured: targetState
      });
      if (res.data?.success) {
        setAllFeedbacks(prev => prev.map(f => f.feedbackId === feedbackId ? { ...f, isFeatured: targetState } : f));
        setFeedbackMsg({
          type: 'success',
          text: targetState
            ? `Review #${feedbackId} will now be displayed on the Front Landing Page!`
            : `Review #${feedbackId} removed from Front Landing Page display.`
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating feedback status.');
    } finally {
      setFeedbackActionLoading(null);
    }
  };

  // Delete & User Role Management Handlers
  const handleDeleteDoctor = async (doctorId, doctorName) => {
    const formattedId = formatDoctorId(doctorId);
    if (!window.confirm(`⚠️ Permanently delete Dr. ${doctorName || ''} (${formattedId})?\n\nThis will remove their profile, clinical sessions, and unlink appointments.`)) {
      return;
    }
    setDeleteLoadingId(doctorId);
    try {
      const res = await axios.delete(`/api/admin/doctors/${doctorId}`);
      if (res.data?.success) {
        alert(res.data.message || `Doctor ${formattedId} deleted successfully.`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete doctor.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    const formattedId = formatPatientId(patientId);
    if (!window.confirm(`⚠️ Permanently delete Patient ${patientName || ''} (${formattedId})?\n\nThis will remove their profile and registered history.`)) {
      return;
    }
    setDeleteLoadingId(patientId);
    try {
      const res = await axios.delete(`/api/admin/patients/${patientId}`);
      if (res.data?.success) {
        alert(res.data.message || `Patient ${formattedId} deleted successfully.`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete patient.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (staffId === 1 || Number(staffId) === 1) {
      alert('The Main Administrator account is permanently protected and cannot be deleted.');
      return;
    }
    const formattedId = formatStaffId(staffId);
    if (!window.confirm(`⚠️ Permanently delete staff user ${staffName || ''} (${formattedId})?`)) {
      return;
    }
    setDeleteLoadingId(staffId);
    try {
      const res = await axios.delete(`/api/admin/staff/${staffId}`);
      if (res.data?.success) {
        alert(res.data.message || `Staff user ${formattedId} deleted successfully.`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff user.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const uid = user.userId || user.id;
    if (uid === 1 || Number(uid) === 1 || user.username === 'admin') {
      alert('The Main Administrator account is permanently protected and cannot be deleted.');
      return;
    }
    const role = user.role || '';
    const formattedId = formatCustomId(user);
    if (!window.confirm(`⚠️ Permanently delete system user ${user.fullName || user.username} (${formattedId}) with role [${role}]?`)) {
      return;
    }
    setDeleteLoadingId(uid);
    try {
      const res = await axios.delete(`/api/admin/users/${uid}`);
      if (res.data?.success) {
        alert(res.data.message || `User ${formattedId} deleted successfully.`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (userId === 1 || Number(userId) === 1) {
      alert('The Main Administrator role is permanently locked and cannot be changed or revoked.');
      return;
    }
    try {
      const res = await axios.put(`/api/admin/users/${userId}/role?newRole=${newRole}`);
      if (res.data?.success) {
        alert(`User role updated to ${newRole}`);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  // Staff Management Helpers
  const getDepartmentForRole = (role) => {
    switch (role) {
      case 'CHANNELING_COORDINATOR': return 'Channeling Operations';
      case 'FINANCE_OFFICER': return 'Accounts & Finance';
      case 'CUSTOMER_SERVICE_EXECUTIVE': return 'Customer Support';
      case 'ADMINISTRATOR': return 'Administration & IT';
      default: return 'General Operations';
    }
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setNewStaffForm(prev => ({
      ...prev,
      role: selectedRole,
      department: getDepartmentForRole(selectedRole)
    }));
  };

  const handleGenerateStaffPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let gen = 'Staff@';
    for (let i = 0; i < 6; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaffForm(prev => ({ ...prev, password: gen }));
    setShowStaffPassword(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setAddStaffLoading(true);
    setAddStaffError('');
    try {
      const payload = {
        ...newStaffForm,
        permissions: newStaffForm.role === 'ADMINISTRATOR' ? selectedAdminPermissions.join(',') : null
      };
      const res = await axios.post('/api/admin/staff', payload);
      if (res.data?.success) {
        alert(`New ${newStaffForm.role} (${newStaffForm.fullName}) registered successfully!`);
        setShowAddStaffModal(false);
        setNewStaffForm({
          username: '',
          password: 'password123',
          fullName: '',
          contactNumber: '',
          nic: '',
          role: 'CHANNELING_COORDINATOR',
          department: 'Channeling Operations'
        });
        setSelectedAdminPermissions(['MANAGE_USERS', 'MANAGE_DOCTORS', 'MANAGE_PATIENTS', 'VIEW_ANALYTICS', 'DELETE_RECORDS']);
        await fetchAdminData();
      }
    } catch (err) {
      setAddStaffError(err.response?.data?.message || 'Failed to register staff user');
    } finally {
      setAddStaffLoading(false);
    }
  };

  const handleSaveAdminPermissions = async (userId, permissionsArray) => {
    if (userId === 1 || Number(userId) === 1) {
      alert('Main Administrator permissions are permanently locked and cannot be modified.');
      return;
    }
    setPermissionSaving(true);
    try {
      const permString = permissionsArray.join(',');
      const res = await axios.put(`/api/admin/staff/${userId}/permissions?permissions=${encodeURIComponent(permString)}`);
      if (res.data?.success) {
        alert('Administrator permissions updated successfully!');
        setEditingAdminPermissionsUser(null);
        await fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update administrator permissions');
    } finally {
      setPermissionSaving(false);
    }
  };

  const handleToggleStaffStatus = async (staffId, currentStatus) => {
    if (staffId === 1 || Number(staffId) === 1) {
      alert('The Main Administrator cannot be deactivated.');
      return;
    }
    const nextStatus = !currentStatus;
    const action = nextStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this staff account?`)) return;

    try {
      await axios.put(`/api/admin/staff/${staffId}/status?isActive=${nextStatus}`);
      setAllStaff(prev => prev.map(s => (s.userId === staffId ? { ...s, isActive: nextStatus } : s)));
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} staff account`);
    }
  };

  const openEditStaffModal = (staff) => {
    setEditingStaff(staff);
    setEditStaffForm({
      fullName: staff.fullName || '',
      contactNumber: staff.contactNumber || '',
      department: staff.department || '',
      role: staff.role || staff.staffRole || 'CHANNELING_COORDINATOR'
    });
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditStaffLoading(true);
    try {
      const res = await axios.put(`/api/admin/staff/${editingStaff.userId}`, editStaffForm);
      if (res.data?.success) {
        alert('Staff details updated successfully!');
        setEditingStaff(null);
        await fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update staff details');
    } finally {
      setEditStaffLoading(false);
    }
  };

  const handleApproval = async (doctorId, approved) => {
    const docId = Number(doctorId);
    try {
      // Optimistically update lists immediately
      setPendingDoctors(prev => prev.filter(doc => (doc.userId || doc.doctorId || doc.id) !== docId));
      setAllDoctors(prev => prev.map(doc => {
        const did = doc.userId || doc.doctorId || doc.id;
        if (did === docId) {
          return { ...doc, isApproved: approved, isActive: approved };
        }
        return doc;
      }));

      await axios.put(`/api/admin/doctors/${docId}/approve`, {
        approved: approved,
        adminId: 1 // Ishara Gunasekara
      });
      alert(`Doctor account ${approved ? 'approved and activated' : 'rejected'}.`);
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing approval');
      await fetchAdminData();
    }
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/doctors/register', {
        username,
        password,
        fullName,
        contactNumber,
        nic,
        medicalLicenseNo,
        specialization,
        qualifications,
        consultationFee: parseFloat(consultationFee),
        hospitalAffiliation,
        profileImage: doctorProfileImage
      });

      alert('Doctor registration submitted! Now pending administrative license verification.');
      setShowAddDoctor(false);
      fetchAdminData();
    } catch (err) {
      if (!err.response) {
        alert('Cannot connect to backend server! Please ensure EChannelingApplication is running on port 8080.');
      } else {
        alert(err.response?.data?.message || 'Failed to register doctor.');
      }
    }
  };

  // Open Edit Patient Modal
  const openEditPatientModal = (patient) => {
    setEditingPatient(patient);
    const dob = patient.dateOfBirth || '';
    const computedAge = calculateAgeFromDob(dob);
    setEditFormData({
      fullName: patient.fullName || '',
      contactNumber: patient.contactNumber || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      bloodGroup: patient.bloodGroup || 'A+',
      dateOfBirth: dob,
      age: computedAge !== '' ? computedAge : (patient.age || 0),
      gender: patient.gender || 'Male',
      isActive: isAccountActive(patient),
      profileImage: patient.profileImage || ''
    });
    setEditSuccessMsg('');
  };

  // Helper to reliably determine if any account is active
  const isAccountActive = (user) => {
    if (!user) return false;
    if (user.isActive === false || user.isActive === 'false' || user.active === false || user.active === 'false') return false;
    return true;
  };

  // Helper to resize any image file to clean base64 dataUrl
  const processImageFile = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAdminPatientPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file, (dataUrl) => {
      setEditFormData(prev => ({ ...prev, profileImage: dataUrl }));
    });
  };

  const handleNewDoctorPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file, (dataUrl) => {
      setDoctorProfileImage(dataUrl);
    });
  };

  const handleEditDoctorPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    processImageFile(file, (dataUrl) => {
      setEditDoctorForm(prev => ({ ...prev, profileImage: dataUrl }));
    });
  };

  // Open Edit Doctor Modal
  const openEditDoctorModal = (doctor) => {
    setEditingDoctor(doctor);
    setEditDoctorForm({
      fullName: doctor.fullName || '',
      contactNumber: doctor.contactNumber || '',
      specialization: doctor.specialization || 'Cardiology',
      qualifications: doctor.qualifications || '',
      medicalLicenseNo: doctor.medicalLicenseNo || '',
      consultationFee: doctor.consultationFee || 3000,
      hospitalAffiliation: doctor.hospitalAffiliation || '',
      profileImage: doctor.profileImage || '',
      isActive: isAccountActive(doctor),
      isApproved: doctor.isApproved !== false
    });
    setEditDoctorSuccessMsg('');
  };

  // Save Doctor Updates (PUT /api/doctors/:id or /api/admin/doctors/:id)
  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    const docId = editingDoctor.userId || editingDoctor.doctorId || editingDoctor.id;
    setEditDoctorLoading(true);
    setEditDoctorSuccessMsg('');

    try {
      const payload = {
        ...editDoctorForm,
        consultationFee: parseFloat(editDoctorForm.consultationFee)
      };

      let res;
      try {
        res = await axios.put(`/api/doctors/${docId}`, payload);
      } catch (err1) {
        res = await axios.put(`/api/admin/doctors/${docId}`, payload);
      }

      if (res?.data?.success) {
        const updatedDoc = res.data.data;
        // Optimistically update doctor across all local lists immediately
        if (updatedDoc) {
          setAllDoctors(prev => prev.map(d => {
            const currentId = d.userId || d.doctorId || d.id;
            return currentId === docId ? { ...d, ...updatedDoc } : d;
          }));
        }
        setEditDoctorSuccessMsg('Doctor details and credentials updated successfully!');
        await fetchAdminData();
        setTimeout(() => {
          setEditingDoctor(null);
          setEditDoctorSuccessMsg('');
        }, 1000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update doctor profile.');
    } finally {
      setEditDoctorLoading(false);
    }
  };

  // Save Patient Updates (PUT /api/patients/:id or /api/admin/patients/:id)
  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    const patId = editingPatient.userId || editingPatient.patientId || editingPatient.id;
    setEditLoading(true);
    setEditSuccessMsg('');

    try {
      const payload = {
        ...editFormData,
        age: typeof editFormData.age === 'number' ? editFormData.age : (parseInt(editFormData.age) || 0),
        dateOfBirth: editFormData.dateOfBirth && String(editFormData.dateOfBirth).trim() ? String(editFormData.dateOfBirth).trim() : null
      };

      let res;
      try {
        res = await axios.put(`/api/admin/patients/${patId}`, payload);
      } catch (err1) {
        res = await axios.put(`/api/patients/${patId}`, payload);
      }

      if (res?.data?.success) {
        const updatedPatient = res.data.data;
        // Optimistically update patient across all local lists immediately
        if (updatedPatient) {
          setAllPatients(prev => prev.map(p => {
            const currentId = p.userId || p.patientId || p.id;
            return currentId === patId ? { ...p, ...updatedPatient } : p;
          }));
        }
        setEditSuccessMsg('Patient details updated successfully in database!');
        await fetchAdminData();
        setTimeout(() => {
          setEditingPatient(null);
          setEditSuccessMsg('');
        }, 1000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update patient details.');
    } finally {
      setEditLoading(false);
    }
  };

  // Quick toggle patient active/deactivate status
  const handleTogglePatientStatus = async (patient) => {
    const currentlyActive = isAccountActive(patient);
    const newStatus = !currentlyActive;
    const patId = patient.userId || patient.patientId || patient.id;
    const confirmMsg = newStatus
      ? `Are you sure you want to RE-ACTIVATE the patient account for "${patient.fullName}"?`
      : `Are you sure you want to DEACTIVATE the patient account for "${patient.fullName}"?`;
    if (!window.confirm(confirmMsg)) return;

    // 1. Optimistically update local state immediately so badge and button change right away
    setAllPatients(prev => prev.map(p => {
      const currentId = p.userId || p.patientId || p.id;
      if (currentId === patId) {
        return { ...p, isActive: newStatus, active: newStatus };
      }
      return p;
    }));

    // 2. Call backend endpoint with fallbacks
    try {
      try {
        await axios.put(`/api/admin/patients/${patId}/status?isActive=${newStatus}`);
      } catch (err1) {
        try {
          await axios.put(`/api/patients/${patId}/status?isActive=${newStatus}`);
        } catch (err2) {
          await axios.put(`/api/patients/${patId}`, { isActive: newStatus });
        }
      }
      await fetchAdminData();
    } catch (err) {
      // Revert if error
      setAllPatients(prev => prev.map(p => {
        const currentId = p.userId || p.patientId || p.id;
        if (currentId === patId) {
          return { ...p, isActive: currentlyActive, active: currentlyActive };
        }
        return p;
      }));
      alert(err.response?.data?.message || 'Error updating patient account status.');
    }
  };

  // Quick toggle doctor active/deactivate status
  const handleToggleDoctorStatus = async (doctor) => {
    const currentlyActive = isAccountActive(doctor);
    const newStatus = !currentlyActive;
    const docId = doctor.userId || doctor.doctorId || doctor.id;
    const confirmMsg = newStatus
      ? `Are you sure you want to RE-ACTIVATE Dr. ${doctor.fullName}? The doctor will be available for patient channeling.`
      : `Are you sure you want to DEACTIVATE Dr. ${doctor.fullName}? The doctor's profile and active consultation sessions will be suspended.`;
    if (!window.confirm(confirmMsg)) return;

    // 1. Optimistically update local state immediately
    setAllDoctors(prev => prev.map(d => {
      const currentId = d.userId || d.doctorId || d.id;
      if (currentId === docId) {
        return { ...d, isActive: newStatus, active: newStatus };
      }
      return d;
    }));

    // 2. Call backend endpoint with fallbacks
    try {
      try {
        await axios.put(`/api/admin/doctors/${docId}/status?isActive=${newStatus}`);
      } catch (err1) {
        await axios.put(`/api/doctors/${docId}`, { isActive: newStatus });
      }
      await fetchAdminData();
    } catch (err) {
      // Revert if error
      setAllDoctors(prev => prev.map(d => {
        const currentId = d.userId || d.doctorId || d.id;
        if (currentId === docId) {
          return { ...d, isActive: currentlyActive, active: currentlyActive };
        }
        return d;
      }));
      alert(err.response?.data?.message || 'Error updating doctor account status.');
    }
  };

  const filteredPatients = allPatients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const term = patientSearch.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(term) ||
      p.nic?.toLowerCase().includes(term) ||
      p.contactNumber?.includes(term) ||
      p.username?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              System Administration & Patient Governance
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 text-xs px-2.5 py-1 rounded-full border border-emerald-300/30 font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Admin: Ishara Gunasekara
            </span>
          </div>
          <p className="text-emerald-100/80 text-xs sm:text-sm font-normal">
            Patient Profiles & Record Maintenance • Doctor Credential Verification • Hospital System KPIs
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-stretch sm:self-auto justify-start xl:justify-end">
          <button
            onClick={() => fetchAdminData()}
            disabled={refreshing}
            className="h-10 px-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Refresh All Admin Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white border border-emerald-500/50 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff User</span>
          </button>
          <button
            onClick={() => setShowAddDoctor(true)}
            className="h-10 px-4 bg-white hover:bg-emerald-50 active:scale-95 text-teal-950 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-teal-700" />
            <span>Register New Doctor</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ANALYTICS & SYSTEM OVERVIEW (activeSection === 'analytics')             */}
      {/* ========================================================================= */}
      {(activeSection === 'analytics' || !activeSection) && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium">Total Patients</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{allPatients.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Editable in system</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium">Registered Doctors</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.totalDoctors || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium">Verified Active</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{stats?.approvedDoctors || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium">Pending Approvals</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats?.pendingDoctors || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium">Total Staff Users</div>
              <div className="text-2xl font-black text-teal-700 mt-1">{allStaff.length}</div>
              <div className="text-[10px] text-teal-600 mt-0.5">Role-based users</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-medium">Appointments Made</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{stats?.totalAppointments || 0}</div>
            </div>
          </div>

          {/* Quick System Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" /> Patient Demographics
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {allPatients.filter(p => isAccountActive(p)).length} Active
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Total registered user base comprises {allPatients.length} patients with emergency contacts, blood groups, and verified national identities.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Deactivated Accounts:</span>
                <span className="font-bold text-rose-600">{allPatients.filter(p => !isAccountActive(p)).length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" /> Clinical Faculty
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {allDoctors.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Medical consultants actively delivering outpatient channeling services across cardiology, neurology, pediatrics, and general practice.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Practicing / Active:</span>
                <span className="font-bold text-blue-700">{allDoctors.filter(d => isAccountActive(d)).length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-600" /> Verification Desk
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {pendingDoctors.length} Awaiting
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {pendingDoctors.length > 0
                  ? `${pendingDoctors.length} doctor profile(s) awaiting administrative SLMC medical credential review.`
                  : 'All doctor profiles verified and approved. No credentials pending review.'}
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Compliance Status:</span>
                <span className="font-bold text-emerald-600">SLMC Aligned</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PATIENT DIRECTORY & RECORD EDITING (activeSection === 'patients')       */}
      {/* ========================================================================= */}
      {activeSection === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Patient Profiles & Records Management ({allPatients.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Administrators can view comprehensive patient records and edit contact details, addresses, and emergency information.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => fetchAdminData()}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer shrink-0"
                title="Refresh Patients List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              {/* Search bar */}
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, NIC or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No patient records match the search filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Full Name & Username</th>
                    <th className="py-3 px-3">NIC Number</th>
                    <th className="py-3 px-3">Contact Details</th>
                    <th className="py-3 px-3">Age / Gender</th>
                    <th className="py-3 px-3">Blood Group</th>
                    <th className="py-3 px-3">Address & Emergency</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => {
                    const patId = p.userId || p.patientId || p.id;
                    return (
                      <tr key={patId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                            {formatPatientId(p)}
                          </span>
                        </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {p.profileImage ? (
                              <img src={p.profileImage} alt={p.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{p.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{p.nic}</td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-semibold">{p.contactNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 text-[10px]">
                          {p.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="truncate text-slate-700" title={p.address}>{p.address}</div>
                        {p.emergencyContact && (
                          <div className="text-[10px] text-slate-400">Em: {p.emergencyContact}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                          isAccountActive(p)
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAccountActive(p) ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {isAccountActive(p) ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditPatientModal(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold border border-teal-200 text-xs inline-flex items-center gap-1 transition shadow-sm"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Record
                        </button>
                        <button
                          onClick={() => handleTogglePatientStatus(p)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5 ${
                            isAccountActive(p)
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          }`}
                        >
                          {isAccountActive(p) ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Reactivate Account
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patId, p.fullName)}
                          disabled={deleteLoadingId === patId}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 text-xs inline-flex items-center gap-1 transition shadow-sm"
                          title="Permanently Delete Patient Record"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PENDING DOCTOR APPROVALS (activeSection === 'approvals')                */}
      {/* ========================================================================= */}
      {activeSection === 'approvals' && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Pending Medical License Verifications ({pendingDoctors.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAdminData()}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 active:scale-95 text-amber-900 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Refresh Pending Approvals"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <span className="text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full font-semibold border border-amber-200">
                Action Required
              </span>
            </div>
          </div>

          {pendingDoctors.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No doctors currently pending approval. All credentials verified!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingDoctors.map((doc) => {
                const docId = doc.userId || doc.doctorId || doc.id;
                return (
                  <div key={docId} className="py-3 flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{doc.fullName}</span>
                        <span className="font-mono text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                          {formatDoctorId(doc)}
                        </span>
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">{doc.specialization}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{doc.qualifications}</p>
                      <p className="text-slate-600 text-[11px] mt-1">
                        <span className="font-semibold text-slate-800">SLMC License No:</span> {doc.medicalLicenseNo} • 
                        <span className="font-semibold text-slate-800 ml-1">Hospital:</span> {doc.hospitalAffiliation} • 
                        <span className="font-semibold text-slate-800 ml-1">Fee:</span> LKR {doc.consultationFee}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproval(docId, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Activate
                      </button>
                      <button
                        onClick={() => handleApproval(docId, false)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ALL REGISTERED DOCTORS (activeSection === 'doctor-list')              */}
      {/* ========================================================================= */}
      {activeSection === 'doctor-list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Medical Doctors Directory & Clinical Staff ({allDoctors.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Administrators can manage practicing doctors and activate or deactivate doctor profiles.
              </p>
            </div>
            <button
              onClick={() => fetchAdminData()}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Refresh Doctors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {allDoctors.map((d) => {
              const docId = d.userId || d.doctorId || d.id;
              return (
                <div key={docId} className="py-3.5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50/70 p-2 rounded-xl transition">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold flex-shrink-0 shadow-sm overflow-hidden">
                    {d.profileImage ? (
                      <img src={d.profileImage} alt={d.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{d.fullName}</span>
                      <span className="font-mono text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                        {formatDoctorId(d)}
                      </span>
                      <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold text-[10px] border border-teal-200">
                        {d.specialization}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      <span className="font-semibold text-slate-700">SLMC:</span> {d.medicalLicenseNo} • 
                      <span className="font-semibold text-slate-700 ml-1">NIC:</span> {d.nic} • 
                      <span className="font-semibold text-slate-700 ml-1">Hospital:</span> {d.hospitalAffiliation || 'General Channeling'} • 
                      <span className="font-semibold text-slate-700 ml-1">Fee:</span> LKR {d.consultationFee?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-auto flex-wrap">
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                    !isAccountActive(d)
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : !d.isApproved
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      !isAccountActive(d) ? 'bg-rose-600' : !d.isApproved ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}></span>
                    {!isAccountActive(d)
                      ? 'Deactivated'
                      : !d.isApproved
                      ? 'Pending Approval'
                      : 'Active Practice'}
                  </span>

                  {/* Quick Approve License Button if Pending */}
                  {!d.isApproved && (
                    <button
                      onClick={() => handleApproval(d.userId || d.doctorId || d.id, true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5"
                      title="Verify SLMC License and Approve Doctor"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve License
                    </button>
                  )}

                  {/* Edit Doctor Details Button */}
                  <button
                    onClick={() => openEditDoctorModal(d)}
                    className="bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-2xs inline-flex items-center gap-1.5"
                    title="Edit Doctor Details & Profile Picture"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Details
                  </button>

                  {/* Activation / Deactivation Toggle Button */}
                  <button
                    onClick={() => handleToggleDoctorStatus(d)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5 ${
                      isAccountActive(d)
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isAccountActive(d) ? (
                      <>
                        <UserX className="w-3.5 h-3.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Reactivate
                      </>
                    )}
                  </button>

                  {/* Delete Doctor Button */}
                  <button
                    onClick={() => handleDeleteDoctor(docId, d.fullName)}
                    disabled={deleteLoadingId === docId}
                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5"
                    title="Permanently Delete Doctor Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYSTEM USERS & ROLES MANAGEMENT (activeSection === 'users' || 'staff')  */}
      {/* ========================================================================= */}
      {(activeSection === 'users' || activeSection === 'staff') && (() => {
        // Merge base users with enriched Doctor, Patient, and Staff data
        const mergedUsersMap = new Map();

        allUsers.forEach(u => {
          const uid = u.userId || u.id;
          if (uid) mergedUsersMap.set(uid, { ...u });
        });

        allStaff.forEach(s => {
          const id = s.userId || s.staffId || s.id;
          if (id) {
            const existing = mergedUsersMap.get(id) || {};
            mergedUsersMap.set(id, { ...existing, ...s });
          }
        });

        allDoctors.forEach(d => {
          const id = d.userId || d.doctorId || d.id;
          if (id) {
            const existing = mergedUsersMap.get(id) || {};
            mergedUsersMap.set(id, { ...existing, ...d, role: 'DOCTOR' });
          }
        });

        allPatients.forEach(p => {
          const id = p.userId || p.patientId || p.id;
          if (id) {
            const existing = mergedUsersMap.get(id) || {};
            mergedUsersMap.set(id, { ...existing, ...p, role: 'PATIENT' });
          }
        });

        const displayUsersList = Array.from(mergedUsersMap.values());

        const filteredUsers = displayUsersList.filter((u) => {
          const q = staffSearch.toLowerCase().trim();
          const role = (u.role || u.staffRole || '').toUpperCase();
          const customId = formatCustomId(u).toLowerCase();
          const matchesSearch = !q ||
            u.fullName?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q) ||
            u.nic?.toLowerCase().includes(q) ||
            u.contactNumber?.toLowerCase().includes(q) ||
            u.department?.toLowerCase().includes(q) ||
            u.specialization?.toLowerCase().includes(q) ||
            role.toLowerCase().includes(q) ||
            customId.includes(q);

          const matchesRole = staffRoleFilter === 'ALL' || role === staffRoleFilter;
          const active = isAccountActive(u);
          const matchesStatus = staffStatusFilter === 'ALL' ||
            (staffStatusFilter === 'ACTIVE' && active) ||
            (staffStatusFilter === 'INACTIVE' && !active);

          return matchesSearch && matchesRole && matchesStatus;
        });

        const totalDoctors = displayUsersList.filter(u => (u.role || u.staffRole) === 'DOCTOR').length;
        const totalPatients = displayUsersList.filter(u => (u.role || u.staffRole) === 'PATIENT').length;
        const totalCoordinators = displayUsersList.filter(u => (u.role || u.staffRole) === 'CHANNELING_COORDINATOR').length;
        const totalFinance = displayUsersList.filter(u => (u.role || u.staffRole) === 'FINANCE_OFFICER').length;
        const totalCSE = displayUsersList.filter(u => (u.role || u.staffRole) === 'CUSTOMER_SERVICE_EXECUTIVE' || (u.role || u.staffRole) === 'CUSTOMER_SERVICE').length;
        const totalAdmins = displayUsersList.filter(u => (u.role || u.staffRole) === 'ADMINISTRATOR').length;

        const getRoleConfig = (role) => {
          switch (role) {
            case 'DOCTOR':
              return { label: 'Medical Doctor', color: 'bg-teal-100 text-teal-900 border-teal-200', icon: Stethoscope };
            case 'PATIENT':
              return { label: 'Patient', color: 'bg-emerald-100 text-emerald-900 border-emerald-200', icon: User };
            case 'CHANNELING_COORDINATOR':
              return { label: 'Channeling Coordinator', color: 'bg-amber-100 text-amber-900 border-amber-200', icon: Calendar };
            case 'FINANCE_OFFICER':
              return { label: 'Finance Officer', color: 'bg-teal-100 text-teal-900 border-teal-200', icon: CreditCard };
            case 'CUSTOMER_SERVICE_EXECUTIVE':
            case 'CUSTOMER_SERVICE':
              return { label: 'Customer Support', color: 'bg-rose-100 text-rose-900 border-rose-200', icon: Headphones };
            case 'ADMINISTRATOR':
              return { label: 'System Admin', color: 'bg-slate-100 text-slate-900 border-slate-300', icon: Shield };
            case 'REVOKED':
            case 'UNASSIGNED':
            case 'NONE':
              return { label: 'Role Revoked / None', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: ShieldOff };
            default:
              return { label: role || 'USER', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: User };
          }
        };

        const handleEditUser = (user) => {
          const role = (user.role || '').toUpperCase();
          if (role === 'DOCTOR') {
            openEditDoctorModal(user);
          } else if (role === 'PATIENT') {
            openEditPatientModal(user);
          } else {
            openEditStaffModal(user);
          }
        };

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  System Users & Staff Roles Management ({displayUsersList.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage accounts, reassign roles, register new doctors and staff, or delete users and doctors as needed.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  onClick={() => fetchAdminData()}
                  disabled={refreshing}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  title="Refresh Users & Staff"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={() => setShowAddDoctor(true)}
                  className="bg-white hover:bg-slate-50 text-teal-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-teal-300 shadow-sm transition cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> + Register Doctor
                </button>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + Add Staff Member
                </button>
              </div>
            </div>

            {/* Quick KPI stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div 
                onClick={() => setStaffRoleFilter('DOCTOR')}
                className={`p-3 rounded-xl border text-xs space-y-0.5 cursor-pointer transition ${
                  staffRoleFilter === 'DOCTOR' ? 'bg-teal-100/60 border-teal-400 ring-2 ring-teal-200' : 'bg-teal-50/70 border-teal-200 hover:bg-teal-100/40'
                }`}
              >
                <span className="text-[10px] font-bold text-teal-700 uppercase">Doctors</span>
                <div className="text-xl font-black text-teal-900">{totalDoctors}</div>
                <span className="text-[11px] text-teal-600">ID Prefix: DOC0001</span>
              </div>
              <div 
                onClick={() => setStaffRoleFilter('PATIENT')}
                className={`p-3 rounded-xl border text-xs space-y-0.5 cursor-pointer transition ${
                  staffRoleFilter === 'PATIENT' ? 'bg-emerald-100/60 border-emerald-400 ring-2 ring-emerald-200' : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/40'
                }`}
              >
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Patients</span>
                <div className="text-xl font-black text-emerald-900">{totalPatients}</div>
                <span className="text-[11px] text-emerald-600">ID Prefix: PAT0001</span>
              </div>
              <div 
                onClick={() => setStaffRoleFilter('CHANNELING_COORDINATOR')}
                className={`p-3 rounded-xl border text-xs space-y-0.5 cursor-pointer transition ${
                  staffRoleFilter === 'CHANNELING_COORDINATOR' ? 'bg-amber-100/60 border-amber-400 ring-2 ring-amber-200' : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/40'
                }`}
              >
                <span className="text-[10px] font-bold text-amber-700 uppercase">Coordinators</span>
                <div className="text-xl font-black text-amber-900">{totalCoordinators}</div>
                <span className="text-[11px] text-amber-600">Channeling Logistics</span>
              </div>
              <div 
                onClick={() => setStaffRoleFilter('ALL')}
                className={`p-3 rounded-xl border text-xs space-y-0.5 cursor-pointer transition ${
                  staffRoleFilter === 'ALL' ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-600 uppercase">Other Staff</span>
                <div className="text-xl font-black text-slate-900">{totalFinance + totalCSE + totalAdmins}</div>
                <span className="text-[11px] text-slate-500">Finance, CSE & Admin</span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Name, Username, NIC, ID (e.g. DOC0001, PAT0001, STAFF0001), or Department..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={staffRoleFilter}
                    onChange={(e) => setStaffRoleFilter(e.target.value)}
                    className="text-xs text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
                  >
                    <option value="ALL">All Roles ({displayUsersList.length})</option>
                    <option value="DOCTOR">Medical Doctors ({totalDoctors})</option>
                    <option value="PATIENT">Patients ({totalPatients})</option>
                    <option value="CHANNELING_COORDINATOR">Channeling Coordinators ({totalCoordinators})</option>
                    <option value="FINANCE_OFFICER">Finance Officers ({totalFinance})</option>
                    <option value="CUSTOMER_SERVICE_EXECUTIVE">Customer Support ({totalCSE})</option>
                    <option value="ADMINISTRATOR">System Administrators ({totalAdmins})</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <select
                    value={staffStatusFilter}
                    onChange={(e) => setStaffStatusFilter(e.target.value)}
                    className="text-xs text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Deactivated Only</option>
                  </select>
                </div>

                {(staffSearch || staffRoleFilter !== 'ALL' || staffStatusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setStaffSearch('');
                      setStaffRoleFilter('ALL');
                      setStaffStatusFilter('ALL');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between items-center px-1">
              <span>Showing <strong>{filteredUsers.length}</strong> of {displayUsersList.length} system users</span>
            </div>

            {/* Users list */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No users match your criteria</p>
                <p className="text-[11px]">Adjust your search query or filters above.</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {filteredUsers.map((u) => {
                  const uid = u.userId || u.id;
                  const role = (u.role || u.staffRole || 'PATIENT').toUpperCase();
                  const roleConfig = getRoleConfig(role);
                  const RoleIcon = roleConfig.icon;
                  const active = isAccountActive(u);
                  const customId = formatCustomId(u);
                  const isMainAdmin = Number(uid) === 1 || u.username === 'admin';

                  return (
                    <div
                      key={`${role}-${uid}`}
                      className="p-3.5 bg-white hover:bg-slate-50/90 border border-slate-200/85 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col xl:flex-row justify-between xl:items-center gap-3.5"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black flex-shrink-0 shadow-2xs text-sm overflow-hidden">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            u.fullName?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm leading-snug">{u.fullName}</span>
                            <span className="font-mono text-[10px] text-slate-400">@{u.username}</span>
                            <span className="font-mono text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                              {customId}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${roleConfig.color}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleConfig.label}
                            </span>
                            {isMainAdmin && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                🛡️ Super Admin (Protected)
                              </span>
                            )}
                            {u.department && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-200">
                                {u.department}
                              </span>
                            )}
                            {u.specialization && (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200">
                                {u.specialization}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                            <span>Phone: <strong>{u.contactNumber || 'N/A'}</strong></span>
                            <span>NIC: <strong>{u.nic || 'N/A'}</strong></span>
                            {u.medicalLicenseNo && (
                              <span>SLMC: <strong>{u.medicalLicenseNo}</strong></span>
                            )}
                            {u.bloodGroup && (
                              <span>Blood: <strong className="text-rose-600">{u.bloodGroup}</strong></span>
                            )}
                            {role === 'ADMINISTRATOR' && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="font-bold text-slate-700 text-[10px]">Modules:</span>
                                {isMainAdmin ? (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                    Full SuperAdmin Access (Unrestricted)
                                  </span>
                                ) : (
                                  u.permissions ? (
                                    u.permissions.split(',').filter(Boolean).map(perm => (
                                      <span key={perm} className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                                        {perm.replace('MANAGE_', '').replace('VIEW_', '').replace('_', ' ')}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] italic">
                                      No modules assigned
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                        {/* Tier 1: Role Configuration & Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Badge */}
                          <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] border flex items-center gap-1.5 ${
                            active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {active ? 'Active' : 'Deactivated'}
                          </span>

                          {/* Role Selector with clean label */}
                          {isMainAdmin ? (
                            <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-slate-200 inline-flex items-center gap-1" title="Main Administrator role is permanently locked">
                              🔒 Role Locked
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role:</span>
                              <select
                                value={role}
                                onChange={(e) => {
                                  const newRole = e.target.value;
                                  if (window.confirm(`Change role of ${u.fullName} (${customId}) from ${role} to ${newRole}?`)) {
                                    handleChangeUserRole(uid, newRole);
                                  }
                                }}
                                className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:text-teal-700"
                                title="Reassign or Change User Role"
                              >
                                <option value="ADMINISTRATOR">Admin</option>
                                <option value="CHANNELING_COORDINATOR">Coordinator</option>
                                <option value="FINANCE_OFFICER">Finance</option>
                                <option value="CUSTOMER_SERVICE_EXECUTIVE">Support</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="PATIENT">Patient</option>
                                <option value="REVOKED">🚫 Revoke Role</option>
                              </select>
                            </div>
                          )}

                          {/* Quick Revoke Role Button */}
                          {!isMainAdmin && role !== 'REVOKED' && role !== 'UNASSIGNED' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to DELETE / REVOKE the role '${role}' for ${u.fullName} (${customId})? This will strip their system privileges.`)) {
                                  handleChangeUserRole(uid, 'REVOKED');
                                }
                              }}
                              className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                              title="Delete / Revoke User Role"
                            >
                              <ShieldOff className="w-3 h-3 text-amber-600" /> Revoke Role
                            </button>
                          )}
                        </div>

                        {/* Tier 2: Action Toolbar (Permissions, Edit, Deactivate, Delete) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Configure Permissions for Sub-Admins */}
                          {!isMainAdmin && role === 'ADMINISTRATOR' && (
                            <button
                              onClick={() => {
                                setEditingAdminPermissionsUser(u);
                                const currentPerms = (u.permissions || '')
                                  .split(',')
                                  .map(p => p.trim())
                                  .filter(Boolean);
                                setPermissionModalSelected(currentPerms);
                              }}
                              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 shadow-2xs"
                              title="Configure Specific Module Permissions"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Permissions
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditUser(u)}
                            className="bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 shadow-2xs"
                            title="Edit User Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>

                          {/* Toggle Status Button */}
                          {!isMainAdmin && (
                            <button
                              onClick={() => {
                                if (role === 'DOCTOR') {
                                  handleToggleDoctorStatus(u);
                                } else if (role === 'PATIENT') {
                                  handleTogglePatientStatus(u);
                                } else {
                                  handleToggleStaffStatus(uid, active);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition shadow-2xs inline-flex items-center gap-1 ${
                                active
                                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {active ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" /> Reactivate
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete User/Doctor Button */}
                          {!isMainAdmin && (
                            <button
                              onClick={() => {
                                if (role === 'DOCTOR') {
                                  handleDeleteDoctor(uid, u.fullName);
                                } else if (role === 'PATIENT') {
                                  handleDeletePatient(uid, u.fullName);
                                } else {
                                  handleDeleteUser(u);
                                }
                              }}
                              disabled={deleteLoadingId === uid}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 shadow-2xs"
                              title="Permanently Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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
        );
      })()}

      {/* ========================================================================= */}
      {/* 6. PATIENT REVIEWS & FEEDBACKS MANAGEMENT (activeSection === 'feedbacks') */}
      {/* ========================================================================= */}
      {activeSection === 'feedbacks' && (() => {
        const totalFeedbacks = allFeedbacks.length;
        const featuredFeedbacks = allFeedbacks.filter(f => f.isFeatured);
        const featuredCount = featuredFeedbacks.length;
        const fiveStarCount = allFeedbacks.filter(f => f.rating === 5).length;
        const avgRating = totalFeedbacks > 0 
          ? (allFeedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) / totalFeedbacks).toFixed(1)
          : '5.0';

        const filteredFeedbacks = allFeedbacks.filter(f => {
          const q = feedbackSearch.toLowerCase().trim();
          const pName = f.patient?.fullName?.toLowerCase() || '';
          const dName = f.doctor?.fullName?.toLowerCase() || '';
          const spec = f.doctor?.specialization?.toLowerCase() || '';
          const comm = f.comments?.toLowerCase() || '';
          const matchSearch = !q || pName.includes(q) || dName.includes(q) || spec.includes(q) || comm.includes(q);

          const matchRating = feedbackRatingFilter === 'ALL' || String(f.rating) === feedbackRatingFilter;

          const matchFeatured = feedbackFeaturedFilter === 'ALL' ||
            (feedbackFeaturedFilter === 'FEATURED' && f.isFeatured) ||
            (feedbackFeaturedFilter === 'NON_FEATURED' && !f.isFeatured);

          return matchSearch && matchRating && matchFeatured;
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-3 py-0.5 rounded-full border border-white/20">
                    Patient Experience & Public Relations
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <Star className="w-6 h-6 text-amber-200 fill-amber-300" />
                  Patient Feedbacks & Landing Page Testimonials
                </h1>
                <p className="text-xs text-amber-100/90 mt-1 max-w-2xl leading-relaxed">
                  Review ratings and clinical feedback submitted by patients. Toggle the switch on any review to feature it directly on the front landing page (Home) or hide it from public display.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchFeedbacks}
                disabled={feedbackLoading}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-2xl text-xs backdrop-blur-sm border border-white/25 shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${feedbackLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Feedbacks</span>
              </button>
            </div>

            {/* Notification Toast */}
            {feedbackMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Feedbacks */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Feedbacks
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {totalFeedbacks}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    Submitted by verified patients
                  </p>
                </div>
              </div>

              {/* Featured on Home */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-2xs ring-1 ring-emerald-500/20 hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Featured on Home
                  </span>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0 uppercase tracking-wide">
                    Live Public
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                    {featuredCount}
                  </div>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    Displayed on landing page
                  </p>
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Average Rating
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight flex items-baseline gap-1.5">
                    {avgRating} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    Across all medical specialists
                  </p>
                </div>
              </div>

              {/* 5-Star Reviews */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    5-Star Reviews
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Quote className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {fiveStarCount}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {totalFeedbacks > 0 ? `${Math.round((fiveStarCount / totalFeedbacks) * 100)}% of total reviews` : '100% of reviews'}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient, doctor, specialization, or review comment..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Landing page status filter */}
                <select
                  value={feedbackFeaturedFilter}
                  onChange={(e) => setFeedbackFeaturedFilter(e.target.value)}
                  className="p-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-white font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Visibility ({totalFeedbacks})</option>
                  <option value="FEATURED">Featured on Home ({featuredCount})</option>
                  <option value="NON_FEATURED">Hidden from Home ({totalFeedbacks - featuredCount})</option>
                </select>

                {/* Rating filter */}
                <select
                  value={feedbackRatingFilter}
                  onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                  className="p-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-white font-medium text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Star Ratings</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                  <option value="3">⭐⭐⭐ 3 Stars</option>
                  <option value="2">⭐⭐ 2 Stars</option>
                  <option value="1">⭐ 1 Star</option>
                </select>
              </div>
            </div>

            {/* Feedbacks Grid */}
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <Quote className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">No feedbacks matching your filter criteria.</p>
                <p className="text-xs text-slate-400">Try modifying your search or visibility filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeedbacks.map((f) => {
                  const isFeatured = f.isFeatured === true;
                  const isBusy = feedbackActionLoading === f.feedbackId;

                  return (
                    <div
                      key={f.feedbackId}
                      className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 ${
                        isFeatured ? 'border-emerald-300 ring-1 ring-emerald-400/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top: Patient details & Rating */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-2xs">
                              {f.patient?.profileImage ? (
                                <img src={f.patient.profileImage} alt={f.patient.fullName} className="w-full h-full object-cover" />
                              ) : (
                                f.patient?.fullName?.charAt(0) || 'P'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {f.patient?.fullName || 'Verified Patient'}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono">{formatPatientId(f.patient || { userId: f.patientId })}</span>
                                <span>•</span>
                                <span>
                                  {f.submittedDate ? new Date(f.submittedDate).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  }) : 'Recently'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Star Rating Badge */}
                          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                            {[...Array(f.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            ))}
                            <span className="font-black text-amber-800 text-xs ml-1">{f.rating}.0</span>
                          </div>
                        </div>

                        {/* Doctor info bar */}
                        <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800">{f.doctor?.fullName || 'Doctor'}</span>
                              <span className="text-slate-500 text-[11px] ml-1.5">({f.doctor?.specialization})</span>
                            </div>
                          </div>
                          {f.appointment?.appointmentId && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                              App #{f.appointment.appointmentId}
                            </span>
                          )}
                        </div>

                        {/* Patient Review Text */}
                        <div className="relative p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-700 italic leading-relaxed">
                          <Quote className="w-3.5 h-3.5 text-slate-300 absolute -top-1.5 left-2 bg-white px-0.5" />
                          {f.comments && f.comments.trim().length > 0 ? (
                            `"${f.comments}"`
                          ) : (
                            <span className="text-slate-400 not-italic text-[11px]">(No written comments provided - star rating only)</span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer: Landing Page Toggle Switch */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isFeatured ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                Displayed on Landing Page
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                Hidden from Landing Page
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {isFeatured ? 'Public visitors will see this review on the homepage' : 'Internal quality record only'}
                          </p>
                        </div>

                        {/* Interactive iOS-style Toggle Switch */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-bold ${isFeatured ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {isFeatured ? 'Featured' : 'Hidden'}
                          </span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleFeedbackFeatured(f.feedbackId, isFeatured)}
                            title={isFeatured ? 'Click to hide from Landing Page' : 'Click to feature on Landing Page'}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                              isFeatured ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isFeatured ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {isBusy && (
                                <RefreshCw className="w-3 h-3 text-slate-600 animate-spin m-1" />
                              )}
                            </span>
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

      {/* ========================================================================= */}
      {/* 7. SYSTEM AUDIT LOGS (activeSection === 'system-logs')                   */}
      {/* ========================================================================= */}
      {activeSection === 'system-logs' && (() => {
        // Filter logs
        const filteredLogs = allLogs.filter(log => {
          // Time filter
          if (!matchesTimeFilter(log.timestamp, logTimeFilter, logCustomStartDate, logCustomEndDate)) {
            return false;
          }

          // Search filter
          if (logSearch.trim()) {
            const q = logSearch.toLowerCase();
            const performerMatch = (log.performerName || '').toLowerCase().includes(q);
            const roleMatch = (log.performerRole || '').toLowerCase().includes(q);
            const actionMatch = (log.actionType || '').toLowerCase().includes(q);
            const entityMatch = (log.entityName || '').toLowerCase().includes(q);
            const descMatch = (log.description || '').toLowerCase().includes(q);
            const ipMatch = (log.ipAddress || '').toLowerCase().includes(q);
            const idMatch = String(log.logId || '').includes(q) || String(log.entityId || '').includes(q);
            if (!performerMatch && !roleMatch && !actionMatch && !entityMatch && !descMatch && !ipMatch && !idMatch) {
              return false;
            }
          }

          // Role filter
          if (logRoleFilter !== 'ALL') {
            if ((log.performerRole || '').toUpperCase() !== logRoleFilter.toUpperCase()) {
              return false;
            }
          }

          // Severity filter
          if (logSeverityFilter !== 'ALL') {
            if ((log.severity || '').toUpperCase() !== logSeverityFilter.toUpperCase()) {
              return false;
            }
          }

          // Action filter
          if (logActionFilter !== 'ALL') {
            if (!(log.actionType || '').toUpperCase().includes(logActionFilter.toUpperCase())) {
              return false;
            }
          }

          return true;
        });

        const totalCount = allLogs.length;
        const todayCount = logStats?.todayLogs ?? allLogs.filter(l => {
          if (!l.timestamp) return false;
          const d = new Date(l.timestamp);
          const today = new Date();
          return d.toDateString() === today.toDateString();
        }).length;

        const staffCount = logStats?.staffLogs ?? allLogs.filter(l => 
          l.performerRole && !['PATIENT', 'SYSTEM'].includes(l.performerRole.toUpperCase())
        ).length;

        const criticalCount = logStats?.criticalOrWarningLogs ?? allLogs.filter(l =>
          l.severity && ['CRITICAL', 'WARNING'].includes(l.severity.toUpperCase())
        ).length;

        return (
          <div className="space-y-6">
            {/* Header / Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                      Real-time System Audit Engine
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Tamper-Evident Hospital Audit Trail
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    <Activity className="w-8 h-8 text-teal-400" />
                    System Audit & Operations Activity Logs
                  </h2>
                  <p className="text-slate-300 text-sm max-w-2xl mt-2 leading-relaxed">
                    Continuous operational telemetry capturing every administrative staff action, doctor license verification, consultation schedule creation, financial refund settlement, and patient booking in chronological order.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={fetchLogs}
                    disabled={logLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/20 hover:border-white/30 backdrop-blur-sm cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${logLoading ? 'animate-spin text-teal-300' : 'text-slate-300'}`} />
                    Refresh Logs
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportLogs('csv', filteredLogs)}
                    disabled={filteredLogs.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title={filteredLogs.length === allLogs.length ? "Export all audit logs to CSV" : `Export ${filteredLogs.length} filtered audit logs to CSV`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Audit Trail (CSV)</span>
                    <span className="bg-teal-700/80 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                      {filteredLogs.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportLogs('json', filteredLogs)}
                    disabled={filteredLogs.length === 0}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition border border-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title={filteredLogs.length === allLogs.length ? "Export all audit logs to JSON" : `Export ${filteredLogs.length} filtered audit logs to JSON`}
                  >
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span>JSON</span>
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {filteredLogs.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Audit Logs</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</span>
                  <span className="text-xs font-semibold text-indigo-600">Events Recorded</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Across all users & system services</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Activities</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{todayCount}</span>
                  <span className="text-xs font-semibold text-teal-600">Within 24 Hours</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Real-time synchronized actions</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Staff & Roles</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{staffCount}</span>
                  <span className="text-xs font-semibold text-blue-600">Staff Operations</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Admin, Coordinator, Finance & Support</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security & Alerts</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{criticalCount}</span>
                  <span className="text-xs font-semibold text-amber-600">Warnings / Critical</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Deletions, overrides & cancellations</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs by staff name, action, target entity, ID, description, or IP..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400 transition"
                  />
                  {logSearch && (
                    <button
                      onClick={() => setLogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Time Range filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Time:
                    </span>
                    <select
                      value={logTimeFilter}
                      onChange={(e) => setLogTimeFilter(e.target.value)}
                      className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-semibold"
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today (24 Hours)</option>
                      <option value="YESTERDAY">Yesterday</option>
                      <option value="LAST_7_DAYS">Last 7 Days</option>
                      <option value="LAST_30_DAYS">Last 30 Days (Month)</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="CUSTOM">Custom Date / Range...</option>
                    </select>
                  </div>

                  {/* Custom Date Pickers */}
                  {logTimeFilter === 'CUSTOM' && (
                    <div className="flex flex-wrap items-center gap-2 bg-teal-50/80 px-2.5 py-1.5 rounded-xl border border-teal-200">
                      <div className="flex items-center gap-1 text-[11px] text-teal-900 font-bold">
                        <span>From:</span>
                        <input
                          type="date"
                          value={logCustomStartDate}
                          onChange={(e) => setLogCustomStartDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-teal-900 font-bold">
                        <span>To:</span>
                        <input
                          type="date"
                          value={logCustomEndDate}
                          onChange={(e) => setLogCustomEndDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                        />
                      </div>
                      {(logCustomStartDate || logCustomEndDate) && (
                        <button
                          type="button"
                          onClick={() => { setLogCustomStartDate(''); setLogCustomEndDate(''); }}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}

                  {/* Role filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 shrink-0">Role:</span>
                    <select
                      value={logRoleFilter}
                      onChange={(e) => setLogRoleFilter(e.target.value)}
                      className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-semibold"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="CHANNELING_COORDINATOR">Channeling Coordinator</option>
                      <option value="FINANCE_OFFICER">Finance Officer</option>
                      <option value="CUSTOMER_SERVICE_EXECUTIVE">Customer Support</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="PATIENT">Patient</option>
                      <option value="SYSTEM">System Service</option>
                    </select>
                  </div>

                  {/* Severity filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 shrink-0">Severity:</span>
                    <select
                      value={logSeverityFilter}
                      onChange={(e) => setLogSeverityFilter(e.target.value)}
                      className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-semibold"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="SUCCESS">Success</option>
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  {/* Reset filters button if any active */}
                  {(logSearch || logRoleFilter !== 'ALL' || logSeverityFilter !== 'ALL' || logActionFilter !== 'ALL' || logTimeFilter !== 'ALL' || logCustomStartDate || logCustomEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogSearch('');
                        setLogRoleFilter('ALL');
                        setLogSeverityFilter('ALL');
                        setLogActionFilter('ALL');
                        setLogTimeFilter('ALL');
                        setLogCustomStartDate('');
                        setLogCustomEndDate('');
                      }}
                      className="text-xs px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Time Presets Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold text-[11px] mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  Time Presets:
                </span>
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Today (24h)' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                  { id: 'LAST_30_DAYS', label: 'Last 30 Days (Month)' },
                  { id: 'THIS_MONTH', label: 'This Month' },
                  { id: 'CUSTOM', label: 'Custom Date Range 📅' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setLogTimeFilter(chip.id);
                      if (chip.id !== 'CUSTOM') {
                        setLogCustomStartDate('');
                        setLogCustomEndDate('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition cursor-pointer ${
                      logTimeFilter === chip.id
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Quick Category Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold text-[11px] mr-1">Quick Filter:</span>
                {[
                  { id: 'ALL', label: 'All Operations' },
                  { id: 'STAFF', label: 'Staff Management' },
                  { id: 'DOCTOR', label: 'Doctor Approvals' },
                  { id: 'SCHEDULE', label: 'Session Rosters' },
                  { id: 'APPOINTMENT', label: 'Appointments' },
                  { id: 'FEEDBACK', label: 'Reviews & Feedback' },
                  { id: 'PAYMENT', label: 'Payments & Refunds' },
                  { id: 'DELETED', label: 'Critical Deletions' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setLogActionFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition cursor-pointer ${
                      logActionFilter === chip.id
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Logs Table / Feed */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Audit Log Ledger
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    Showing {filteredLogs.length} of {allLogs.length} events
                  </span>
                  {logTimeFilter !== 'ALL' && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-600" />
                      {logTimeFilter === 'CUSTOM'
                        ? (logCustomStartDate || logCustomEndDate ? `${logCustomStartDate || 'Start'} → ${logCustomEndDate || 'Now'}` : 'Custom Date')
                        : logTimeFilter.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Timestamp format: YYYY-MM-DD HH:mm:ss (12h Clock)
                </div>
              </div>

              {logLoading ? (
                <div className="p-16 text-center">
                  <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Synchronizing system logs...</p>
                  <p className="text-xs text-slate-400 mt-1">Retrieving latest platform audit trail</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No matching audit logs found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No activity records match your current search terms, selected timeframe, or filter criteria. Try adjusting your filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLogSearch('');
                      setLogRoleFilter('ALL');
                      setLogSeverityFilter('ALL');
                      setLogActionFilter('ALL');
                      setLogTimeFilter('ALL');
                      setLogCustomStartDate('');
                      setLogCustomEndDate('');
                    }}
                    className="mt-3.5 inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 transition cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200/60 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 w-16">Log #</th>
                        <th className="py-3 px-4 w-48">Staff / Performer</th>
                        <th className="py-3 px-4 w-44">Action & Entity</th>
                        <th className="py-3 px-4">Event Description</th>
                        <th className="py-3 px-4 w-28 text-center">Severity</th>
                        <th className="py-3 px-4 w-40 text-right">Timestamp</th>
                        <th className="py-3 px-4 w-28 text-center">Event Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map(log => {
                        const roleStyle = getRoleBadgeStyle(log.performerRole);
                        const severityStyle = getSeverityStyle(log.severity);
                        const SeverityIcon = severityStyle.icon;

                        return (
                          <tr
                            key={log.logId}
                            onClick={() => setSelectedLogForDetails(log)}
                            className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                            title="Click to view complete event information"
                          >
                            {/* Log ID */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-[11px] group-hover:text-teal-700">
                              #{log.logId}
                            </td>

                            {/* Staff / Performer */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0 uppercase">
                                  {log.performerName ? log.performerName.charAt(0) : 'S'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 truncate">
                                    {log.performerName || 'System'}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`}></span>
                                      {roleStyle.label}
                                    </span>
                                    {log.userId && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        ID:{log.userId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Action Type & Target Entity */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[10px] border border-slate-200">
                                  {log.actionType}
                                </span>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <span className="font-semibold text-slate-600">{log.entityName || 'System'}</span>
                                  {log.entityId && (
                                    <span className="font-mono text-[10px] text-slate-400">
                                      #{log.entityId}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Description */}
                            <td className="py-3.5 px-4">
                              <p className="text-slate-800 text-xs leading-relaxed font-normal">
                                {log.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {log.ipAddress && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                    IP: {log.ipAddress}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Severity */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${severityStyle.bg}`}
                                title={severityStyle.desc}
                              >
                                <SeverityIcon className="w-3 h-3 shrink-0" />
                                {severityStyle.label}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="font-mono font-bold text-slate-800 text-[11px]">
                                {formatLogTimestamp(log.timestamp)}
                              </div>
                              <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                                {formatRelativeTime(log.timestamp)}
                              </div>
                            </td>

                            {/* Action / View Info */}
                            <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedLogForDetails(log)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 font-bold border border-slate-200 hover:border-teal-300 text-[11px] transition shadow-2xs cursor-pointer"
                                title="View complete event information and metadata"
                              >
                                <Info className="w-3.5 h-3.5 text-teal-600" />
                                <span>View Info</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AUDIT LOG EVENT INFORMATION MODAL */}
            {selectedLogForDetails && (() => {
              const log = selectedLogForDetails;
              const roleStyle = getRoleBadgeStyle(log.performerRole);
              const severityStyle = getSeverityStyle(log.severity);
              const SeverityIcon = severityStyle.icon;

              const handleCopyJson = () => {
                navigator.clipboard?.writeText(JSON.stringify(log, null, 2));
                setCopiedLogJson(true);
                setTimeout(() => setCopiedLogJson(false), 2000);
              };

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                  <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-400 border border-white/10">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-white tracking-tight">
                              Audit Log Event Information
                            </h3>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                              #{log.logId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Detailed transaction audit record and event telemetry
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLogForDetails(null)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                      {/* Status & Severity Banner */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Severity Classification:</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${severityStyle.bg}`}>
                            <SeverityIcon className="w-3.5 h-3.5 shrink-0" />
                            {severityStyle.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {severityStyle.desc}
                        </span>
                      </div>

                      {/* Grid: Performer Info & Action Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Performer Card */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Staff / Performer</span>
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm shrink-0">
                              {log.performerName ? log.performerName.charAt(0) : 'S'}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm">
                                {log.performerName || 'System'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`}></span>
                                  {roleStyle.label}
                                </span>
                                {log.userId && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    UID: #{log.userId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action & Entity Card */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Action & Target Entity</span>
                            <Activity className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-mono font-black text-xs border border-teal-200">
                              {log.actionType}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-1.5">
                              <span>Target: {log.entityName || 'System'}</span>
                              {log.entityId && (
                                <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  ID: #{log.entityId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event Description Card */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Event Description & Operation Details
                        </span>
                        <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                          {log.description}
                        </p>
                      </div>

                      {/* Network & Timestamp Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client IP Address</span>
                            <span className="font-mono font-bold text-slate-700 text-xs mt-0.5 block">{log.ipAddress || '127.0.0.1'}</span>
                          </div>
                          <Terminal className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp (Local)</span>
                            <span className="font-mono font-bold text-slate-700 text-xs mt-0.5 block">{formatLogTimestamp(log.timestamp)}</span>
                            <span className="text-[10px] text-slate-400">{formatRelativeTime(log.timestamp)}</span>
                          </div>
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Raw JSON Audit Payload */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Raw Audit Record Payload</span>
                          <button
                            type="button"
                            onClick={handleCopyJson}
                            className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedLogJson ? 'Copied to Clipboard!' : 'Copy JSON'}
                          </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-900 text-teal-400 font-mono text-[11px] overflow-x-auto max-h-36 border border-slate-800">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        CareSync System Audit Ledger v2.4 • Non-repudiation verified
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedLogForDetails(null)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 8. ISSUED PRESCRIPTIONS REGISTRY (activeSection === 'prescriptions')      */}
      {/* ========================================================================= */}
      {activeSection === 'prescriptions' && (() => {
        // Distinct doctors and patients for filter dropdowns
        const doctorOptionsMap = new Map();
        const patientOptionsMap = new Map();

        allPrescriptions.forEach(p => {
          if (p.doctor?.userId || p.doctor?.doctorId) {
            const docId = p.doctor.userId || p.doctor.doctorId;
            if (!doctorOptionsMap.has(docId)) {
              doctorOptionsMap.set(docId, p.doctor);
            }
          }
          if (p.patient?.userId || p.patient?.patientId) {
            const patId = p.patient.userId || p.patient.patientId;
            if (!patientOptionsMap.has(patId)) {
              patientOptionsMap.set(patId, p.patient);
            }
          }
        });

        // Also add any registered doctors that haven't issued yet if in allDoctors
        allDoctors.forEach(d => {
          const docId = d.userId || d.doctorId;
          if (docId && !doctorOptionsMap.has(docId)) {
            doctorOptionsMap.set(docId, d);
          }
        });

        const doctorOptions = Array.from(doctorOptionsMap.values());
        const patientOptions = Array.from(patientOptionsMap.values());

        // Date filter matcher helper
        const matchesDate = (dateStr) => {
          if (!prescriptionDateFilter || prescriptionDateFilter === 'ALL') return true;
          if (!dateStr) return false;
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return true;
            const now = new Date();

            if (prescriptionDateFilter === 'TODAY') {
              return d.toDateString() === now.toDateString();
            }
            if (prescriptionDateFilter === 'YESTERDAY') {
              const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              return d.toDateString() === y.toDateString();
            }
            if (prescriptionDateFilter === 'LAST_7_DAYS') {
              const w = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return d >= w;
            }
            if (prescriptionDateFilter === 'LAST_30_DAYS') {
              const m = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return d >= m;
            }
            if (prescriptionDateFilter === 'THIS_MONTH') {
              return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            }
            if (prescriptionDateFilter === 'CUSTOM') {
              if (prescriptionCustomStart) {
                const s = new Date(prescriptionCustomStart + 'T00:00:00');
                if (d < s) return false;
              }
              if (prescriptionCustomEnd) {
                const e = new Date(prescriptionCustomEnd + 'T23:59:59');
                if (d > e) return false;
              }
              return true;
            }
          } catch {
            return true;
          }
          return true;
        };

        // Filter prescriptions
        const filteredPrescriptions = allPrescriptions.filter(p => {
          // 1. Doctor filter
          if (prescriptionDoctorFilter !== 'ALL') {
            const docId = String(p.doctor?.userId || p.doctor?.doctorId || '');
            if (docId !== String(prescriptionDoctorFilter)) return false;
          }

          // 2. Patient filter
          if (prescriptionPatientFilter !== 'ALL') {
            const patId = String(p.patient?.userId || p.patient?.patientId || '');
            if (patId !== String(prescriptionPatientFilter)) return false;
          }

          // 3. Date filter
          if (!matchesDate(p.issueDate)) {
            return false;
          }

          // 4. Text search
          if (prescriptionSearch.trim()) {
            const q = prescriptionSearch.toLowerCase().trim();
            const pat = p.patient || p.appointment?.patient || {};
            const doc = p.doctor || p.appointment?.doctor || {};
            const pName = (pat.fullName || '').toLowerCase();
            const pNic = (pat.nic || '').toLowerCase();
            const pPhone = (pat.contactNumber || pat.contactNo || '').toLowerCase();
            const pId = String(pat.userId || pat.patientId || '').toLowerCase();
            const dName = (doc.fullName || '').toLowerCase();
            const dSpec = (doc.specialization || '').toLowerCase();
            const dLic = (doc.medicalLicenseNo || '').toLowerCase();
            const rxId = `rx-${String(p.prescriptionId || '').padStart(4, '0')}`.toLowerCase();
            const details = (p.details || '').toLowerCase();
            const apptId = String(p.appointment?.appointmentId || '').toLowerCase();

            if (!pName.includes(q) && !pNic.includes(q) && !pPhone.includes(q) && !pId.includes(q) &&
                !dName.includes(q) && !dSpec.includes(q) && !dLic.includes(q) &&
                !rxId.includes(q) && !details.includes(q) && !apptId.includes(q)) {
              return false;
            }
          }

          return true;
        });

        // Statistics
        const distinctDoctorsCount = Array.from(new Set(allPrescriptions.map(p => p.doctor?.userId || p.doctor?.doctorId).filter(Boolean))).length;
        const distinctPatientsCount = Array.from(new Set(allPrescriptions.map(p => p.patient?.userId || p.patient?.patientId).filter(Boolean))).length;
        const todayCount = allPrescriptions.filter(p => {
          if (!p.issueDate) return false;
          return new Date(p.issueDate).toDateString() === new Date().toDateString();
        }).length;

        const copyRx = (p) => {
          const rxNo = `RX-${String(p.prescriptionId || '1').padStart(4, '0')}`;
          const txt = `CareSync Hospital Medical Prescription\nRx Number: ${rxNo}\nPatient: ${p.patient?.fullName || 'Patient'}\nDoctor: ${p.doctor?.fullName || 'Doctor'}\nDate: ${p.issueDate}\n\nPRESCRIPTION & ADVICE:\n${p.details || ''}`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt);
            setCopiedRxId(p.prescriptionId);
            setTimeout(() => setCopiedRxId(null), 2000);
          }
        };

        const formatPrescDate = (dateStr) => {
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

        const exportCsv = () => {
          if (!filteredPrescriptions || filteredPrescriptions.length === 0) return;
          const headers = ['Rx Number', 'Issue Date', 'Patient Name', 'Patient ID', 'NIC', 'Patient Phone', 'Doctor Name', 'Doctor ID', 'Specialization', 'License No', 'Hospital', 'Appointment ID', 'Queue Token', 'Prescription Details'];
          const rows = filteredPrescriptions.map(p => {
            const pat = p.patient || p.appointment?.patient || {};
            const doc = p.doctor || p.appointment?.doctor || {};
            const appt = p.appointment || {};
            return [
              `RX-${String(p.prescriptionId || '').padStart(4, '0')}`,
              p.issueDate || '',
              `"${(pat.fullName || '').replace(/"/g, '""')}"`,
              formatPatientId(pat) || `PAT-${pat.userId || ''}`,
              pat.nic || '',
              pat.contactNumber || pat.contactNo || '',
              `"${(doc.fullName || '').replace(/"/g, '""')}"`,
              formatDoctorId(doc) || `DOC-${doc.userId || ''}`,
              doc.specialization || '',
              doc.medicalLicenseNo || '',
              `"${(doc.hospitalLocation || '').replace(/"/g, '""')}"`,
              appt.appointmentId || '',
              appt.timeslot?.queueNumber || appt.queueNumber || '',
              `"${(p.details || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
            ];
          });

          const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `CareSync_Issued_Prescriptions_${new Date().toISOString().slice(0, 10)}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        const hasActiveFilters = prescriptionSearch || prescriptionDoctorFilter !== 'ALL' || prescriptionPatientFilter !== 'ALL' || prescriptionDateFilter !== 'ALL' || prescriptionCustomStart || prescriptionCustomEnd;

        return (
          <div className="space-y-6 text-left">
            {/* Header with Title & Action Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">Hospital Issued Prescriptions</h1>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                        {allPrescriptions.length} Records
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Central clinical registry of all electronic prescriptions issued across hospital channeling sessions
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Mode Toggle */}
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPrescriptionViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      prescriptionViewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrescriptionViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      prescriptionViewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cards View
                  </button>
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filteredPrescriptions.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 disabled:opacity-50 cursor-pointer"
                  title="Export filtered prescriptions as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchPrescriptions}
                  disabled={prescriptionsLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${prescriptionsLoading ? 'animate-spin' : ''}`} />
                  <span>{prescriptionsLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* KPI Analytics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Prescriptions</span>
                  <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{allPrescriptions.length}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">All-time Hospital Records</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Doctors</span>
                  <span className="text-xl font-black text-teal-900 font-mono tracking-tight">{distinctDoctorsCount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Prescribing Consultants</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patients Treated</span>
                  <span className="text-xl font-black text-sky-900 font-mono tracking-tight">{distinctPatientsCount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Unique Individuals</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issued Today</span>
                  <span className="text-xl font-black text-amber-900 font-mono tracking-tight">{todayCount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Today's Sessions</span>
                </div>
              </div>
            </div>

            {/* Advanced Filters & Multi-Parameter Search Bar */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Global Text Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={prescriptionSearch}
                    onChange={(e) => setPrescriptionSearch(e.target.value)}
                    placeholder="Search patient, doctor, Rx #, medicine..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                  {prescriptionSearch && (
                    <button
                      type="button"
                      onClick={() => setPrescriptionSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 2. Doctor Filter */}
                <div>
                  <select
                    value={prescriptionDoctorFilter}
                    onChange={(e) => setPrescriptionDoctorFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="ALL">All Doctors ({doctorOptions.length})</option>
                    {doctorOptions.map(d => {
                      const dId = d.userId || d.doctorId;
                      return (
                        <option key={dId} value={dId}>
                          {d.fullName} ({d.specialization || 'Consultant'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 3. Patient Filter */}
                <div>
                  <select
                    value={prescriptionPatientFilter}
                    onChange={(e) => setPrescriptionPatientFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="ALL">All Patients ({patientOptions.length})</option>
                    {patientOptions.map(p => {
                      const pId = p.userId || p.patientId;
                      return (
                        <option key={pId} value={pId}>
                          {p.fullName} ({formatPatientId(p)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 4. Date Filter */}
                <div>
                  <select
                    value={prescriptionDateFilter}
                    onChange={(e) => setPrescriptionDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Issued Today</option>
                    <option value="YESTERDAY">Issued Yesterday</option>
                    <option value="LAST_7_DAYS">Last 7 Days</option>
                    <option value="LAST_30_DAYS">Last 30 Days</option>
                    <option value="THIS_MONTH">This Month</option>
                    <option value="CUSTOM">Custom Date Range...</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Pickers (Shown if CUSTOM selected) */}
              {prescriptionDateFilter === 'CUSTOM' && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold text-[11px]">From Date:</span>
                    <input
                      type="date"
                      value={prescriptionCustomStart}
                      onChange={(e) => setPrescriptionCustomStart(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold text-[11px]">To Date:</span>
                    <input
                      type="date"
                      value={prescriptionCustomEnd}
                      onChange={(e) => setPrescriptionCustomEnd(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  {(prescriptionCustomStart || prescriptionCustomEnd) && (
                    <button
                      type="button"
                      onClick={() => { setPrescriptionCustomStart(''); setPrescriptionCustomEnd(''); }}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              )}

              {/* Active Filter Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  Showing <strong className="text-slate-900">{filteredPrescriptions.length}</strong> of <strong className="text-slate-900">{allPrescriptions.length}</strong> prescriptions
                  {hasActiveFilters && (
                    <span className="ml-2 text-emerald-700 font-semibold">(Filters Applied)</span>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionSearch('');
                      setPrescriptionDoctorFilter('ALL');
                      setPrescriptionPatientFilter('ALL');
                      setPrescriptionDateFilter('ALL');
                      setPrescriptionCustomStart('');
                      setPrescriptionCustomEnd('');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Prescriptions Content (Table or Cards View) */}
            {filteredPrescriptions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No Prescriptions Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'No prescriptions match the selected doctor, patient, date, or search filters. Try clearing some filters.'
                    : 'No hospital prescriptions have been recorded in the database yet.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionSearch('');
                      setPrescriptionDoctorFilter('ALL');
                      setPrescriptionPatientFilter('ALL');
                      setPrescriptionDateFilter('ALL');
                      setPrescriptionCustomStart('');
                      setPrescriptionCustomEnd('');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : prescriptionViewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Rx Ref</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Patient Information</th>
                        <th className="py-3.5 px-4">Prescribing Doctor</th>
                        <th className="py-3.5 px-4">Consultation Appt</th>
                        <th className="py-3.5 px-4">Prescription Order</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPrescriptions.map(p => {
                        const pat = p.patient || p.appointment?.patient || {};
                        const doc = p.doctor || p.appointment?.doctor || {};
                        const appt = p.appointment || {};
                        const rxNo = `RX-${String(p.prescriptionId || '1').padStart(4, '0')}`;

                        return (
                          <tr key={p.prescriptionId} className="hover:bg-slate-50/60 transition">
                            {/* Rx Ref */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                {rxNo}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-semibold text-slate-800 block">{formatPrescDate(p.issueDate)}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Appt #{appt.appointmentId || 'N/A'}</span>
                            </td>

                            {/* Patient Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                                  {(pat.fullName || 'P').slice(0, 1)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {pat.fullName || 'Patient'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {formatPatientId(pat)} • {pat.contactNumber || pat.contactNo || 'No phone'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Doctor Info */}
                            <td className="py-3.5 px-4">
                              <div>
                                <span className="font-bold text-slate-900 block truncate">{doc.fullName || 'Doctor'}</span>
                                <span className="text-[11px] text-emerald-800 font-semibold block">{doc.specialization || 'Consultant'}</span>
                                <span className="text-[10px] text-slate-400 block">{doc.hospitalLocation || 'CareSync Hospital'}</span>
                              </div>
                            </td>

                            {/* Appointment Info */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div>
                                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  Token #{appt.timeslot?.queueNumber || appt.queueNumber || '1'}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  {appt.appointmentDate || 'Session'} ({appt.startTime || '09:00'})
                                </span>
                              </div>
                            </td>

                            {/* Prescription snippet */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 font-mono text-[11px] text-slate-700 line-clamp-2">
                                {p.details}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => copyRx(p)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                                  title="Copy Prescription Text"
                                >
                                  {copiedRxId === p.prescriptionId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedPrescriptionForModal(p)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                  title="View official prescription slip & print"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>View Slip</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPrescriptions.map(p => {
                  const pat = p.patient || p.appointment?.patient || {};
                  const doc = p.doctor || p.appointment?.doctor || {};
                  const appt = p.appointment || {};
                  const rxNo = `RX-${String(p.prescriptionId || '1').padStart(4, '0')}`;

                  return (
                    <div
                      key={p.prescriptionId}
                      className="rounded-3xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all p-5 space-y-4 text-xs"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            {rxNo}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            Appt #{appt.appointmentId || 'N/A'} • Token #{appt.timeslot?.queueNumber || appt.queueNumber || '1'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {formatPrescDate(p.issueDate)}
                        </div>
                      </div>

                      {/* Doctor & Patient Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                          <span className="font-black text-slate-900 block">{pat.fullName || 'Patient'}</span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {formatPatientId(pat)} • {pat.contactNumber || pat.contactNo || 'N/A'}
                          </span>
                          {pat.age && <span className="text-[10px] text-slate-400 block">{pat.age} Yrs • {pat.gender || 'Patient'}</span>}
                        </div>

                        <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescribing Doctor</span>
                          <span className="font-black text-slate-900 block">{doc.fullName || 'Doctor'}</span>
                          <span className="text-[11px] text-emerald-800 font-bold block">{doc.specialization}</span>
                          <span className="text-[10px] text-slate-400 block">License: {doc.medicalLicenseNo || 'SLMC-VERIFIED'}</span>
                        </div>
                      </div>

                      {/* Rx Orders Box */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/20 border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs border-b border-emerald-100 pb-1">
                          <span className="font-serif italic font-bold text-emerald-700 text-base leading-none">℞</span>
                          <span>Prescription Orders & Instructions:</span>
                        </div>
                        <p className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-xl border border-emerald-100">
                          {p.details}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          CareSync Verified E-Prescription
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyRx(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
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
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View / Print Slip</span>
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

      {/* ========================================================================= */}
      {/* EDIT PATIENT MODAL                                                       */}
      {/* ========================================================================= */}
      {editingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Edit Patient Information</h3>
                <p className="text-xs text-slate-500">Patient ID: <strong className="text-teal-800 font-mono">{formatPatientId(editingPatient)}</strong> • Username: @{editingPatient.username}</p>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePatient} className="space-y-3 text-xs">
              {/* Patient Photo Management */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-300 overflow-hidden flex items-center justify-center text-slate-400 shadow-sm">
                    {editFormData.profileImage ? (
                      <img src={editFormData.profileImage} alt="Patient Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  {editFormData.profileImage && (
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, profileImage: '' }))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <span className="font-bold text-slate-800 block text-xs">Patient Profile Photo</span>
                  <p className="text-[11px] text-slate-500">Update photo on behalf of the patient.</p>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-300 cursor-pointer shadow-sm transition">
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    <span>{editFormData.profileImage ? 'Replace Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminPatientPhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.contactNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={editFormData.dateOfBirth}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const calculatedAge = calculateAgeFromDob(dob);
                      setEditFormData({
                        ...editFormData,
                        dateOfBirth: dob,
                        age: calculatedAge !== '' ? calculatedAge : editFormData.age
                      });
                    }}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Age</label>
                    <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">Auto-calculated</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={editFormData.age !== '' ? `${editFormData.age} yrs` : 'Auto'}
                    className="w-full p-2.5 mt-1 border border-slate-200 bg-slate-100 text-slate-700 font-semibold rounded-xl outline-none cursor-not-allowed select-none"
                    title="Age is automatically calculated from Date of Birth"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Gender</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Blood Group</label>
                  <select
                    value={editFormData.bloodGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Residential Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Emergency Contact Number</label>
                <input
                  type="text"
                  value={editFormData.emergencyContact}
                  onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-800">
                  Account is Active (Uncheck to suspend patient access)
                </label>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow transition disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER DOCTOR MODAL */}
      {showAddDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Register New Medical Doctor</span>
              <button onClick={() => setShowAddDoctor(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleRegisterDoctor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dr.senarath"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Samantha Senarath"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Doctor Account Initial Password Field */}
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-teal-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                    Doctor Account Initial Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-teal-200 hover:bg-teal-50 shadow-2xs transition"
                  >
                    <Wand2 className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showDoctorPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter initial password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 pr-20 bg-white border border-teal-200 rounded-lg outline-none focus:border-teal-600 text-xs font-mono font-medium text-slate-800"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                      title={showDoctorPassword ? 'Hide password' : 'Show password'}
                    >
                      {showDoctorPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(password);
                        alert('Password copied to clipboard!');
                      }}
                      className="text-teal-600 hover:text-teal-800 p-0.5 rounded transition"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-teal-700/80">
                  Default is <span className="font-mono font-bold">password123</span>. Admin can customize or auto-generate. Doctor can reset this later via the login recovery screen.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    required
                    placeholder="0771234567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">NIC</label>
                  <input
                    type="text"
                    required
                    placeholder="198212345678"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Medical License No</label>
                  <input
                    type="text"
                    required
                    placeholder="SLMC-78901"
                    value={medicalLicenseNo}
                    onChange={(e) => setMedicalLicenseNo(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Specialization</label>
                  <input
                    type="text"
                    required
                    placeholder="Cardiology"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Qualifications</label>
                  <input
                    type="text"
                    required
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Fee (LKR)</label>
                  <input
                    type="number"
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Doctor Profile Picture Upload */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  Doctor Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {doctorProfileImage ? (
                      <img src={doctorProfileImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewDoctorPhotoSelect}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 cursor-pointer"
                    />
                    {doctorProfileImage && (
                      <button
                        type="button"
                        onClick={() => setDoctorProfileImage('')}
                        className="text-[10px] text-rose-600 hover:underline block font-semibold"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Hospital Affiliation</label>
                <input
                  type="text"
                  required
                  value={hospitalAffiliation}
                  onChange={(e) => setHospitalAffiliation(e.target.value)}
                  className="w-full p-2 mt-1 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition mt-2"
              >
                Register & Submit for Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT REGISTERED DOCTOR MODAL                                             */}
      {/* ========================================================================= */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Edit Doctor Profile & Credentials</h3>
                <p className="text-xs text-slate-500">
                  Doctor ID: <strong className="text-teal-800 font-mono">{formatDoctorId(editingDoctor)}</strong> • Username: @{editingDoctor.username}
                </p>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            {editDoctorSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{editDoctorSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDoctor} className="space-y-3.5 text-xs">
              {/* Doctor Profile Picture Editor */}
              <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-700" />
                  Doctor Profile Picture
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {editDoctorForm.profileImage ? (
                      <img src={editDoctorForm.profileImage} alt="Doctor avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditDoctorPhotoSelect}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 cursor-pointer"
                    />
                    {editDoctorForm.profileImage && (
                      <button
                        type="button"
                        onClick={() => setEditDoctorForm(prev => ({ ...prev, profileImage: '' }))}
                        className="text-[10px] text-rose-600 hover:underline block font-semibold"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editDoctorForm.fullName}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, fullName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={editDoctorForm.contactNumber}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, contactNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Specialization & SLMC License */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Specialization</label>
                  <input
                    type="text"
                    required
                    value={editDoctorForm.specialization}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, specialization: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medical License No (SLMC)</label>
                  <input
                    type="text"
                    required
                    value={editDoctorForm.medicalLicenseNo}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, medicalLicenseNo: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Qualifications & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medical Qualifications</label>
                  <input
                    type="text"
                    required
                    value={editDoctorForm.qualifications}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, qualifications: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee (LKR)</label>
                  <input
                    type="number"
                    required
                    value={editDoctorForm.consultationFee}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, consultationFee: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Hospital Affiliation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Affiliation</label>
                <input
                  type="text"
                  required
                  value={editDoctorForm.hospitalAffiliation}
                  onChange={(e) => setEditDoctorForm({ ...editDoctorForm, hospitalAffiliation: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              {/* Medical License Approval Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Medical License Approval Status</span>
                  <span className="text-[11px] text-slate-500">
                    {editDoctorForm.isApproved ? 'Verified & Approved by Medical Council' : 'Pending Administrative Verification'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDoctorForm.isApproved}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, isApproved: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Account Status Active/Inactive Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Doctor Account Status</span>
                  <span className="text-[11px] text-slate-500">
                    {editDoctorForm.isActive ? 'Active and open for appointments' : 'Deactivated / Suspended from channeling'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDoctorForm.isActive}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editDoctorLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow transition disabled:opacity-50"
                >
                  {editDoctorLoading ? 'Saving...' : 'Save Doctor Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW STAFF / ROLE-BASED USER MODAL                                    */}
      {/* ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  Register Staff & Role-Based User
                </h3>
                <p className="text-xs text-slate-500">
                  Provision new system staff credentials with role authorization
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            {addStaffError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addStaffError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              {/* Role Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assign User Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newStaffForm.role}
                  onChange={handleRoleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 bg-white font-medium"
                >
                  <option value="CHANNELING_COORDINATOR">Channeling Operations Coordinator</option>
                  <option value="FINANCE_OFFICER">Finance & Accounts Officer</option>
                  <option value="CUSTOMER_SERVICE_EXECUTIVE">Customer Service & Support Officer</option>
                  <option value="ADMINISTRATOR">System Administrator</option>
                </select>
              </div>

              {/* Administrator Module Permissions (Granular Access Control) */}
              {newStaffForm.role === 'ADMINISTRATOR' && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      Administrator Module Permissions
                    </label>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedAdminPermissions(ALL_ADMIN_PERMISSIONS.map(p => p.id))}
                        className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAdminPermissions([])}
                        className="text-slate-500 hover:text-slate-700 underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Grant specific privileges to this administrative user:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {ALL_ADMIN_PERMISSIONS.map((perm) => {
                      const checked = selectedAdminPermissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer text-xs ${
                            checked ? 'bg-white border-indigo-300 shadow-2xs' : 'bg-slate-50/60 border-slate-200 opacity-75'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-indigo-600 rounded"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAdminPermissions(prev => [...prev, perm.id]);
                              } else {
                                setSelectedAdminPermissions(prev => prev.filter(id => id !== perm.id));
                              }
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-800 block text-[11px]">{perm.label}</span>
                            <span className="text-[10px] text-slate-500">{perm.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyantha Dissanayake"
                  value={newStaffForm.fullName}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    System Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. coordinator.priyantha"
                    value={newStaffForm.username}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, username: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">
                      Initial Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateStaffPassword}
                      className="text-[11px] text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
                    >
                      <Wand2 className="w-3 h-3" /> Quick Gen
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      value={newStaffForm.password}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                      className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Number & NIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="077xxxxxxx"
                    value={newStaffForm.contactNumber}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, contactNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    NIC / Identity Card No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 198812345678"
                    value={newStaffForm.nic}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, nic: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assigned Department / Branch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.department}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStaffLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {addStaffLoading ? 'Registering...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STAFF MODAL                                                          */}
      {/* ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Edit Staff Member Details</h3>
                <p className="text-xs text-slate-500">Staff ID: <strong className="text-teal-800 font-mono">{formatStaffId(editingStaff)}</strong> • @{editingStaff.username}</p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editStaffForm.fullName}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={editStaffForm.contactNumber}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, contactNumber: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Department</label>
                <input
                  type="text"
                  required
                  value={editStaffForm.department}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, department: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned System Role</label>
                <select
                  value={editStaffForm.role}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-500 bg-white font-medium"
                >
                  <option value="CHANNELING_COORDINATOR">Channeling Coordinator</option>
                  <option value="FINANCE_OFFICER">Finance Officer</option>
                  <option value="CUSTOMER_SERVICE_EXECUTIVE">Customer Support Executive</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStaffLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow transition disabled:opacity-50"
                >
                  {editStaffLoading ? 'Saving...' : 'Save Staff Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIGURE ADMIN PERMISSIONS MODAL                                         */}
      {/* ========================================================================= */}
      {editingAdminPermissionsUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  Configure Admin Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  {editingAdminPermissionsUser.fullName} (@{editingAdminPermissionsUser.username})
                </p>
              </div>
              <button
                onClick={() => setEditingAdminPermissionsUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center px-1">
                <span className="text-slate-600 text-[11px] font-medium">Select authorized administrative modules:</span>
                <div className="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPermissionModalSelected(ALL_ADMIN_PERMISSIONS.map(p => p.id))}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionModalSelected([])}
                    className="text-slate-500 hover:text-slate-700 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {ALL_ADMIN_PERMISSIONS.map((perm) => {
                  const isChecked = permissionModalSelected.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                        isChecked ? 'bg-indigo-50/60 border-indigo-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-indigo-600 rounded"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissionModalSelected(prev => [...prev, perm.id]);
                          } else {
                            setPermissionModalSelected(prev => prev.filter(id => id !== perm.id));
                          }
                        }}
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{perm.label}</span>
                        <span className="text-[11px] text-slate-500">{perm.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAdminPermissionsUser(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={permissionSaving}
                  onClick={() => handleSaveAdminPermissions(editingAdminPermissionsUser.userId || editingAdminPermissionsUser.id, permissionModalSelected)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {permissionSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Prescription Slip Modal (Admin View & Print) */}
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
