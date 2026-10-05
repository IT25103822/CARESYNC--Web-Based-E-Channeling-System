package com.sliit.echanneling.doctor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PrescriptionCreateDto {
    @NotNull(message = "Appointment ID is required")
    private Integer appointmentId;

    @NotNull(message = "Doctor ID is required")
    private Integer doctorId;

    @NotNull(message = "Patient ID is required")
    private Integer patientId;

    @NotBlank(message = "Prescription details are required")
    private String details;

    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public Integer getDoctorId() { return doctorId; }
    public void setDoctorId(Integer doctorId) { this.doctorId = doctorId; }

    public Integer getPatientId() { return patientId; }
    public void setPatientId(Integer patientId) { this.patientId = patientId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
