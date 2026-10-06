package com.sliit.echanneling.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class RefundRequestDto {

    @NotNull(message = "Appointment ID is required")
    private Integer appointmentId;

    @NotNull(message = "Refund amount is required")
    private BigDecimal refundAmount;

    @NotBlank(message = "Reason is required")
    private String reason;

    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
