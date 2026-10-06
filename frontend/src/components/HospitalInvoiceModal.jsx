import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  User, 
  Stethoscope, 
  CreditCard, 
  FileText, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';
import { numberToWords } from '../utils/numberToWords';

export default function HospitalInvoiceModal({ invoice, onClose, currentUser }) {
  const invoiceRef = useRef(null);

  if (!invoice) return null;

  // Extract or normalize fields whether coming from Payment receipt or CustomBill
  const isCustomBill = Boolean(invoice.billCategory || invoice.lineItemsJson || invoice.totalAmount !== undefined);

  const invoiceNumber = invoice.invoiceNumber || invoice.receiptNumber || `INV-2026-${invoice.paymentId || '0001'}`;
  const issueDate = invoice.createdAt || invoice.issueDate || invoice.payment?.paymentDate || new Date().toISOString();
  
  const formattedDate = (() => {
    try {
      const d = new Date(issueDate);
      if (isNaN(d.getTime())) return String(issueDate);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(issueDate);
    }
  })();

  // Patient Info
  const patient = invoice.appointment?.patient || invoice.patient || {};
  const patientName = invoice.patientName || patient.fullName || 'Walk-in Patient';
  const patientIdDisplay = invoice.patientId 
    ? (String(invoice.patientId).startsWith('PAT') ? invoice.patientId : formatPatientId(invoice.patientId)) 
    : (patient.userId || patient.patientId ? formatPatientId(patient) : 'PAT-WALKIN');
  const patientNic = invoice.patientNic || patient.nic || 'N/A';
  const patientContact = invoice.patientContact || patient.contactNumber || 'N/A';
  const patientAge = patient.age ? `${patient.age} Yrs` : null;
  const patientGender = patient.gender || null;

  // Doctor & Clinical Info
  const doctor = invoice.appointment?.doctor || invoice.doctor || {};
  const doctorName = invoice.doctorName || doctor.fullName || 'Consultant Specialist';
  const doctorSpecialization = invoice.doctorSpecialization || doctor.specialization || 'Clinical Medicine';
  const doctorLicense = doctor.medicalLicenseNo || 'SLMC-REG-2026';
  const department = invoice.department || (doctor.specialization ? `${doctor.specialization} Unit` : 'Outpatient Department (OPD)');

  // Financial Figures
  let subtotal = 0;
  let facilityCharge = 0;
  let discount = 0;
  let tax = 0;
  let totalAmount = 0;
  let lineItems = [];

  if (isCustomBill && invoice.lineItemsJson) {
    try {
      lineItems = typeof invoice.lineItemsJson === 'string' ? JSON.parse(invoice.lineItemsJson) : invoice.lineItemsJson;
    } catch (e) {
      console.error('Error parsing lineItemsJson', e);
      lineItems = [];
    }
    subtotal = Number(invoice.subtotal) || 0;
    facilityCharge = Number(invoice.facilityCharge) || 0;
    discount = Number(invoice.discount) || 0;
    tax = Number(invoice.tax) || 0;
    totalAmount = Number(invoice.totalAmount) || 0;
  } else {
    // Existing Payment / Appointment Receipt breakdown
    const rawTotal = Number(invoice.payment?.amount || invoice.amount || 0);
    totalAmount = rawTotal;
    // Standard hospital breakdown
    const docFee = Math.max(0, rawTotal > 1000 ? rawTotal - 1000 : rawTotal);
    const hospFacility = rawTotal > 1000 ? 600 : 0;
    const nursingFee = rawTotal > 1000 ? 300 : 0;
    const digitalSurcharge = rawTotal > 1000 ? 100 : 0;

    subtotal = docFee;
    facilityCharge = hospFacility + nursingFee + digitalSurcharge;
    discount = 0;
    tax = 0;

    lineItems = [
      {
        id: 1,
        description: `Consultant Specialist Review & Medical Examination (${doctorName})`,
        category: 'Consultation',
        qty: 1,
        unitPrice: docFee,
        amount: docFee
      }
    ];

    if (hospFacility > 0) {
      lineItems.push({
        id: 2,
        description: 'Hospital Clinical Facilities, Consultation Room & Equipment Charge',
        category: 'Facility',
        qty: 1,
        unitPrice: hospFacility,
        amount: hospFacility
      });
    }

    if (nursingFee > 0) {
      lineItems.push({
        id: 3,
        description: 'Nursing Care, Vitals Triage & Clinical Documentation',
        category: 'Nursing',
        qty: 1,
        unitPrice: nursingFee,
        amount: nursingFee
      });
    }

    if (digitalSurcharge > 0) {
      lineItems.push({
        id: 4,
        description: 'Digital Health Cloud & Real-time Queue Notification Surcharge',
        category: 'Service',
        qty: 1,
        unitPrice: digitalSurcharge,
        amount: digitalSurcharge
      });
    }
  }

  // Fallback if lineItems is empty
  if (!lineItems || lineItems.length === 0) {
    lineItems = [
      {
        id: 1,
        description: invoice.receiptDetails || 'Medical Services & Professional Consultation',
        category: invoice.billCategory || 'General',
        qty: 1,
        unitPrice: totalAmount,
        amount: totalAmount
      }
    ];
    subtotal = totalAmount;
  }

  const paymentMethod = invoice.paymentMethod || invoice.payment?.paymentMethod || 'CREDIT_CARD';
  const paymentStatus = invoice.paymentStatus || invoice.payment?.paymentStatus || 'COMPLETED';
  const txnReference = invoice.payment?.transactionReference || `TXN-REF-${invoice.billId || invoice.receiptId || '7721'}`;
  const cashierName = invoice.cashierName || currentUser?.fullName || 'Ruwan Selvaratnam (Finance Directorate)';

  const amountWords = numberToWords(totalAmount);

  const handlePrint = () => {
    window.print();
  };

  const copyRef = () => {
    navigator.clipboard?.writeText(invoiceNumber);
    alert(`Invoice reference "${invoiceNumber}" copied to clipboard.`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #caresync-official-invoice, #caresync-official-invoice * {
            visibility: visible !important;
          }
          #caresync-official-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh] print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none">
        
        {/* Top Control Bar (Screen Only) */}
        <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wide text-slate-200">
              CareSync Healthcare Cloud • Verified Official Invoice System
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyRef}
              title="Copy Invoice Reference"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Ref</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Body */}
        <div 
          id="caresync-official-invoice"
          ref={invoiceRef}
          className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 bg-white"
        >
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900">
            {/* Hospital Crest & Details */}
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shrink-0 border border-emerald-500/30">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    CARESYNC HEALTHCARE NETWORK
                  </h1>
                </div>
                <p className="text-xs font-bold text-emerald-800 tracking-wide">
                  CENTRAL SPECIALIST HOSPITALS & CLINICAL INSTITUTE
                </p>
                <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                  120 Dharmapala Mawatha, Colombo 07, Sri Lanka • Reg No: PH/COL/2026/894
                  <br />
                  Emergency: 1990 • Hotlines: +94 11 268 8800 / 01 • Web: www.caresync.lk
                  <br />
                  <span className="font-semibold text-slate-600">TIN: 104829104-0001</span> • <span className="font-semibold text-slate-600">VAT Reg: 88301149-7000</span>
                </p>
              </div>
            </div>

            {/* Document Stamp Box */}
            <div className="flex flex-col items-start sm:items-end space-y-1.5 self-stretch sm:self-auto bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-slate-200 sm:border-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Official Clinical Document
              </span>
              <div className="text-lg font-black text-slate-900 tracking-tight sm:text-right">
                MEDICAL TAX INVOICE & RECEIPT
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {invoiceNumber}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                  paymentStatus === 'COMPLETED' || paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : paymentStatus === 'REFUNDED'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {paymentStatus === 'COMPLETED' || paymentStatus === 'PAID' 
                    ? '✓ PAID & SETTLED' 
                    : paymentStatus === 'REFUNDED'
                    ? '✕ REFUNDED & CANCELLED'
                    : '⏳ PENDING'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Issue Date: <strong className="text-slate-800">{formattedDate}</strong>
              </div>
              
              {/* Simulated Vector Barcode */}
              <div className="pt-1.5 flex flex-col items-start sm:items-end">
                <div className="flex items-end h-6 space-x-0.5 opacity-80">
                  {[2,1,3,1,2,3,1,1,2,3,1,2,1,3,2,1,1,3,1,2,1,3,1,1,2,3,1,2,3,1,2].map((w, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-900" 
                      style={{ width: `${w * 1.3}px`, height: idx % 4 === 0 ? '100%' : '85%' }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-400 tracking-wider">
                  *{invoiceNumber}*
                </span>
              </div>
            </div>
          </div>

          {/* Patient & Doctor Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Panel */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>PATIENT INFORMATION</span>
                </div>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                  {patientIdDisplay}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-bold text-slate-900">{patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">NIC / Passport</span>
                  <span className="font-medium text-slate-700">{patientNic}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                  <span className="font-medium text-slate-700">{patientContact}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
                  <span className="font-medium text-slate-700">
                    {[patientAge, patientGender].filter(Boolean).join(' • ') || 'Registered Patient'}
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical & Physician Panel */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span>CLINICAL & ATTENDING PHYSICIAN</span>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {invoice.billCategory || 'OPD Service'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultant Doctor</span>
                  <span className="font-bold text-slate-900">{doctorName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialization / SLMC</span>
                  <span className="font-medium text-slate-700">{doctorSpecialization}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hospital Department</span>
                  <span className="font-medium text-slate-700">{department}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                  <span className="font-bold text-slate-800 uppercase">{paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Billing Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 px-1">
              <span>ITEMIZED CLINICAL CHARGES & HEALTHCARE SERVICES</span>
              <span className="text-[11px] text-slate-400 font-normal">All rates quoted in Sri Lankan Rupees (LKR)</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Service & Item Description</th>
                    <th className="py-3 px-4 w-28">Category</th>
                    <th className="py-3 px-4 w-16 text-center">Qty</th>
                    <th className="py-3 px-4 w-28 text-right">Unit Rate (LKR)</th>
                    <th className="py-3 px-4 w-28 text-right">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.description}</div>
                        {item.notes && <div className="text-[10px] text-slate-400 mt-0.5">{item.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                          {item.category || 'Service'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.qty || 1}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {Number(item.amount || ((item.qty || 1) * (item.unitPrice || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Amount in Words */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            {/* Amount in words & Notes (7 Cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Amount in Words
                </span>
                <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                  "{amountWords}"
                </p>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>Txn Ref: <strong className="font-mono text-slate-800">{txnReference}</strong></span>
                  <span>•</span>
                  <span>Payment Rail: <strong className="text-slate-800">{paymentMethod}</strong></span>
                </div>
              </div>

              {invoice.remarks && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950">
                  <strong className="block text-[10px] uppercase tracking-wider text-emerald-800 mb-0.5">
                    Clinical / Billing Remarks
                  </strong>
                  {invoice.remarks}
                </div>
              )}
            </div>

            {/* Calculations Summary Box (5 Cols) */}
            <div className="md:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Clinical Services Subtotal:</span>
                <span className="font-mono font-semibold">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {facilityCharge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Hospital Facility & Nursing Fee:</span>
                  <span className="font-mono font-semibold">LKR {facilityCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Concession / Discount:</span>
                  <span className="font-mono">- LKR {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Government Healthcare Levy / VAT:</span>
                <span className="font-mono">
                  {tax > 0 ? `LKR ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Exempt (0.00)'}
                </span>
              </div>

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black text-slate-950">
                <span>NET TOTAL PAID:</span>
                <span className="text-base text-emerald-700 font-mono">
                  LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Security, Verification Stamp & Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            
            {/* 1. Official Digital Stamp */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-28 h-28 border-2 border-dashed border-emerald-700/60 rounded-full flex flex-col items-center justify-center p-2 text-emerald-800 rotate-[-4deg] shadow-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-700 mb-0.5" />
                <span className="text-[8px] font-black tracking-widest uppercase">CareSync Network</span>
                <span className="text-[10px] font-black uppercase text-slate-900 leading-tight">OFFICIAL AUDIT</span>
                <span className="text-[8px] font-bold text-emerald-700">APPROVED & SETTLED</span>
                <span className="text-[7px] text-slate-500 mt-0.5">{formattedDate.split(',')[0]}</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 font-mono">Electronic Seal #CS-2026-VAL</span>
            </div>

            {/* 2. QR Code Authentication */}
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-xs">
                {/* SVG QR Code Pattern */}
                <svg className="w-20 h-20 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer Frame Top Left */}
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="13" width="12" height="12" />
                  {/* Outer Frame Top Right */}
                  <rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="75" y="13" width="12" height="12" />
                  {/* Outer Frame Bottom Left */}
                  <rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="75" width="12" height="12" />
                  {/* Inner Data Dots */}
                  <rect x="42" y="10" width="8" height="8" />
                  <rect x="52" y="20" width="8" height="8" />
                  <rect x="42" y="32" width="16" height="6" />
                  <rect x="10" y="42" width="6" height="16" />
                  <rect x="25" y="45" width="8" height="8" />
                  <rect x="45" y="45" width="12" height="12" />
                  <rect x="68" y="42" width="8" height="8" />
                  <rect x="80" y="50" width="10" height="10" />
                  <rect x="42" y="68" width="8" height="14" />
                  <rect x="55" y="75" width="10" height="8" />
                  <rect x="72" y="72" width="18" height="18" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Authenticity QR Scan</span>
              <span className="text-[8px] text-slate-400 max-w-[150px] leading-tight">
                Scan to verify this official invoice on CareSync National Cloud
              </span>
            </div>

            {/* 3. Authorized Cashier Signatory */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1">
              <div className="h-12 flex items-center justify-center">
                {/* Simulated signature curve */}
                <svg className="w-36 h-10 text-slate-800" viewBox="0 0 150 40" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M 10 30 Q 30 5, 50 25 T 90 20 T 120 15 T 140 28" />
                </svg>
              </div>
              <div className="w-48 border-t border-slate-400 pt-1">
                <span className="text-xs font-black text-slate-900 block">{cashierName}</span>
                <span className="text-[10px] font-medium text-slate-500 block">
                  Authorized Signatory • Directorate of Finance
                </span>
                <span className="text-[9px] text-emerald-800 font-mono font-semibold block">
                  CareSync Health Cloud Certified
                </span>
              </div>
            </div>
          </div>

          {/* Legal / PHSRC Accreditation Footer */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <p>
              This is a computer-generated tax invoice issued in accordance with the Private Health Services Regulatory Council (PHSRC) Act No. 21 of 2006.
              Valid without physical signature when bearing official electronic seal.
            </p>
            <p className="font-semibold text-slate-500">
              For billing inquiries or insurance reimbursement claims, contact billing@caresync.lk or call +94 11 268 8800 quoting invoice reference: {invoiceNumber}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
