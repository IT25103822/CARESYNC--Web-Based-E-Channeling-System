package com.sliit.echanneling.payment.service;

import com.sliit.echanneling.payment.dto.*;
import com.sliit.echanneling.payment.entity.CustomBill;
import com.sliit.echanneling.payment.entity.Payment;
import com.sliit.echanneling.payment.entity.Receipt;
import com.sliit.echanneling.payment.entity.Refund;

import java.util.List;

/**
 * OOP Demonstration: Abstraction
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment Management Interface
 */
public interface PaymentService {
    Payment processPayment(ProcessPaymentDto dto);
    Receipt getReceiptByPaymentId(Integer paymentId);
    Receipt getReceiptByAppointmentId(Integer appointmentId);
    Refund requestRefund(RefundRequestDto dto);
    Refund processRefundDecision(Integer refundId, RefundDecisionDto dto);
    Object createCustomRefund(CustomRefundDto dto);
    List<Payment> getAllPayments();
    List<Refund> getAllRefunds();
    List<Refund> getRefundsByPatientId(Integer patientId);
    ReconciliationSummaryDto getReconciliationReport();

    // Custom Hospital Bills & Invoices (Member 6)
    CustomBill createCustomBill(CreateCustomBillDto dto);
    List<CustomBill> getAllCustomBills();
    CustomBill getCustomBillByInvoiceNumber(String invoiceNumber);
    CustomBill payCustomBill(Integer billId, PayCustomBillDto dto);
    List<CustomBill> getCustomBillsForPatient(String patientId, String nic, String contactNumber);
}

