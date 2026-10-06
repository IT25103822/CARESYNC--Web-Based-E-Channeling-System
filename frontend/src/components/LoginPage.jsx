import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  HeartPulse, Lock, User, KeyRound, UserPlus, HelpCircle, ArrowRight, 
  ShieldCheck, CheckCircle, AlertCircle, Camera, Trash2, Image as ImageIcon,
  Stethoscope, Activity, RotateCcw, Clock, Sparkles, Building2, Users,
  Pill, Syringe, Dna, Cross, Phone, Eye, EyeOff, Star, Quote, Award,
  ChevronDown, ChevronUp, CreditCard
} from 'lucide-react';
import { calculateAgeFromDob } from '../utils/dateUtils';
import LiveQueueTracker from './LiveQueueTracker';
import Footer from './Footer';

export default function LoginPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showLiveQueueModal, setShowLiveQueueModal] = useState(false);
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state (Patient Registration)
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    fullName: '',
    contactNumber: '',
    nic: '',
    dateOfBirth: '1998-05-15',
    gender: 'Female',
    address: '',
    bloodGroup: 'B+',
    age: calculateAgeFromDob('1998-05-15'),
    emergencyContact: '',
    profileImage: ''
  });
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Password Recovery state (2-Step Verification: NIC + Birthday + Mobile, then New Password + Confirm Password)
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 = Identity Verification, 2 = Reset Password
  const [recoveryNic, setRecoveryNic] = useState('');
  const [recoveryDob, setRecoveryDob] = useState('');
  const [recoveryMobile, setRecoveryMobile] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Public Doctor Ratings & Verified Patient Testimonials state
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [showAllPublicReviews, setShowAllPublicReviews] = useState(false);
  const [publicReviews, setPublicReviews] = useState([
    {
      patientName: 'Anjali Perera',
      doctorName: 'Dr. Nuwan Jayawardena',
      specialization: 'Cardiology',
      rating: 5,
      comment: 'Dr. Nuwan is exceptional! He took the time to review my ECG and explained my medication regimen with great clarity.',
      date: 'Verified Patient • 2 days ago'
    },
    {
      patientName: 'Kasun Bandara',
      doctorName: 'Dr. Priyantha Alwis',
      specialization: 'Orthopedics',
      rating: 5,
      comment: 'Very punctual consultation. Dr. Priyantha diagnosed my knee injury accurately and prescribed a fast recovery plan.',
      date: 'Verified Patient • 4 days ago'
    },
    {
      patientName: 'Dilani Samarasinghe',
      doctorName: 'Dr. Amanda Pathirana',
      specialization: 'Pediatrics',
      rating: 5,
      comment: 'Wonderful pediatrician. She handled my 4-year-old child with utmost warmth and care. Highly recommended!',
      date: 'Verified Patient • 1 week ago'
    },
    {
      patientName: 'Chaminda Silva',
      doctorName: 'Dr. Samantha Fernando',
      specialization: 'Neurology',
      rating: 5,
      comment: 'Very reassuring and detailed diagnosis. CareSync live queue token tracking saved me hours at the hospital!',
      date: 'Verified Patient • 1 week ago'
    }
  ]);
  const [publicDoctorSummaries, setPublicDoctorSummaries] = useState([
    { doctorName: 'Dr. Nuwan Jayawardena', specialization: 'Cardiology', averageRating: 5.0, totalReviews: 18 },
    { doctorName: 'Dr. Amanda Pathirana', specialization: 'Pediatrics', averageRating: 5.0, totalReviews: 14 },
    { doctorName: 'Dr. Priyantha Alwis', specialization: 'Orthopedics', averageRating: 4.9, totalReviews: 22 },
    { doctorName: 'Dr. Samantha Fernando', specialization: 'Neurology', averageRating: 4.8, totalReviews: 16 }
  ]);

  useEffect(() => {
    const fetchPublicFeedback = async () => {
      try {
        // 1. Fetch Featured Reviews specifically curated by Administrator
        const featuredRes = await axios.get('/api/feedback/featured');
        let hasFeatured = false;
        if (featuredRes.data && featuredRes.data.success && Array.isArray(featuredRes.data.data) && featuredRes.data.data.length > 0) {
          const featuredList = featuredRes.data.data
            .filter(f => f.comments && f.comments.trim().length > 0)
            .map((f) => ({
              patientName: f.patient?.fullName || 'Verified Patient',
              doctorName: f.doctor?.fullName || 'Specialist Doctor',
              specialization: f.doctor?.specialization || 'Consultant Specialist',
              rating: f.rating || 5,
              comment: f.comments,
              date: f.submittedDate ? new Date(f.submittedDate).toLocaleDateString() : 'Verified Patient'
            }));
          if (featuredList.length > 0) {
            setPublicReviews(featuredList);
            hasFeatured = true;
          }
        }

        // 2. Fetch Doctor Summaries
        const res = await axios.get('/api/feedback/summary');
        if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPublicDoctorSummaries(res.data.data);
          // If no specific featured list was loaded, fallback to all feedbacks
          if (!hasFeatured) {
            const extracted = [];
            res.data.data.forEach((d) => {
              if (Array.isArray(d.feedbacks)) {
                d.feedbacks.forEach((f) => {
                  if (f.comments && f.comments.trim().length > 0) {
                    extracted.push({
                      patientName: f.patient?.fullName || 'Verified Patient',
                      doctorName: d.doctorName,
                      specialization: d.specialization,
                      rating: f.rating || 5,
                      comment: f.comments,
                      date: f.submittedDate ? new Date(f.submittedDate).toLocaleDateString() : 'Verified Patient'
                    });
                  }
                });
              }
            });
            if (extracted.length > 0) {
              setPublicReviews(extracted);
            }
          }
        }
      } catch (e) {
        // Fallback already pre-set
      }
    };
    fetchPublicFeedback();
  }, []);

  // Interactive Particle Network Canvas State
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for interactive connection
    const mouse = { x: null, y: null, radius: 140 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Create particles (nodes)
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles = [];
    const colors = ['rgba(16, 185, 129, ', 'rgba(20, 184, 166, ', 'rgba(56, 189, 248, '];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1.2,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce on boundary
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.baseColor + p1.alpha + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = p1.baseColor + '0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect to neighboring particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect to mouse if nearby
        if (mouse.x !== null && mouse.y !== null) {
          const mdx = p1.x - mouse.x;
          const mdy = p1.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < mouse.radius) {
            const mAlpha = (1 - mdist / mouse.radius) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(45, 212, 191, ${mAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data && res.data.success) {
        onLoginSuccess(res.data.data);
      } else {
        setLoginError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoginLoading(false);
    }
  };


  const handleProfilePicSelect = (e) => {
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
        setRegData(prev => ({ ...prev, profileImage: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);

    try {
      const res = await axios.post('/api/patients/register', regData);
      if (res.data && res.data.success) {
        setRegSuccess('Account created successfully! You can now log in.');
        setUsername(regData.username);
        setPassword(regData.password);
        setTimeout(() => {
          setAuthMode('login');
          setRegSuccess('');
        }, 1800);
      }
    } catch (err) {
      if (!err.response) {
        setRegError('Cannot connect to backend server on port 8080! Please ensure EChannelingApplication is running in IntelliJ.');
      } else {
        setRegError(err.response?.data?.message || 'Registration failed. Check your input.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  // Step 1: Verify identity using NIC + Birthday + Mobile Number
  const handleVerifyRecovery = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryNic.trim()) {
      setRecoveryError('Please enter your National ID (NIC) number.');
      return;
    }
    if (!recoveryDob) {
      setRecoveryError('Please select your Date of Birth (Birthday).');
      return;
    }
    if (!recoveryMobile.trim()) {
      setRecoveryError('Please enter your registered Mobile Number.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-recovery', {
        nic: recoveryNic.trim(),
        dateOfBirth: recoveryDob,
        mobileNumber: recoveryMobile.trim()
      });

      if (res.data && res.data.success && res.data.data) {
        setVerifiedAccount(res.data.data);
        setRecoverySuccess(`Identity verified for ${res.data.data.fullName}! Please enter your new password.`);
        setRecoveryStep(2);
      } else {
        setRecoveryError(res.data?.message || 'Verification failed. Please check your NIC, Birthday, and Mobile Number.');
      }
    } catch (err) {
      setRecoveryError(err.response?.data?.message || 'No registered account found matching the provided NIC, Birthday, and Mobile Number.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Step 2: Set New Password and Confirm Password
  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (recoveryNewPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('New password and confirm password do not match. Please verify both inputs.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        identifier: verifiedAccount?.username || recoveryNic.trim(),
        newPassword: recoveryNewPassword
      });

      if (res.data && res.data.success) {
        setRecoverySuccess('Password reset successfully! Redirecting to login portal...');
        setUsername(verifiedAccount?.username || recoveryNic.trim());
        setPassword(recoveryNewPassword);
        setTimeout(() => {
          setAuthMode('login');
          setRecoveryStep(1);
          setRecoveryNic('');
          setRecoveryDob('');
          setRecoveryMobile('');
          setRecoveryNewPassword('');
          setRecoveryConfirmPassword('');
          setRecoverySuccess('');
        }, 1800);
      } else {
        setRecoveryError(res.data?.message || 'Failed to update password.');
      }
    } catch (err) {
      setRecoveryError(err.response?.data?.message || 'Could not update password. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col justify-between items-center p-0 pt-4 sm:pt-6 lg:pt-8">
      {/* 1. Deep Gradient Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950" />

      {/* 2. High-Tech Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* 3. Option 1: Interactive Medical Particle & DNA Constellation Network Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-auto z-0" 
      />

      {/* 4. Glowing Ambient Animated Orbs */}
      <div className="absolute -top-36 -left-36 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-[30rem] h-[30rem] bg-teal-500/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none [animation-delay:2s]" />
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none [animation-delay:4s]" />
      <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none [animation-delay:3s]" />

      {/* 5. Option 4: Multi-Layered Dynamic Cardiac / ECG Pulse Waves */}
      <div className="absolute inset-x-0 top-1/3 -translate-y-1/2 pointer-events-none opacity-25 overflow-hidden h-28 flex items-center">
        <svg className="w-full h-24 text-emerald-400" viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
          <path
            d="M0 50 L280 50 L300 20 L315 85 L330 15 L345 70 L360 50 L680 50 L700 20 L715 85 L730 15 L745 70 L760 50 L1200 50"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg"
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 top-2/3 -translate-y-1/2 pointer-events-none opacity-15 overflow-hidden h-24 flex items-center">
        <svg className="w-full h-20 text-teal-300" viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
          <path
            d="M0 50 L400 50 L420 30 L435 75 L450 25 L465 65 L480 50 L850 50 L870 30 L885 75 L900 25 L915 65 L930 50 L1200 50"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-slow"
          />
        </svg>
      </div>

      {/* 6. Option 3: Floating Micro Medical Icons & Glass Bokeh Nodes */}
      <div className="hidden md:block absolute top-20 left-[12%] text-emerald-400/25 animate-drift-up pointer-events-none">
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm">
          <Dna className="w-6 h-6" />
        </div>
      </div>

      <div className="hidden md:block absolute bottom-28 left-[8%] text-teal-300/25 animate-drift-down pointer-events-none" style={{ animationDelay: '1.5s' }}>
        <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-400/20 backdrop-blur-sm">
          <Pill className="w-6 h-6" />
        </div>
      </div>

      <div className="hidden md:block absolute top-28 right-[10%] text-blue-400/25 animate-drift-down pointer-events-none" style={{ animationDelay: '3s' }}>
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm">
          <Syringe className="w-6 h-6" />
        </div>
      </div>

      <div className="hidden md:block absolute bottom-24 right-[14%] text-emerald-400/25 animate-drift-up pointer-events-none" style={{ animationDelay: '4.5s' }}>
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm">
          <Cross className="w-6 h-6" />
        </div>
      </div>

      {/* 5. Modern Split 2-Column Showcase & Authentication Layout */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8 lg:py-12">
        
        {/* LEFT COLUMN: Hero, Hospital Introduction & Highlights */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-6 text-white">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold backdrop-blur-md shadow-lg shadow-emerald-950/40">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Next-Generation Healthcare E-Channeling</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Main Brand Title & Tagline with Official Logo In Front */}
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl bg-white p-2.5 shadow-2xl shadow-emerald-950/70 border-2 border-emerald-400/40 flex items-center justify-center overflow-hidden shrink-0 backdrop-blur-md transform hover:scale-105 transition-all duration-300">
                  <img
                    src="/caresync-logo.png"
                    alt="CareSync Official Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-[0_4px_24px_rgba(16,185,129,0.35)]">
                      CareSync
                    </span>
                  </h1>
                  <div className="flex items-center gap-2.5 sm:gap-3 mt-2 sm:mt-2.5">
                    <span className="h-0.5 w-6 sm:w-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shrink-0" />
                    <p className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-widest text-emerald-300 uppercase">
                      Central Hospital Information & Channeling Network
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight leading-snug">
              Compassionate Care Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">Smart Digital Scheduling.</span>
            </h2>

            <p className="text-slate-200 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl font-normal">
              CareSync is Sri Lanka's premier centralized healthcare information and specialist doctor channeling network. 
              Connecting patients with accredited consultants across leading hospital branches with guaranteed appointment reservations, 
              live queue token tracking, transparent fees, and 2-day cancellation & refund protection.
            </p>
          </div>

          {/* Symmetrical 2x2 Value Proposition Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            
            {/* Feature 1: Specialists */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">50+ SLMC Verified Specialists</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">Cardiology, Neurology, Pediatrics, Oncology, Orthopedics & General Medicine.</p>
              </div>
            </div>

            {/* Feature 2: Live Queue Tracking */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition group">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 group-hover:scale-105 transition">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-bold text-white">Live Queue & Smart Tracking</h4>
                  <span className="text-[9px] font-black bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded-full uppercase tracking-wider">Live</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">Real-time doctor arrival tracking, ongoing consultation token, and instant queue alerts.</p>
              </div>
            </div>

            {/* Feature 3: Cancellation & Refund Policy */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition group">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">2-Day Refund & Flexibility</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">Cancel bookings within 2 days (48 hours) of appointment confirmation for verified claims and settlements.</p>
              </div>
            </div>

            {/* Feature 4: Bank-Grade Data Security */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition group">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 group-hover:scale-105 transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Bank-Grade Health Security</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">256-bit encryption for digital prescriptions, consultation notes, and private medical records.</p>
              </div>
            </div>

          </div>

          {/* Live Trust Metrics Ribbon */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-white">15+</span>
              <span className="text-slate-300">Partner Hospitals</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span className="font-extrabold text-white">50k+</span>
              <span className="text-slate-300">Satisfied Patients</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-white">24/7</span>
              <span className="text-slate-300">Care Support</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Authentication Form Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 border border-white/40 w-full p-6 sm:p-7 space-y-4">
        
          {/* Card Top Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-0.5 overflow-hidden">
                <img src="/caresync-logo.png" alt="CareSync Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-black text-slate-900 text-sm tracking-tight block">CareSync</span>
                <span className="text-[10px] text-emerald-700 font-bold">Central Hospital Channeling</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> SLMC Verified
            </span>
          </div>

          {/* Navigation Tabs (Prominently Highlighted) */}
          <div className="flex bg-slate-100/90 border border-slate-200/90 p-1.5 rounded-2xl gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/25 ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-bold'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${authMode === 'login' ? 'text-white' : 'text-slate-400'}`} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/25 ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-bold'
              }`}
            >
              <UserPlus className={`w-3.5 h-3.5 ${authMode === 'register' ? 'text-white' : 'text-slate-400'}`} />
              <span>New Patient Register</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('forgot')}
              className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                authMode === 'forgot'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/25 ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-bold'
              }`}
            >
              <KeyRound className={`w-3.5 h-3.5 ${authMode === 'forgot' ? 'text-white' : 'text-slate-400'}`} />
              <span>Recover Password</span>
            </button>
          </div>

        {/* 1. SIGN IN MODE */}
        {authMode === 'login' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Sign in to your account</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                Role-based access for Patients, Doctors, Coordinators, Admins, Finance & Customer Service.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Username or National ID (NIC)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your username or NIC number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition focus:outline-none"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loginLoading ? 'Signing In...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-Bit SSL Secured Portal
              </span>
              <span className="font-semibold text-slate-400">CareSync Healthcare Core</span>
            </div>
          </div>
        )}

        {/* 2. REGISTER NEW PATIENT MODE */}
        {authMode === 'register' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Create New Patient Account</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your details to register for doctor channeling, receipts, and medical records.
              </p>
            </div>

            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              {/* Profile Photo Upload Field */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-300 overflow-hidden flex items-center justify-center text-slate-400 shadow-sm">
                    {regData.profileImage ? (
                      <img src={regData.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  {regData.profileImage && (
                    <button
                      type="button"
                      onClick={() => setRegData(prev => ({ ...prev, profileImage: '' }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <span className="font-bold text-slate-800 block text-xs">Patient Profile Photo (Optional)</span>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Upload your face portrait (JPG, PNG). This will appear on your digital clinic ID card and appointment slips.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-300 cursor-pointer shadow-sm transition">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{regData.profileImage ? 'Change Photo' : 'Upload Profile Picture'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kamal.perera"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Password *</label>
                  <div className="relative mt-1">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      placeholder="Choose secure password"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition focus:outline-none"
                      title={showRegisterPassword ? 'Hide password' : 'Show password'}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kamal Perera"
                    value={regData.fullName}
                    onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">National ID (NIC) *</label>
                  <input
                    type="text"
                    required
                    placeholder="200012345678"
                    value={regData.nic}
                    onChange={(e) => setRegData({ ...regData, nic: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="0771234567"
                    value={regData.contactNumber}
                    onChange={(e) => setRegData({ ...regData, contactNumber: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="0719876543"
                    value={regData.emergencyContact}
                    onChange={(e) => setRegData({ ...regData, emergencyContact: e.target.value })}
                    className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={regData.dateOfBirth}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const calculatedAge = calculateAgeFromDob(dob);
                      setRegData({ ...regData, dateOfBirth: dob, age: calculatedAge !== '' ? calculatedAge : 0 });
                    }}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Age</label>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 py-0.2 rounded">Auto</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={regData.age !== '' ? `${regData.age} yrs` : 'Auto'}
                    className="w-full p-2 mt-1 border border-slate-200 bg-slate-100 text-slate-700 font-semibold rounded-xl outline-none cursor-not-allowed select-none text-xs sm:text-sm"
                    title="Age is automatically calculated from Date of Birth"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Gender *</label>
                  <select
                    value={regData.gender}
                    onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs sm:text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Blood Group *</label>
                  <select
                    value={regData.bloodGroup}
                    onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                    className="w-full p-2 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs sm:text-sm"
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
                <label className="font-bold text-slate-700">Permanent Address *</label>
                <input
                  type="text"
                  required
                  placeholder="No. 123, Temple Road, Colombo"
                  value={regData.address}
                  onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                  className="w-full p-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition mt-2 disabled:opacity-50"
              >
                {regLoading ? 'Creating Account...' : 'Complete Patient Registration'}
              </button>
            </form>
          </div>
        )}

        {/* 3. FORGOT / RECOVER PASSWORD MODE (2-Step Verification) */}
        {authMode === 'forgot' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${recoveryStep === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                  Step {recoveryStep} of 2
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {recoveryStep === 1 ? 'Identity Verification' : 'Set New Password'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {recoveryStep === 1 ? 'Verify Your Identity' : 'Create New Password'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {recoveryStep === 1 
                  ? 'Enter your registered NIC, Birthday, and Mobile Number to verify your account.' 
                  : 'Enter your new password and confirm it to regain access.'}
              </p>
            </div>

            {recoverySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            {recoveryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoveryStep === 1 ? (
              /* STEP 1: NIC, Birthday, Mobile Number */
              <form onSubmit={handleVerifyRecovery} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">National ID (NIC) *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 199855667788 or 200012349988"
                      value={recoveryNic}
                      onChange={(e) => setRecoveryNic(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Birth (Birthday) *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={recoveryDob}
                      onChange={(e) => setRecoveryDob(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0775566778"
                      value={recoveryMobile}
                      onChange={(e) => setRecoveryMobile(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {recoveryLoading ? 'Verifying Details...' : 'Confirm & Verify Identity'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setRecoveryError('');
                    setRecoverySuccess('');
                  }}
                  className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 py-1"
                >
                  ← Back to Sign In
                </button>
              </form>
            ) : (
              /* STEP 2: New Password and Confirm Password */
              <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5 text-xs">
                {verifiedAccount && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Identity Confirmed</span>
                    </div>
                    <p className="text-slate-800 font-semibold">{verifiedAccount.fullName} ({verifiedAccount.username})</p>
                    <p className="text-slate-500 text-[11px]">NIC: {verifiedAccount.nic} • Role: {verifiedAccount.role}</p>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Password *</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min. 6 chars)"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password to confirm"
                      value={recoveryConfirmPassword}
                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {recoveryLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep(1);
                      setRecoveryError('');
                      setRecoverySuccess('');
                    }}
                    className="text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    ← Re-verify Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setRecoveryStep(1);
                      setRecoveryError('');
                      setRecoverySuccess('');
                    }}
                    className="text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        </div>
        </div>
      </div>

      {/* 6. Full-Width Verified Doctor Ratings & Patient Reviews Section (Light Theme) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-950/20 rounded-3xl p-6 sm:p-8 text-slate-800 space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start sm:items-center gap-3.5">
              <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 shadow-xs shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Verified Doctor Ratings & Patient Reviews</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Overall Patient Satisfaction: <strong className="text-emerald-700 font-extrabold">4.9 / 5.0</strong> based on 500+ verified channelings
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Genuine Reviews
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                SLMC Verified Consultants
              </span>
            </div>
          </div>

          {/* Top Specialists Rating Badges */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Top Rated Hospital Specialists</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {publicDoctorSummaries.slice(0, 4).map((doc, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 group shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 truncate">{doc.specialization}</span>
                    <span className="inline-flex items-center text-xs font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500 mr-1" />
                      {Number(doc.averageRating || 5.0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-800 transition">
                    {doc.doctorName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {doc.totalReviews || 12} verified reviews
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Patient Feedbacks */}
          {publicReviews.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800 text-sm font-black">
                  <Quote className="w-4 h-4 text-emerald-600" /> Recent Patient Feedbacks
                </span>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Showing {showAllPublicReviews ? publicReviews.length : Math.min(3, publicReviews.length)} of {publicReviews.length} Verified Reviews
                </span>
              </div>

              {/* 3-Column Testimonial Cards Grid across Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showAllPublicReviews ? publicReviews : publicReviews.slice(0, 3)).map((rev, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                      </div>
                      
                      <p className="text-xs sm:text-[13px] text-slate-700 italic leading-relaxed font-normal">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-3 mt-3.5 flex items-center justify-between border-t border-slate-200/80 text-xs">
                      <span className="font-extrabold text-emerald-800 text-xs">{rev.patientName}</span>
                      <span className="text-slate-500 text-[11px] font-medium truncate ml-2">
                        {rev.doctorName} <span className="text-slate-400">({rev.specialization})</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {publicReviews.length > 3 && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllPublicReviews(!showAllPublicReviews)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300 transition-all shadow-xs hover:shadow"
                  >
                    {showAllPublicReviews ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-emerald-600" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-emerald-600" />
                        <span>See More Reviews (+{publicReviews.length - 3} more)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* LANDING PAGE FOOTER */}
      <div className="w-full relative z-10 mt-16">
        <Footer
          currentUser={null}
          isLanding={true}
          onNavigate={(target) => {
            if (target === 'live-queue') {
              setShowLiveQueueModal(true);
            } else {
              setAuthMode('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      </div>

      {/* LIVE QUEUE & SMART TOKEN TRACKER MODAL ON LANDING PAGE */}
      {showLiveQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-50 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200">
            <LiveQueueTracker
              currentUser={null}
              onClose={() => setShowLiveQueueModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
