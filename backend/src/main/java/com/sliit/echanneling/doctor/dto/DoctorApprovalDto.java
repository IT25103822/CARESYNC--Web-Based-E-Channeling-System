package com.sliit.echanneling.doctor.dto;

import jakarta.validation.constraints.NotNull;

public class DoctorApprovalDto {
    @NotNull(message = "Approval status is required")
    private Boolean approved;
    private Integer adminId;

    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }

    public Integer getAdminId() { return adminId; }
    public void setAdminId(Integer adminId) { this.adminId = adminId; }
}
