import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RotateCcw,
  X,
  Search,
  DollarSign,
  User,
  Stethoscope,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';
import { numberToWords } from '../utils/numberToWords';

const REASON_CATEGORIES = [
  { id: 'DOCTOR_UNAVAILABLE', label: 'Consultant Doctor Emergency Leave / Clinic Rescheduled' },
  { id: 'HOSPITAL_WAIVER', label: 'Hospital Facility Surcharge Waiver / Management Concession' },
  { id: 'GATEWAY_DOUBLE_CHARGE', label: 'Payment Gateway Double-Charge / System Duplication' },
  { id: 'DUPLICATE_PAYMENT', label: 'Duplicate Payment Reversal (Multiple Transaction Tokens)' },
  { id: 'PATIENT_EMERGENCY', label: 'Patient Medical Emergency / Inability to Attend Consultation' },
  { id: 'BILLING_DISCREPANCY', label: 'Cashier Overbilling Correction / Clinical Order Adjusted' },
  { id: 'TECHNICAL_OUTAGE', label: 'Hospital Power / Infrastructure / Diagnostic Equipment Outage' },
  { id: 'MANAGEMENT_GOODWILL', label: 'Service Quality Goodwill Refund / Patient Conciliation' },
  { id: 'OTHER', label: 'Other Administrative & Financial Adjustment' }
];

const PAYOUT_METHODS = [
  { id: 'REVERSE_TO_ORIGINAL_PAYMENT', label: 'Reverse to Original Payment Card / Bank (Online Gateway Reversal)' },
  { id: 'CASH_COUNTER', label: 'Direct Cash Disbursal at Hospital Cashier Counter' },
  { id: 'BANK_TRANSFER', label: 'Direct Bank Transfer (SLIPS / CEFT)' },
  { id: 'CREDIT_VOUCHER', label: 'CareSync Digital Patient Wallet Credit Voucher' }
];

export default function CustomRefundGeneratorModal({
  onClose,
  onRefundGenerated,
  currentUser,
  initialTransaction = null
}) {
  const [targetType, setTargetType] = useState(
    initialTransaction?.rawType === 'CUSTOM_BILL' ? 'CUSTOM_BILL' : 'APPOINTMENT'
  );

  const [payments, setPayments] = useState([]);
  const [customBills, setCustomBills] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Transaction State
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Refund Form State
  const [refundScope, setRefundScope] = useState('FULL'); // 'FULL' | 'PARTIAL'
  const [refundAmount, setRefundAmount] = useState('');
  const [reasonCategory, setReasonCategory] = useState('DOCTOR_UNAVAILABLE');
  const [reasonNotes, setReasonNotes] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('REVERSE_TO_ORIGINAL_PAYMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEligibleTransactions();
  }, []);

  const fetchEligibleTransactions = async () => {
    try {
      setLoadingDirectory(true);
      const [payRes, billRes] = await Promise.allSettled([
        axios.get('/api/payments'),
        axios.get('/api/payments/custom-bills')
      ]);

      if (payRes.status === 'fulfilled' && payRes.value.data?.success) {
        setPayments(payRes.value.data.data || []);
      }
      if (billRes.status === 'fulfilled' && billRes.value.data?.success) {
        setCustomBills(billRes.value.data.data || []);
      }

      // If initialTransaction was supplied from table click, bind it
      if (initialTransaction) {
        bindTransaction(initialTransaction);
      }
    } catch (err) {
      console.error('Error fetching transactions for refund:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const bindTransaction = (txn) => {
    setSelectedTxn(txn);
    setErrorMsg('');
    const originalAmt = Number(txn.amount || txn.totalAmount || 0);
    setRefundAmount(originalAmt.toString());
    setRefundScope('FULL');
  };

  // Filtered available transactions for dropdown / list
  const filteredAppointments = payments.filter((p) => {
    const isCompleted = p.paymentStatus === 'COMPLETED';
    const patientName = p.appointment?.patient?.fullName || '';
    const nic = p.appointment?.patient?.nic || '';
    const apptId = String(p.appointment?.appointmentId || p.paymentId || '');
    const q = searchQuery.toLowerCase().trim();
    if (!q) return isCompleted;
    return isCompleted && (
      patientName.toLowerCase().includes(q) ||
      nic.toLowerCase().includes(q) ||
      apptId.includes(q)
    );
  });

  const filteredBills = customBills.filter((b) => {
    const isPaid = b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID';
    const patientName = b.patientName || '';
    const inv = b.invoiceNumber || '';
    const nic = b.patientNic || '';
    const q = searchQuery.toLowerCase().trim();
    if (!q) return isPaid;
    return isPaid && (
      patientName.toLowerCase().includes(q) ||
      inv.toLowerCase().includes(q) ||
      nic.toLowerCase().includes(q)
    );
  });

  const handleSelectPresetPercentage = (pct) => {
    if (!selectedTxn) return;
    const originalAmt = Number(selectedTxn.amount || selectedTxn.totalAmount || 0);
    const calculated = Math.round((originalAmt * pct) / 100);
    setRefundAmount(calculated.toString());
    if (pct === 100) {
      setRefundScope('FULL');
    } else {
      setRefundScope('PARTIAL');
    }
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!selectedTxn) {
      setErrorMsg('Please select a paid transaction to issue a refund.');
      return;
    }

    const originalAmt = Number(selectedTxn.amount || selectedTxn.totalAmount || 0);
    const numRefund = Number(refundAmount);

    if (isNaN(numRefund) || numRefund <= 0) {
      setErrorMsg('Refund amount must be a positive number greater than 0.');
      return;
    }

    if (!reasonNotes.trim()) {
      setErrorMsg('Please provide administrative justification / notes for this refund.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const categoryObj = REASON_CATEGORIES.find((c) => c.id === reasonCategory);
      const categoryLabel = categoryObj ? categoryObj.label : reasonCategory;

      const payload = {
        targetType: targetType,
        appointmentId: targetType === 'APPOINTMENT' ? (selectedTxn.appointment?.appointmentId || selectedTxn.paymentId) : null,
        paymentId: targetType === 'APPOINTMENT' ? selectedTxn.paymentId : null,
        billId: targetType === 'CUSTOM_BILL' ? selectedTxn.billId : null,
        invoiceNumber: targetType === 'CUSTOM_BILL' ? selectedTxn.invoiceNumber : null,
        refundAmount: numRefund,
        reasonCategory: categoryLabel,
        reason: reasonNotes.trim(),
        payoutMethod: payoutMethod,
        financeOfficerId: currentUser?.userId || 3, // Ruwan Selvaratnam
        financeOfficerName: currentUser?.fullName || 'Ruwan Selvaratnam (Finance Directorate)',
        remarks: `Custom refund processed via Finance Desk. Scope: ${refundScope} (${numRefund} of ${originalAmt}).`
      };

      const res = await axios.post('/api/refunds/custom', payload);

      if (res.data?.success) {
        // Construct printable voucher data
        const voucherData = {
          refundId: res.data.data?.refundId || Math.floor(1000 + Math.random() * 9000),
          voucherNumber: `VCHR-REF-2026-${res.data.data?.refundId || Math.floor(1000 + Math.random() * 9000)}`,
          refundDate: new Date().toISOString(),
          patientName: targetType === 'APPOINTMENT' ? selectedTxn.appointment?.patient?.fullName : selectedTxn.patientName,
          patientId: targetType === 'APPOINTMENT' ? formatPatientId(selectedTxn.appointment?.patient) : selectedTxn.patientId,
          patientNic: targetType === 'APPOINTMENT' ? selectedTxn.appointment?.patient?.nic : selectedTxn.patientNic,
          patientContact: targetType === 'APPOINTMENT' ? selectedTxn.appointment?.patient?.contactNumber : selectedTxn.patientContact,
          doctorName: targetType === 'APPOINTMENT' ? selectedTxn.appointment?.doctor?.fullName : selectedTxn.doctorName,
          doctorSpecialization: targetType === 'APPOINTMENT' ? selectedTxn.appointment?.doctor?.specialization : selectedTxn.doctorSpecialization,
          department: targetType === 'APPOINTMENT' ? 'Specialist Outpatient Clinic' : (selectedTxn.department || 'Outpatient Department'),
          originalAmount: originalAmt,
          refundAmount: numRefund,
          payoutMethod: payoutMethod,
          reason: `[${categoryLabel}] ${reasonNotes.trim()}`,
          financeOfficerName: currentUser?.fullName || 'Ruwan Selvaratnam',
          reference: selectedTxn.transactionReference || selectedTxn.invoiceNumber || `TXN-${Date.now()}`
        };

        if (onRefundGenerated) {
          onRefundGenerated(voucherData);
        }
        onClose();
      }
    } catch (err) {
      console.error('Error issuing custom refund:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to process custom refund. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOriginalAmt = selectedTxn ? Number(selectedTxn.amount || selectedTxn.totalAmount || 0) : 0;
  const numRefundAmt = Number(refundAmount) || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-red-800 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-rose-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-rose-300 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Issue Custom Patient Refund & Credit Voucher</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-[10px] font-bold border border-rose-400/30">
                  Finance Authority
                </span>
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5">
                Authorizes instant financial settlement, cancels consultation/bill status, and adjusts ledger revenue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/20 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form noValidate onSubmit={handleSubmitRefund} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">

          {/* Target Type Selector */}
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200/90 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetType('APPOINTMENT');
                setSelectedTxn(null);
                setRefundAmount('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${targetType === 'APPOINTMENT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70'
                }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Channeling Appointment Payment</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetType('CUSTOM_BILL');
                setSelectedTxn(null);
                setRefundAmount('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${targetType === 'CUSTOM_BILL'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Custom Medical Bill / Invoice</span>
            </button>
          </div>

          {/* Step 1: Select Eligible Paid Transaction */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-rose-600" />
                Select Paid Transaction to Refund
              </label>
              <span className="text-[11px] text-slate-400">
                {targetType === 'APPOINTMENT' ? `${filteredAppointments.length} Settled Appts Available` : `${filteredBills.length} Settled Bills Available`}
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  targetType === 'APPOINTMENT'
                    ? "Search by patient name, NIC, or Appt # (e.g., 'Anjali Perera' or '951234567V')..."
                    : "Search by patient name, NIC, or Invoice # (e.g., 'INV-2026-4421')..."
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
              />
            </div>

            {/* Quick Picker Dropdown */}
            <select
              value={selectedTxn ? (targetType === 'APPOINTMENT' ? selectedTxn.paymentId : selectedTxn.billId) : ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!val) {
                  setSelectedTxn(null);
                  return;
                }
                if (targetType === 'APPOINTMENT') {
                  const found = payments.find((p) => p.paymentId === val);
                  if (found) bindTransaction(found);
                } else {
                  const found = customBills.find((b) => b.billId === val);
                  if (found) bindTransaction(found);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
            >
              <option value="">-- Choose Transaction from Eligible Paid Records --</option>
              {targetType === 'APPOINTMENT'
                ? filteredAppointments.map((p) => (
                  <option key={p.paymentId} value={p.paymentId}>
                    Appt #{p.appointment?.appointmentId} • {p.appointment?.patient?.fullName} ({p.appointment?.doctor?.fullName}) • Paid: LKR {Number(p.amount).toLocaleString()} • {p.paymentMethod}
                  </option>
                ))
                : filteredBills.map((b) => (
                  <option key={b.billId} value={b.billId}>
                    {b.invoiceNumber} • {b.patientName} ({b.billCategory}) • Paid: LKR {Number(b.totalAmount).toLocaleString()} • {b.paymentMethod}
                  </option>
                ))}
            </select>
          </div>

          {/* Selected Transaction Summary Card */}
          {selectedTxn && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50/50 border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200/80">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Target Transaction Selected
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  Verified Settlement
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Patient Name:</span>
                  <span className="font-bold text-slate-900">
                    {targetType === 'APPOINTMENT' ? selectedTxn.appointment?.patient?.fullName : selectedTxn.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Patient ID / NIC:</span>
                  <span className="font-mono text-slate-700">
                    {targetType === 'APPOINTMENT' ? (selectedTxn.appointment?.patient?.nic || 'PAT0001') : (selectedTxn.patientNic || selectedTxn.patientId)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Doctor / Service:</span>
                  <span className="font-bold text-slate-900">
                    {targetType === 'APPOINTMENT' ? selectedTxn.appointment?.doctor?.fullName : (selectedTxn.doctorName || selectedTxn.billCategory)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block uppercase">Original Amount:</span>
                  <span className="font-black text-slate-950 font-mono text-sm">
                    LKR {selectedOriginalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Refund Amount & Scope Configuration */}
          {selectedTxn && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[11px]">
                  Refund Amount & Scope Configuration
                </span>
                <span className="text-[11px] text-slate-400">
                  Maximum Refund: <strong>LKR {selectedOriginalAmt.toLocaleString()}</strong>
                </span>
              </div>

              {/* Scope Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPresetPercentage(100)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col cursor-pointer ${refundScope === 'FULL'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span className="font-extrabold text-xs">Full Refund (100%)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Refund entire consultation fee of LKR {selectedOriginalAmt.toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRefundScope('PARTIAL')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col cursor-pointer ${refundScope === 'PARTIAL'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span className="font-extrabold text-xs">Partial Concession / Custom Amount</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Specify exact amount to disburse to the patient
                  </span>
                </button>
              </div>

              {/* Amount Input with quick percentage buttons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700 text-xs">
                    Disbursal Amount (LKR):
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleSelectPresetPercentage(pct)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    LKR
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={refundAmount}
                    onChange={(e) => {
                      setRefundAmount(e.target.value);
                      const val = Number(e.target.value);
                      if (selectedOriginalAmt && val === selectedOriginalAmt) {
                        setRefundScope('FULL');
                      } else {
                        setRefundScope('PARTIAL');
                      }
                    }}
                    placeholder="Enter any refund amount (e.g. 3500)"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-rose-700 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                  />
                </div>

                {numRefundAmt > 0 && (
                  <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 italic">
                    Amount in words: <strong className="text-slate-900 not-italic">{numberToWords(numRefundAmt)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Reason & Payout Channel */}
          {selectedTxn && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="font-extrabold text-slate-900 uppercase tracking-wide text-[11px] pb-2 border-b border-slate-100">
                Reason, Audit Justification & Payout Channel
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reason Category Preset */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">
                    Refund Reason Category:
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 transition"
                  >
                    {REASON_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Payout Channel */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">
                    Payout Disbursal Method:
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 transition"
                  >
                    {PAYOUT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Justification Textarea */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">
                  Administrative Justification / Reason Notes: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  placeholder="Detail the circumstances, clinical justification, or dispute resolution rationale for auditing and financial compliance..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                ></textarea>
              </div>
            </div>
          )}

          {/* System Automatic Effects Notice Banner */}
          {selectedTxn && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Automated System Cascade on Authorization</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-amber-900/90 list-disc list-inside">
                <li>Payment status switches to <strong>REFUNDED</strong></li>
                <li>Appointment status set to <strong>CANCELLED</strong></li>
                <li>Doctor's live queue releases patient token</li>
                <li>Timeslot is freed back to <strong>AVAILABLE</strong></li>
                <li>Hospital ledger increases total refunds by <strong>LKR {numRefundAmt.toLocaleString()}</strong></li>
                <li>Patient portal displays certified refund claim</li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 shrink-0">
            <div className="text-slate-500 text-[11px]">
              Authorizing Officer: <strong className="text-slate-900">{currentUser?.fullName || 'Ruwan Selvaratnam (Finance Officer)'}</strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTxn || isSubmitting || numRefundAmt <= 0}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs transition shadow-md shadow-rose-950/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>
                  {isSubmitting ? 'Processing Payout...' : `Authorize & Disburse Refund (LKR ${numRefundAmt.toLocaleString()})`}
                </span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
