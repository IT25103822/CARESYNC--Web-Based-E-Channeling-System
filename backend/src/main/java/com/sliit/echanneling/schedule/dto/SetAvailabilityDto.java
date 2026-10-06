package com.sliit.echanneling.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class SetAvailabilityDto {
    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;

    @NotBlank(message = "Status is required (SCHEDULED/ON_LEAVE/CANCELLED)")
    private String status;

    private String reason;

    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
