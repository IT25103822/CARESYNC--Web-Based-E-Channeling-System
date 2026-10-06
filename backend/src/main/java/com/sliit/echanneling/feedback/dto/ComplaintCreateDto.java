package com.sliit.echanneling.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ComplaintCreateDto {
    @NotNull(message = "Patient ID is required")
    private Integer patientId;

    @NotBlank(message = "Complaint type is required")
    private String complaintType;

    @NotBlank(message = "Description is required")
    private String description;

    public Integer getPatientId() { return patientId; }
    public void setPatientId(Integer patientId) { this.patientId = patientId; }

    public String getComplaintType() { return complaintType; }
    public void setComplaintType(String complaintType) { this.complaintType = complaintType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
