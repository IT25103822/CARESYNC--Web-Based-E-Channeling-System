package com.sliit.echanneling.doctor.entity;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.patient.entity.Patient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Prescription Entity
 * Doctor ISSUES Prescription, Appointment GENERATES FOR Prescription
 */
@Entity
@Table(name = "Prescriptions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PrescriptionId")
    private Integer prescriptionId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AppointmentId", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DoctorId", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PatientId", nullable = false)
    private Patient patient;

    @Column(name = "IssueDate", nullable = false)
    private LocalDateTime issueDate = LocalDateTime.now();

    @Column(name = "Details", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String details;

    public Prescription() {}

    public Prescription(Appointment appointment, Doctor doctor, Patient patient, String details) {
        this.appointment = appointment;
        this.doctor = doctor;
        this.patient = patient;
        this.details = details;
        this.issueDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Integer prescriptionId) { this.prescriptionId = prescriptionId; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
