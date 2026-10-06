package com.sliit.echanneling.doctor.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sliit.echanneling.auth.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * OOP Demonstration: Inheritance (Doctor IS A User)
 * Member 2: Adhikari A.M.S.T (IT25103821) - Doctor Management & Administration
 */
@Entity
@Table(name = "Doctors")
@PrimaryKeyJoinColumn(name = "DoctorId")
public class Doctor extends User {

    @Column(name = "MedicalLicenseNo", nullable = false, unique = true, length = 50)
    private String medicalLicenseNo;

    @Column(name = "Specialization", nullable = false, length = 100)
    private String specialization;

    @Column(name = "Qualifications", nullable = false, length = 500)
    private String qualifications;

    @Column(name = "ConsultationFee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(name = "IsApproved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "ApprovedByAdminId")
    private Integer approvedByAdminId;

    @Column(name = "HospitalAffiliation", length = 255)
    private String hospitalAffiliation;

    @Lob
    @Column(name = "ProfileImage", columnDefinition = "NVARCHAR(MAX)")
    private String profileImage;

    public Doctor() {
        super();
        this.setRole("DOCTOR");
    }

    public Doctor(String username, String passwordHash, String fullName, String contactNumber, String nic,
                  String medicalLicenseNo, String specialization, String qualifications, BigDecimal consultationFee,
                  Boolean isApproved, Integer approvedByAdminId, String hospitalAffiliation) {
        super(username, passwordHash, fullName, contactNumber, nic, "DOCTOR");
        this.medicalLicenseNo = medicalLicenseNo;
        this.specialization = specialization;
        this.qualifications = qualifications;
        this.consultationFee = consultationFee;
        this.isApproved = isApproved != null ? isApproved : false;
        this.approvedByAdminId = approvedByAdminId;
        this.hospitalAffiliation = hospitalAffiliation;
    }

    public Doctor(String username, String passwordHash, String fullName, String contactNumber, String nic,
                  String medicalLicenseNo, String specialization, String qualifications, BigDecimal consultationFee,
                  Boolean isApproved, Integer approvedByAdminId, String hospitalAffiliation, String profileImage) {
        super(username, passwordHash, fullName, contactNumber, nic, "DOCTOR");
        this.medicalLicenseNo = medicalLicenseNo;
        this.specialization = specialization;
        this.qualifications = qualifications;
        this.consultationFee = consultationFee;
        this.isApproved = isApproved != null ? isApproved : false;
        this.approvedByAdminId = approvedByAdminId;
        this.hospitalAffiliation = hospitalAffiliation;
        this.profileImage = profileImage;
    }

    // Getters and Setters
    public String getMedicalLicenseNo() { return medicalLicenseNo; }
    public void setMedicalLicenseNo(String medicalLicenseNo) { this.medicalLicenseNo = medicalLicenseNo; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public Boolean getIsApproved() { return isApproved; }
    public void setIsApproved(Boolean isApproved) { this.isApproved = isApproved; }

    public Integer getApprovedByAdminId() { return approvedByAdminId; }
    public void setApprovedByAdminId(Integer approvedByAdminId) { this.approvedByAdminId = approvedByAdminId; }

    public String getHospitalAffiliation() { return hospitalAffiliation; }
    public void setHospitalAffiliation(String hospitalAffiliation) { this.hospitalAffiliation = hospitalAffiliation; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    @JsonProperty("doctorId")
    public Integer getDoctorId() {
        return getUserId();
    }

    @JsonProperty("customDoctorId")
    public String getCustomDoctorId() {
        return getUserId() != null ? String.format("DOC%04d", getUserId()) : null;
    }

    @JsonProperty("customDoctorId")
    public void setCustomDoctorId(String customDoctorId) {
        // Read-only formatted property
    }
}
