import React, { useRef } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Building2, 
  User, 
  Stethoscope, 
  CreditCard, 
  RotateCcw,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';
import { numberToWords } from '../utils/numberToWords';

export default function RefundVoucherModal({ voucher, onClose, currentUser }) {
  const printRef = useRef(null);

  if (!voucher) return null;

  const voucherNumber = voucher.voucherNumber || `VCHR-REF-2026-${voucher.refundId || Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = voucher.refundDate || new Date().toISOString();

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

  const patientName = voucher.patientName || voucher.appointment?.patient?.fullName || 'Registered Patient';
  const patientId = voucher.patientId || (voucher.appointment?.patient ? formatPatientId(voucher.appointment.patient) : 'PAT-WALKIN');
  const patientNic = voucher.patientNic || voucher.appointment?.patient?.nic || 'N/A';
  const patientContact = voucher.patientContact || voucher.appointment?.patient?.contactNumber || 'N/A';

  const doctorName = voucher.doctorName || voucher.appointment?.doctor?.fullName || 'Consultant Specialist';
  const specialization = voucher.doctorSpecialization || voucher.appointment?.doctor?.specialization || 'Outpatient Consultation';
  const department = voucher.department || 'Outpatient Department (OPD)';

  const originalAmount = Number(voucher.originalAmount || voucher.payment?.amount || voucher.refundAmount || 0);
  const refundAmount = Number(voucher.refundAmount || 0);
  const refundWords = numberToWords(refundAmount);

  const reason = voucher.reason || 'Official Administrative Refund issued by CareSync Finance Directorate';
  const payoutMethod = voucher.payoutMethod || voucher.paymentMethod || 'REVERSE_TO_ORIGINAL_CARD';
  const officerName = voucher.financeOfficerName || currentUser?.fullName || 'Ruwan Selvaratnam (Finance Directorate)';
  const reference = voucher.reference || voucher.payment?.transactionReference || `TXN-REF-${voucher.appointment?.appointmentId || '001'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #caresync-official-refund-voucher, #caresync-official-refund-voucher * {
            visibility: visible;
          }
          #caresync-official-refund-voucher {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none">
        
        {/* Top Action Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-300">
              Official Hospital Refund Voucher
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voucher Body (Printable) */}
        <div 
          id="caresync-official-refund-voucher"
          ref={printRef}
          className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-800 bg-white"
        >
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center text-white shadow-md shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-black text-slate-950 tracking-tight">
                  CARESYNC HEALTHCARE NETWORK
                </h1>
                <p className="text-xs font-bold text-rose-800 tracking-wide">
                  CENTRAL FINANCE DIRECTORATE & REVENUE AUDIT
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  120 Dharmapala Mawatha, Colombo 07 • Reg No: PH/COL/2026/894 • Hotlines: +94 11 268 8800
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-rose-50/70 p-3 sm:p-0 rounded-xl sm:bg-transparent border sm:border-none border-rose-200 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 block">
                REFUND CREDIT VOUCHER
              </span>
              <div className="font-mono font-black text-base text-slate-950">{voucherNumber}</div>
              <div className="text-[11px] text-slate-500">Date: <strong className="text-slate-800">{formattedDate}</strong></div>
              <span className="inline-block px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded font-black text-[10px] uppercase tracking-wider">
                ✓ REFUND APPROVED & SETTLED
              </span>
            </div>
          </div>

          {/* Two-Column Grid: Patient & Clinical Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>BENEFICIARY PATIENT</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Name:</span>
                  <span className="font-bold text-slate-900">{patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Patient ID:</span>
                  <span className="font-mono font-bold text-emerald-700">{patientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">NIC:</span>
                  <span className="font-mono text-slate-700">{patientNic}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Contact:</span>
                  <span className="text-slate-700">{patientContact}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                <span>CONSULTATION & SERVICE</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Doctor / Unit:</span>
                  <span className="font-bold text-slate-900">{doctorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Specialization:</span>
                  <span className="text-slate-700">{specialization}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Txn Reference:</span>
                  <span className="font-mono text-slate-700 truncate">{reference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Payout Method:</span>
                  <span className="font-bold text-slate-800 uppercase">{payoutMethod.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Breakdown Box */}
          <div className="border-2 border-rose-200 rounded-2xl p-4 bg-rose-50/40 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-rose-200 text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Financial Disbursal Particulars
              </span>
              <span className="text-[11px] text-rose-700 font-semibold">All figures in LKR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Original Paid Amount</span>
                <span className="text-sm font-black text-slate-800 font-mono">
                  LKR {originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-rose-700 font-bold block uppercase">Disbursed Refund Amount</span>
                <span className="text-xl font-black text-rose-700 font-mono">
                  LKR {refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Net Balance Retained</span>
                <span className="text-sm font-bold text-slate-700 font-mono">
                  LKR {Math.max(0, originalAmount - refundAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Amount in Words:</span>
              <p className="font-bold text-slate-900 italic text-[11px]">{refundWords}</p>
            </div>
          </div>

          {/* Refund Justification / Reason */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Administrative Justification & Settlement Reason
            </span>
            <p className="text-xs text-slate-800 italic leading-relaxed">
              "{reason}"
            </p>
          </div>

          {/* Authorization & Security Stamp */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="space-y-1 max-w-sm">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hospital Financial Ledger Updated & Verified</span>
              </div>
              <p className="text-[10px] text-slate-400">
                This official refund voucher confirms that funds have been authorized and reversed from the hospital revenue account. The recipient should retain this for financial records.
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 w-full sm:w-auto">
              <div className="font-mono text-[10px] text-slate-400 mb-1">Digitally Signed & Certified</div>
              <div className="font-black text-xs text-slate-900">{officerName}</div>
              <div className="text-[10px] text-slate-500 font-medium">Finance Officer • CareSync Directorate</div>
              <div className="mt-1 text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                AUTH-STAMP: CS-{voucher.refundId || '789'}-SETTLED
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
