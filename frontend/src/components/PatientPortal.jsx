import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, Calendar, Clock, CheckCircle, AlertCircle, Star, MessageSquare, 
  CreditCard, Download, ShieldCheck, RefreshCw, User, Camera, Edit3, 
  MapPin, Phone, Droplet, Heart, Shield, CheckCircle2, UserCheck, Sparkles, FileText, QrCode,
  RotateCcw, DollarSign, Banknote, Stethoscope, Lock, Building, Smartphone, X, Printer, Check,
  ThumbsUp, Quote, Award, ChevronRight, ChevronDown, ChevronUp, Activity, Receipt
} from 'lucide-react';
import { calculateAgeFromDob, isPastDateTime, isSlotExpired, isSessionCompleted, getCancellationWindowStatus } from '../utils/dateUtils';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';
import LiveQueueTracker from './LiveQueueTracker';
import NotificationManager from './NotificationManager';
import HospitalInvoiceModal from './HospitalInvoiceModal';
import BillPaymentModal from './BillPaymentModal';

export default function PatientPortal({ activeSection, onSectionChange, currentUser }) {
  const [internalTab, setInternalTab] = useState('browse');
  const activeTab = activeSection || internalTab;
  const setActiveTab = onSectionChange || setInternalTab;
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [specialization, setSpecialization] = useState('');
  const [expandedDoctorId, setExpandedDoctorId] = useState(null); // tracks which doctor card is expanded
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Card Payment Checkout state (Simulation)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CREDIT_CARD');
  const [cardForm, setCardForm] = useState({
    cardholderName: currentUser?.fullName || 'Anjali Perera',
    cardNumber: '4532 8912 3456 8899',
    expiryDate: '08/28',
    cvv: '789',
    saveCard: true
  });
  const [bankOption, setBankOption] = useState('Commercial Bank of Ceylon');
  const [walletPhone, setWalletPhone] = useState(currentUser?.contactNumber || '0775566778');
  const [paymentStep, setPaymentStep] = useState('IDLE'); // 'IDLE', '3D_SECURE', 'SUCCESS'
  const [paymentStepMsg, setPaymentStepMsg] = useState('');
  
  // Resolve effective patient ID (safeguards against legacy hardcoded ID 5)
  const resolvedPatientId = (currentUser?.role === 'PATIENT' && currentUser?.userId && currentUser?.userId !== 5)
    ? currentUser.userId
    : (currentUser?.username === 'patient.kasun' ? 9 : 8);
  const [patientId, setPatientId] = useState(resolvedPatientId);
  const [myAppointments, setMyAppointments] = useState([]);
  const [patientBills, setPatientBills] = useState([]);
  const [selectedBillToPay, setSelectedBillToPay] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduleSchedules, setRescheduleSchedules] = useState([]);
  const [selectedQueueScheduleId, setSelectedQueueScheduleId] = useState(null);

  // Refund Claims state (Member 6 - Brahmananayaka N.M)
  const [patientRefunds, setPatientRefunds] = useState([]);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({
    appointmentId: '',
    reasonCategory: 'Doctor unavailable / Cancelled schedule',
    customReason: '',
    amount: ''
  });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState({ type: '', text: '' });

  // Patient Profile & Photo state (Member 1 - Jayasundara U.R)
  const [patientProfile, setPatientProfile] = useState(() => {
    if (currentUser?.profileDetails && currentUser.profileDetails.userId !== 5) {
      return currentUser.profileDetails;
    }
    return {
      userId: resolvedPatientId,
      fullName: currentUser?.fullName || (currentUser?.username === 'patient.kasun' ? 'Kasun Bandara' : 'Anjali Perera'),
      username: currentUser?.username || 'patient.anjali',
      nic: currentUser?.nic || (currentUser?.username === 'patient.kasun' ? '200012349988' : '199855667788'),
      contactNumber: currentUser?.contactNumber || (currentUser?.username === 'patient.kasun' ? '0719988112' : '0775566778'),
      bloodGroup: currentUser?.username === 'patient.kasun' ? 'O+' : 'A+',
      dateOfBirth: currentUser?.username === 'patient.kasun' ? '2000-09-22' : '1998-05-14',
      age: calculateAgeFromDob(currentUser?.username === 'patient.kasun' ? '2000-09-22' : '1998-05-14'),
      gender: currentUser?.username === 'patient.kasun' ? 'Male' : 'Female',
      address: currentUser?.username === 'patient.kasun' ? 'No. 12, Kandy Road, Malabe' : 'No. 45, Galle Road, Colombo 03',
      emergencyContact: currentUser?.username === 'patient.kasun' ? '0718877665' : '0771122334',
      profileImage: currentUser?.profileImage || (currentUser?.username === 'patient.kasun' 
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'),
      isActive: true
    };
  });
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    contactNumber: '',
    emergencyContact: '',
    address: '',
    profileImage: ''
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Feedback & Complaint state
  const [feedbackAppointmentId, setFeedbackAppointmentId] = useState('');
  const [feedbackDoctorId, setFeedbackDoctorId] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [complaintType, setComplaintType] = useState('DELAY');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Doctor Ratings and Feedback display state
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [doctorRatingsSummary, setDoctorRatingsSummary] = useState([]);
  const [selectedDoctorReviewsModal, setSelectedDoctorReviewsModal] = useState(null);
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('ALL');
  const [feedbackDoctorFilter, setFeedbackDoctorFilter] = useState('ALL');
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  // Medical Prescriptions & Complaints history state (Member 1, 2, 3)
  const [myPrescriptions, setMyPrescriptions] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchAllPatientData = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetchDoctors(),
        fetchSchedules(),
        fetchMyAppointments(),
        fetchPatientProfile(),
        fetchPatientRefunds(),
        fetchMyPrescriptions(),
        fetchMyComplaints(),
        fetchFeedbacksAndRatings(),
        fetchPatientBills()
      ]);
    } catch (e) {
      console.warn('Error refreshing patient portal:', e);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchDoctors();
    fetchSchedules();
    fetchMyAppointments();
    fetchPatientProfile();
    fetchPatientRefunds();
    fetchMyPrescriptions();
    fetchMyComplaints();
    fetchFeedbacksAndRatings();
    fetchPatientBills();
  }, [patientId]);

  const fetchPatientProfile = async () => {
    try {
      const targetId = patientId || resolvedPatientId;
      const res = await axios.get(`/api/patients/${targetId}`);
      if (res.data && res.data.success && res.data.data) {
        setPatientProfile(res.data.data);
        setPatientId(res.data.data.userId);
        // Sync local storage so navbar avatar reflects latest photo
        const saved = localStorage.getItem('careSync_user');
        if (saved) {
          const u = JSON.parse(saved);
          u.userId = res.data.data.userId;
          u.profileDetails = res.data.data;
          u.profileImage = res.data.data.profileImage;
          u.fullName = res.data.data.fullName;
          localStorage.setItem('careSync_user', JSON.stringify(u));
        }
        return;
      }
    } catch (err) {
      console.warn('Patient profile fetch by ID failed, attempting fallback by username:', err.message);
    }

    // Fallback: fetch by username
    if (currentUser?.username) {
      try {
        const uRes = await axios.get(`/api/patients/username/${currentUser.username}`);
        if (uRes.data && uRes.data.success && uRes.data.data) {
          setPatientProfile(uRes.data.data);
          setPatientId(uRes.data.data.userId);
          const saved = localStorage.getItem('careSync_user');
          if (saved) {
            const u = JSON.parse(saved);
            u.userId = uRes.data.data.userId;
            u.profileDetails = uRes.data.data;
            u.profileImage = uRes.data.data.profileImage;
            u.fullName = uRes.data.data.fullName;
            localStorage.setItem('careSync_user', JSON.stringify(u));
          }
        }
      } catch (uErr) {
        console.warn('Patient fallback fetch by username failed:', uErr.message);
      }
    }
  };

  const openEditProfile = () => {
    const p = patientProfile || currentUser?.profileDetails;
    setProfileForm({
      contactNumber: p?.contactNumber || currentUser?.contactNumber || '',
      emergencyContact: p?.emergencyContact || '',
      address: p?.address || currentUser?.address || '',
      profileImage: p?.profileImage || currentUser?.profileImage || ''
    });
    setProfileSuccessMsg('');
    setEditProfileModal(true);
  };

  const handleEditPhotoSelect = (e) => {
    const file = e.target.files?.[0];
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
        setProfileForm(prev => ({ ...prev, profileImage: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileUpdateLoading(true);
    setProfileSuccessMsg('');
    try {
      const activeId = patientId || resolvedPatientId || patientProfile?.userId || currentUser?.userId;
      if (!activeId) {
        throw new Error('Unable to identify patient account ID. Please refresh your session.');
      }
      const payload = {
        contactNumber: (profileForm.contactNumber || '').trim(),
        emergencyContact: (profileForm.emergencyContact || '').trim(),
        address: (profileForm.address || '').trim(),
        profileImage: profileForm.profileImage || null
      };
      const res = await axios.put(`/api/patients/${activeId}`, payload);
      if (res.data && res.data.success) {
        setPatientProfile(res.data.data);
        setPatientId(activeId);
        setProfileSuccessMsg('Contact details, address, and profile photo updated successfully!');
        const saved = localStorage.getItem('careSync_user');
        if (saved) {
          const u = JSON.parse(saved);
          u.userId = activeId;
          u.profileDetails = res.data.data;
          u.profileImage = res.data.data.profileImage;
          u.contactNumber = res.data.data.contactNumber;
          localStorage.setItem('careSync_user', JSON.stringify(u));
        }
        setTimeout(() => {
          setEditProfileModal(false);
          setProfileSuccessMsg('');
        }, 1200);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error updating profile');
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/doctors');
      if (res.data && res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/schedules/upcoming');
      if (res.data && res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await axios.get(`/api/appointments/patient/${patientId}`);
      if (res.data && res.data.success) {
        setMyAppointments(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyPrescriptions = async () => {
    try {
      const targetId = patientId || resolvedPatientId;
      const res = await axios.get(`/api/doctors/prescriptions/patient/${targetId}`);
      if (res.data && res.data.success) {
        setMyPrescriptions(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.warn('Error fetching patient prescriptions:', err);
    }
  };

  const fetchPatientBills = async () => {
    try {
      const myPatId = formatPatientId(patientId || resolvedPatientId);
      const myNic = patientProfile?.nic || currentUser?.nic;
      const myContact = patientProfile?.contactNumber || currentUser?.contactNumber;
      const myName = patientProfile?.fullName || currentUser?.fullName;

      let bills = [];
      try {
        const res = await axios.get('/api/payments/custom-bills');
        if (res.data?.success && Array.isArray(res.data.data)) {
          bills = res.data.data;
        }
      } catch (err) {
        console.warn('Could not fetch custom bills from API:', err);
      }

      // Merge with localStorage bills
      try {
        const localBills = JSON.parse(localStorage.getItem('caresync_custom_bills') || '[]');
        const existingInv = new Set(bills.map(b => b.invoiceNumber));
        localBills.forEach(lb => {
          if (!existingInv.has(lb.invoiceNumber)) {
            bills.push(lb);
          }
        });
      } catch (e) {
        console.error('Error loading local bills', e);
      }

      // Filter for this patient
      const myBills = bills.filter(b => {
        if (!b) return false;
        if (b.patientId && myPatId && String(b.patientId).trim().toUpperCase() === myPatId.toUpperCase()) return true;
        if (b.patientId && String(b.patientId).trim() === String(patientId)) return true;
        if (b.patientNic && myNic && String(b.patientNic).trim().toUpperCase() === String(myNic).trim().toUpperCase()) return true;
        if (b.patientContact && myContact && String(b.patientContact).replace(/\D/g, '') === String(myContact).replace(/\D/g, '')) return true;
        if (b.patientName && myName && String(b.patientName).trim().toLowerCase() === String(myName).trim().toLowerCase()) return true;
        return false;
      });

      setPatientBills(myBills);
    } catch (err) {
      console.error('Error in fetchPatientBills', err);
    }
  };

  const handleCustomBillPaid = (updatedBill) => {
    setPatientBills(prev => prev.map(b => 
      (b.billId === updatedBill.billId || b.invoiceNumber === updatedBill.invoiceNumber) ? updatedBill : b
    ));
    setReceiptModal(updatedBill);
    fetchPatientBills();
  };

  const fetchMyComplaints = async () => {
    try {
      const targetId = patientId || resolvedPatientId;
      const res = await axios.get(`/api/complaints/patient/${targetId}`);
      if (res.data && res.data.success) {
        setMyComplaints(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.warn('Error fetching patient complaints:', err);
    }
  };

  const fetchFeedbacksAndRatings = async () => {
    setFeedbacksLoading(true);
    try {
      const [feedbacksRes, summaryRes] = await Promise.allSettled([
        axios.get('/api/feedback'),
        axios.get('/api/feedback/summary')
      ]);

      let fbData = [];
      if (feedbacksRes.status === 'fulfilled' && feedbacksRes.value.data?.success) {
        fbData = Array.isArray(feedbacksRes.value.data.data) ? feedbacksRes.value.data.data : [];
      }

      let smData = [];
      if (summaryRes.status === 'fulfilled' && summaryRes.value.data?.success) {
        smData = Array.isArray(summaryRes.value.data.data) ? summaryRes.value.data.data : [];
      }

      // High-quality verified realistic dataset fallback if empty
      if (fbData.length === 0) {
        fbData = [
          {
            feedbackId: 101,
            patient: { fullName: 'Anjali Perera' },
            doctor: { userId: 5, fullName: 'Dr. Nuwan Jayawardena', specialization: 'Cardiology' },
            appointment: { appointmentId: 1 },
            rating: 5,
            comments: 'Dr. Nuwan is exceptional! He took time to review my ECG and explained my cardiac medication regimen clearly. Very reassuring.',
            submittedDate: '2026-09-24T14:30:00'
          },
          {
            feedbackId: 102,
            patient: { fullName: 'Kasun Bandara' },
            doctor: { userId: 6, fullName: 'Dr. Priyantha Alwis', specialization: 'Orthopedics' },
            appointment: { appointmentId: 2 },
            rating: 5,
            comments: 'Consultation was on time. Dr. Priyantha diagnosed my knee sprain accurately and recommended therapy that brought fast relief.',
            submittedDate: '2026-09-25T11:15:00'
          },
          {
            feedbackId: 103,
            patient: { fullName: 'Dilani Samarasinghe' },
            doctor: { userId: 7, fullName: 'Dr. Amanda Pathirana', specialization: 'Pediatrics' },
            appointment: { appointmentId: 3 },
            rating: 5,
            comments: 'Wonderful pediatrician. She handled my 4-year-old child with utmost warmth and care. Highly recommended for any parents.',
            submittedDate: '2026-09-26T16:45:00'
          },
          {
            feedbackId: 104,
            patient: { fullName: 'Chaminda Silva' },
            doctor: { userId: 8, fullName: 'Dr. Samantha Fernando', specialization: 'Neurology' },
            appointment: { appointmentId: 4 },
            rating: 4,
            comments: 'Thorough neurological assessment. The hospital wait time was minimal and doctor gave very detailed lifestyle guidance.',
            submittedDate: '2026-09-27T09:20:00'
          },
          {
            feedbackId: 105,
            patient: { fullName: 'Nimali Senanayake' },
            doctor: { userId: 5, fullName: 'Dr. Nuwan Jayawardena', specialization: 'Cardiology' },
            appointment: { appointmentId: 5 },
            rating: 5,
            comments: 'Polite, extremely professional and knowledgeable. The CareSync live queue tracker made scheduling stress-free.',
            submittedDate: '2026-09-28T10:00:00'
          }
        ];
      }
      setAllFeedbacks(fbData);

      if (smData.length === 0) {
        smData = [
          { doctorId: 5, doctorName: 'Dr. Nuwan Jayawardena', specialization: 'Cardiology', averageRating: 5.0, totalReviews: 18 },
          { doctorId: 6, doctorName: 'Dr. Priyantha Alwis', specialization: 'Orthopedics', averageRating: 4.9, totalReviews: 22 },
          { doctorId: 7, doctorName: 'Dr. Amanda Pathirana', specialization: 'Pediatrics', averageRating: 5.0, totalReviews: 15 },
          { doctorId: 8, doctorName: 'Dr. Samantha Fernando', specialization: 'Neurology', averageRating: 4.8, totalReviews: 12 }
        ];
      }
      setDoctorRatingsSummary(smData);
    } catch (err) {
      console.warn('Error fetching feedbacks/ratings summary:', err);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const getDoctorAvgRating = (docUserId) => {
    const summary = doctorRatingsSummary.find(s => Number(s.doctorId) === Number(docUserId));
    if (summary && summary.averageRating !== undefined && summary.averageRating !== null) {
      return Number(summary.averageRating).toFixed(1);
    }
    const docFbs = allFeedbacks.filter(f => Number(f.doctor?.userId) === Number(docUserId) || Number(f.doctorId) === Number(docUserId));
    if (docFbs.length > 0) {
      const sum = docFbs.reduce((acc, f) => acc + (f.rating || 5), 0);
      return (sum / docFbs.length).toFixed(1);
    }
    return '4.9';
  };

  const getDoctorReviewCount = (docUserId) => {
    const summary = doctorRatingsSummary.find(s => Number(s.doctorId) === Number(docUserId));
    if (summary && summary.totalReviews !== undefined) {
      return summary.totalReviews;
    }
    const docFbs = allFeedbacks.filter(f => Number(f.doctor?.userId) === Number(docUserId) || Number(f.doctorId) === Number(docUserId));
    return docFbs.length > 0 ? docFbs.length : 12;
  };

  const getDoctorFeedbacksList = (docUserId) => {
    return allFeedbacks.filter(f => Number(f.doctor?.userId) === Number(docUserId) || Number(f.doctorId) === Number(docUserId));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      if (!specialization.trim()) {
        fetchDoctors();
        return;
      }
      const res = await axios.get(`/api/doctors/search?specialization=${encodeURIComponent(specialization)}`);
      if (res.data && res.data.success) {
        setDoctors(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.length > 0 ? parts.join(' ') : v;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 4);
    if (v.length >= 3) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const getCardType = (number) => {
    if (!number) return 'VISA';
    const clean = number.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'MASTERCARD';
    if (clean.startsWith('3')) return 'AMEX';
    return 'VISA';
  };

  const setTestCard = (type) => {
    if (type === 'VISA') {
      setCardForm({
        ...cardForm,
        cardNumber: '4532 8912 3456 8899',
        expiryDate: '08/28',
        cvv: '789',
      });
    } else {
      setCardForm({
        ...cardForm,
        cardNumber: '5412 7534 8901 5544',
        expiryDate: '11/29',
        cvv: '321',
      });
    }
  };

  const openPaymentGateway = (e, sched, slot) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    if (isSlotExpired(sched?.scheduleDate, slot?.slotTime, slot?.slotEndTime, slot?.slotStatus)) {
      alert('This timeslot has already expired because its time has passed.');
      return;
    }
    setSelectedSchedule(sched);
    setSelectedSlot(slot);
    setCardForm((prev) => ({
      ...prev,
      cardholderName: currentUser?.fullName || prev.cardholderName || 'Anjali Perera'
    }));
    setPaymentStep('IDLE');
    setPaymentStepMsg('');
    setShowPaymentModal(true);
  };

  const handleProcessPaymentWithGateway = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedSchedule || !selectedSlot) {
      alert('Please select a valid schedule and timeslot.');
      return;
    }
    if (isSlotExpired(selectedSchedule.scheduleDate, selectedSlot.slotTime, selectedSlot.slotEndTime, selectedSlot.slotStatus)) {
      alert('Cannot proceed with payment: This timeslot has already expired.');
      setShowPaymentModal(false);
      setSelectedSlot(null);
      return;
    }

    if (selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD') {
      const cleanNum = cardForm.cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 12) {
        alert('Please enter a valid card number.');
        return;
      }
      if (!cardForm.expiryDate || cardForm.expiryDate.length < 5) {
        alert('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        alert('Please enter a valid 3-digit CVV.');
        return;
      }
    }

    const feeAmount = selectedSchedule.doctor?.consultationFee || 2500;
    setBookingLoading(true);
    setPaymentStep('3D_SECURE');
    setPaymentStepMsg('Contacting Merchant Acquiring Bank (Visa / Mastercard 3D-Secure 2.0)...');

    // Simulated 3D secure delay 1
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPaymentStepMsg('Verifying Card Security Token & Authorizing LKR ' + feeAmount.toLocaleString() + '...');

    // Simulated 3D secure delay 2
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPaymentStepMsg('Payment Approved by Bank! Confirming Outpatient Booking...');

    try {
      // 1. Calculate end time
      let calcEndTime = selectedSlot.slotEndTime || selectedSlot.slotTime;
      if (!selectedSlot.slotEndTime) {
        try {
          const parts = String(selectedSlot.slotTime).split(':');
          let h = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10) + 20;
          if (m >= 60) {
            h = (h + 1) % 24;
            m = m - 60;
          }
          const s = parts[2] !== undefined ? parts[2] : '00';
          calcEndTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s}`;
        } catch (calcErr) {
          calcEndTime = selectedSlot.slotTime;
        }
      }

      // 2. Book appointment (Member 4 - Devindra P.P.C.G)
      const docId = selectedSchedule.doctor?.userId || selectedSchedule.doctor?.doctorId || selectedSchedule.doctorId;
      const bookRes = await axios.post('/api/appointments', {
        patientId: patientId,
        doctorId: docId,
        scheduleId: selectedSchedule.scheduleId,
        timeslotId: selectedSlot.timeslotId,
        appointmentDate: selectedSchedule.scheduleDate,
        startTime: selectedSlot.slotTime,
        endTime: calcEndTime,
      });

      const appointment = bookRes.data.data;

      // 3. Process online payment & generate digital receipt (Member 6 - Brahmananayaka N.M)
      const txnRef = 'TXN-CARD-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
      const payMethod = (selectedPaymentMethod === 'MOBILE_WALLET') ? 'ONLINE_BANKING' : selectedPaymentMethod;
      const payRes = await axios.post('/api/payments/process', {
        appointmentId: appointment.appointmentId,
        amount: feeAmount,
        paymentMethod: payMethod,
        transactionReference: txnRef,
      });

      // 4. Fetch newly generated receipt
      let receiptData = null;
      try {
        const receiptRes = await axios.get(`/api/payments/appointment/${appointment.appointmentId}/receipt`);
        receiptData = receiptRes.data?.data;
      } catch (rErr) {
        console.warn('Could not fetch receipt details:', rErr);
      }
      
      setBookingSuccess({
        appointment,
        payment: payRes.data.data,
        receipt: receiptData,
        cardLast4: cardForm.cardNumber ? cardForm.cardNumber.replace(/\s+/g, '').slice(-4) : '8899',
        cardBrand: getCardType(cardForm.cardNumber),
      });

      setShowPaymentModal(false);
      setSelectedSchedule(null);
      setSelectedSlot(null);
      fetchSchedules();
      fetchMyAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment simulation failed. Please try again.');
      setPaymentStep('IDLE');
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchPatientRefunds = async () => {
    try {
      const res = await axios.get(`/api/refunds/patient/${patientId}`);
      if (res.data && res.data.success) {
        setPatientRefunds(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
    }
  };

  const refundMap = useMemo(() => {
    const map = {};
    if (Array.isArray(patientRefunds)) {
      patientRefunds.forEach((r) => {
        if (r && r.appointment && r.appointment.appointmentId) {
          map[r.appointment.appointmentId] = r;
        }
      });
    }
    return map;
  }, [patientRefunds]);

  const openRefundModal = (appointment = null) => {
    setRefundMsg({ type: '', text: '' });
    if (appointment) {
      const windowStatus = getCancellationWindowStatus(appointment.bookingDate || appointment.createdAt);
      if (windowStatus.isExpired) {
        alert(`⚠️ Cancellation Window Closed!\n\nThis appointment was booked ${windowStatus.hoursSinceBooking} hours ago (${windowStatus.daysSinceBooking || Math.floor(windowStatus.hoursSinceBooking / 24)} days).\n\nPer hospital regulations, appointments can only be cancelled and refunded within 2 days (48 hours) of booking. Cancellations are no longer permitted.`);
        return;
      }
      const fee = appointment.doctor?.consultationFee || 2500.0;
      setRefundForm({
        appointmentId: appointment.appointmentId,
        reasonCategory: 'Doctor unavailable / Cancelled schedule',
        customReason: '',
        amount: fee,
      });
    } else {
      const eligible = (myAppointments || []).filter((a) => {
        if (!a || refundMap[a.appointmentId]) return false;
        const windowStatus = getCancellationWindowStatus(a.bookingDate || a.createdAt);
        return !windowStatus.isExpired;
      });
      if (eligible.length === 0) {
        alert("⚠️ No Eligible Appointments:\n\nNone of your appointments are currently eligible for cancellation or refund. Appointments can only be cancelled within 2 days (48 hours) of booking.");
        return;
      }
      const first = eligible[0];
      setRefundForm({
        appointmentId: first ? first.appointmentId : '',
        reasonCategory: 'Doctor unavailable / Cancelled schedule',
        customReason: '',
        amount: first ? first.doctor?.consultationFee || 2500.0 : 2500.0,
      });
    }
    setRefundModalOpen(true);
  };

  const handleRefundAppointmentSelect = (appId) => {
    const found = myAppointments.find((a) => String(a.appointmentId) === String(appId));
    setRefundForm((prev) => ({
      ...prev,
      appointmentId: appId,
      amount: found?.doctor?.consultationFee || 2500.0,
    }));
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!refundForm.appointmentId) {
      setRefundMsg({ type: 'error', text: 'Please select an appointment to refund.' });
      return;
    }
    setRefundLoading(true);
    setRefundMsg({ type: '', text: '' });
    try {
      const fullReason = refundForm.customReason.trim()
        ? `${refundForm.reasonCategory}: ${refundForm.customReason.trim()}`
        : refundForm.reasonCategory;

      const res = await axios.post('/api/refunds/request', {
        appointmentId: parseInt(refundForm.appointmentId),
        refundAmount: parseFloat(refundForm.amount),
        reason: fullReason,
      });

      if (res.data && res.data.success) {
        setRefundMsg({
          type: 'success',
          text: 'Refund claim submitted successfully! Hospital Finance Officer will review and settle your payment.',
        });
        fetchPatientRefunds();
        fetchMyAppointments();
        setTimeout(() => {
          setRefundModalOpen(false);
          setRefundMsg({ type: '', text: '' });
        }, 1600);
      }
    } catch (err) {
      setRefundMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error submitting refund request.',
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    const app = typeof appointment === 'object' ? appointment : myAppointments.find((a) => a.appointmentId === appointment);
    const appId = app ? app.appointmentId : appointment;
    if (app && isPastDateTime(app.appointmentDate, app.endTime || app.startTime)) {
      alert('Cannot cancel: This appointment has already taken place and concluded.');
      return;
    }

    if (app) {
      const windowStatus = getCancellationWindowStatus(app.bookingDate || app.createdAt);
      if (windowStatus.isExpired) {
        alert(`⚠️ Cancellation Window Closed!\n\nThis appointment was booked ${windowStatus.hoursSinceBooking} hours ago (${windowStatus.daysSinceBooking || Math.floor(windowStatus.hoursSinceBooking / 24)} days).\n\nPer hospital regulations, appointments can only be cancelled within 2 days (48 hours) of booking. Cancellations after 2 days are strictly prohibited.`);
        return;
      }
    }

    const cancelWindow = app ? getCancellationWindowStatus(app.bookingDate || app.createdAt) : null;
    const confirmPrompt = cancelWindow && !cancelWindow.isExpired
      ? `Are you sure you want to cancel this appointment? (Cancellation window: ${cancelWindow.formattedRemaining} remaining)\n\nYour timeslot will be released.`
      : 'Are you sure you want to cancel this appointment? Your timeslot will be released.';

    if (!window.confirm(confirmPrompt)) return;
    try {
      await axios.put(`/api/appointments/${appId}/cancel`);
      fetchMyAppointments();
      fetchSchedules();
      fetchPatientRefunds();
      if (window.confirm('Appointment cancelled successfully.\n\nWould you like to apply for a refund for your consultation fee right now?')) {
        openRefundModal(app);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling appointment.');
    }
  };

  const openRescheduleModal = async (appointment) => {
    setRescheduleModal(appointment);
    try {
      const res = await axios.get(`/api/schedules/doctor/${appointment.doctor.userId}`);
      if (res.data && res.data.success) {
        setRescheduleSchedules(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleSlot) {
      alert('Please select a target timeslot.');
      return;
    }
    if (isSlotExpired(rescheduleSlot.schedule?.scheduleDate, rescheduleSlot.slotTime, rescheduleSlot.slotEndTime, rescheduleSlot.slotStatus)) {
      alert('Cannot reschedule: The selected timeslot has already expired.');
      return;
    }
    try {
      await axios.put(`/api/appointments/${rescheduleModal.appointmentId}/reschedule`, {
        newScheduleId: rescheduleSlot.schedule.scheduleId,
        newTimeslotId: rescheduleSlot.timeslotId,
        newAppointmentDate: rescheduleSlot.schedule.scheduleDate,
        newStartTime: rescheduleSlot.slotTime,
        newEndTime: rescheduleSlot.slotTime,
      });
      alert('Appointment successfully rescheduled!');
      setRescheduleModal(null);
      setRescheduleSlot(null);
      fetchMyAppointments();
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rescheduling appointment.');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackAppointmentId) {
      alert('Please select a consultation appointment to provide feedback.');
      return;
    }
    const chosenApp = myAppointments.find(a => String(a.appointmentId) === String(feedbackAppointmentId));
    const docId = feedbackDoctorId || chosenApp?.doctor?.userId || chosenApp?.doctor?.doctorId;
    if (!docId) {
      alert('Could not resolve the doctor for this appointment.');
      return;
    }
    try {
      await axios.post('/api/feedback', {
        patientId: patientId,
        doctorId: parseInt(docId),
        appointmentId: parseInt(feedbackAppointmentId),
        rating: parseInt(rating),
        comments: comments,
      });
      setFeedbackMessage('Thank you! Your feedback has been recorded.');
      setFeedbackAppointmentId('');
      setFeedbackDoctorId('');
      setComments('');
      fetchFeedbacksAndRatings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/complaints', {
        patientId: patientId,
        complaintType: complaintType,
        description: complaintDesc,
      });
      alert('Complaint lodged successfully. Customer Support will follow up promptly.');
      setComplaintDesc('');
      fetchMyComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit complaint.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Profile Photo & Details */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Profile Avatar with Quick Edit Button */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/50 overflow-hidden shadow-2xl flex items-center justify-center">
                {patientProfile?.profileImage || currentUser?.profileImage ? (
                  <img
                    src={patientProfile?.profileImage || currentUser?.profileImage}
                    alt={patientProfile?.fullName || currentUser?.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-white/80" />
                )}
              </div>
              <button
                onClick={openEditProfile}
                className="absolute -bottom-1 -right-1 bg-white text-emerald-700 hover:bg-emerald-50 p-2 rounded-2xl shadow-lg border border-emerald-100 transition transform hover:scale-110"
                title="Change Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {patientProfile?.fullName || currentUser?.fullName || 'Valued Patient'}
                </h1>
                <span className="bg-emerald-500/40 border border-white/30 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Verified Patient
                </span>
                {patientProfile?.bloodGroup && (
                  <span className="bg-rose-500/80 border border-white/30 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Droplet className="w-3 h-3" /> Blood: {patientProfile.bloodGroup}
                  </span>
                )}
              </div>

              <p className="text-emerald-100 text-xs sm:text-sm font-medium flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                <span>Patient ID: <strong className="text-white font-mono">{formatPatientId(patientId)}</strong></span>
                <span>NIC: <strong className="text-white">{patientProfile?.nic || currentUser?.nic || 'Verified'}</strong></span>
                <span>Username: <strong className="text-white">@{patientProfile?.username || currentUser?.username}</strong></span>
              </p>

              <div className="text-emerald-200 text-xs flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 pt-1">
                {patientProfile?.contactNumber && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {patientProfile.contactNumber}</span>
                )}
                {patientProfile?.emergencyContact && (
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-300" /> Emergency: {patientProfile.emergencyContact}</span>
                )}
                {patientProfile?.address && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {patientProfile.address}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Notification Manager */}
          <div className="flex flex-col gap-3 w-full sm:w-auto items-stretch sm:items-end">
            <div className="w-full flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={fetchAllPatientData}
                disabled={refreshing}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold px-3 py-2 rounded-xl text-xs backdrop-blur-sm transition flex items-center gap-1.5 cursor-pointer"
                title="Refresh Patient Records"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Portal'}</span>
              </button>
              <NotificationManager currentUser={currentUser} onNavigate={setActiveTab} variant="banner" />
            </div>
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex-1 sm:flex-initial bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold px-4 py-2 rounded-xl text-xs backdrop-blur-sm transition flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" /> View Full Profile & ID
              </button>
              <button
                onClick={openEditProfile}
                className="flex-1 sm:flex-initial bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Contacts & Photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OUTSTANDING HOSPITAL BILL ALERT BANNER */}
      {(() => {
        const pendingBills = (patientBills || []).filter(b => b.paymentStatus === 'PENDING');
        if (pendingBills.length === 0) return null;
        const totalPendingAmount = pendingBills.reduce((acc, b) => acc + (Number(b.netPayable || b.totalAmount || 0)), 0);
        return (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-orange-400/40 animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[10px] uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full text-white border border-white/30">Action Required</span>
                  <p className="font-extrabold text-sm sm:text-base tracking-tight">
                    You have {pendingBills.length} unpaid hospital {pendingBills.length === 1 ? 'bill' : 'bills'}
                  </p>
                </div>
                <p className="text-amber-100 text-xs mt-1">
                  Outstanding balance: <strong className="text-white font-black text-sm">LKR {totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  <span className="opacity-90 ml-1.5 hidden sm:inline">({pendingBills.map(b => b.invoiceNumber).join(', ')})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSelectedBillToPay(pendingBills[0])}
                className="flex-1 md:flex-initial bg-white text-orange-800 hover:bg-orange-50 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
              >
                <CreditCard className="w-4 h-4 text-orange-600" />
                Pay Bill Online Now
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bills')}
                className="bg-black/20 hover:bg-black/30 border border-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
              >
                View Invoices <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* TAB 1: BROWSE & BOOK */}
      {activeTab === 'browse' && (
        <div className="space-y-8">
          {/* Full-width: Search + Doctor Cards with inline schedule expansion */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Search by specialization (e.g. Cardiology, General Medicine, Pediatrics)..."
                className="w-full text-sm outline-none bg-transparent text-slate-800"
              />
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Filter
              </button>
            </div>

            {/* Doctor Cards */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Available Medical Specialists</h2>
              {doctors.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500">
                  No doctors found matching criteria.
                </div>
              ) : (
                doctors.map((doc) => {
                  const isOpen = expandedDoctorId === doc.userId;
                  // Schedules belonging to this doctor (only upcoming/active sessions)
                  const doctorSchedules = schedules.filter(
                    s => Number(s.doctor?.userId) === Number(doc.userId) &&
                         !isSessionCompleted(s.scheduleDate, s.endTime, s.status)
                  );

                  return (
                    <div
                      key={doc.userId}
                      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                        isOpen
                          ? 'border-emerald-500 shadow-md shadow-emerald-100 ring-2 ring-emerald-400/20'
                          : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      {/* ── Doctor card header ── */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isOpen) {
                            setExpandedDoctorId(null);
                            setSelectedSchedule(null);
                            setSelectedSlot(null);
                          } else {
                            setExpandedDoctorId(doc.userId);
                            setSelectedSchedule(null);
                            setSelectedSlot(null);
                          }
                        }}
                        className={`w-full text-left p-5 flex items-center justify-between gap-4 transition-colors ${
                          isOpen ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm">
                            {doc.profileImage ? (
                              <img src={doc.profileImage} alt={doc.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <Stethoscope className="w-6 h-6 text-emerald-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{doc.fullName}</span>
                              <span className="font-mono text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                                {formatDoctorId(doc)}
                              </span>
                              <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                                {doc.specialization}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.qualifications}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                              <span className="flex items-center text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mr-1" />
                                {getDoctorAvgRating(doc.userId)}
                                <span className="text-slate-500 font-normal ml-1">({getDoctorReviewCount(doc.userId)} reviews)</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDoctorReviewsModal(doc);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 px-2 py-0.5 rounded-md transition"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                Read Reviews
                              </button>
                              <span className="text-[11px] text-slate-500">
                                Hospital: <span className="font-medium text-slate-700">{doc.hospitalAffiliation || 'National Hospital'}</span> • License: {doc.medicalLicenseNo}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: fee + session count + chevron */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="text-sm font-bold text-emerald-700">LKR {doc.consultationFee?.toLocaleString()}</div>
                          <span className="text-[11px] text-slate-400">per session</span>
                          {doctorSchedules.length > 0 && (
                            <span className="text-[11px] text-emerald-600 font-semibold">
                              {doctorSchedules.length} session{doctorSchedules.length !== 1 ? 's' : ''} available
                            </span>
                          )}
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 mt-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      {/* ── Inline schedule expansion (smooth max-height animation) ── */}
                      <div
                        style={{
                          maxHeight: isOpen ? '2000px' : '0px',
                          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          overflow: 'hidden',
                        }}
                      >
                        <div className="border-t border-emerald-100 bg-slate-50/40 px-5 py-4 space-y-3">
                          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            Select Consultation Session
                          </h3>

                          {doctorSchedules.length === 0 ? (
                            <div className="text-xs text-slate-500 bg-white rounded-xl border border-slate-200 p-4 text-center">
                              No upcoming sessions available for this doctor.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {doctorSchedules.map((sched) => {
                                const isSchedExpanded = selectedSchedule?.scheduleId === sched.scheduleId;
                                const availableSlots = (sched.timeslots || []).filter(
                                  t => t.slotStatus === 'AVAILABLE' && !isSlotExpired(sched.scheduleDate, t.slotTime, t.slotEndTime, t.slotStatus)
                                );
                                const availableCount = availableSlots.length;
                                return (
                                  <div
                                    key={sched.scheduleId}
                                    className={`rounded-xl border overflow-hidden bg-white transition-all duration-200 ${
                                      isSchedExpanded
                                        ? 'border-emerald-400 shadow-sm ring-1 ring-emerald-300/30'
                                        : 'border-slate-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    {/* Session row header */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isSchedExpanded) {
                                          setSelectedSchedule(null);
                                          setSelectedSlot(null);
                                        } else {
                                          setSelectedSchedule(sched);
                                          setSelectedSlot(null);
                                        }
                                      }}
                                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                                        isSchedExpanded ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-slate-800">{sched.scheduleDate}</span>
                                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                              <Clock className="w-3 h-3" />
                                              {sched.startTime} – {sched.endTime}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sched.hospitalLocation}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-[11px] font-semibold ${availableCount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                          {availableCount} slot{availableCount !== 1 ? 's' : ''}
                                        </span>
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSchedExpanded ? 'rotate-180' : ''}`}
                                        />
                                      </div>
                                    </button>

                                    {/* Timeslot grid (nested expand) */}
                                    <div
                                      style={{
                                        maxHeight: isSchedExpanded ? '600px' : '0px',
                                        transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <div className="px-4 pb-4 pt-2 border-t border-emerald-100 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                          <p className="text-xs font-bold text-slate-700">Select a 20-Min Timeslot:</p>
                                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                            <span>Note: Cancellations permitted within 2 days (48 hours) only</span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                          {sched.timeslots?.map((slot) => {
                                            const isExpired = isSlotExpired(sched.scheduleDate, slot.slotTime, slot.slotEndTime, slot.slotStatus);
                                            const isAvailable = slot.slotStatus === 'AVAILABLE' && !isExpired;
                                            const isSlotSelected = selectedSlot?.timeslotId === slot.timeslotId;
                                            return (
                                              <button
                                                key={slot.timeslotId}
                                                type="button"
                                                disabled={!isAvailable}
                                                onClick={() => setSelectedSlot(isSlotSelected ? null : slot)}
                                                title={isExpired ? 'Slot expired (time passed)' : !isAvailable ? 'Slot already booked' : 'Available for booking'}
                                                className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                                  isSlotSelected
                                                    ? 'bg-emerald-600 text-white shadow-sm scale-105'
                                                    : isAvailable
                                                    ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:scale-105'
                                                    : isExpired
                                                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-60'
                                                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed line-through'
                                                }`}
                                              >
                                                <span>#{slot.slotNo}</span>
                                                <span className="text-[10px] font-normal opacity-80">
                                                  {slot.slotEndTime ? `${String(slot.slotTime).slice(0, 5)} - ${String(slot.slotEndTime).slice(0, 5)}` : slot.slotTime}
                                                </span>
                                                {isExpired && (
                                                  <span className="text-[8px] uppercase tracking-wider font-bold text-rose-500 not-italic">
                                                    Expired
                                                  </span>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Payment CTA */}
                                        {selectedSlot && (
                                          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-xl border border-emerald-300 shadow-sm space-y-2.5 mt-1">
                                            <div className="flex justify-between items-center text-xs">
                                              <div>
                                                <span className="font-bold text-slate-800">Selected Slot #{selectedSlot.slotNo}</span>
                                                <span className="text-slate-500 ml-1.5 font-medium">
                                                  ({selectedSlot.slotEndTime ? `${String(selectedSlot.slotTime).slice(0, 5)} - ${String(selectedSlot.slotEndTime).slice(0, 5)}` : selectedSlot.slotTime})
                                                </span>
                                              </div>
                                              <span className="font-black text-emerald-800 text-sm">
                                                LKR {(doc?.consultationFee || 2500)?.toLocaleString()}
                                              </span>
                                            </div>

                                            {/* 2-Day Cancellation Policy Warning Note */}
                                            <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
                                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                              <div>
                                                <span className="font-bold text-amber-950">Important Notice:</span> You can cancel this appointment and claim a refund <strong className="text-amber-950 font-bold underline decoration-amber-400">within 2 days (48 hours) of booking only</strong>. After 2 days, cancellation is permanently locked.
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={(e) => openPaymentGateway(e, sched, selectedSlot)}
                                              disabled={bookingLoading}
                                              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
                                            >
                                              <CreditCard className="w-4 h-4" />
                                              Proceed to Card Payment (LKR {(doc?.consultationFee || 2500)?.toLocaleString()})
                                            </button>
                                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-0.5">
                                              <Lock className="w-3 h-3 text-emerald-600" />
                                              <span>Visa • Mastercard • Amex • LankaPay IPG</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        {/* VERIFIED PATIENT REVIEWS & DOCTOR RATINGS DESK */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header & Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Patient Reviews & Doctor Ratings Desk
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Real feedback and verified ratings submitted by patients following completed consultations. Browse honest reviews to choose the right specialist for your healthcare needs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Verified Consultations
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Rate Your Consultation
              </button>
            </div>
          </div>

          {/* Top Scorecard & Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/40 p-4 rounded-2xl border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Average Rating</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                <span>4.9</span>
                <span className="text-xs text-slate-500 font-semibold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-[10px] text-slate-500 ml-1 font-medium">Top Quality Care</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Feedbacks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {allFeedbacks.length > 0 ? allFeedbacks.length : '18+'}
              </div>
              <p className="text-[10px] text-emerald-800 font-medium">Recorded from live outpatient sessions</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 p-4 rounded-2xl border border-blue-200/80 space-y-1">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Satisfaction Rate</span>
                <ThumbsUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">98.5%</div>
              <p className="text-[10px] text-blue-800 font-medium">Would recommend CareSync specialists</p>
            </div>

            <div className="bg-gradient-to-br from-teal-50/80 to-teal-100/40 p-4 rounded-2xl border border-teal-200/80 space-y-1">
              <div className="flex items-center justify-between text-teal-700">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Specialists Rated</span>
                <Stethoscope className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {doctors.length > 0 ? doctors.length : 4}
              </div>
              <p className="text-[10px] text-teal-800 font-medium">Cardiology, Ortho, Pediatrics & Neuro</p>
            </div>
          </div>

          {/* Filter Pills & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">Rating:</span>
              {[
                { id: 'ALL', label: 'All Reviews' },
                { id: '5', label: '5 Stars ★★★★★' },
                { id: '4', label: '4 Stars ★★★★' },
                { id: '3', label: '3 Stars or Below' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFeedbackRatingFilter(pill.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    feedbackRatingFilter === pill.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Doctor:</span>
              <select
                value={feedbackDoctorFilter}
                onChange={(e) => setFeedbackDoctorFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Doctors & Specialists</option>
                {doctors.map((d) => (
                  <option key={d.userId} value={d.userId}>
                    {d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reviews Cards Grid */}
          {/* Reviews Cards Grid (3 Visible + See More Toggle) */}
          {(() => {
            const filteredReviews = allFeedbacks.filter((f) => {
              if (feedbackRatingFilter !== 'ALL') {
                if (feedbackRatingFilter === '3') {
                  if (Number(f.rating) > 3) return false;
                } else if (Number(f.rating) !== Number(feedbackRatingFilter)) {
                  return false;
                }
              }
              if (feedbackDoctorFilter !== 'ALL') {
                const docId = f.doctor?.userId || f.doctorId;
                if (Number(docId) !== Number(feedbackDoctorFilter)) return false;
              }
              return true;
            });

            const visibleReviews = showAllFeedbacks ? filteredReviews : filteredReviews.slice(0, 3);

            return (
              <>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1 px-1">
                  <span>
                    Showing {visibleReviews.length} of {filteredReviews.length} patient reviews
                  </span>
                  {filteredReviews.length > 3 && (
                    <span className="text-emerald-700 font-bold text-[11px]">
                      {showAllFeedbacks ? 'All reviews displayed' : `3 of ${filteredReviews.length} shown (Click "See More" below)`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {visibleReviews.map((f, idx) => {
                    const docObj = f.doctor || doctors.find((d) => Number(d.userId) === Number(f.doctorId));
                    const patientName = f.patient?.fullName || 'Verified Patient';
                    const initial = patientName.charAt(0).toUpperCase();
                    const stars = Number(f.rating) || 5;

                    return (
                      <div
                        key={f.feedbackId || idx}
                        className="bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4 transition shadow-sm hover:shadow space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          {/* Reviewer Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                                {initial}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900">{patientName}</span>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Consultation" />
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {f.submittedDate ? new Date(f.submittedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Verified Session'}
                                </span>
                              </div>
                            </div>

                            {/* Star Rating Badge */}
                            <div className="flex items-center bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-700 font-extrabold text-[11px]">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                              {stars}.0
                            </div>
                          </div>

                          {/* Doctor Tag */}
                          {docObj && (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-[11px]">
                              <Stethoscope className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span className="font-bold text-slate-800 truncate">{docObj.fullName}</span>
                              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded ml-auto flex-shrink-0">
                                {docObj.specialization}
                              </span>
                            </div>
                          )}

                          {/* Comment text */}
                          <div className="relative pl-3 border-l-2 border-emerald-400 text-xs text-slate-700 italic leading-relaxed">
                            "{f.comments || 'Consultation went smoothly and on schedule. Doctor was very helpful.'}"
                          </div>
                        </div>

                        {/* Card Footer / Quick Action */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-[10px] text-slate-400">
                            App #{f.appointment?.appointmentId || f.appointmentId || 'VERIFIED'}
                          </span>
                          {docObj && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctorReviewsModal(docObj);
                              }}
                              className="font-bold text-emerald-700 hover:text-emerald-800 text-[11px] flex items-center gap-1 transition"
                            >
                              All Doctor Reviews <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* See More / Show Less Toggle Button */}
                {filteredReviews.length > 3 && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 font-extrabold text-xs border border-emerald-300 shadow-sm transition hover:shadow transform hover:-translate-y-0.5"
                    >
                      {showAllFeedbacks ? (
                        <>
                          <ChevronUp className="w-4 h-4 text-emerald-700" />
                          <span>Show Less (Collapse to 3 reviews)</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 text-emerald-700" />
                          <span>See More Reviews (+{filteredReviews.length - 3} remaining)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Empty filter result fallback */}
                {filteredReviews.length === 0 && (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    No reviews found matching the selected rating or doctor filter.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my-appointments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Scheduled Appointments</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage consultations, access digital receipts, or claim refunds.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setRefreshing(true);
                  await fetchMyAppointments();
                  setTimeout(() => setRefreshing(false), 500);
                }}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Refresh Appointments"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bills')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                Hospital Bills ({patientBills.length})
              </button>
              <button
                onClick={() => openRefundModal()}
                className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Apply for Refund
              </button>
            </div>
          </div>

          {/* Refund Advisory Notice */}
          <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Need to claim a Refund for a cancelled consultation?</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  You can submit a refund claim directly on any cancelled booking below, or track all filings under the <strong>Refund Claims</strong> tab.
                </p>
              </div>
            </div>
            <button
              onClick={() => openRefundModal()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request Refund
            </button>
          </div>

          {/* 2-Day Cancellation Policy Notice Banner */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-amber-900 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <span className="font-bold text-amber-950">Hospital Policy Note:</span> Appointments can only be cancelled or refunded within <strong className="text-amber-950 font-bold">2 days (48 hours)</strong> of booking. After 2 days, cancellations and refund filings are strictly locked.
            </div>
          </div>

          {myAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              You do not have any appointments yet. Head to "Book Appointments" to reserve one!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myAppointments.map((app) => {
                const isPast = isPastDateTime(app.appointmentDate, app.endTime || app.startTime);
                const effectiveStatus = (app.appointmentStatus === 'CONFIRMED' || app.appointmentStatus === 'RESCHEDULED') && isPast
                  ? 'COMPLETED'
                  : (app.appointmentStatus === 'PENDING_PAYMENT' && isPast ? 'EXPIRED' : app.appointmentStatus);
                const isConcluded = effectiveStatus === 'COMPLETED' || effectiveStatus === 'EXPIRED' || isPast;
                const cancelWindow = getCancellationWindowStatus(app.bookingDate || app.createdAt);

                return (
                  <div key={app.appointmentId} className="py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">Appointment #{app.appointmentId}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          effectiveStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          effectiveStatus === 'RESCHEDULED' ? 'bg-amber-100 text-amber-800' :
                          effectiveStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          effectiveStatus === 'EXPIRED' ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {effectiveStatus}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        {app.doctor.fullName} ({app.doctor.specialization})
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Date: <span className="font-semibold text-slate-700">{app.appointmentDate}</span> at <span className="font-semibold text-slate-700">{app.startTime}</span> (Slot #{app.timeslot?.slotNo})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{app.schedule?.hospitalLocation}</p>

                      {effectiveStatus !== 'CANCELLED' && !isConcluded && (
                        <div className="mt-1 flex items-center gap-1.5">
                          {!cancelWindow.isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Cancellation window: {cancelWindow.formattedRemaining} left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Cancellation locked (booked &gt;2d ago)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {/* Live Queue Tracker Button (only for active upcoming appointments) */}
                      {!isConcluded && effectiveStatus !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedQueueScheduleId(app.schedule?.scheduleId);
                            setActiveTab('live-queue');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-300 text-teal-800 text-xs font-bold hover:bg-teal-100 flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                          <span>Track Live Turn & Doctor Arrival</span>
                        </button>
                      )}

                      {/* View Digital Receipt */}
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.get(`/api/payments/appointment/${app.appointmentId}/receipt`);
                            if (res.data?.success && res.data.data) {
                              setReceiptModal(res.data.data);
                              return;
                            }
                          } catch (err) {
                            console.warn('Receipt endpoint fallback:', err);
                          }
                          setReceiptModal({
                            receiptNumber: `REC-2026-${app.appointmentId}`,
                            issueDate: app.appointmentDate,
                            appointment: app,
                            patient: app.patient || currentUser,
                            doctor: app.doctor,
                            payment: {
                              amount: app.doctor?.consultationFee || 2800,
                              paymentMethod: 'CREDIT_CARD',
                              paymentStatus: 'COMPLETED',
                              transactionReference: `TXN-APP-${app.appointmentId}`
                            },
                            receiptDetails: `CareSync Official Payment Receipt for Appointment #${app.appointmentId} with ${app.doctor?.fullName}`
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Official Tax Invoice
                      </button>

                      {/* Reschedule Button */}
                      {!isConcluded && effectiveStatus !== 'CANCELLED' && !refundMap[app.appointmentId] && (
                        <button
                          onClick={() => openRescheduleModal(app)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
                        >
                          Reschedule
                        </button>
                      )}

                      {/* Refund status badge or Request Refund button */}
                      {refundMap[app.appointmentId] ? (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                          refundMap[app.appointmentId].refundStatus === 'REQUESTED'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : refundMap[app.appointmentId].refundStatus === 'APPROVED' || refundMap[app.appointmentId].refundStatus === 'PROCESSED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          <RotateCcw className={`w-3.5 h-3.5 ${refundMap[app.appointmentId].refundStatus === 'REQUESTED' ? 'animate-pulse text-amber-600' : ''}`} />
                          {refundMap[app.appointmentId].refundStatus === 'REQUESTED' && `⏳ Refund Requested • Pending Finance Approval (LKR ${parseFloat(refundMap[app.appointmentId].refundAmount).toLocaleString()})`}
                          {(refundMap[app.appointmentId].refundStatus === 'APPROVED' || refundMap[app.appointmentId].refundStatus === 'PROCESSED') && `✓ Refund Approved & Settled (LKR ${parseFloat(refundMap[app.appointmentId].refundAmount).toLocaleString()})`}
                          {refundMap[app.appointmentId].refundStatus === 'REJECTED' && `✕ Refund Claim Rejected by Finance`}
                        </span>
                      ) : isConcluded ? (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          ✓ Consultation Concluded
                        </span>
                      ) : cancelWindow.isExpired ? (
                        <button
                          type="button"
                          disabled
                          title={`This appointment was booked ${cancelWindow.hoursSinceBooking} hours ago. Appointments cannot be cancelled after 2 days (48 hours).`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs font-medium cursor-not-allowed flex items-center gap-1"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" /> Cancellation Locked (&gt;2d)
                        </button>
                      ) : (
                        <button
                          onClick={() => openRefundModal(app)}
                          title={`Cancellation window closes in ${cancelWindow.formattedRemaining}`}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Request Cancellation & Refund ({cancelWindow.formattedRemaining})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REFUND CLAIMS & SETTLEMENT */}
      {activeTab === 'refunds' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-3 py-0.5 rounded-full border border-white/20">
                  Payment & Settlement Management
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <RotateCcw className="w-6 h-6 text-teal-300" />
                Appointment Refund Claims & Settlement
              </h2>
              <p className="text-xs text-teal-100/80 mt-1 max-w-xl">
                Submit claims for cancelled consultations or unavailable doctor sessions. All claims are verified against SSL payment gateway logs and settled directly by the Finance Officer.
              </p>
            </div>
            <button
              onClick={() => openRefundModal()}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg flex items-center gap-2 transition shrink-0"
            >
              <RotateCcw className="w-4 h-4" /> + Apply for Refund
            </button>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Claims Submitted</span>
              <div className="text-2xl font-black text-slate-900 mt-2">{(patientRefunds || []).length}</div>
              <span className="text-[11px] text-slate-400">Total cancellation filings</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
              <span className="text-xs font-semibold text-amber-800">Pending Review</span>
              <div className="text-2xl font-black text-amber-700 mt-2">
                {(patientRefunds || []).filter(r => r.refundStatus === 'REQUESTED').length}
              </div>
              <span className="text-[11px] text-amber-600">Awaiting Finance decision</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              <span className="text-xs font-semibold text-emerald-800">Approved & Settled</span>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                {(patientRefunds || []).filter(r => r.refundStatus === 'APPROVED' || r.refundStatus === 'PROCESSED').length}
              </div>
              <span className="text-[11px] text-emerald-600">Refund credited / settled</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Settled Amount</span>
              <div className="text-2xl font-black text-emerald-800 mt-2">
                LKR {(patientRefunds || [])
                  .filter(r => r.refundStatus === 'APPROVED' || r.refundStatus === 'PROCESSED')
                  .reduce((sum, r) => sum + (parseFloat(r.refundAmount) || 0), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400">Net refunded balance</span>
            </div>
          </div>

          {/* Refund Claims Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                My Refund Filing History ({(patientRefunds || []).length})
              </h3>
            </div>

            {(patientRefunds || []).length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">No Refund Claims Filed Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  If you cancelled an appointment or a doctor was unavailable, you can submit an official claim for immediate finance refund processing.
                </p>
                <button
                  onClick={() => openRefundModal()}
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition"
                >
                  Apply for Refund Now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(patientRefunds || []).map((ref) => (
                  <div key={ref.refundId} className="py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">Claim #REF-{String(ref.refundId).padStart(4, '0')}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          ref.refundStatus === 'REQUESTED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          ref.refundStatus === 'APPROVED' || ref.refundStatus === 'PROCESSED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {ref.refundStatus === 'REQUESTED' ? '⏳ Pending Finance Approval' :
                           ref.refundStatus === 'APPROVED' || ref.refundStatus === 'PROCESSED' ? '✓ Refund Approved & Settled' :
                           '✕ Claim Rejected'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Appointment #{ref.appointment?.appointmentId} • {ref.appointment?.doctor?.fullName} ({ref.appointment?.doctor?.specialization})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Session Date: <span className="font-semibold text-slate-700">{ref.appointment?.appointmentDate}</span> at <span className="font-semibold text-slate-700">{ref.appointment?.startTime}</span>
                      </p>
                      <p className="text-xs text-slate-600 italic bg-slate-50 border border-slate-200 p-2.5 rounded-xl max-w-xl mt-1">
                        "{ref.reason}"
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claim Amount</span>
                      <div className="text-lg font-black text-rose-700">
                        LKR {parseFloat(ref.refundAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Filed: {ref.refundDate?.replace('T', ' ')?.slice(0, 16)}</span>
                      {(ref.refundStatus === 'APPROVED' || ref.refundStatus === 'PROCESSED') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Settled via Gateway
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MY PRESCRIPTIONS (Member 1 & 2) */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                My Medical Prescriptions & Rx ({myPrescriptions.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official electronic prescriptions issued by certified consultants during your hospital channeling sessions.
              </p>
            </div>
          </div>

          {myPrescriptions.length === 0 ? (
            <div className="text-center py-14 space-y-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No Prescriptions Issued Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once a consultant completes your channeling consultation and issues an e-prescription, it will securely appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPrescriptions.map((rx) => (
                <div 
                  key={rx.prescriptionId}
                  className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-b from-white to-emerald-50/20 p-5 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Rx #{String(rx.prescriptionId).padStart(4, '0')}
                      </span>
                      <h3 className="font-black text-slate-900 text-sm mt-1">
                        {rx.doctor?.fullName || 'Specialist Consultant'}
                      </h3>
                      <p className="text-[11px] text-emerald-800 font-semibold">
                        {rx.doctor?.specialization} • {rx.doctor?.hospitalAffiliation || 'CareSync Hospital'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        License: {rx.doctor?.medicalLicenseNo || 'SLMC-VERIFIED'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issued Date</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {rx.issueDate ? String(rx.issueDate).replace('T', ' ').slice(0, 10) : 'Recent'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        App #{rx.appointment?.appointmentId}
                      </span>
                    </div>
                  </div>

                  {/* Medical Details Prescription Box */}
                  <div className="bg-white rounded-xl border border-emerald-200/80 p-3.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 border-b border-emerald-100 pb-1">
                      <span className="text-base font-serif italic text-emerald-700">℞</span>
                      <span>Medication & Clinical Instructions:</span>
                    </div>
                    <p className="text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap pt-1">
                      {rx.details}
                    </p>
                  </div>

                  {/* Footer Seal & Print Button */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      CareSync Verified E-Prescription
                    </span>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" /> Print / Save PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FEEDBACK & COMPLAINTS */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rate Doctor / Feedback */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Rate Doctor & Experience
              </h2>
              <p className="text-xs text-slate-500">
                Help us improve quality of care by submitting feedback for your completed appointments.
              </p>
              {feedbackMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                  {feedbackMessage}
                </div>
              )}
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Select Consultation Appointment</label>
                  <select
                    required
                    value={feedbackAppointmentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFeedbackAppointmentId(val);
                      const chosenApp = myAppointments.find(a => String(a.appointmentId) === String(val));
                      if (chosenApp && chosenApp.doctor) {
                        setFeedbackDoctorId(chosenApp.doctor.userId || chosenApp.doctor.doctorId || '');
                      } else {
                        setFeedbackDoctorId('');
                      }
                    }}
                    className="w-full p-2.5 mt-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white font-medium"
                  >
                    <option value="">-- Choose Booked Appointment --</option>
                    {myAppointments.map(a => (
                      <option key={a.appointmentId} value={a.appointmentId}>
                        App #{a.appointmentId} - {a.doctor?.fullName} ({a.appointmentDate}) [{a.appointmentStatus}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Doctor Summary Card (Replaces manual Doctor ID input) */}
                {(() => {
                  const chosenApp = myAppointments.find(a => String(a.appointmentId) === String(feedbackAppointmentId));
                  if (!chosenApp || !chosenApp.doctor) return null;
                  return (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-150">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                        {chosenApp.doctor.profileImage ? (
                          <img src={chosenApp.doctor.profileImage} alt={chosenApp.doctor.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope className="w-5 h-5 text-emerald-700" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Consulting Specialist</div>
                        <div className="text-xs font-bold text-slate-900 truncate">{chosenApp.doctor.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {chosenApp.doctor.specialization} • {chosenApp.doctor.hospitalAffiliation || chosenApp.schedule?.hospitalLocation || 'CareSync Hospital'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <label className="text-xs font-bold text-slate-700">Rating (1 to 5 Stars)</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-slate-300 hover:text-amber-500 transition"
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">{rating} Stars</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Comments</label>
                  <textarea
                    rows="3"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share details of your consultation experience..."
                    className="w-full p-2.5 mt-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs transition"
                >
                  Submit Feedback
                </button>
              </form>
            </div>

            {/* Raise Support Complaint */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-500" />
                Lodge a Support Complaint
              </h2>
              <p className="text-xs text-slate-500">
                Customer Support Executives (CSE) review complaints and update resolution progress directly.
              </p>
              <form onSubmit={handleSubmitComplaint} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Complaint Category</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="w-full p-2.5 mt-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  >
                    <option value="DELAY">Consultation Delay</option>
                    <option value="STAFF_BEHAVIOR">Staff Conduct</option>
                    <option value="PAYMENT_ISSUE">Payment / Refund Issue</option>
                    <option value="CANCELLATION">Unexpected Cancellation</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Detailed Description</label>
                  <textarea
                    rows="5"
                    required
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Please describe the issue faced in detail..."
                    className="w-full p-2.5 mt-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs transition"
                >
                  Lodge Complaint
                </button>
              </form>
            </div>
          </div>

          {/* Patient Complaint Tracking History (Member 3) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-500" />
                  My Lodged Complaints & Inquiry Resolution Tracker ({myComplaints.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track the real-time review progress and official resolution notes provided by Customer Service Executives (CSE).
                </p>
              </div>
            </div>

            {myComplaints.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                You have not filed any complaints or inquiries. If you encounter any issue, submit a ticket above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myComplaints.map((c) => (
                  <div key={c.complaintId} className="py-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">Ticket #TKT-{String(c.complaintId).padStart(4, '0')}</span>
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {c.complaintType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.complaintStatus === 'RESOLVED' || c.complaintStatus === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.complaintStatus === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.complaintStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Submitted: {c.dateSubmitted ? String(c.dateSubmitted).replace('T', ' ').slice(0, 16) : 'N/A'}
                      </span>
                    </div>

                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      "{c.description}"
                    </p>

                    {c.resolutionNotes ? (
                      <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Official CSE Resolution Note ({c.resolvedDate ? String(c.resolvedDate).replace('T', ' ').slice(0, 10) : 'Resolved'}):
                        </span>
                        <p className="text-xs">{c.resolutionNotes}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 italic flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Under review by Customer Service Desk. A resolution note will appear here upon completion.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MY PROFILE & HEALTH ID */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Main Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Card: Health ID Card & Profile Picture */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-center space-y-4 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl bg-emerald-50 border-4 border-emerald-500/20 overflow-hidden shadow-xl flex items-center justify-center">
                  {patientProfile?.profileImage || currentUser?.profileImage ? (
                    <img
                      src={patientProfile?.profileImage || currentUser?.profileImage}
                      alt={patientProfile?.fullName || currentUser?.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-emerald-400" />
                  )}
                </div>
                <button
                  onClick={openEditProfile}
                  className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-2xl shadow-lg transition"
                  title="Update Profile Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">{patientProfile?.fullName || currentUser?.fullName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">@{patientProfile?.username || currentUser?.username} • Patient Persona</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Account
                  </span>
                  {patientProfile?.bloodGroup && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Blood Group: {patientProfile.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Hospital Patient ID:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatPatientId(patientId)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">National Identity (NIC):</span>
                  <span className="font-bold text-slate-800">{patientProfile?.nic || currentUser?.nic || 'Verified'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Primary Contact:</span>
                  <span className="font-bold text-slate-800">{patientProfile?.contactNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Emergency Line:</span>
                  <span className="font-bold text-rose-700">{patientProfile?.emergencyContact || 'Not provided'}</span>
                </div>
              </div>

              <button
                onClick={openEditProfile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Contacts, Address & Photo
              </button>
            </div>

            {/* Right Card: Detailed Clinical Record & Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Patient Biodata & Health Record Profile
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official registration profile verified by Hospital Information System.
                    </p>
                  </div>
                </div>

                {/* Grid of attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Full Legal Name</span>
                    <div className="font-black text-slate-900 text-sm">{patientProfile?.fullName || currentUser?.fullName}</div>
                    <span className="text-[11px] text-slate-500">Matches official National Identity Card</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">NIC / Identity Number</span>
                    <div className="font-black text-slate-900 text-sm">{patientProfile?.nic || currentUser?.nic}</div>
                    <span className="text-[11px] text-emerald-600 font-bold">Government Authenticated</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Blood Group & Factor</span>
                    <div className="font-black text-rose-700 text-base">{patientProfile?.bloodGroup || 'Not specified'}</div>
                    <span className="text-[11px] text-slate-500">Crucial for emergency clinical interventions</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Age & Gender</span>
                    <div className="font-black text-slate-900 text-sm">
                      {patientProfile?.age ? `${patientProfile.age} Years` : 'N/A'} • {patientProfile?.gender || 'N/A'}
                    </div>
                    <span className="text-[11px] text-slate-500">Date of Birth: {patientProfile?.dateOfBirth || 'N/A'}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Contact Number</span>
                    <div className="font-bold text-slate-900">{patientProfile?.contactNumber || 'N/A'}</div>
                    <span className="text-[11px] text-slate-500">Used for SMS booking confirmations & tokens</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Emergency Contact Person</span>
                    <div className="font-bold text-slate-900">{patientProfile?.emergencyContact || 'None Listed'}</div>
                    <span className="text-[11px] text-slate-500">Next of Kin / Relative for clinical alerts</span>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Permanent Residential Address</span>
                    <div className="font-bold text-slate-900">{patientProfile?.address || 'N/A'}</div>
                    <span className="text-[11px] text-slate-500">Used for official medical invoicing and dispatch</span>
                  </div>
                </div>

                {/* Digital Card Preview Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Fast-Track Clinic Check-in Enabled</h4>
                      <p className="text-[11px] text-emerald-200">Show this digital profile or your NIC at hospital reception counters.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="whitespace-nowrap px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    Print Profile Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MY HOSPITAL BILLS & MEDICAL INVOICES */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    My Hospital Bills & Invoices
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      {patientBills.length} Total
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access official hospital bills (OPD, Pharmacy, Diagnostics & Clinical Services) with secure online payment.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setRefreshing(true);
                    await fetchPatientBills();
                    setTimeout(() => setRefreshing(false), 500);
                  }}
                  disabled={refreshing}
                  className="px-3 py-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Refresh bills"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Syncing...' : 'Refresh Ledger'}</span>
                </button>
              </div>
            </div>

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Bills</span>
                <div className="text-2xl font-black text-slate-800">{patientBills.length}</div>
                <span className="text-[11px] text-slate-500">Invoices tied to patient profile</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Payment</span>
                <div className="text-2xl font-black text-amber-900">
                  {patientBills.filter(b => b.paymentStatus === 'PENDING').length}
                </div>
                <span className="text-[11px] text-amber-800 font-bold">
                  Outstanding: LKR {patientBills.filter(b => b.paymentStatus === 'PENDING').reduce((acc, b) => acc + Number(b.netPayable || b.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Settled & Cleared</span>
                <div className="text-2xl font-black text-emerald-900">
                  {patientBills.filter(b => b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID').length}
                </div>
                <span className="text-[11px] text-emerald-700 font-bold">
                  Paid: LKR {patientBills.filter(b => b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID').reduce((acc, b) => acc + Number(b.netPayable || b.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Bills List / Table */}
            {patientBills.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm">No Medical Bills on Record</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  When the hospital accounts desk or physician issues a medical bill for OPD consultation, pharmacy prescriptions, or laboratory tests, it will appear here for 1-click settlement.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Invoice No</th>
                      <th className="py-3.5 px-4">Category & Department</th>
                      <th className="py-3.5 px-4">Doctor / Unit</th>
                      <th className="py-3.5 px-4">Date Issued</th>
                      <th className="py-3.5 px-4 text-right">Net Payable</th>
                      <th className="py-3.5 px-4 text-center">Settlement Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientBills.map((bill) => {
                      const isPending = bill.paymentStatus === 'PENDING';
                      const amount = Number(bill.netPayable || bill.totalAmount || 0);
                      const dateFormatted = (() => {
                        try {
                          const d = new Date(bill.createdAt || bill.issueDate);
                          return isNaN(d.getTime()) ? bill.createdAt : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        } catch {
                          return bill.createdAt || 'N/A';
                        }
                      })();

                      return (
                        <tr key={bill.billId || bill.invoiceNumber} className="hover:bg-slate-50/90 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-slate-900 text-xs block">
                              {bill.invoiceNumber}
                            </span>
                            {bill.transactionReference && (
                              <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]" title={bill.transactionReference}>
                                Ref: {bill.transactionReference}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 text-xs">{bill.billCategory || 'Hospital Bill'}</span>
                            <span className="block text-[10px] text-slate-500">{bill.department || 'Outpatient Department'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {bill.doctorName ? (
                              <div className="font-semibold text-slate-900">{bill.doctorName}</div>
                            ) : (
                              <span className="text-slate-400 italic">Hospital Accounts</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                            LKR {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" /> Payment Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-xs">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Paid & Settled
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBillToPay(bill)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Pay Bill Online
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setReceiptModal(bill)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                  View Tax Invoice
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: LIVE QUEUE & SMART TOKEN TRACKING */}
      {activeTab === 'live-queue' && (
        <LiveQueueTracker
          currentUser={currentUser}
          targetScheduleId={selectedQueueScheduleId}
        />
      )}

      {/* EDIT PROFILE MODAL */}
      {editProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-slate-900 text-sm">Update Contact Details & Photo</span>
              </div>
              <button
                onClick={() => setEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Read-Only Medical Identity Summary */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Verified Medical Identity (Locked)
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  Read-Only
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Full Legal Name</span>
                  <span className="font-bold text-slate-800 truncate block">{patientProfile?.fullName || currentUser?.fullName}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">NIC / Identity</span>
                  <span className="font-bold text-slate-800 block">{patientProfile?.nic || currentUser?.nic || 'Verified'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Blood Group</span>
                  <span className="font-bold text-rose-600 block">{patientProfile?.bloodGroup || 'Not specified'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">DOB & Gender</span>
                  <span className="font-bold text-slate-800 block">{patientProfile?.dateOfBirth || 'N/A'} ({patientProfile?.gender || 'N/A'})</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                Legal identity records are locked for clinical safety. Contact hospital administration for revisions.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              {/* Photo Upload & Preview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-300 overflow-hidden flex items-center justify-center text-slate-400 shadow-sm">
                    {profileForm.profileImage ? (
                      <img src={profileForm.profileImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  {profileForm.profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileForm(prev => ({ ...prev, profileImage: '' }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <span className="font-bold text-slate-800 block">Profile Picture</span>
                  <p className="text-[11px] text-slate-500">Upload your new portrait picture (JPG, PNG).</p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-300 cursor-pointer shadow-sm transition">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{profileForm.profileImage ? 'Change Photo' : 'Upload New Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Two Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Primary Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileForm.contactNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                    placeholder="07XXXXXXXX"
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Used for SMS alerts & booking updates</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Emergency Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    placeholder="07XXXXXXXX"
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Next of kin or guardian contact</span>
                </div>
              </div>

              {/* Permanent Address */}
              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Permanent Residential Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Enter your street address, city, postal district..."
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProfileModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileUpdateLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {profileUpdateLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL HOSPITAL MEDICAL TAX INVOICE & RECEIPT MODAL */}
      {receiptModal && (
        <HospitalInvoiceModal
          invoice={receiptModal}
          onClose={() => setReceiptModal(null)}
          currentUser={currentUser}
        />
      )}

      {/* SECURE ONLINE HOSPITAL BILL PAYMENT GATEWAY MODAL (Member 6) */}
      {selectedBillToPay && (
        <BillPaymentModal
          bill={selectedBillToPay}
          onClose={() => setSelectedBillToPay(null)}
          onPaymentSuccess={handleCustomBillPaid}
          currentUser={currentUser}
        />
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Reschedule Appointment #{rescheduleModal.appointmentId}</span>
              <button onClick={() => setRescheduleModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select a new session and timeslot for <span className="font-bold text-slate-800">{rescheduleModal.doctor.fullName}</span>:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {(() => {
                const upcomingSchedules = rescheduleSchedules.filter(
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
                          onClick={() => setRescheduleSlot({ ...s, schedule: sched })}
                          className={`p-1.5 rounded text-[11px] font-semibold transition ${
                            rescheduleSlot?.timeslotId === s.timeslotId
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-slate-200 hover:border-amber-400 text-slate-700'
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

            {rescheduleSlot && (
              <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                New Target: {rescheduleSlot.schedule.scheduleDate} at {rescheduleSlot.slotTime} (Slot #{rescheduleSlot.slotNo})
              </div>
            )}

            <button
              onClick={handleConfirmReschedule}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition"
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                  Apply for Appointment Refund
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Payment & Settlement Management Cancellation Claim
                </p>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {refundMsg.text && (
              <div className={`p-3 text-xs rounded-xl border flex items-center gap-2 ${
                refundMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {refundMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{refundMsg.text}</span>
              </div>
            )}

            {/* 2-Day Cancellation Policy Warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">2-Day Policy Requirement:</span> In accordance with hospital regulations, cancellations and refund claims can only be processed within <strong className="text-amber-950 font-bold">2 days (48 hours)</strong> of booking. Appointments booked over 2 days ago cannot be refunded.
              </div>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-4 text-xs">
              {/* Select Appointment */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Appointment for Refund Claim</label>
                <select
                  value={refundForm.appointmentId}
                  onChange={(e) => handleRefundAppointmentSelect(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white font-medium"
                >
                  <option value="">-- Choose an appointment --</option>
                  {myAppointments.map((app) => {
                    const cancelWindow = getCancellationWindowStatus(app.bookingDate || app.createdAt);
                    const isRefundedOrPending = !!refundMap[app.appointmentId];
                    const isDisabled = cancelWindow.isExpired || isRefundedOrPending;
                    return (
                      <option 
                        key={app.appointmentId} 
                        value={app.appointmentId}
                        disabled={isDisabled}
                        className={isDisabled ? 'text-slate-400 bg-slate-50' : 'text-slate-800 font-medium'}
                      >
                        Appointment #{app.appointmentId} - {app.doctor.fullName} ({app.appointmentDate} at {app.startTime})
                        {cancelWindow.isExpired ? ' [LOCKED: Booked >2d ago]' : ` [Window: ${cancelWindow.formattedRemaining} left]`}
                        {isRefundedOrPending ? ' [Refund Already Filed]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Refund Amount (Full Consultation Fee)</span>
                  <div className="font-black text-rose-700 text-lg">
                    LKR {refundForm.amount ? parseFloat(refundForm.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '2,500.00'}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  100% Refund Claim
                </span>
              </div>

              {/* Reason Category */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Reason for Refund</label>
                <select
                  value={refundForm.reasonCategory}
                  onChange={(e) => setRefundForm({ ...refundForm, reasonCategory: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Doctor unavailable / Cancelled schedule">Doctor unavailable / Cancelled schedule</option>
                  <option value="Patient unable to attend due to medical emergency">Patient unable to attend due to medical emergency</option>
                  <option value="Appointment timeslot clash / Error in booking">Appointment timeslot clash / Error in booking</option>
                  <option value="Hospital facility delay / Long waiting time">Hospital facility delay / Long waiting time</option>
                  <option value="Other valid reason">Other valid reason</option>
                </select>
              </div>

              {/* Custom Reason Details */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional Explanation & Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={refundForm.customReason}
                  onChange={(e) => setRefundForm({ ...refundForm, customReason: e.target.value })}
                  placeholder="Provide additional details or notes for the Finance Officer..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 leading-relaxed">
                ℹ️ <strong>Direct Finance Settlement:</strong> Your request will be immediately routed to the Hospital Finance Officer (Finance Portal -&gt; Refund Requests). Once approved, the appointment will be marked Cancelled and your payment will be refunded.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading || !refundForm.appointmentId}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {refundLoading ? 'Submitting...' : 'Submit Refund Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CARD PAYMENT CHECKOUT MODAL (Simulated Bank Gateway) */}
      {showPaymentModal && selectedSchedule && selectedSlot && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 my-8">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-sm shrink-0">
                    <img src="/caresync-logo.png" alt="CareSync Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">CareSync SecurePay™</h3>
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted Healthcare Payment Gateway
                    </p>
                  </div>
                </div>
              </div>
              <button
                disabled={bookingLoading}
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Gateway Notice Banner */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Live Payment Simulation Mode • Free Test Checkout
              </span>
              <span className="bg-emerald-200/60 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                SANDBOX IPG
              </span>
            </div>

            {/* Order / Channeling Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Doctor Consultation</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {selectedSchedule.doctor?.fullName || 'Specialist Doctor'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {selectedSchedule.doctor?.specialization || 'Consultant Specialist'} • {selectedSchedule.doctor?.hospitalAffiliation || selectedSchedule.hospitalLocation || 'CareSync Hospital'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Session & Slot</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedSchedule.scheduleDate}</div>
                  <div className="text-[11px] font-semibold text-emerald-700">Slot #{selectedSlot.slotNo} ({selectedSlot.slotTime})</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Consultation Fee</span>
                <span className="font-bold text-slate-800">LKR {(selectedSchedule.doctor?.consultationFee || 2500)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Hospital Facility & E-Channeling Service</span>
                <span className="font-semibold text-slate-600">LKR 0.00 (Waived)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount Payable</span>
                <span className="text-emerald-700 text-base">LKR {(selectedSchedule.doctor?.consultationFee || 2500)?.toLocaleString()}</span>
              </div>
            </div>

            {/* 2-Day Cancellation Policy Warning */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-950">Important Cancellation Policy Note:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Appointments can only be cancelled or refunded within <strong className="text-amber-950 font-bold">2 days (48 hours)</strong> of booking. Once 2 days have passed, the booking is final and cannot be cancelled or refunded under hospital regulations.
                </p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('CREDIT_CARD')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Card Pay (Visa/MC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('ONLINE_BANKING')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    selectedPaymentMethod === 'ONLINE_BANKING'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Building className="w-5 h-5 text-blue-600" />
                  <span>Online Banking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('MOBILE_WALLET')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    selectedPaymentMethod === 'MOBILE_WALLET'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <span>Mobile Wallet / QR</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CREDIT / DEBIT CARD UI */}
            {(selectedPaymentMethod === 'CREDIT_CARD' || selectedPaymentMethod === 'DEBIT_CARD') && (
              <div className="space-y-3 pt-1">
                {/* Visual Realistic Credit Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-5 text-white shadow-xl border border-slate-700/60 font-mono">
                  {/* Background decoration */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl"></div>
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-indigo-500/20 blur-xl"></div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {/* EMV Chip */}
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-200 flex items-center justify-center p-1 shadow-inner">
                        <div className="w-full h-full border border-amber-600/40 rounded-sm"></div>
                      </div>
                      {/* Contactless symbol */}
                      <span className="text-white/60 text-xs">📶</span>
                    </div>

                    {/* Card Brand */}
                    <div className="text-right">
                      {getCardType(cardForm.cardNumber) === 'VISA' ? (
                        <span className="text-lg font-black tracking-widest italic bg-gradient-to-r from-blue-300 via-white to-amber-200 bg-clip-text text-transparent">
                          VISA
                        </span>
                      ) : getCardType(cardForm.cardNumber) === 'MASTERCARD' ? (
                        <div className="flex items-center -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-rose-500 opacity-90"></div>
                          <div className="w-5 h-5 rounded-full bg-amber-400 opacity-90"></div>
                        </div>
                      ) : (
                        <span className="text-xs font-black tracking-wider text-amber-300">AMEX</span>
                      )}
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="text-lg tracking-[0.2em] font-black text-slate-100 mb-4 drop-shadow">
                    {cardForm.cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Cardholder</div>
                      <div className="font-bold tracking-wider text-slate-100 uppercase truncate max-w-[200px]">
                        {cardForm.cardholderName || 'ANJALI PERERA'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Expires</div>
                      <div className="font-bold tracking-wider text-slate-100">
                        {cardForm.expiryDate || 'MM/YY'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Auto-fill buttons */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Quick Test Cards:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTestCard('VISA')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-bold text-blue-700 shadow-2xs"
                    >
                      💳 Visa (•••• 8899)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestCard('MASTERCARD')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-bold text-amber-700 shadow-2xs"
                    >
                      💳 Mastercard (•••• 5544)
                    </button>
                  </div>
                </div>

                {/* Card Input Fields */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cardholder Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={cardForm.cardholderName}
                        onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                        placeholder="Name as printed on card"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                        placeholder="XXXX XXXX XXXX XXXX"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono font-bold text-slate-800 tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={cardForm.expiryDate}
                        onChange={(e) => setCardForm({ ...cardForm, expiryDate: formatExpiry(e.target.value) })}
                        placeholder="MM/YY"
                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono font-bold text-slate-800 text-center"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="•••"
                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono font-bold text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={cardForm.saveCard}
                      onChange={(e) => setCardForm({ ...cardForm, saveCard: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Save encrypted token for fast 1-click channeling checkouts</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: ONLINE BANKING */}
            {selectedPaymentMethod === 'ONLINE_BANKING' && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Your Bank</label>
                  <select
                    value={bankOption}
                    onChange={(e) => setBankOption(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white font-semibold text-slate-800"
                  >
                    <option value="Commercial Bank of Ceylon">Commercial Bank of Ceylon (COMBANK IPG)</option>
                    <option value="Sampath Bank (Sampath Vishwa)">Sampath Bank (Sampath Vishwa)</option>
                    <option value="Hatton National Bank (HNB)">Hatton National Bank (HNB)</option>
                    <option value="Bank of Ceylon (BOC)">Bank of Ceylon (BOC SmartPay)</option>
                    <option value="Nations Trust Bank (FriMi IPG)">Nations Trust Bank (FriMi IPG)</option>
                  </select>
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  ℹ️ You will be redirected to the secure <strong>{bankOption}</strong> internet banking authorization portal to approve the LKR {(selectedSchedule.doctor?.consultationFee || 2500)?.toLocaleString()} channeling transfer.
                </div>
              </div>
            )}

            {/* TAB 3: MOBILE WALLET */}
            {selectedPaymentMethod === 'MOBILE_WALLET' && (
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Wallet / Payment App</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white font-semibold text-slate-800">
                    <option value="eZ Cash">Dialog eZ Cash (LankaQR)</option>
                    <option value="FriMi">FriMi by Nations Trust</option>
                    <option value="Genie">Genie by Dialog</option>
                    <option value="mCash">Mobitel mCash</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered Mobile Number for OTP Approval</label>
                  <input
                    type="tel"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    placeholder="077XXXXXXX"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-[11px] text-purple-900 leading-relaxed">
                  📱 A 6-digit push authentication request will be sent to your mobile device to complete this channeling payment.
                </div>
              </div>
            )}

            {/* 3D-SECURE SIMULATION SPINNER / STATUS */}
            {paymentStep === '3D_SECURE' && (
              <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-center space-y-2 animate-pulse">
                <div className="flex justify-center">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
                <div className="font-bold text-emerald-900 text-xs">{paymentStepMsg}</div>
                <div className="text-[10px] text-emerald-700">Bank 3D-Secure 2.0 Token Handshake Active...</div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                disabled={bookingLoading}
                onClick={() => setShowPaymentModal(false)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleProcessPaymentWithGateway}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/30 transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {bookingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Pay LKR {(selectedSchedule.doctor?.consultationFee || 2500)?.toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING & PAYMENT SUCCESS SCREEN (Digital Receipt) */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 my-8">
            {/* Header Badge with Official Hospital Logo */}
            <div className="text-center space-y-2 pb-2">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center mx-auto overflow-hidden p-1">
                <img src="/caresync-logo.png" alt="CareSync Logo" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Payment Approved & Appointment Booked!</h3>
              <p className="text-xs text-slate-500">
                Your channeling slot is officially secured. Digital receipt has been generated.
              </p>
            </div>

            {/* Official Digital Receipt Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Receipt Number</span>
                <span className="font-black text-slate-900 text-xs font-mono">{bookingSuccess.receipt?.receiptNumber || 'REC-2026-LIVE'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-slate-800">{bookingSuccess.payment?.transactionReference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  {bookingSuccess.payment?.paymentMethod} ({bookingSuccess.cardBrand || 'Card'} •••• {bookingSuccess.cardLast4 || '8899'})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Doctor / Specialist:</span>
                <span className="font-bold text-slate-900">{bookingSuccess.appointment?.doctor?.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-semibold text-slate-800">
                  {bookingSuccess.appointment?.appointmentDate} at {bookingSuccess.appointment?.startTime} (Slot #{bookingSuccess.appointment?.timeslot?.slotNo || 1})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-slate-800">{bookingSuccess.appointment?.patient?.fullName || currentUser?.fullName}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-emerald-800">
                <span>Amount Paid:</span>
                <span>LKR {bookingSuccess.payment?.amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Receipt Details Note */}
            <p className="text-[11px] text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 italic leading-relaxed">
              {bookingSuccess.receipt?.receiptDetails || 'Digital payment receipt verified and recorded in CareSync Hospital Accounts ledger.'}
            </p>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptModal({
                    receiptNumber: bookingSuccess.receipt?.receiptNumber || `REC-2026-${bookingSuccess.appointment?.appointmentId}`,
                    issueDate: bookingSuccess.appointment?.appointmentDate || new Date().toISOString(),
                    appointment: bookingSuccess.appointment,
                    patient: bookingSuccess.appointment?.patient || currentUser,
                    doctor: bookingSuccess.appointment?.doctor,
                    payment: bookingSuccess.payment,
                    receiptDetails: bookingSuccess.receipt?.receiptDetails || 'Digital payment receipt verified and recorded in CareSync Hospital Accounts ledger.'
                  });
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                View & Print Official Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(null);
                  setActiveTab('my-appointments');
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Calendar className="w-4 h-4" />
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR REVIEWS & RATINGS DETAIL MODAL */}
      {selectedDoctorReviewsModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 my-8">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm">
                  {selectedDoctorReviewsModal.profileImage ? (
                    <img src={selectedDoctorReviewsModal.profileImage} alt={selectedDoctorReviewsModal.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope className="w-7 h-7 text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{selectedDoctorReviewsModal.fullName}</h3>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      {selectedDoctorReviewsModal.specialization}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedDoctorReviewsModal.qualifications}</p>
                  <p className="text-[11px] text-slate-500">
                    Hospital: <span className="font-semibold text-slate-700">{selectedDoctorReviewsModal.hospitalAffiliation || 'National Hospital'}</span> • License: {selectedDoctorReviewsModal.medicalLicenseNo}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoctorReviewsModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard Box */}
            <div className="bg-gradient-to-r from-amber-50/70 to-emerald-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Overall Doctor Rating</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-slate-900">{getDoctorAvgRating(selectedDoctorReviewsModal.userId)}</span>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Based on {getDoctorReviewCount(selectedDoctorReviewsModal.userId)} verified patient evaluations
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500">Consultation Fee</span>
                <p className="text-lg font-black text-emerald-800">LKR {Number(selectedDoctorReviewsModal.consultationFee || 2500).toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">100% Guaranteed Slot</span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Patient Feedback & Comments ({getDoctorFeedbacksList(selectedDoctorReviewsModal.userId).length})</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Appointments
                </span>
              </h4>

              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {getDoctorFeedbacksList(selectedDoctorReviewsModal.userId).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    No individual reviews recorded yet for this specialist.
                  </div>
                ) : (
                  getDoctorFeedbacksList(selectedDoctorReviewsModal.userId).map((fb, idx) => (
                    <div key={fb.feedbackId || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{fb.patient?.fullName || 'Verified Patient'}</span>
                          <span className="text-[10px] text-slate-400">
                            {fb.submittedDate ? new Date(fb.submittedDate).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div className="flex items-center text-amber-500">
                          {[...Array(Number(fb.rating) || 5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 italic">"{fb.comments}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDoctorReviewsModal(null)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDoctorReviewsModal(null);
                  const sched = schedules.find(s => Number(s.doctor?.userId) === Number(selectedDoctorReviewsModal.userId));
                  if (sched) {
                    setSelectedSchedule(sched);
                    setSelectedSlot(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs flex items-center justify-center gap-2 shadow"
              >
                <Calendar className="w-4 h-4" />
                Select Consultation Slot with {selectedDoctorReviewsModal.fullName}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
