package com.sliit.echanneling.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RefundDecisionDto {

    @NotNull(message = "Finance Officer ID is required")
    private Integer financeOfficerId;

    @NotBlank(message = "Decision status is required (APPROVED/REJECTED/PROCESSED)")
    private String status;

    public Integer getFinanceOfficerId() { return financeOfficerId; }
    public void setFinanceOfficerId(Integer financeOfficerId) { this.financeOfficerId = financeOfficerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
