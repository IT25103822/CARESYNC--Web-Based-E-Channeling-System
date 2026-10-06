import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';
import CoordinatorPortal from './components/CoordinatorPortal';
import AdminPortal from './components/AdminPortal';
import FinancePortal from './components/FinancePortal';
import SupportPortal from './components/SupportPortal';
import NotificationManager from './components/NotificationManager';
import Footer from './components/Footer';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('careSync_user');
      if (!saved) return null;
      const u = JSON.parse(saved);
      // Auto-heal legacy or stale user IDs from localStorage
      if (u && u.role === 'PATIENT' && (u.userId === 5 || !u.userId)) {
        u.userId = (u.username === 'patient.kasun') ? 9 : 8;
        localStorage.setItem('careSync_user', JSON.stringify(u));
      }
      return u;
    } catch (e) {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const saved = localStorage.getItem('careSync_user');
      const u = saved ? JSON.parse(saved) : null;
      return u?.role || 'PATIENT';
    } catch (e) {
      return 'PATIENT';
    }
  });

  const [activeSection, setActiveSection] = useState('browse');

  // When role changes, set default active section for that role
  useEffect(() => {
    if (currentRole === 'PATIENT') setActiveSection('browse');
    else if (currentRole === 'DOCTOR') setActiveSection('schedules');
    else if (currentRole === 'CHANNELING_COORDINATOR') setActiveSection('all-bookings');
    else if (currentRole === 'ADMINISTRATOR') setActiveSection('analytics');
    else if (currentRole === 'FINANCE_OFFICER') setActiveSection('reconciliation');
    else if (currentRole === 'CUSTOMER_SERVICE_EXECUTIVE' || currentRole === 'CUSTOMER_SERVICE') setActiveSection('tickets');
  }, [currentRole]);

  const handleLoginSuccess = (user) => {
    // Ensure patient role always has correct ID
    if (user && user.role === 'PATIENT' && (user.userId === 5 || !user.userId)) {
      user.userId = (user.username === 'patient.kasun') ? 9 : 8;
    }
    setCurrentUser(user);
    let role = user.role;
    if (role === 'CUSTOMER_SERVICE') role = 'CUSTOMER_SERVICE_EXECUTIVE';
    setCurrentRole(role);
    localStorage.setItem('careSync_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('careSync_user');
    setCurrentUser(null);
  };

  // If not logged in, render the clean login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Navbar
        currentUser={currentUser}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Breadcrumb / Live Status Bar (Desktop) */}
        <header className="hidden md:flex bg-white/90 backdrop-blur-sm border-b border-slate-200/80 px-6 lg:px-8 h-14 items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-extrabold text-slate-800 tracking-tight capitalize">
              {activeSection === 'bills' ? 'My Bills and Invoices' : activeSection === 'profile' ? 'My Profile & ID' : activeSection === 'feedbacks' ? 'Patient Reviews & Public Testimonials' : activeSection === 'system-logs' ? 'System Audit Logs & Operations Desk' : activeSection.replace(/-/g, ' ')}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">CareSync Hospital Management</span>
          </div>

          <div className="flex items-center gap-3">
            {!['PATIENT', 'DOCTOR'].includes(currentUser?.role) && (
              <NotificationManager
                currentUser={currentUser}
                onNavigate={setActiveSection}
                variant="header"
              />
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Hospital Core Live</span>
            </div>
            {/* User Profile Pill in top right header */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs overflow-hidden border border-teal-200 shrink-0">
                {currentUser?.profileDetails?.profileImage || currentUser?.profileImage ? (
                  <img src={currentUser.profileDetails?.profileImage || currentUser.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.fullName?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block font-bold text-slate-800 leading-tight">{currentUser?.fullName}</span>
                <span className="text-[10px] text-slate-400 capitalize">{currentUser?.role?.toLowerCase()?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentRole === 'PATIENT' && (
            <PatientPortal activeSection={activeSection} onSectionChange={setActiveSection} currentUser={currentUser} />
          )}
          {currentRole === 'DOCTOR' && <DoctorPortal activeSection={activeSection} onSectionChange={setActiveSection} currentUser={currentUser} />}
          {currentRole === 'CHANNELING_COORDINATOR' && <CoordinatorPortal activeSection={activeSection} onSectionChange={setActiveSection} currentUser={currentUser} />}
          {currentRole === 'ADMINISTRATOR' && <AdminPortal activeSection={activeSection} currentUser={currentUser} />}
          {currentRole === 'FINANCE_OFFICER' && <FinancePortal activeSection={activeSection} currentUser={currentUser} />}
          {(currentRole === 'CUSTOMER_SERVICE_EXECUTIVE' || currentRole === 'CUSTOMER_SERVICE') && (
            <SupportPortal activeSection={activeSection} onSectionChange={setActiveSection} currentUser={currentUser} />
          )}
        </main>

        <Footer currentUser={currentUser} onNavigate={setActiveSection} />
      </div>
    </div>
  );
}
