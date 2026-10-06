package com.sliit.echanneling.doctor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class DoctorRegistrationDto {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;

    @NotBlank(message = "NIC is required")
    private String nic;

    @NotBlank(message = "Medical license number is required")
    private String medicalLicenseNo;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Qualifications are required")
    private String qualifications;

    @NotNull(message = "Consultation fee is required")
    private BigDecimal consultationFee;

    private String hospitalAffiliation;
    private String profileImage;

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }

    public String getMedicalLicenseNo() { return medicalLicenseNo; }
    public void setMedicalLicenseNo(String medicalLicenseNo) { this.medicalLicenseNo = medicalLicenseNo; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public String getHospitalAffiliation() { return hospitalAffiliation; }
    public void setHospitalAffiliation(String hospitalAffiliation) { this.hospitalAffiliation = hospitalAffiliation; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
}
