package com.sliit.echanneling.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class RescheduleAppointmentDto {

    @NotNull(message = "New Schedule ID is required")
    private Integer newScheduleId;

    @NotNull(message = "New Timeslot ID is required")
    private Integer newTimeslotId;

    @NotNull(message = "New Appointment Date is required")
    private LocalDate newAppointmentDate;

    @NotNull(message = "New Start Time is required")
    private LocalTime newStartTime;

    @NotNull(message = "New End Time is required")
    private LocalTime newEndTime;

    // Getters and Setters
    public Integer getNewScheduleId() { return newScheduleId; }
    public void setNewScheduleId(Integer newScheduleId) { this.newScheduleId = newScheduleId; }

    public Integer getNewTimeslotId() { return newTimeslotId; }
    public void setNewTimeslotId(Integer newTimeslotId) { this.newTimeslotId = newTimeslotId; }

    public LocalDate getNewAppointmentDate() { return newAppointmentDate; }
    public void setNewAppointmentDate(LocalDate newAppointmentDate) { this.newAppointmentDate = newAppointmentDate; }

    public LocalTime getNewStartTime() { return newStartTime; }
    public void setNewStartTime(LocalTime newStartTime) { this.newStartTime = newStartTime; }

    public LocalTime getNewEndTime() { return newEndTime; }
    public void setNewEndTime(LocalTime newEndTime) { this.newEndTime = newEndTime; }
}
