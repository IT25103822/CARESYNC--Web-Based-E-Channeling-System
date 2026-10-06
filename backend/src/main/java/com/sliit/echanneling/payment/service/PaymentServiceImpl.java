package com.sliit.echanneling.payment.service;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.payment.dto.*;
import com.sliit.echanneling.payment.entity.CustomBill;
import com.sliit.echanneling.payment.entity.Payment;
import com.sliit.echanneling.payment.entity.Receipt;
import com.sliit.echanneling.payment.entity.Refund;
import com.sliit.echanneling.payment.repository.CustomBillRepository;
import com.sliit.echanneling.payment.repository.PaymentRepository;
import com.sliit.echanneling.payment.repository.ReceiptRepository;
import com.sliit.echanneling.payment.repository.RefundRepository;
import com.sliit.echanneling.schedule.entity.Timeslot;
import com.sliit.echanneling.schedule.repository.TimeslotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment Management Implementation
 */
@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReceiptRepository receiptRepository;
    private final RefundRepository refundRepository;
    private final AppointmentRepository appointmentRepository;
    private final CustomBillRepository customBillRepository;
    private final TimeslotRepository timeslotRepository;

    @Autowired
    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              ReceiptRepository receiptRepository,
                              RefundRepository refundRepository,
                              AppointmentRepository appointmentRepository,
                              CustomBillRepository customBillRepository,
                              TimeslotRepository timeslotRepository) {
        this.paymentRepository = paymentRepository;
        this.receiptRepository = receiptRepository;
        this.refundRepository = refundRepository;
        this.appointmentRepository = appointmentRepository;
        this.customBillRepository = customBillRepository;
        this.timeslotRepository = timeslotRepository;
    }

    @Override
    public Payment processPayment(ProcessPaymentDto dto) {
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + dto.getAppointmentId()));

        if (paymentRepository.findByAppointment_AppointmentId(dto.getAppointmentId()).isPresent()) {
            throw new BadRequestException("Payment has already been processed for Appointment ID: " + dto.getAppointmentId());
        }

        String txnRef = dto.getTransactionReference();
        if (txnRef == null || txnRef.isBlank()) {
            txnRef = "TXN-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);
        }

        Payment payment = new Payment(
                appointment,
                null,
                txnRef,
                dto.getAmount(),
                dto.getPaymentMethod(),
                "COMPLETED"
        );

        Payment savedPayment = paymentRepository.save(payment);

        // Auto-generate digital receipt (Lab 02 PBI-18 / Lab 03 PY01)
        String receiptNumber = "REC-" + LocalDateTime.now().getYear() + "-" + (int)(Math.random() * 89999 + 10000);
        String details = "Digital Payment Receipt for Appointment #" + appointment.getAppointmentId() +
                " | Patient: " + appointment.getPatient().getFullName() +
                " | Doctor: " + appointment.getDoctor().getFullName() +
                " | Specialization: " + appointment.getDoctor().getSpecialization() +
                " | Amount Paid: LKR " + dto.getAmount() +
                " | Method: " + dto.getPaymentMethod();

        Receipt receipt = new Receipt(savedPayment, receiptNumber, details);
        receiptRepository.save(receipt);

        // Ensure appointment is confirmed
        appointment.setAppointmentStatus("CONFIRMED");
        appointmentRepository.save(appointment);

        return savedPayment;
    }

    @Override
    @Transactional(readOnly = true)
    public Receipt getReceiptByPaymentId(Integer paymentId) {
        return receiptRepository.findByPayment_PaymentId(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found for Payment ID: " + paymentId));
    }

    @Override
    @Transactional(readOnly = true)
    public Receipt getReceiptByAppointmentId(Integer appointmentId) {
        return receiptRepository.findByPayment_Appointment_AppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found for Appointment ID: " + appointmentId));
    }

    @Override
    public Refund requestRefund(RefundRequestDto dto) {
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + dto.getAppointmentId()));

        Payment payment = paymentRepository.findByAppointment_AppointmentId(dto.getAppointmentId())
                .orElseGet(() -> {
                    BigDecimal amt = (dto.getRefundAmount() != null && dto.getRefundAmount().compareTo(BigDecimal.ZERO) > 0)
                            ? dto.getRefundAmount()
                            : (appointment.getDoctor() != null && appointment.getDoctor().getConsultationFee() != null
                                ? appointment.getDoctor().getConsultationFee()
                                : new BigDecimal("2500.00"));
                    Payment p = new Payment(
                            appointment,
                            null,
                            "TXN-AUTO-" + System.currentTimeMillis(),
                            amt,
                            "CREDIT_CARD",
                            "COMPLETED"
                    );
                    return paymentRepository.saveAndFlush(p);
                });

        if (refundRepository.findByAppointment_AppointmentId(dto.getAppointmentId()).isPresent()) {
            throw new BadRequestException("A refund request already exists for this appointment.");
        }

        // 2-Day (48-Hour) Cancellation & Refund Window Enforcement
        LocalDateTime bookedAt = appointment.getBookingDate() != null ? appointment.getBookingDate() : appointment.getCreatedAt();
        if (bookedAt != null) {
            long minutesSinceBooking = Duration.between(bookedAt, LocalDateTime.now()).toMinutes();
            if (minutesSinceBooking > 48 * 60) {
                long hoursSinceBooking = minutesSinceBooking / 60;
                long remainingMins = minutesSinceBooking % 60;
                long daysSinceBooking = hoursSinceBooking / 24;
                throw new BadRequestException("Cancellation and refund window expired: Refund claims can only be requested within 2 days (48 hours) of booking. This appointment was booked " 
                        + (daysSinceBooking > 0 ? daysSinceBooking + "d " : "") + (hoursSinceBooking % 24) + "h " + remainingMins + "m ago. Refund requests are no longer accepted.");
            }
        }

        BigDecimal refundAmt = (dto.getRefundAmount() != null && dto.getRefundAmount().compareTo(BigDecimal.ZERO) > 0)
                ? dto.getRefundAmount()
                : payment.getAmount();

        Refund refund = new Refund(
                appointment,
                payment,
                null,
                refundAmt,
                dto.getReason(),
                "REQUESTED"
        );

        return refundRepository.saveAndFlush(refund);
    }

    @Override
    public Refund processRefundDecision(Integer refundId, RefundDecisionDto dto) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found with ID: " + refundId));

        refund.setFinanceOfficerId(dto.getFinanceOfficerId());
        refund.setRefundStatus(dto.getStatus());

        if ("APPROVED".equalsIgnoreCase(dto.getStatus()) || "PROCESSED".equalsIgnoreCase(dto.getStatus())) {
            // Update payment status
            Payment payment = refund.getPayment();
            payment.setPaymentStatus("REFUNDED");
            paymentRepository.saveAndFlush(payment);

            // Update appointment status
            Appointment appointment = refund.getAppointment();
            appointment.setAppointmentStatus("CANCELLED");
            if (appointment.getTimeslot() != null) {
                Timeslot slot = appointment.getTimeslot();
                if (!"EXPIRED".equalsIgnoreCase(slot.getSlotStatus())) {
                    slot.setSlotStatus("AVAILABLE");
                    timeslotRepository.save(slot);
                }
            }
            appointmentRepository.saveAndFlush(appointment);
        }

        return refundRepository.saveAndFlush(refund);
    }

    @Override
    @Transactional
    public Object createCustomRefund(CustomRefundDto dto) {
        if (dto.getRefundAmount() == null || dto.getRefundAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Refund amount must be greater than zero.");
        }

        String targetType = dto.getTargetType() != null ? dto.getTargetType().toUpperCase() : "APPOINTMENT";

        // Check if Custom Medical Bill Refund
        if ("CUSTOM_BILL".equalsIgnoreCase(targetType) || dto.getBillId() != null || (dto.getInvoiceNumber() != null && dto.getInvoiceNumber().startsWith("INV-"))) {
            CustomBill bill;
            if (dto.getBillId() != null) {
                bill = customBillRepository.findById(dto.getBillId())
                        .orElseThrow(() -> new ResourceNotFoundException("Custom Medical Bill not found with ID: " + dto.getBillId()));
            } else {
                bill = customBillRepository.findByInvoiceNumber(dto.getInvoiceNumber())
                        .orElseThrow(() -> new ResourceNotFoundException("Custom Medical Bill not found with Invoice Number: " + dto.getInvoiceNumber()));
            }

            if ("REFUNDED".equalsIgnoreCase(bill.getPaymentStatus())) {
                throw new BadRequestException("Medical Bill " + bill.getInvoiceNumber() + " has already been refunded.");
            }

            if (bill.getTotalAmount() != null && dto.getRefundAmount().compareTo(bill.getTotalAmount()) > 0) {
                bill.setTotalAmount(dto.getRefundAmount());
            }

            bill.setPaymentStatus("REFUNDED");
            String officer = dto.getFinanceOfficerName() != null ? dto.getFinanceOfficerName() : "Finance Directorate";
            String payout = dto.getPayoutMethod() != null ? dto.getPayoutMethod() : "DIRECT_PAYOUT";
            String reasonText = dto.getReason() != null ? dto.getReason() : "Custom billing adjustment";
            String category = dto.getReasonCategory() != null ? "[" + dto.getReasonCategory() + "] " : "";

            String refundLog = " | [CUSTOM REFUND: LKR " + dto.getRefundAmount() + " refunded on " 
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                    + " via " + payout + " | Auth: " + officer + " | " + category + reasonText + "]";
            bill.setRemarks((bill.getRemarks() != null ? bill.getRemarks() : "") + refundLog);

            return customBillRepository.saveAndFlush(bill);
        }

        // Otherwise: Channeling APPOINTMENT REFUND
        Appointment appointment = null;
        if (dto.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(dto.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + dto.getAppointmentId()));
        } else if (dto.getPaymentId() != null) {
            Payment p = paymentRepository.findById(dto.getPaymentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + dto.getPaymentId()));
            appointment = p.getAppointment();
        }

        if (appointment == null) {
            throw new BadRequestException("Valid Appointment ID or Payment ID is required to issue refund.");
        }

        final Appointment targetAppointment = appointment;
        Payment payment = paymentRepository.findByAppointment_AppointmentId(targetAppointment.getAppointmentId())
                .orElseGet(() -> {
                    BigDecimal amt = (targetAppointment.getDoctor() != null && targetAppointment.getDoctor().getConsultationFee() != null)
                            ? targetAppointment.getDoctor().getConsultationFee()
                            : dto.getRefundAmount();
                    Payment p = new Payment(
                            targetAppointment,
                            dto.getFinanceOfficerId(),
                            "TXN-CUSTOM-REFUND-" + System.currentTimeMillis(),
                            amt,
                            "CREDIT_CARD",
                            "REFUNDED"
                    );
                    return paymentRepository.saveAndFlush(p);
                });

        if (payment.getAmount() != null && dto.getRefundAmount().compareTo(payment.getAmount()) > 0) {
            payment.setAmount(dto.getRefundAmount());
        }

        // 1. Update Payment status to REFUNDED
        payment.setPaymentStatus("REFUNDED");
        if (dto.getFinanceOfficerId() != null) {
            payment.setFinanceOfficerId(dto.getFinanceOfficerId());
        }
        paymentRepository.saveAndFlush(payment);

        // 2. Update Appointment status to CANCELLED
        appointment.setAppointmentStatus("CANCELLED");
        appointmentRepository.saveAndFlush(appointment);

        // 3. Release timeslot back to AVAILABLE if not expired
        if (appointment.getTimeslot() != null) {
            Timeslot slot = appointment.getTimeslot();
            if (!"EXPIRED".equalsIgnoreCase(slot.getSlotStatus())) {
                slot.setSlotStatus("AVAILABLE");
                timeslotRepository.save(slot);
            }
        }

        // 4. Create or Update Refund Record
        String category = dto.getReasonCategory() != null ? "[" + dto.getReasonCategory() + "] " : "";
        String reasonText = dto.getReason() != null ? dto.getReason() : "Custom Refund authorized by Finance Directorate";
        String officer = dto.getFinanceOfficerName() != null ? dto.getFinanceOfficerName() : "Finance Officer #" + (dto.getFinanceOfficerId() != null ? dto.getFinanceOfficerId() : 3);
        String payout = dto.getPayoutMethod() != null ? dto.getPayoutMethod() : "REVERSE_TO_ORIGINAL_PAYMENT";

        String formattedReason = category + reasonText + " [Custom Refund Auth: " + officer + " | Payout: " + payout + "]";

        Refund refund = refundRepository.findByAppointment_AppointmentId(appointment.getAppointmentId())
                .orElse(new Refund());

        refund.setAppointment(appointment);
        refund.setPayment(payment);
        refund.setFinanceOfficerId(dto.getFinanceOfficerId() != null ? dto.getFinanceOfficerId() : 3);
        refund.setRefundAmount(dto.getRefundAmount());
        refund.setRefundDate(LocalDateTime.now());
        refund.setReason(formattedReason);
        refund.setRefundStatus("APPROVED"); // Directly approved & settled

        return refundRepository.saveAndFlush(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Refund> getAllRefunds() {
        return refundRepository.findAllByOrderByRefundDateDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Refund> getRefundsByPatientId(Integer patientId) {
        return refundRepository.findByAppointment_Patient_UserIdOrderByRefundDateDesc(patientId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReconciliationSummaryDto getReconciliationReport() {
        List<Payment> payments = paymentRepository.findAll();
        List<Refund> refunds = refundRepository.findByRefundStatusOrderByRefundDateDesc("APPROVED");
        List<CustomBill> customBills = customBillRepository.findAll();

        BigDecimal totalRevenue = payments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getPaymentStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal customRevenue = customBills.stream()
                .filter(b -> "COMPLETED".equalsIgnoreCase(b.getPaymentStatus()) || "PAID".equalsIgnoreCase(b.getPaymentStatus()))
                .map(CustomBill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossRevenue = totalRevenue.add(customRevenue);

        BigDecimal totalRefunds = refunds.stream()
                .map(Refund::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal customBillRefunds = customBills.stream()
                .filter(b -> "REFUNDED".equalsIgnoreCase(b.getPaymentStatus()))
                .map(CustomBill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grandTotalRefundAmount = totalRefunds.add(customBillRefunds);
        int totalRefundsCount = refunds.size() + (int) customBills.stream().filter(b -> "REFUNDED".equalsIgnoreCase(b.getPaymentStatus())).count();
        BigDecimal netRevenue = grossRevenue.subtract(grandTotalRefundAmount);
        long totalTransactions = payments.size() + customBills.size();

        return new ReconciliationSummaryDto(
                totalTransactions,
                grossRevenue,
                totalRefundsCount,
                grandTotalRefundAmount,
                netRevenue
        );
    }

    @Override
    public CustomBill createCustomBill(CreateCustomBillDto dto) {
        String invoiceNum = dto.getInvoiceNumber();
        if (invoiceNum == null || invoiceNum.trim().isEmpty()) {
            invoiceNum = "INV-" + LocalDateTime.now().getYear() + "-" + (int)(Math.random() * 8999 + 1000);
        }

        CustomBill bill = new CustomBill();
        bill.setInvoiceNumber(invoiceNum);
        bill.setPatientName(dto.getPatientName());
        bill.setPatientId(dto.getPatientId());
        bill.setPatientNic(dto.getPatientNic());
        bill.setPatientContact(dto.getPatientContact());
        bill.setDoctorName(dto.getDoctorName());
        bill.setDoctorSpecialization(dto.getDoctorSpecialization());
        bill.setDepartment(dto.getDepartment());
        bill.setBillCategory(dto.getBillCategory() != null ? dto.getBillCategory() : "GENERAL");
        bill.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CASH");
        bill.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "COMPLETED");
        bill.setSubtotal(dto.getSubtotal() != null ? dto.getSubtotal() : BigDecimal.ZERO);
        bill.setFacilityCharge(dto.getFacilityCharge() != null ? dto.getFacilityCharge() : BigDecimal.ZERO);
        bill.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO);
        bill.setTax(dto.getTax() != null ? dto.getTax() : BigDecimal.ZERO);
        bill.setTotalAmount(dto.getTotalAmount() != null ? dto.getTotalAmount() : BigDecimal.ZERO);
        bill.setLineItemsJson(dto.getLineItemsJson());
        bill.setRemarks(dto.getRemarks());
        bill.setCashierName(dto.getCashierName());
        bill.setCreatedAt(LocalDateTime.now());

        return customBillRepository.save(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomBill> getAllCustomBills() {
        return customBillRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomBill getCustomBillByInvoiceNumber(String invoiceNumber) {
        return customBillRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Custom bill not found with Invoice Number: " + invoiceNumber));
    }

    @Override
    public CustomBill payCustomBill(Integer billId, PayCustomBillDto dto) {
        CustomBill bill = customBillRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Custom bill not found with ID: " + billId));

        if ("COMPLETED".equalsIgnoreCase(bill.getPaymentStatus()) || "PAID".equalsIgnoreCase(bill.getPaymentStatus())) {
            throw new BadRequestException("Bill " + bill.getInvoiceNumber() + " has already been settled and paid.");
        }

        String txn = dto.getTransactionReference();
        if (txn == null || txn.isBlank()) {
            txn = "TXN-ONLINE-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 899 + 100);
        }

        bill.setPaymentStatus("COMPLETED");
        bill.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CREDIT_CARD");
        bill.setTransactionReference(txn);
        bill.setPaidAt(LocalDateTime.now());

        String cardNote = (dto.getCardBrand() != null && dto.getCardLast4() != null)
                ? " Paid online via " + dto.getCardBrand() + " (•••• " + dto.getCardLast4() + ")."
                : " Paid online via patient portal.";
        bill.setRemarks((bill.getRemarks() != null ? bill.getRemarks() + " |" : "") + cardNote);

        return customBillRepository.save(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomBill> getCustomBillsForPatient(String patientId, String nic, String contactNumber) {
        String pId = patientId != null ? patientId.trim() : "";
        String pNic = nic != null ? nic.trim() : "";
        String pContact = contactNumber != null ? contactNumber.trim() : "";

        if (!pId.isEmpty() || !pNic.isEmpty() || !pContact.isEmpty()) {
            return customBillRepository.findByPatientIdIgnoreCaseOrPatientNicIgnoreCaseOrPatientContactOrderByCreatedAtDesc(
                    pId, pNic, pContact
            );
        }
        return customBillRepository.findAllByOrderByCreatedAtDesc();
    }
}
