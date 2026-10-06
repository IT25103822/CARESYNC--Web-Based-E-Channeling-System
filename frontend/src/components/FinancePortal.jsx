import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  DollarSign, 
  Download, 
  CheckCircle, 
  XCircle, 
  FileText, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  RotateCcw,
  Plus,
  Receipt,
  Printer,
  ShieldCheck,
  Stethoscope,
  Calendar
} from 'lucide-react';
import { formatDoctorId, formatPatientId } from '../utils/idUtils';
import HospitalInvoiceModal from './HospitalInvoiceModal';
import CustomBillGeneratorModal from './CustomBillGeneratorModal';
import CustomRefundGeneratorModal from './CustomRefundGeneratorModal';
import RefundVoucherModal from './RefundVoucherModal';

export default function FinancePortal({ activeSection, currentUser }) {
  const [payments, setPayments] = useState([]);
  const [customBills, setCustomBills] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [report, setReport] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [showCustomBillModal, setShowCustomBillModal] = useState(false);
  const [showCustomRefundModal, setShowCustomRefundModal] = useState(false);
  const [selectedRefundTarget, setSelectedRefundTarget] = useState(null);
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reconciliation Period & Method filters (Member 6 - IT25103825)
  const [reconPeriodFilter, setReconPeriodFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'SELECTED_DATE' | 'CUSTOM_RANGE'
  const [reconSelectedDate, setReconSelectedDate] = useState('');
  const [reconCustomStart, setReconCustomStart] = useState('');
  const [reconCustomEnd, setReconCustomEnd] = useState('');
  const [reconMethodFilter, setReconMethodFilter] = useState('ALL');

  // Transaction Search & Filter states (Member 6 - IT25103825)
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'APPOINTMENTS' | 'CUSTOM_BILLS'
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'SELECTED_DATE' | 'CUSTOM_RANGE'
  const [txSelectedDate, setTxSelectedDate] = useState('');
  const [txCustomStart, setTxCustomStart] = useState('');
  const [txCustomEnd, setTxCustomEnd] = useState('');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setRefreshing(true);
      const [payRes, refRes, repRes, billRes] = await Promise.allSettled([
        axios.get('/api/payments'),
        axios.get('/api/refunds'),
        axios.get('/api/payments/reconciliation'),
        axios.get('/api/payments/custom-bills')
      ]);

      if (payRes.status === 'fulfilled' && payRes.value.data?.success) {
        setPayments(payRes.value.data.data || []);
      }
      if (refRes.status === 'fulfilled' && refRes.value.data?.success) {
        setRefunds(refRes.value.data.data || []);
      }
      if (repRes.status === 'fulfilled' && repRes.value.data?.success) {
        setReport(repRes.value.data.data || null);
      }

      // Merge backend custom bills with local storage backup
      let bills = [];
      if (billRes.status === 'fulfilled' && billRes.value.data?.success) {
        bills = billRes.value.data.data || [];
      }
      try {
        const localBills = JSON.parse(localStorage.getItem('caresync_custom_bills') || '[]');
        const existingInv = new Set(bills.map(b => b.invoiceNumber));
        localBills.forEach(lb => {
          if (!existingInv.has(lb.invoiceNumber)) {
            bills.push(lb);
          }
        });
      } catch (e) {
        console.error('Error loading local custom bills', e);
      }
      setCustomBills(bills);
    } catch (err) {
      console.error('Error fetching finance data', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBillGenerated = (newBill) => {
    setCustomBills(prev => [newBill, ...prev]);
    setActiveInvoice(newBill);
    fetchFinanceData();
  };

  const handleRefundDecision = async (refundId, status) => {
    try {
      await axios.put(`/api/refunds/${refundId}/process`, {
        financeOfficerId: currentUser?.userId || 3, // Ruwan Selvaratnam
        status: status
      });
      alert(`Refund request marked as ${status}. Financial ledger updated.`);
      fetchFinanceData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating refund');
    }
  };

  // View Receipt / Invoice for Appointment Payment
  const handleViewAppointmentReceipt = async (p) => {
    try {
      const res = await axios.get(`/api/payments/${p.paymentId}/receipt`);
      if (res.data?.success && res.data.data) {
        setActiveInvoice(res.data.data);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch dedicated receipt row, formatting from payment record:', err);
    }

    // High-fidelity fallback from payment object
    setActiveInvoice({
      receiptNumber: `REC-2026-${p.paymentId || '0001'}`,
      payment: p,
      appointment: p.appointment,
      patient: p.appointment?.patient,
      doctor: p.appointment?.doctor,
      issueDate: p.paymentDate,
      receiptDetails: `CareSync Official Payment Receipt for Appointment #${p.appointment?.appointmentId} with ${p.appointment?.doctor?.fullName || 'Specialist'}. Amount Paid: LKR ${p.amount}`
    });
  };

  // Date & Period Filter Matching Helper (Member 6 - IT25103825)
  const isDateInPeriod = (dateVal, period, selectedDate, customStart, customEnd) => {
    if (!period || period === 'ALL') return true;
    if (!dateVal) return false;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;

    const now = new Date();

    const toLocalDateString = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const itemDateStr = toLocalDateString(d);
    const todayStr = toLocalDateString(now);

    if (period === 'TODAY' || period === 'DAILY') {
      return itemDateStr === todayStr;
    }

    if (period === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return itemDateStr === toLocalDateString(yesterday);
    }

    if (period === 'WEEKLY') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const itemStartOfDay = new Date(d);
      itemStartOfDay.setHours(0, 0, 0, 0);
      return itemStartOfDay >= sevenDaysAgo && itemStartOfDay <= now;
    }

    if (period === 'MONTHLY') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    if (period === 'YEARLY') {
      return d.getFullYear() === now.getFullYear();
    }

    if (period === 'SELECTED_DATE') {
      if (!selectedDate) return true;
      return itemDateStr === selectedDate;
    }

    if (period === 'CUSTOM_RANGE') {
      if (customStart && itemDateStr < customStart) return false;
      if (customEnd && itemDateStr > customEnd) return false;
      return true;
    }

    return true;
  };

  const matchesPaymentMethod = (itemMethod, targetFilter) => {
    if (!targetFilter || targetFilter === 'ALL') return true;
    if (!itemMethod) return false;
    const m = String(itemMethod).toUpperCase();
    const t = String(targetFilter).toUpperCase();

    if (t === 'CASH') {
      return m.includes('CASH');
    }
    if (t === 'CARD') {
      return m.includes('CARD');
    }
    if (t === 'ONLINE_BANKING') {
      return m.includes('ONLINE') || m.includes('BANK') || m.includes('TRANSFER');
    }
    if (t === 'INSURANCE') {
      return m.includes('INSUR');
    }
    return m === t;
  };

  const exportTransactionsToCsv = (txList) => {
    if (!txList || txList.length === 0) {
      alert('No transactions to export for the selected filter criteria.');
      return;
    }

    const headers = ['Invoice / Txn Reference', 'Type', 'Category', 'Date', 'Patient Name', 'Patient ID', 'Doctor / Specialization', 'Amount (LKR)', 'Payment Method', 'Status'];
    const rows = txList.map(item => [
      `"${item.reference || ''}"`,
      `"${item.rawType || ''}"`,
      `"${item.category || ''}"`,
      `"${item.date ? new Date(item.date).toLocaleDateString() : ''}"`,
      `"${(item.patientName || '').replace(/"/g, '""')}"`,
      `"${item.patientId || ''}"`,
      `"${(item.doctorName || '').replace(/"/g, '""')}"`,
      Number(item.amount || 0).toFixed(2),
      `"${item.method || ''}"`,
      `"${item.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CareSync_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reconciled Metrics Calculation (including Custom Bills, Dynamic Periods & Methods)
  const filteredReconPayments = payments.filter(p => {
    const pDate = p.paymentDate || p.createdAt;
    const inPeriod = isDateInPeriod(pDate, reconPeriodFilter, reconSelectedDate, reconCustomStart, reconCustomEnd);
    const matchMethod = matchesPaymentMethod(p.paymentMethod, reconMethodFilter);
    return inPeriod && matchMethod;
  });

  const filteredReconBills = customBills.filter(b => {
    const bDate = b.createdAt || b.issueDate;
    const inPeriod = isDateInPeriod(bDate, reconPeriodFilter, reconSelectedDate, reconCustomStart, reconCustomEnd);
    const matchMethod = matchesPaymentMethod(b.paymentMethod, reconMethodFilter);
    return inPeriod && matchMethod;
  });

  const filteredReconRefunds = refunds.filter(r => {
    const rDate = r.approvedDate || r.refundDate || r.requestedDate || r.createdAt;
    const inPeriod = isDateInPeriod(rDate, reconPeriodFilter, reconSelectedDate, reconCustomStart, reconCustomEnd);
    const refMethod = r.payment?.paymentMethod || r.paymentMethod || 'CARD';
    const matchMethod = matchesPaymentMethod(refMethod, reconMethodFilter);
    return inPeriod && matchMethod;
  });

  const reconCompletedPaymentsTotal = filteredReconPayments
    .filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const reconCompletedBillsTotal = filteredReconBills
    .filter(b => b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const isDefaultScope = reconPeriodFilter === 'ALL' && reconMethodFilter === 'ALL' && !reconSelectedDate && !reconCustomStart && !reconCustomEnd;

  const reconGrossRevenue = (isDefaultScope && (report?.totalRevenue || 0) > 0)
    ? Number(report.totalRevenue) + reconCompletedBillsTotal
    : reconCompletedPaymentsTotal + reconCompletedBillsTotal;

  const reconTotalRefundAmount = (isDefaultScope && (report?.totalRefundAmount || 0) > 0)
    ? Number(report.totalRefundAmount)
    : filteredReconRefunds.filter(r => r.refundStatus === 'APPROVED').reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);

  const reconNetSettledBalance = reconGrossRevenue - reconTotalRefundAmount;
  const reconTotalTransactions = filteredReconPayments.length + filteredReconBills.length;
  const reconSettledApptsCount = filteredReconPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID').length;
  const reconCustomBillsCount = filteredReconBills.length;
  const reconPendingRefundsCount = filteredReconRefunds.filter(r => r.refundStatus === 'REQUESTED').length;

  return (
    <div className="space-y-6">
      {/* Header with Custom Bill & Refund Generation Action */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black">Financial Governance & Reconciliation</h1>
            <span className="bg-emerald-400/20 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-300/30">
              Finance Officer: {currentUser?.fullName || 'Ruwan Selvaratnam'}
            </span>
          </div>
          <p className="text-emerald-100 text-sm mt-1">
            Payment Gateway Verifications, Official Medical Tax Invoices, Custom Billing & Daily Ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto shrink-0">
          <button
            onClick={() => fetchFinanceData()}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            title="Refresh Financial Ledger & Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => {
              setSelectedRefundTarget(null);
              setShowCustomRefundModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer shadow-rose-950/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Issue Custom Refund</span>
          </button>
          <button
            onClick={() => setShowCustomBillModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Custom Bill</span>
          </button>
        </div>
      </div>

      {/* 1. DAILY RECONCILIATION & KPIS (activeSection === 'reconciliation') */}
      {(activeSection === 'reconciliation' || !activeSection) && (
        <div className="space-y-6">
          {/* Reconciliation Filter & Period Selector Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Reconciliation Filter & Timeframe Scope</span>
                    {(reconPeriodFilter !== 'ALL' || reconMethodFilter !== 'ALL' || reconSelectedDate || reconCustomStart || reconCustomEnd) && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Active Filter Applied
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">Filter hospital financial records by timeframe and payment method channel</p>
                </div>
              </div>

              {/* Reset button if filtered */}
              {(reconPeriodFilter !== 'ALL' || reconMethodFilter !== 'ALL' || reconSelectedDate || reconCustomStart || reconCustomEnd) && (
                <button
                  onClick={() => {
                    setReconPeriodFilter('ALL');
                    setReconSelectedDate('');
                    setReconCustomStart('');
                    setReconCustomEnd('');
                    setReconMethodFilter('ALL');
                  }}
                  className="self-start lg:self-auto px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Scope</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              {/* Period Buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Daily (Today)' },
                  { id: 'WEEKLY', label: 'Weekly (Last 7d)' },
                  { id: 'MONTHLY', label: 'Monthly' },
                  { id: 'YEARLY', label: 'Yearly' },
                  { id: 'SELECTED_DATE', label: 'Selected Date' },
                  { id: 'CUSTOM_RANGE', label: 'Custom Range' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setReconPeriodFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      reconPeriodFilter === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500">Method:</span>
                <select
                  value={reconMethodFilter}
                  onChange={(e) => setReconMethodFilter(e.target.value)}
                  className="text-xs text-slate-800 font-bold bg-transparent outline-none cursor-pointer"
                >
                  <option value="ALL">All Payment Channels</option>
                  <option value="CASH">Cash Counter (Direct)</option>
                  <option value="CARD">Credit / Debit Cards</option>
                  <option value="ONLINE_BANKING">Online Banking & Transfers</option>
                  <option value="INSURANCE">Insurance Claims</option>
                </select>
              </div>

              {/* Date Picker if SELECTED_DATE */}
              {reconPeriodFilter === 'SELECTED_DATE' && (
                <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-bold text-slate-600">Date:</span>
                  <input
                    type="date"
                    value={reconSelectedDate}
                    onChange={(e) => setReconSelectedDate(e.target.value)}
                    className="text-xs text-slate-800 font-bold outline-none cursor-pointer bg-transparent"
                  />
                </div>
              )}

              {/* Date Pickers if CUSTOM_RANGE */}
              {reconPeriodFilter === 'CUSTOM_RANGE' && (
                <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-500">From:</span>
                    <input
                      type="date"
                      value={reconCustomStart}
                      onChange={(e) => setReconCustomStart(e.target.value)}
                      className="text-xs text-slate-800 font-bold outline-none cursor-pointer bg-transparent"
                    />
                  </div>
                  <span className="text-slate-300 font-bold">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-500">To:</span>
                    <input
                      type="date"
                      value={reconCustomEnd}
                      onChange={(e) => setReconCustomEnd(e.target.value)}
                      className="text-xs text-slate-800 font-bold outline-none cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KPI Cards (Reconciliation Summary) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Total Transactions</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{reconTotalTransactions}</div>
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> {filteredReconPayments.length} appts + {filteredReconBills.length} custom bills
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                LKR {reconGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Verified hospital gross income in scope</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Refunds Processed</span>
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600 mt-2">
                LKR {reconTotalRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{filteredReconRefunds.filter(r => r.refundStatus === 'APPROVED').length} approved refunds in scope</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
                <span>Net Settled Balance</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-2">
                LKR {reconNetSettledBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Audited for bank settlement</div>
            </div>
          </div>

          {/* Reconciliation Audit Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Audit Trail & Daily Settlement Summary
              </h2>
              <button
                onClick={() => setShowCustomBillModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Issue Custom Tax Invoice</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Settled Appointments</span>
                <p className="text-2xl font-black text-slate-900">{reconSettledApptsCount}</p>
                <p className="text-[11px] text-slate-400">Channeling sessions in selected scope</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Custom Medical Bills</span>
                <p className="text-2xl font-black text-teal-700">{reconCustomBillsCount}</p>
                <p className="text-[11px] text-slate-400">OPD, pharmacy & diagnostics bills</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Pending Refund Payouts</span>
                <p className="text-2xl font-black text-amber-600">{reconPendingRefundsCount}</p>
                <p className="text-[11px] text-slate-400">Awaiting finance officer approval</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Payment Gateway Rail</span>
                <p className="text-2xl font-black text-emerald-600">Active (100%)</p>
                <p className="text-[11px] text-slate-400">SSL encrypted financial rail</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRANSACTIONS & OFFICIAL TAX INVOICES (activeSection === 'transactions') */}
      {activeSection === 'transactions' && (() => {
        // Construct unified transactions list
        const appointmentRows = payments.map(p => ({
          uniqueId: `PAY-${p.paymentId}`,
          rawType: 'APPOINTMENT',
          typeLabel: `Channeling Appt #${p.appointment?.appointmentId || p.paymentId}`,
          category: 'Specialist Channeling',
          reference: p.transactionReference,
          date: p.paymentDate,
          patientName: p.appointment?.patient?.fullName || 'N/A',
          patientId: p.appointment?.patient ? formatPatientId(p.appointment.patient) : 'PAT0000',
          contact: p.appointment?.patient?.contactNumber || '',
          doctorName: p.appointment?.doctor?.fullName || 'Consultant Specialist',
          amount: Number(p.amount) || 0,
          method: p.paymentMethod || 'CREDIT_CARD',
          status: p.paymentStatus || 'COMPLETED',
          rawObject: p
        }));

        const customBillRows = customBills.map(b => ({
          uniqueId: `BILL-${b.billId || b.invoiceNumber}`,
          rawType: 'CUSTOM_BILL',
          typeLabel: 'Custom Tax Invoice',
          category: b.billCategory || 'OPD Service',
          reference: b.invoiceNumber,
          date: b.createdAt,
          patientName: b.patientName,
          patientId: b.patientId || 'WALKIN',
          contact: b.patientContact || '',
          doctorName: b.doctorName || 'Consultant Specialist',
          amount: Number(b.totalAmount) || 0,
          method: b.paymentMethod || 'CASH',
          status: b.paymentStatus || 'COMPLETED',
          rawObject: b
        }));

        const allTransactions = [...customBillRows, ...appointmentRows];

        const filteredList = allTransactions.filter((item) => {
          const q = searchQuery.toLowerCase().trim();
          const matchesSearch = !q ||
            item.reference?.toLowerCase().includes(q) ||
            item.patientName?.toLowerCase().includes(q) ||
            item.patientId?.toLowerCase().includes(q) ||
            item.doctorName?.toLowerCase().includes(q) ||
            item.typeLabel?.toLowerCase().includes(q);

          const matchesMethod = matchesPaymentMethod(item.method, methodFilter);
          const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
          const matchesType = typeFilter === 'ALL' || item.rawType === typeFilter;
          const matchesDate = isDateInPeriod(item.date, dateFilter, txSelectedDate, txCustomStart, txCustomEnd);

          return matchesSearch && matchesMethod && matchesStatus && matchesType && matchesDate;
        });

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  All Payment Transactions & Official Tax Invoices ({allTransactions.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit, filter, and print verified hospital tax invoices and custom OPD receipts (Member 6 - IT25103825)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => exportTransactionsToCsv(filteredList)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Export Filtered Transactions to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => fetchFinanceData()}
                  disabled={refreshing}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  title="Refresh Transactions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={() => setShowCustomBillModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Bill</span>
                </button>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                  Verified Records
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Txn Ref, Invoice #, Patient Name, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Date Filter (Member 6 Requirement) */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-xs text-slate-700 outline-none bg-transparent cursor-pointer font-bold"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="TODAY">Today (Daily)</option>
                    <option value="YESTERDAY">Yesterday</option>
                    <option value="WEEKLY">Last 7 Days (Weekly)</option>
                    <option value="MONTHLY">This Month (Monthly)</option>
                    <option value="YEARLY">This Year (Yearly)</option>
                    <option value="SELECTED_DATE">Selected Date</option>
                    <option value="CUSTOM_RANGE">Custom Date Range</option>
                  </select>
                </div>

                {/* Specific date input */}
                {dateFilter === 'SELECTED_DATE' && (
                  <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-300 rounded-xl px-2.5 py-1.5 shadow-sm">
                    <input
                      type="date"
                      value={txSelectedDate}
                      onChange={(e) => setTxSelectedDate(e.target.value)}
                      className="text-xs text-slate-800 font-bold outline-none cursor-pointer bg-transparent"
                    />
                  </div>
                )}

                {/* Custom date range inputs */}
                {dateFilter === 'CUSTOM_RANGE' && (
                  <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-300 rounded-xl px-2.5 py-1.5 shadow-sm">
                    <input
                      type="date"
                      value={txCustomStart}
                      onChange={(e) => setTxCustomStart(e.target.value)}
                      className="text-xs text-slate-800 font-bold outline-none cursor-pointer bg-transparent"
                      title="Start Date"
                    />
                    <span className="text-slate-300 text-xs font-bold">to</span>
                    <input
                      type="date"
                      value={txCustomEnd}
                      onChange={(e) => setTxCustomEnd(e.target.value)}
                      className="text-xs text-slate-800 font-bold outline-none cursor-pointer bg-transparent"
                      title="End Date"
                    />
                  </div>
                )}

                {/* Type Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-xs text-slate-700 outline-none bg-transparent cursor-pointer font-bold"
                  >
                    <option value="ALL">All Types</option>
                    <option value="APPOINTMENTS">Channeling Appts</option>
                    <option value="CUSTOM_BILLS">Custom Medical Bills</option>
                  </select>
                </div>

                {/* Method Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="text-xs text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
                  >
                    <option value="ALL">All Methods</option>
                    <option value="CASH">Cash Counter</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="ONLINE_BANKING">Online Banking</option>
                    <option value="INSURANCE">Insurance Claim</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">COMPLETED / PAID</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                {(searchQuery || methodFilter !== 'ALL' || statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateFilter !== 'ALL' || txSelectedDate || txCustomStart || txCustomEnd) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setMethodFilter('ALL');
                      setStatusFilter('ALL');
                      setTypeFilter('ALL');
                      setDateFilter('ALL');
                      setTxSelectedDate('');
                      setTxCustomStart('');
                      setTxCustomEnd('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition cursor-pointer"
                    title="Reset Filters"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between items-center px-1">
              <span>Showing <strong>{filteredList.length}</strong> of {allTransactions.length} records</span>
              <span className="text-[10px] text-slate-400">Click "View Tax Invoice" for official hospital printable document</span>
            </div>

            {filteredList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-1">
                <p className="text-xs font-bold text-slate-700">No transactions match your search/filter criteria</p>
                <p className="text-[11px]">Try adjusting your search query or reset the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Invoice / Txn Ref</th>
                      <th className="py-3 px-3">Classification</th>
                      <th className="py-3 px-3">Patient</th>
                      <th className="py-3 px-3">Physician / Clinic</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Official Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((item) => (
                      <tr key={item.uniqueId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-slate-900">{item.reference}</div>
                          <div className="text-[10px] text-slate-400">{item.typeLabel}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.date ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.rawType === 'CUSTOM_BILL'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {item.rawType === 'CUSTOM_BILL' ? 'CUSTOM INVOICE' : 'CHANNELING'}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.category}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.patientName}</div>
                          <div className="text-[10px] text-slate-500">
                            <span className="font-mono text-emerald-700 font-semibold">{item.patientId}</span>
                            {item.contact ? ` • ${item.contact}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-semibold text-slate-800">{item.doctorName}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          LKR {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                            {item.method.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'COMPLETED' || item.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'REFUNDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(item.status === 'COMPLETED' || item.status === 'PAID') && (
                              <button
                                onClick={() => {
                                  setSelectedRefundTarget(item.rawObject);
                                  setShowCustomRefundModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Issue direct patient refund for this transaction"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                <span>Refund</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (item.rawType === 'CUSTOM_BILL') {
                                  setActiveInvoice(item.rawObject);
                                } else {
                                  handleViewAppointmentReceipt(item.rawObject);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Tax Invoice</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. REFUND APPROVAL REQUESTS (activeSection === 'refunds') */}
      {activeSection === 'refunds' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-rose-600" />
              Refund Claims & Disbursals ({refunds.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedRefundTarget(null);
                  setShowCustomRefundModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Custom Refund</span>
              </button>
              <button
                onClick={() => fetchFinanceData()}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Refresh Refunds"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-600' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <span className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-full border border-rose-200">
                Cancellation Claims
              </span>
            </div>
          </div>

          {refunds.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No pending cancellation refund requests found. All accounts balanced!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {refunds.map((ref) => (
                <div key={ref.refundId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-black text-slate-900 text-sm">Refund Claim #{ref.refundId}</span>
                      <span className="text-slate-500 ml-1.5 font-medium">(App #{ref.appointment?.appointmentId})</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      ref.refundStatus === 'REQUESTED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      ref.refundStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {ref.refundStatus === 'REQUESTED' ? '⏳ Pending Review' : ref.refundStatus === 'APPROVED' ? '✓ Approved' : '✕ Rejected'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Patient:</span>
                      <span className="font-bold text-slate-800">
                        {ref.appointment?.patient?.fullName || 'Patient'}{' '}
                        {ref.appointment?.patient && (
                          <span className="font-mono text-emerald-700 font-semibold text-[10px]">
                            ({formatPatientId(ref.appointment.patient)})
                          </span>
                        )}{' '}
                        {ref.appointment?.patient?.contactNumber ? `(${ref.appointment.patient.contactNumber})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Doctor:</span>
                      <span className="font-bold text-slate-800">
                        {ref.appointment?.doctor?.fullName}{' '}
                        {ref.appointment?.doctor && (
                          <span className="font-mono text-teal-700 font-semibold text-[10px]">
                            ({formatDoctorId(ref.appointment.doctor)})
                          </span>
                        )}{' '}
                        ({ref.appointment?.doctor?.specialization})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Session:</span>
                      <span className="font-semibold text-slate-700">{ref.appointment?.appointmentDate} at {ref.appointment?.startTime}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-slate-800 pt-0.5">
                    <span className="text-slate-600">Claim Amount:</span>
                    <span className="text-rose-700 font-black text-sm">LKR {ref.refundAmount.toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    "{ref.reason}"
                  </p>

                  {ref.refundStatus === 'REQUESTED' ? (
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleRefundDecision(ref.refundId, 'APPROVED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        ✓ Approve & Payout
                      </button>
                      <button
                        onClick={() => handleRefundDecision(ref.refundId, 'REJECTED')}
                        className="flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold py-2 rounded-xl text-xs border border-rose-200 transition cursor-pointer"
                      >
                        ✕ Reject Claim
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {ref.refundStatus === 'APPROVED' ? '✓ Disbursed & Settled' : '✕ Rejected by Finance'}
                      </span>
                      {ref.refundStatus === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveVoucher({
                              refundId: ref.refundId,
                              voucherNumber: `VCHR-REF-2026-${ref.refundId}`,
                              refundDate: ref.refundDate,
                              patientName: ref.appointment?.patient?.fullName,
                              patientId: ref.appointment?.patient ? formatPatientId(ref.appointment.patient) : 'PAT0001',
                              patientNic: ref.appointment?.patient?.nic,
                              patientContact: ref.appointment?.patient?.contactNumber,
                              doctorName: ref.appointment?.doctor?.fullName,
                              doctorSpecialization: ref.appointment?.doctor?.specialization,
                              originalAmount: ref.payment?.amount || ref.refundAmount,
                              refundAmount: ref.refundAmount,
                              payoutMethod: 'REVERSE_TO_ORIGINAL_PAYMENT',
                              reason: ref.reason,
                              financeOfficerName: currentUser?.fullName || 'Ruwan Selvaratnam',
                              reference: ref.payment?.transactionReference || `TXN-REF-${ref.appointment?.appointmentId}`
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Refund Voucher</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOSPITAL TAX INVOICE & MEDICAL RECEIPT MODAL */}
      {activeInvoice && (
        <HospitalInvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
          currentUser={currentUser}
        />
      )}

      {/* CUSTOM BILL GENERATOR MODAL */}
      {showCustomBillModal && (
        <CustomBillGeneratorModal
          onClose={() => setShowCustomBillModal(false)}
          onBillGenerated={handleBillGenerated}
          currentUser={currentUser}
        />
      )}

      {/* CUSTOM REFUND GENERATOR MODAL */}
      {showCustomRefundModal && (
        <CustomRefundGeneratorModal
          onClose={() => {
            setShowCustomRefundModal(false);
            setSelectedRefundTarget(null);
          }}
          onRefundGenerated={(voucherData) => {
            fetchFinanceData();
            if (voucherData) {
              setActiveVoucher(voucherData);
            }
          }}
          currentUser={currentUser}
          initialTransaction={selectedRefundTarget}
        />
      )}

      {/* OFFICIAL REFUND CREDIT VOUCHER MODAL */}
      {activeVoucher && (
        <RefundVoucherModal
          voucher={activeVoucher}
          onClose={() => setActiveVoucher(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
