package com.sliit.echanneling.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Custom Bill Request DTO
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment & Financial Governance
 */
public class CreateCustomBillDto {

    private String invoiceNumber;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    private String patientId;
    private String patientNic;
    private String patientContact;

    private String doctorName;
    private String doctorSpecialization;
    private String department;

    private String billCategory = "GENERAL";
    private String paymentMethod = "CASH";
    private String paymentStatus = "COMPLETED";

    @NotNull(message = "Subtotal is required")
    private BigDecimal subtotal;

    private BigDecimal facilityCharge = BigDecimal.ZERO;
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal tax = BigDecimal.ZERO;

    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    private String lineItemsJson;
    private String remarks;
    private String cashierName;

    public CreateCustomBillDto() {}

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
}
