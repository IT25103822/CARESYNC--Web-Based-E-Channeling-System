package com.sliit.echanneling.feedback.entity;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.patient.entity.Patient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Feedback Entity
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - User Login & Feedback Management
 */
@Entity
@Table(name = "Feedbacks")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FeedbackId")
    private Integer feedbackId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PatientId", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DoctorId", nullable = false)
    private Doctor doctor;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AppointmentId", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "Rating", nullable = false)
    private Integer rating; // 1 to 5

    @Column(name = "Comments", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "SubmittedDate", nullable = false)
    private LocalDateTime submittedDate = LocalDateTime.now();

    @Column(name = "IsFeatured", nullable = false)
    private Boolean isFeatured = false;

    public Feedback() {}

    public Feedback(Patient patient, Doctor doctor, Appointment appointment, Integer rating, String comments) {
        this.patient = patient;
        this.doctor = doctor;
        this.appointment = appointment;
        this.rating = rating;
        this.comments = comments;
        this.submittedDate = LocalDateTime.now();
        this.isFeatured = false;
    }

    // Getters and Setters
    public Integer getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Integer feedbackId) { this.feedbackId = feedbackId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public LocalDateTime getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(LocalDateTime submittedDate) { this.submittedDate = submittedDate; }

    public Boolean getIsFeatured() { return isFeatured != null ? isFeatured : false; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured != null ? isFeatured : false; }
}
