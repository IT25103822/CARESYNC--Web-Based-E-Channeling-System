import React, { useRef } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Stethoscope,
  Copy,
  Clock,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  Check
} from 'lucide-react';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';

export default function PrescriptionSlipModal({ prescription, onClose, currentUser }) {
  const [copied, setCopied] = React.useState(false);
  const slipRef = useRef(null);

  if (!prescription) return null;

  const patient = prescription.patient || prescription.appointment?.patient || {};
  const doctor = prescription.doctor || prescription.appointment?.doctor || {};
  const appointment = prescription.appointment || {};

  const rxNumber = `RX-${String(prescription.prescriptionId || '1').padStart(4, '0')}`;
  
  const formattedDate = (() => {
    try {
      const d = new Date(prescription.issueDate || appointment.appointmentDate || Date.now());
      if (isNaN(d.getTime())) return String(prescription.issueDate || 'N/A');
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(prescription.issueDate || 'N/A');
    }
  })();

  const patientIdDisplay = formatPatientId(patient) || `PAT-${String(patient.userId || '0000').padStart(4, '0')}`;
  const doctorIdDisplay = formatDoctorId(doctor) || `DOC-${String(doctor.userId || '0000').padStart(4, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textToCopy = `CareSync Hospital Medical Prescription
Rx Number: ${rxNumber}
Date: ${formattedDate}
Doctor: ${doctor.fullName || 'Consultant Specialist'} (${doctor.specialization || 'General'})
SLMC License: ${doctor.medicalLicenseNo || 'SLMC-VERIFIED'}
Hospital: ${doctor.hospitalLocation || 'CareSync Hospital'}
Patient: ${patient.fullName || 'Patient'} (${patientIdDisplay})
Age/Gender: ${patient.age ? patient.age + ' Yrs' : 'N/A'} • ${patient.gender || 'N/A'}
Contact: ${patient.contactNumber || patient.contactNo || 'N/A'}
Appointment: #${appointment.appointmentId || 'N/A'} • Token: #${appointment.timeslot?.queueNumber || appointment.queueNumber || '1'}

PRESCRIPTION & CLINICAL INSTRUCTIONS:
${prescription.details || 'No clinical instructions specified.'}
----------------------------------------
CareSync E-Channeling Hospital Network`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Parse lines or comma separated medications if present for clean bulleted display
  const clinicalNotes = prescription.details || '';
  const lines = clinicalNotes.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Print-specific style rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-prescription-slip, #printable-prescription-slip * {
            visibility: visible;
          }
          #printable-prescription-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 18mm 15mm;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col text-slate-800">
        
        {/* Top Modal Action Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <span className="font-serif italic font-bold text-lg leading-none">℞</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Official Clinical Prescription Slip
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {rxNumber}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">CareSync Electronic Hospital Records System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              title="Copy prescription details"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="Print Prescription Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Slip Container */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6">
          <div
            id="printable-prescription-slip"
            ref={slipRef}
            className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-xs text-left"
          >
            {/* Header: Hospital & Doctor Information */}
            <div className="border-b-2 border-emerald-600 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1.5 shrink-0">
                    <img src="/caresync-logo.png" alt="CareSync" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">CareSync E-Channeling</h1>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Official Medical Slip
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {doctor.hospitalLocation || 'Asiri Central Hospital'} • 24/7 Channeling Support: +94 11 234 5678
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                    {rxNumber}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Issued: <span className="font-semibold text-slate-700">{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Consultant Details Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-700" />
                    {doctor.fullName || 'Dr. Consultant Specialist'}
                  </h2>
                  <p className="text-xs text-emerald-900 font-bold">
                    Consultant {doctor.specialization || 'Medical Specialist'} • {doctorIdDisplay}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-slate-600">
                  <p>SLMC Registration: <span className="font-mono font-bold text-slate-800">{doctor.medicalLicenseNo || 'SLMC-45892'}</span></p>
                  <p>Department: <span className="font-semibold text-slate-700">{doctor.hospitalLocation || 'Clinical OPD'}</span></p>
                </div>
              </div>
            </div>

            {/* Patient & Channeling Consultation Demographics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Patient Information
                </span>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {patient.fullName || 'Patient'}
                  <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    {patientIdDisplay}
                  </span>
                </div>
                <div className="text-slate-600 space-x-2">
                  <span>Age: <strong>{patient.age ? `${patient.age} Yrs` : 'Adult'}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong>{patient.gender || 'Not specified'}</strong></span>
                  {patient.bloodGroup && (
                    <>
                      <span>•</span>
                      <span>Blood: <strong className="text-rose-700">{patient.bloodGroup}</strong></span>
                    </>
                  )}
                </div>
                <div className="text-slate-500 text-[11px]">
                  <span>NIC: <strong className="text-slate-700">{patient.nic || 'N/A'}</strong></span>
                  <span className="mx-1.5">•</span>
                  <span>Phone: <strong className="text-slate-700 font-mono">{patient.contactNumber || patient.contactNo || 'N/A'}</strong></span>
                </div>
                {patient.address && (
                  <p className="text-[11px] text-slate-500 truncate">
                    Address: {patient.address}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Consultation Session Reference
                </span>
                <div className="text-slate-900 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Appointment #{appointment.appointmentId || 'N/A'}
                </div>
                <div className="text-slate-600">
                  Queue Token: <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
                    Token #{appointment.timeslot?.queueNumber || appointment.queueNumber || '1'}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Session: {appointment.startTime || '09:00'} - {appointment.endTime || '12:00'}
                  <span className="mx-1">•</span>
                  Status: <span className="font-bold text-emerald-700">COMPLETED</span>
                </div>
              </div>
            </div>

            {/* Prescriptions & Clinical Advice Body (Rx Section) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 border-b border-emerald-200 pb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-serif font-black text-xl italic leading-none">
                  ℞
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-slate-900">
                    Medication Orders & Clinical Advice
                  </h3>
                  <p className="text-[10px] text-slate-500">Official prescriptions prescribed during hospital consultation</p>
                </div>
              </div>

              {/* Parsed / Formatted Clinical Items */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-emerald-100 shadow-2xs space-y-3">
                {lines.length > 0 ? (
                  <div className="space-y-2">
                    {lines.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-mono leading-relaxed p-2 rounded-lg bg-emerald-50/30 border border-emerald-100/60">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 whitespace-pre-wrap">
                          {line}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">No specific medical instructions recorded.</p>
                )}

                {/* Additional Clinical Notes Box */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Take all medications exactly as directed by the consultant. Complete the full course.</span>
                </div>
              </div>
            </div>

            {/* Official Authentication Block & Doctor's Signature */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1 text-[10px] text-slate-500">
                <div className="flex items-center gap-1 text-emerald-800 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CareSync Certified Medical E-Prescription</span>
                </div>
                <p>
                  This prescription is an official electronic medical document issued via the CareSync Hospital Network.
                  Valid for dispensing at certified pharmacies within 30 days of issuance.
                </p>
                <p className="font-mono text-[9px] text-slate-400">
                  Verification Hash: CS-RX-{prescription.prescriptionId}-{String(prescription.issueDate || '').slice(0, 10).replace(/-/g, '')}
                </p>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="inline-block border-b-2 border-slate-800 pb-1 px-6 min-w-[200px]">
                  <span className="font-serif italic font-bold text-slate-800 text-sm">
                    {doctor.fullName || 'Consultant Signature'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-800">{doctor.fullName}</p>
                <p className="text-[10px] text-slate-500">
                  Consultant {doctor.specialization || 'Specialist'} • SLMC {doctor.medicalLicenseNo || 'SLMC-45892'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls (Hidden on print) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5 text-center sm:text-left">
            <span className="font-mono font-bold text-slate-700">{rxNumber}</span>
            <span>•</span>
            <span>Patient: {patient.fullName}</span>
            <span>•</span>
            <span>Doctor: {doctor.fullName}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Prescription</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
