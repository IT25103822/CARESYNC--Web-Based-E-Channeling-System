package com.sliit.echanneling.auth.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

/**
 * DTO for verifying user identity before password recovery
 * Requires: NIC, Birthday (Date of Birth), and Mobile Number
 */
public class RecoveryVerificationDto {

    @NotBlank(message = "NIC number is required")
    private String nic;

    private LocalDate dateOfBirth;

    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    public RecoveryVerificationDto() {}

    public RecoveryVerificationDto(String nic, LocalDate dateOfBirth, String mobileNumber) {
        this.nic = nic;
        this.dateOfBirth = dateOfBirth;
        this.mobileNumber = mobileNumber;
    }

    public String getNic() {
        return nic;
    }

    public void setNic(String nic) {
        this.nic = nic;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }
}
