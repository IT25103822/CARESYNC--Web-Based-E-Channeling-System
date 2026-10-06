import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  X, 
  FileText, 
  DollarSign, 
  User, 
  Stethoscope, 
  Building2, 
  CheckCircle, 
  CreditCard, 
  ShieldCheck, 
  Sparkles,
  Search,
  Tag
} from 'lucide-react';
import { formatPatientId, formatDoctorId } from '../utils/idUtils';
import { numberToWords } from '../utils/numberToWords';

const PRESET_ITEMS = [
  { description: 'Specialist Physician Consultation Review', category: 'Consultation', unitPrice: 3500 },
  { description: 'Hospital Facility & Clinical Room Surcharge', category: 'Facility', unitPrice: 750 },
  { description: 'Nursing Station Care & Vitals Observation', category: 'Nursing', unitPrice: 500 },
  { description: 'Laboratory: Full Blood Count (FBC) & Blood Sugar', category: 'Lab', unitPrice: 1800 },
  { description: 'Laboratory: Full Lipid Profile & Liver Function', category: 'Lab', unitPrice: 2400 },
  { description: 'Pharmacy: Standard Outpatient Prescription & Dispensing', category: 'Pharmacy', unitPrice: 1650 },
  { description: 'Diagnostics: 12-Lead Electrocardiogram (ECG)', category: 'Diagnostics', unitPrice: 1500 },
  { description: 'Diagnostics: Abdominal Ultrasound Imaging Scan', category: 'Diagnostics', unitPrice: 4500 },
  { description: 'Emergency Casualty Dressing, Suture & Triage', category: 'Emergency', unitPrice: 2200 },
  { description: 'Nebulization & Inhalation Respiratory Therapy', category: 'Procedure', unitPrice: 1200 }
];

const BILL_CATEGORIES = [
  'Outpatient (OPD) Consultation',
  'Emergency Care & Casualty',
  'Specialist Channeling Consultation',
  'Laboratory & Diagnostic Testing',
  'Pharmacy & Medication Dispensing',
  'Minor Surgical & Daycare Procedure',
  'In-Patient Ward Services',
  'General Healthcare Services'
];

export default function CustomBillGeneratorModal({ onClose, onBillGenerated, currentUser }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientType, setPatientType] = useState('REGISTERED'); // 'REGISTERED' | 'WALKIN'
  const [doctorType, setDoctorType] = useState('REGISTERED'); // 'REGISTERED' | 'CUSTOM'

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientIdDisplay, setPatientIdDisplay] = useState('');
  const [patientNic, setPatientNic] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('');
  const [department, setDepartment] = useState('Outpatient Department (OPD)');

  const [billCategory, setBillCategory] = useState('Outpatient (OPD) Consultation');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentStatus, setPaymentStatus] = useState('COMPLETED');
  const [facilityCharge, setFacilityCharge] = useState(500);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [remarks, setRemarks] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState([
    {
      id: 1,
      description: 'Consultant Clinical Examination & OPD Review',
      category: 'Consultation',
      qty: 1,
      unitPrice: 3000,
      amount: 3000
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        axios.get('/api/patients'),
        axios.get('/api/doctors')
      ]);
      if (patRes.data?.success) setPatients(patRes.data.data || []);
      if (docRes.data?.success) setDoctors(docRes.data.data || []);
    } catch (err) {
      console.warn('Could not fetch patients or doctors directory', err);
    }
  };

  const handlePatientSelect = (e) => {
    const patId = e.target.value;
    setSelectedPatientId(patId);
    if (!patId) return;

    const pat = patients.find(p => String(p.userId) === String(patId) || String(p.patientId) === String(patId));
    if (pat) {
      setPatientName(pat.fullName || '');
      setPatientIdDisplay(formatPatientId(pat));
      setPatientNic(pat.nic || '');
      setPatientContact(pat.contactNumber || '');
      setPatientAge(pat.age ? String(pat.age) : '');
      setPatientGender(pat.gender || 'Male');
    }
  };

  const handleDoctorSelect = (e) => {
    const docId = e.target.value;
    setSelectedDoctorId(docId);
    if (!docId) return;

    const doc = doctors.find(d => String(d.userId) === String(docId) || String(d.doctorId) === String(docId));
    if (doc) {
      setDoctorName(doc.fullName || '');
      setDoctorSpecialization(doc.specialization || '');
      setDepartment(doc.specialization ? `${doc.specialization} Clinic` : 'Outpatient Clinic');

      // If line items has only default, update with doctor fee
      const fee = Number(doc.consultationFee) || 3000;
      setLineItems(prev => {
        if (prev.length === 1 && prev[0].category === 'Consultation') {
          return [{
            ...prev[0],
            description: `Consultant Review (${doc.fullName})`,
            unitPrice: fee,
            amount: fee * (prev[0].qty || 1)
          }];
        }
        return prev;
      });
    }
  };

  const addLineItem = (preset = null) => {
    const newItem = preset ? {
      id: Date.now() + Math.random(),
      description: preset.description,
      category: preset.category,
      qty: 1,
      unitPrice: preset.unitPrice,
      amount: preset.unitPrice
    } : {
      id: Date.now() + Math.random(),
      description: '',
      category: 'General',
      qty: 1,
      unitPrice: 0,
      amount: 0
    };

    setLineItems(prev => [...prev, newItem]);
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          const qty = field === 'qty' ? Number(value) || 0 : Number(item.qty) || 0;
          const price = field === 'unitPrice' ? Number(value) || 0 : Number(item.unitPrice) || 0;
          updated.amount = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id) => {
    if (lineItems.length <= 1) {
      alert('A medical bill must contain at least one line item.');
      return;
    }
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netTotal = Math.max(0, subtotal + Number(facilityCharge || 0) + Number(tax || 0) - Number(discount || 0));
  const amountWords = numberToWords(netTotal);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientName.trim()) {
      alert('Please provide the patient name.');
      return;
    }

    if (lineItems.length === 0 || subtotal <= 0) {
      alert('Please add valid bill line items with prices.');
      return;
    }

    setIsSubmitting(true);

    const generatedInvNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const billPayload = {
      invoiceNumber: generatedInvNo,
      patientName: patientName.trim(),
      patientId: patientIdDisplay || `PAT-WALKIN-${Math.floor(100 + Math.random() * 900)}`,
      patientNic: patientNic.trim(),
      patientContact: patientContact.trim(),
      doctorName: doctorName.trim() || 'Consultant Specialist',
      doctorSpecialization: doctorSpecialization.trim() || 'General Medicine',
      department: department.trim() || 'Outpatient Unit',
      billCategory: billCategory,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      subtotal: subtotal,
      facilityCharge: Number(facilityCharge) || 0,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      totalAmount: netTotal,
      lineItemsJson: JSON.stringify(lineItems),
      remarks: remarks.trim() || `Custom medical bill issued at CareSync Finance counter by ${currentUser?.fullName || 'Ruwan Selvaratnam'}`,
      cashierName: currentUser?.fullName || 'Ruwan Selvaratnam (Finance Directorate)'
    };

    try {
      let savedBill = null;
      try {
        const res = await axios.post('/api/payments/custom-bill', billPayload);
        if (res.data?.success) {
          savedBill = res.data.data;
        }
      } catch (backendErr) {
        console.warn('Backend custom-bill POST endpoint returned error, saving locally:', backendErr);
      }

      const finalBill = savedBill || {
        ...billPayload,
        billId: Date.now(),
        createdAt: new Date().toISOString()
      };

      // Also persist to localStorage for resilience
      try {
        const stored = JSON.parse(localStorage.getItem('caresync_custom_bills') || '[]');
        stored.unshift(finalBill);
        localStorage.setItem('caresync_custom_bills', JSON.stringify(stored));
      } catch (lsErr) {
        console.error('LocalStorage write error', lsErr);
      }

      onBillGenerated(finalBill);
      onClose();
    } catch (err) {
      console.error('Error generating bill', err);
      alert('Error creating bill. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 flex justify-between items-start shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Generate Custom Hospital Bill & Tax Invoice</h2>
            </div>
            <p className="text-xs text-emerald-100/90">
              Create official itemized medical bills for OPD patients, diagnostics, pharmacy, or walk-in clinical services.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          
          {/* 1. Patient Information */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <User className="w-4 h-4 text-emerald-700" />
                1. Patient Information
              </span>
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPatientType('REGISTERED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    patientType === 'REGISTERED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Registered Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatientType('WALKIN');
                    setSelectedPatientId('');
                    setPatientIdDisplay('');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    patientType === 'WALKIN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Walk-in / New
                </button>
              </div>
            </div>

            {patientType === 'REGISTERED' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Select from Registered Patients</label>
                <select
                  value={selectedPatientId}
                  onChange={handlePatientSelect}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 shadow-xs text-xs font-medium"
                >
                  <option value="">-- Choose Registered Patient (Auto-fills Details) --</option>
                  {patients.map(p => (
                    <option key={p.userId || p.patientId} value={p.userId || p.patientId}>
                      {formatPatientId(p)} • {p.fullName} (NIC: {p.nic || 'N/A'}, Phone: {p.contactNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Bandara"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Patient ID / MRN</label>
                <input
                  type="text"
                  placeholder="e.g. PAT0008 or WALKIN"
                  value={patientIdDisplay}
                  onChange={(e) => setPatientIdDisplay(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">NIC / Passport</label>
                <input
                  type="text"
                  placeholder="e.g. 199512345678"
                  value={patientNic}
                  onChange={(e) => setPatientNic(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 0771234567"
                  value={patientContact}
                  onChange={(e) => setPatientContact(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Physician & Department */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Stethoscope className="w-4 h-4 text-teal-700" />
                2. Attending Physician & Unit
              </span>
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setDoctorType('REGISTERED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    doctorType === 'REGISTERED' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hospital Specialist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDoctorType('CUSTOM');
                    setSelectedDoctorId('');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    doctorType === 'CUSTOM' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Custom Clinical Unit
                </button>
              </div>
            </div>

            {doctorType === 'REGISTERED' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Select CareSync Specialist</label>
                <select
                  value={selectedDoctorId}
                  onChange={handleDoctorSelect}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 shadow-xs text-xs font-medium"
                >
                  <option value="">-- Choose Attending Consultant --</option>
                  {doctors.map(d => (
                    <option key={d.userId || d.doctorId} value={d.userId || d.doctorId}>
                      {formatDoctorId(d)} • {d.fullName} ({d.specialization} • Fee: LKR {d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Doctor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Nuwan Jayawardena"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology / General Medicine"
                  value={doctorSpecialization}
                  onChange={(e) => setDoctorSpecialization(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Department / Clinic</label>
                <input
                  type="text"
                  placeholder="e.g. Outpatient Unit Room 204"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* 3. Category & Payment Rails */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bill Purpose / Category</label>
              <select
                value={billCategory}
                onChange={(e) => setBillCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 shadow-xs font-semibold"
              >
                {BILL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payment Rail</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 shadow-xs font-semibold"
              >
                <option value="CASH">CASH (Physical Counter)</option>
                <option value="CREDIT_CARD">CREDIT CARD (VISA / Mastercard)</option>
                <option value="DEBIT_CARD">DEBIT CARD</option>
                <option value="ONLINE_BANKING">ONLINE BANKING (Direct Transfer)</option>
                <option value="INSURANCE">CORPORATE / HEALTH INSURANCE CLAIM</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Settlement Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 shadow-xs font-semibold"
              >
                <option value="COMPLETED">COMPLETED (Paid & Audited)</option>
                <option value="PENDING">PENDING (Awaiting Settlement)</option>
              </select>
            </div>
          </div>

          {/* 4. Itemized Line Items */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider block">
                  3. Itemized Medical & Clinical Services ({lineItems.length})
                </span>
                <span className="text-[10px] text-slate-400">Add individual tests, medications, consultations, or facility fees</span>
              </div>
              <button
                type="button"
                onClick={() => addLineItem()}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Blank Item</span>
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick-Add Common Hospital Charges:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ITEMS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addLineItem(preset)}
                    className="bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-medium transition shadow-2xs flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>{preset.description.split('(')[0].trim()}</span>
                    <strong className="text-emerald-700 ml-1 font-mono">LKR {preset.unitPrice}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Service / Item Description</th>
                    <th className="py-2.5 px-3 w-32">Category</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price (LKR)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (LKR)</th>
                    <th className="py-2.5 px-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Full Blood Count Test"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600 font-medium text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 text-xs"
                        >
                          <option value="Consultation">Consultation</option>
                          <option value="Lab">Lab Test</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="Nursing">Nursing</option>
                          <option value="Facility">Facility</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Diagnostics">Diagnostics</option>
                          <option value="Procedure">Procedure</option>
                          <option value="General">General</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => updateLineItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center outline-none focus:border-emerald-600 font-medium text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-right font-mono outline-none focus:border-emerald-600 font-medium text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Summary & Financial Reconciliation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: Remarks & Word Preview */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Cashier & Clinical Remarks / Diagnosis Code
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Regular outpatient cardiology follow-up consultation and routine lipid screening."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Amount in Formal Words Preview
                </span>
                <p className="text-[11px] font-bold text-slate-800 italic">
                  "{amountWords}"
                </p>
              </div>
            </div>

            {/* Right: Calculations */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Hospital Facility & Maintenance Surcharge:</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono">LKR</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={facilityCharge}
                    onChange={(e) => setFacilityCharge(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right font-mono text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-rose-700">
                <span>Concession / Discount:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">- LKR</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white border border-rose-200 text-rose-800 rounded-lg px-2 py-0.5 text-right font-mono text-xs outline-none focus:border-rose-600 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Government Healthcare Levy / VAT:</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono">LKR</span>
                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right font-mono text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black text-slate-900">
                <span>GRAND TOTAL:</span>
                <span className="text-base text-emerald-700 font-mono">
                  LKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                Authorized by <strong>{currentUser?.fullName || 'Ruwan Selvaratnam'}</strong> (Finance Directorate)
              </span>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Issuing Tax Invoice...' : 'Generate & Issue Tax Invoice'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
