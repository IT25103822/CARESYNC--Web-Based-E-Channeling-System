package com.sliit.echanneling.payment.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Custom Bill & Medical Invoice Entity
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment & Financial Governance
 */
@Entity
@Table(name = "CustomBills")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BillId")
    private Integer billId;

    @Column(name = "InvoiceNumber", nullable = false, unique = true, length = 100)
    private String invoiceNumber;

    @Column(name = "PatientName", nullable = false, length = 200)
    private String patientName;

    @Column(name = "PatientId", length = 50)
    private String patientId;

    @Column(name = "PatientNic", length = 50)
    private String patientNic;

    @Column(name = "PatientContact", length = 50)
    private String patientContact;

    @Column(name = "DoctorName", length = 200)
    private String doctorName;

    @Column(name = "DoctorSpecialization", length = 100)
    private String doctorSpecialization;

    @Column(name = "Department", length = 100)
    private String department;

    @Column(name = "BillCategory", nullable = false, length = 100)
    private String billCategory; // OPD, EMERGENCY, PHARMACY, LAB, ADMISSION, GENERAL

    @Column(name = "PaymentMethod", nullable = false, length = 50)
    private String paymentMethod; // CASH, CREDIT_CARD, DEBIT_CARD, ONLINE_BANKING, INSURANCE

    @Column(name = "PaymentStatus", nullable = false, length = 50)
    private String paymentStatus = "COMPLETED"; // COMPLETED, PENDING, CANCELLED

    @Column(name = "Subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "FacilityCharge", precision = 10, scale = 2)
    private BigDecimal facilityCharge = BigDecimal.ZERO;

    @Column(name = "Discount", precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "Tax", precision = 10, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "TotalAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "LineItemsJson", columnDefinition = "NVARCHAR(MAX)")
    private String lineItemsJson;

    @Column(name = "Remarks", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "CashierName", length = 100)
    private String cashierName;

    @Column(name = "TransactionReference", length = 100)
    private String transactionReference;

    @Column(name = "PaidAt")
    private LocalDateTime paidAt;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public CustomBill() {}

    public Integer getBillId() { return billId; }
    public void setBillId(Integer billId) { this.billId = billId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientNic() { return patientNic; }
    public void setPatientNic(String patientNic) { this.patientNic = patientNic; }

    public String getPatientContact() { return patientContact; }
    public void setPatientContact(String patientContact) { this.patientContact = patientContact; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getBillCategory() { return billCategory; }
    public void setBillCategory(String billCategory) { this.billCategory = billCategory; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getFacilityCharge() { return facilityCharge; }
    public void setFacilityCharge(BigDecimal facilityCharge) { this.facilityCharge = facilityCharge; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getLineItemsJson() { return lineItemsJson; }
    public void setLineItemsJson(String lineItemsJson) { this.lineItemsJson = lineItemsJson; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getCashierName() { return cashierName; }
    public void setCashierName(String cashierName) { this.cashierName = cashierName; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
