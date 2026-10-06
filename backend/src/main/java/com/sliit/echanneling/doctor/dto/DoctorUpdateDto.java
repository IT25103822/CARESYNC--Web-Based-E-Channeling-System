package com.sliit.echanneling.doctor.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class DoctorUpdateDto {
    private String fullName;
    private String contactNumber;
    private String specialization;
    private String qualifications;
    private BigDecimal consultationFee;
    private String hospitalAffiliation;
    private String medicalLicenseNo;
    private String profileImage;

    @JsonProperty("isActive")
    @JsonAlias({"isActive", "active"})
    private Boolean isActive;

    @JsonProperty("isApproved")
    @JsonAlias({"isApproved", "approved"})
    private Boolean isApproved;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public String getHospitalAffiliation() { return hospitalAffiliation; }
    public void setHospitalAffiliation(String hospitalAffiliation) { this.hospitalAffiliation = hospitalAffiliation; }

    public String getMedicalLicenseNo() { return medicalLicenseNo; }
    public void setMedicalLicenseNo(String medicalLicenseNo) { this.medicalLicenseNo = medicalLicenseNo; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    @JsonProperty("isActive")
    public Boolean getIsActive() { return isActive; }

    @JsonProperty("isActive")
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    @JsonProperty("isApproved")
    public Boolean getIsApproved() { return isApproved; }

    @JsonProperty("isApproved")
    public void setIsApproved(Boolean isApproved) { this.isApproved = isApproved; }
}
