import React, { useState } from 'react';
import {
  HeartPulse, Stethoscope, Calendar, Shield, CreditCard, Headphones,
  LogOut, User, Sparkles, CheckCircle2, ChevronDown, ChevronRight,
  Menu, X, Search, FileText, Star, Clock, PlusCircle, RefreshCw,
  BarChart3, LayoutDashboard, Users, UserCheck, ShieldCheck, Receipt,
  RotateCcw, Activity
} from 'lucide-react';
import NotificationManager from './NotificationManager';

export default function Navbar({ currentUser, activeSection, setActiveSection, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Strict, role-specific navigation menu definition
  // Each role ONLY sees their own authorized functional tabs down the left pane
  const getRoleNavConfig = (role, user) => {
    switch (role) {
      case 'DOCTOR':
        return {
          portalTitle: 'Doctor Portal',
          roleBadge: 'Medical Consultant',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          Icon: Stethoscope,
          menuItems: [
            { id: 'schedules', label: 'Consultation Sessions', icon: Calendar },
            { id: 'live-queue', label: 'Live Queue Console', icon: Activity },
            { id: 'patients', label: 'Patient Channeling List', icon: Users },
            { id: 'prescriptions', label: 'Issued Prescriptions', icon: FileText },
            { id: 'leave', label: 'Emergency Leave', icon: Clock },
            { id: 'feedback', label: 'Patient Reviews', icon: Star },
          ]
        };

      case 'CHANNELING_COORDINATOR':
        return {
          portalTitle: 'Coordinator Portal',
          roleBadge: 'Channeling Operations',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          Icon: Calendar,
          menuItems: [
            { id: 'all-bookings', label: 'All Hospital Bookings', icon: Calendar },
            { id: 'sessions', label: 'Doctor Sessions & Leaves', icon: Calendar },
            { id: 'live-queue', label: 'Live Queue Operations', icon: Activity },
            { id: 'new-session', label: '+ Create Doctor Session', icon: PlusCircle },
            { id: 'reschedule', label: 'Reschedule Slots', icon: RefreshCw },
            { id: 'reports', label: 'Channeling Reports', icon: BarChart3 },
          ]
        };

      case 'ADMINISTRATOR': {
        const isMainAdmin = (user?.userId === 1) || (user?.username === 'admin') || (!user?.userId);
        const perms = (user?.permissions || '').toUpperCase();
        const hasAll = isMainAdmin || perms.includes('ALL') || !user?.permissions;

        const items = [];
        if (hasAll || perms.includes('VIEW_ANALYTICS')) {
          items.push({ id: 'analytics', label: 'System Overview & KPIs', icon: LayoutDashboard });
        }
        if (hasAll || perms.includes('MANAGE_USERS')) {
          items.push({ id: 'users', label: 'System Users & Roles', icon: Users });
        }
        if (hasAll || perms.includes('MANAGE_DOCTORS')) {
          items.push({ id: 'doctor-list', label: 'Registered Doctors', icon: Stethoscope });
        }
        if (hasAll || perms.includes('MANAGE_PATIENTS')) {
          items.push({ id: 'patients', label: 'Patient Management', icon: UserCheck });
        }
        if (hasAll || perms.includes('MANAGE_DOCTORS')) {
          items.push({ id: 'approvals', label: 'Verify Doctor Licenses', icon: ShieldCheck });
        }
        if (hasAll || perms.includes('MANAGE_PATIENTS') || perms.includes('MANAGE_DOCTORS') || perms.includes('VIEW_ANALYTICS')) {
          items.push({ id: 'prescriptions', label: 'Issued Prescriptions', icon: FileText });
        }
        if (hasAll || perms.includes('VIEW_ANALYTICS') || perms.includes('MANAGE_USERS')) {
          items.push({ id: 'feedbacks', label: 'Patient Reviews & Feedbacks', icon: Star });
          items.push({ id: 'system-logs', label: 'System Audit Logs', icon: Activity });
        }

        if (items.length === 0) {
          items.push({ id: 'analytics', label: 'System Overview & KPIs', icon: LayoutDashboard });
        }

        return {
          portalTitle: isMainAdmin ? 'Main Admin Portal' : 'Admin Portal (Delegated)',
          roleBadge: isMainAdmin ? 'Super / Main Admin' : 'Staff Admin',
          badgeColor: isMainAdmin ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-teal-50 text-teal-800 border-teal-200',
          Icon: Shield,
          menuItems: items
        };
      }

      case 'FINANCE_OFFICER':
        return {
          portalTitle: 'Finance Portal',
          roleBadge: 'Finance & Accounts',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          Icon: CreditCard,
          menuItems: [
            { id: 'reconciliation', label: 'Daily Reconciliation', icon: Receipt },
            { id: 'transactions', label: 'Transactions & Receipts', icon: CreditCard },
            { id: 'refunds', label: 'Refund Requests', icon: RotateCcw },
          ]
        };

      case 'CUSTOMER_SERVICE_EXECUTIVE':
      case 'CUSTOMER_SERVICE':
        return {
          portalTitle: 'Customer Support Portal',
          roleBadge: 'Customer Support Executive',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          Icon: Headphones,
          menuItems: [
            { id: 'tickets', label: 'Patient Support Tickets', icon: Headphones },
            { id: 'resolution', label: 'Ticket Resolution Desk', icon: CheckCircle2 },
          ]
        };

      case 'PATIENT':
      default:
        return {
          portalTitle: 'Patient Portal',
          roleBadge: 'Registered Patient',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          Icon: HeartPulse,
          menuItems: [
            { id: 'browse', label: 'Search & Book Doctor', icon: Search },
            { id: 'my-appointments', label: 'My Bookings & Receipts', icon: Calendar },
            { id: 'live-queue', label: 'Live Queue & Token Tracker', icon: Activity },
            { id: 'prescriptions', label: 'My Prescriptions', icon: FileText },
            { id: 'refunds', label: 'Refund Claims', icon: CreditCard },
            { id: 'bills', label: 'My Bills and Invoices', icon: Receipt },
            { id: 'profile', label: 'My Profile & ID', icon: User },
            { id: 'feedback', label: 'Ratings & Complaints', icon: Star },
          ]
        };
    }
  };

  const config = getRoleNavConfig(currentUser?.role, currentUser);
  const RoleIcon = config.Icon;
  const userAvatar = currentUser?.profileDetails?.profileImage || currentUser?.profileImage;

  const handleSelectSection = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  // Reusable Navigation Content (Used for Desktop Sidebar & Mobile Drawer)
  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Top Branding & Portal Badge */}
      <div>
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-1 shrink-0">
            <img src="/caresync-logo.png" alt="CareSync Official Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-slate-900">CareSync</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase truncate">E-Channeling Network</p>
          </div>
        </div>

        {/* Portal Role Indicator Card */}
        <div className="px-3 pt-3 pb-1">
          <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">{config.portalTitle}</p>
              <span className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded-full border ${config.badgeColor}`}>
                {config.roleBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Items Section Label */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Main Navigation</span>
          <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
            {config.menuItems.length}
          </span>
        </div>

        {/* Vertical Nav Items Stack */}
        <nav className="px-3 py-1 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          {config.menuItems.map((item) => {
            const ItemIcon = item.icon || Activity;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 translate-x-0.5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <ItemIcon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="truncate flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/90 shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Current User Card, Demo Switcher, Sign Out */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-2 mt-auto">
        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-black text-xs overflow-hidden border border-teal-200 shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
            ) : (
              currentUser?.fullName?.charAt(0) || 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{currentUser?.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate font-mono">@{currentUser?.username}</p>
          </div>
        </div>


        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl border border-rose-200 transition text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
          title="Sign out of system"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Left Sidebar (Fixed and Sticky down the left side) */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 bg-white border-r border-slate-200/90 h-screen sticky top-0 z-30 flex-col shadow-xs">
        {renderNavContent()}
      </aside>

      {/* 2. Mobile Top Bar (< md) */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1 shrink-0">
            <img src="/caresync-logo.png" alt="CareSync Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900">CareSync</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${config.badgeColor}`}>
                {config.portalTitle}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!['PATIENT', 'DOCTOR'].includes(currentUser?.role) && (
            <NotificationManager currentUser={currentUser} onNavigate={handleSelectSection} variant="header" />
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* 3. Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
