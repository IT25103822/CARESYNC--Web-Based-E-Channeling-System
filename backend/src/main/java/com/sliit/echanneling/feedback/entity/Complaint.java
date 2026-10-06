package com.sliit.echanneling.feedback.entity;

import com.sliit.echanneling.patient.entity.Patient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Complaint Entity
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - User Login & Feedback Management
 */
@Entity
@Table(name = "Complaints")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ComplaintId")
    private Integer complaintId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PatientId", nullable = false)
    private Patient patient;

    @Column(name = "CustomerServiceId")
    private Integer customerServiceId;

    @Column(name = "ComplaintType", nullable = false, length = 100)
    private String complaintType; // DELAY, STAFF_BEHAVIOR, PAYMENT_ISSUE, CANCELLATION, OTHER

    @Column(name = "Description", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "ComplaintStatus", nullable = false, length = 50)
    private String complaintStatus = "PENDING"; // PENDING, IN_PROGRESS, RESOLVED, CLOSED

    @Column(name = "DateSubmitted", nullable = false)
    private LocalDateTime dateSubmitted = LocalDateTime.now();

    @Column(name = "ResolutionNotes", columnDefinition = "NVARCHAR(MAX)")
    private String resolutionNotes;

    @Column(name = "ResolvedDate")
    private LocalDateTime resolvedDate;

    public Complaint() {}

    public Complaint(Patient patient, String complaintType, String description) {
        this.patient = patient;
        this.complaintType = complaintType;
        this.description = description;
        this.complaintStatus = "PENDING";
        this.dateSubmitted = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getComplaintId() { return complaintId; }
    public void setComplaintId(Integer complaintId) { this.complaintId = complaintId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Integer getCustomerServiceId() { return customerServiceId; }
    public void setCustomerServiceId(Integer customerServiceId) { this.customerServiceId = customerServiceId; }

    public String getComplaintType() { return complaintType; }
    public void setComplaintType(String complaintType) { this.complaintType = complaintType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getComplaintStatus() { return complaintStatus; }
    public void setComplaintStatus(String complaintStatus) { this.complaintStatus = complaintStatus; }

    public LocalDateTime getDateSubmitted() { return dateSubmitted; }
    public void setDateSubmitted(LocalDateTime dateSubmitted) { this.dateSubmitted = dateSubmitted; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public LocalDateTime getResolvedDate() { return resolvedDate; }
    public void setResolvedDate(LocalDateTime resolvedDate) { this.resolvedDate = resolvedDate; }
}
