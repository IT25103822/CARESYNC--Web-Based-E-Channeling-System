package com.sliit.echanneling.payment.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Custom Refund DTO
 * Allows Finance Officers to issue direct/custom refunds for appointments and custom medical bills.
 */
public class CustomRefundDto {

    private String targetType = "APPOINTMENT"; // "APPOINTMENT" or "CUSTOM_BILL"
    private Integer appointmentId;
    private Integer paymentId;
    private Integer billId;
    private String invoiceNumber;

    @NotNull(message = "Refund amount is required")
    private BigDecimal refundAmount;

    private String reason;
    private String reasonCategory; // DOCTOR_UNAVAILABLE, BILLING_ERROR, SPECIAL_WAIVER, COMPASSIONATE, DUPLICATE_PAYMENT, OTHER
    private String payoutMethod = "REVERSE_TO_ORIGINAL_PAYMENT"; // REVERSE_TO_ORIGINAL_PAYMENT, CASH_COUNTER, BANK_TRANSFER, CREDIT_VOUCHER
    private Integer financeOfficerId;
    private String financeOfficerName;
    private String remarks;

    public CustomRefundDto() {}

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public Integer getPaymentId() { return paymentId; }
    public void setPaymentId(Integer paymentId) { this.paymentId = paymentId; }

    public Integer getBillId() { return billId; }
    public void setBillId(Integer billId) { this.billId = billId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getReasonCategory() { return reasonCategory; }
    public void setReasonCategory(String reasonCategory) { this.reasonCategory = reasonCategory; }

    public String getPayoutMethod() { return payoutMethod; }
    public void setPayoutMethod(String payoutMethod) { this.payoutMethod = payoutMethod; }

    public Integer getFinanceOfficerId() { return financeOfficerId; }
    public void setFinanceOfficerId(Integer financeOfficerId) { this.financeOfficerId = financeOfficerId; }

    public String getFinanceOfficerName() { return financeOfficerName; }
    public void setFinanceOfficerName(String financeOfficerName) { this.financeOfficerName = financeOfficerName; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
