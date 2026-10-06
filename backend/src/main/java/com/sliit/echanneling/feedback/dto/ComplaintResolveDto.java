package com.sliit.echanneling.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ComplaintResolveDto {
    @NotNull(message = "Customer Service ID is required")
    private Integer customerServiceId;

    @NotBlank(message = "Status is required (RESOLVED/IN_PROGRESS/CLOSED)")
    private String status;

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;

    public Integer getCustomerServiceId() { return customerServiceId; }
    public void setCustomerServiceId(Integer customerServiceId) { this.customerServiceId = customerServiceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
