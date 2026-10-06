import React, { useState } from 'react';
import {
  Phone, Mail, MapPin, Clock, ShieldCheck, HeartPulse, Stethoscope,
  Headphones, MessageSquare, ExternalLink, Calendar, Receipt,
  CreditCard, CheckCircle2, ChevronRight, Activity, ArrowUpRight,
  Building2, HelpCircle, Shield, Sparkles, Copy, Check, X, PhoneCall
} from 'lucide-react';

// Official WhatsApp Icon (Brand green speech bubble with crisp white phone handset)
export function WhatsAppIcon({ className = "w-3.5 h-3.5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fill="#25D366"
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"
      />
      <path
        fill="#FFFFFF"
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"
      />
    </svg>
  );
}

export default function Footer({ currentUser, onNavigate, isLanding = false }) {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const handleCopy = (e, text, key) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleNav = (sectionId) => {
    if (onNavigate) {
      onNavigate(sectionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Comprehensive, detailed 24/7 Help Desk & Emergency Support Modal
  const renderSupportModal = () => {
    if (!showSupportModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-700 text-left">
          
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>24/7 Live Patient Support Desk</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <Headphones className="w-6 h-6 text-emerald-400 shrink-0" />
                  CareSync 24/7 Support & Contact Center
                </h3>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                  Have questions about doctor channeling, live queue tokens, appointment rescheduling, or urgent hospital care? Connect with our dedicated patient support team anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Hotline Wait: <strong>&lt; 45 Seconds</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-300">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>WhatsApp: <strong>Instant Reply</strong></span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Operating: <strong>365 Days • 24/7</strong></span>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            
            {/* Copy Toast Feedback */}
            {copiedKey && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Copied contact information to your clipboard!</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">Ready to paste</span>
              </div>
            )}

            {/* Main Channels */}
            <div className="space-y-3">
              
              {/* 1. Hotline Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-950 text-sm">24/7 Channeling & Emergency Hotline</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 text-[10px] font-bold">Voice Call</span>
                    </div>
                    <div className="font-mono text-base font-black text-slate-900">+94 11 234 5678</div>
                    <p className="text-[11px] text-slate-600">
                      Direct telephone doctor bookings, queue delays, doctor arrival checks, and urgent hospital support. Toll-free on all local networks.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, '+94112345678', 'hotline')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Copy hotline number"
                  >
                    {copiedKey === 'hotline' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'hotline' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href="tel:+94112345678"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>

              {/* 2. WhatsApp Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-950 text-sm">WhatsApp Patient Assistance Desk</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 text-[10px] font-bold">Fast Chat</span>
                    </div>
                    <div className="font-mono text-base font-black text-slate-900">+94 77 123 4567</div>
                    <p className="text-[11px] text-slate-600">
                      Message our hospital channeling desk for live queue token updates, schedule delay alerts, appointment rescheduling, and digital receipts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, '+94771234567', 'whatsapp')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Copy WhatsApp number"
                  >
                    {copiedKey === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'whatsapp' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href="https://wa.me/94771234567?text=Hello%20CareSync%20Support%2C%20I%20need%20assistance%20with%20my%20appointment."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* 3. Official Email Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">Official Care & Documentation Email</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">Email Support</span>
                    </div>
                    <div className="font-bold text-base text-slate-900">support@caresync.lk</div>
                    <p className="text-[11px] text-slate-600">
                      Formal inquiries, payment confirmation receipts, lab report status, tax invoice requests, and management correspondence. Average 2-hour response.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, 'support@caresync.lk', 'email')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Copy official email"
                  >
                    {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'email' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href="mailto:support@caresync.lk"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Departmental Directory & Emergency Extensions */}
            <div className="pt-2 border-t border-slate-200">
              <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block mb-2.5">
                Hospital Emergency & Departmental Extensions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                  <span className="text-[10px] font-bold uppercase text-rose-700 block">Ambulance Service</span>
                  <span className="font-mono font-black text-rose-900 text-sm">1990</span>
                  <span className="text-[10px] text-rose-600 block mt-0.5">National Emergency</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Main Help Desk</span>
                  <span className="font-bold text-slate-900 text-sm">Lobby Counter A</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ground Floor • 24/7</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Outpatient Pharmacy</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">Ext. 402</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Open 24 Hours</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Cashier & Refunds</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">Ext. 201</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">7:00 AM – 10:00 PM</span>
                </div>
              </div>
            </div>

            {/* Location & Parking */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>CareSync Central Hospital:</strong> No. 120, Elvitigala Mawatha, Colombo 05, Sri Lanka</span>
              </div>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 self-start sm:self-auto">
                Valet & Patient Parking Available
              </span>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              CareSync Healthcare Information System • 24/7 Helpline
            </span>
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition text-xs cursor-pointer shadow-sm"
            >
              Close Support Desk
            </button>
          </div>

        </div>
      </div>
    );
  };

  // Compact, light, elegant bottom pane for internal portal views (when logged in)
  if (!isLanding) {
    return (
      <>
        <footer className="bg-white/95 backdrop-blur-sm border-t border-slate-200/90 py-2.5 px-4 sm:px-6 lg:px-8 mt-auto text-slate-600 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Left: Branding & Copyright */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                <img src="/caresync-logo.png" alt="CareSync" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2 text-slate-600 whitespace-nowrap">
                <span className="font-bold text-slate-900 tracking-tight">CareSync</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-normal">Hospital E-Channeling</span>
                <span className="hidden xl:inline text-slate-300">•</span>
                <span className="hidden xl:inline text-slate-400">&copy; 2026 All Rights Reserved</span>
              </div>
            </div>

            {/* Right: Integrated 24/7 Hotline & WhatsApp Support Pills */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2.5 shrink-0">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                For any inquiry:
              </span>
              <div className="inline-flex items-center p-1 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 rounded-2xl shadow-2xs gap-1.5 sm:gap-2 transition-all">
                
                {/* 24/7 Hotline with Direct Call + 1-Click Copy */}
                <div className="inline-flex items-center rounded-xl bg-white hover:bg-emerald-50/80 text-emerald-800 border border-slate-200/80 hover:border-emerald-300 font-semibold transition text-xs shadow-2xs group overflow-hidden shrink-0 whitespace-nowrap">
                  <a
                    href="tel:+94112345678"
                    className="flex items-center gap-1.5 py-1 px-2.5 whitespace-nowrap"
                    title="Call 24/7 Channeling & Emergency Hotline (+94 11 234 5678)"
                  >
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                      <Phone className="w-3 h-3" />
                    </div>
                    <span className="font-mono font-bold text-slate-800 group-hover:text-emerald-800 whitespace-nowrap">+94 11 234 5678</span>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, '+94112345678', 'phone')}
                    className="py-1 px-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 border-l border-slate-100 transition cursor-pointer shrink-0"
                    title="Copy Phone Number"
                  >
                    {copiedKey === 'phone' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* WhatsApp with Direct Chat + 1-Click Copy */}
                <div className="inline-flex items-center rounded-xl bg-white hover:bg-emerald-50/80 text-emerald-800 border border-slate-200/80 hover:border-emerald-300 font-semibold transition text-xs shadow-2xs group overflow-hidden shrink-0 whitespace-nowrap">
                  <a
                    href="https://wa.me/94771234567?text=Hello%20CareSync%20Support%2C%20I%20need%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 py-1 px-2.5 whitespace-nowrap"
                    title="Chat on WhatsApp Desk (+94 77 123 4567)"
                  >
                    <div className="w-5 h-5 rounded-lg bg-emerald-100/70 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono font-bold text-slate-800 group-hover:text-emerald-800 whitespace-nowrap">+94 77 123 4567</span>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, '+94771234567', 'whatsapp')}
                    className="py-1 px-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 border-l border-slate-100 transition cursor-pointer shrink-0"
                    title="Copy WhatsApp Number"
                  >
                    {copiedKey === 'whatsapp' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </footer>

        {/* Detailed Modal */}
        {renderSupportModal()}
      </>
    );
  }

  // Full Landing Page Footer (Dark theme, rich directory & 24/7 Hero Banner)
  return (
    <>
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 relative overflow-hidden mt-auto">
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. HIGHLIGHTED 24/7 SUPPORT & EMERGENCY CONTACT BANNER                    */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 lg:p-10 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/40">
          {/* Subtle decorative grid/glow inside banner */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left: Support Title & Description */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold tracking-wide uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>24/7 Patient Support & Emergency Helpdesk</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Headphones className="w-8 h-8 text-emerald-400 shrink-0" />
                Need Immediate Help or Medical Inquiries?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-2.5 leading-relaxed font-normal">
                Our round-the-clock hospital channeling coordinators and support executives are always on standby. Contact us anytime for appointment bookings, live queue tokens, urgent rescheduling, or clinical inquiries.
              </p>

              {/* Response Time & Status Pill */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Average Hotline Response: &lt; 45 Seconds</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-semibold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Operating 365 Days • 24/7 Non-Stop</span>
                </div>
              </div>
            </div>

            {/* Right: Contact Highlights (Direct Action Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto shrink-0">
              {/* Card 1: 24/7 Channeling Hotline */}
              <a
                href="tel:+94112345678"
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    24/7 Channeling Hotline
                  </span>
                  <span className="text-base sm:text-lg font-black text-white group-hover:text-emerald-200 transition font-mono tracking-tight">
                    +94 11 234 5678
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Toll-free across all SL networks
                  </span>
                </div>
              </a>

              {/* Card 2: WhatsApp Patient Desk */}
              <a
                href="https://wa.me/94771234567?text=Hello%20CareSync%20Support%2C%20I%20need%20assistance%20with%20my%20appointment."
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-400/50 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30 group-hover:scale-105 group-hover:bg-[#25D366] group-hover:text-white transition">
                  <WhatsAppIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    WhatsApp Patient Desk
                  </span>
                  <span className="text-base sm:text-lg font-black text-white group-hover:text-emerald-200 transition font-mono tracking-tight">
                    +94 77 123 4567
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Fast Token & Reschedule Chat
                  </span>
                </div>
              </a>

              {/* Card 3: Email Support */}
              <a
                href="mailto:support@caresync.lk"
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 transition-all duration-200 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center shrink-0 border border-slate-700 group-hover:scale-105 transition">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Official Care Email
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition">
                    support@caresync.lk
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Detailed medical ticket support
                  </span>
                </div>
              </a>

              {/* Card 4: Colombo Headquarters */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-slate-700/60">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 border border-slate-700">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Care Center & Operations
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 block">
                    No. 120, Elvitigala Mawatha
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Colombo 05, Sri Lanka
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MULTI-COLUMN SITE DIRECTORY & DETAILS                                  */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1 & 2: Branding & Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md">
                <img src="/caresync-logo.png" alt="CareSync Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
                  CareSync
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    E-Channeling
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-400 font-semibold">Your Health, Our Priority</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              CareSync is Sri Lanka's next-generation digital healthcare channeling platform. Connecting patients with verified medical consultants across leading private hospitals with real-time live queue tokens, smart session roasters, and instant refund guarantees.
            </p>

            {/* Accreditation Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SLMC Verified Doctors</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          {/* Column 3: Patient Services & Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              Patient Services
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('browse')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:translate-x-0.5 duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  Search Specialist Doctors
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('live-queue')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:translate-x-0.5 duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  Live Queue & Token Tracker
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('my-appointments')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:translate-x-0.5 duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  My Bookings & Receipts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('bills')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:translate-x-0.5 duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  My Bills and Invoices
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('prescriptions')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:translate-x-0.5 duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  Digital Prescriptions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('refunds')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-slate-400 hover:translate-x-0.5 duration-150 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  Refund Claims & Policies
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Partner Hospitals */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Partner Hospitals
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <div>
                  <span className="text-slate-200 font-semibold block">Asiri Central Hospital</span>
                  <span className="text-[10px] text-slate-500">Norris Canal Rd, Colombo 10</span>
                </div>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <div>
                  <span className="text-slate-200 font-semibold block">Nawaloka Hospital</span>
                  <span className="text-[10px] text-slate-500">Deshamanya H.K. Dharmadasa Mw, Colombo 02</span>
                </div>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <div>
                  <span className="text-slate-200 font-semibold block">Lanka Hospitals</span>
                  <span className="text-[10px] text-slate-500">Elvitigala Mawatha, Colombo 05</span>
                </div>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <div>
                  <span className="text-slate-200 font-semibold block">Durdans Hospital</span>
                  <span className="text-[10px] text-slate-500">Alfred Place, Colombo 03</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 5: Patient Care Guarantee & Policies */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Patient Protection
            </h5>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="font-bold text-amber-300 block text-[11px]">2-Day Cancellation Rule</span>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Bookings can be cancelled and fully refunded within 2 days (48 hours) of appointment confirmation.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 block text-[11px]">100% Refund Assurance</span>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Automatic settlements to original payment card or direct bank account within 2-3 business days.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Payment Gateways:</span>
                <span className="font-mono text-slate-300 font-bold">Visa • MC • LankaQR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM COPYRIGHT & SYSTEM STATUS BAR                                   */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-800/80 bg-slate-950/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-center sm:text-left">
            <span>&copy; 2026 CareSync Healthcare Network (Pvt) Ltd. All Rights Reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-[11px] text-slate-500">Ministry of Health Reg: PV-98214</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* System Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
    {renderSupportModal()}
  </>
  );
}
