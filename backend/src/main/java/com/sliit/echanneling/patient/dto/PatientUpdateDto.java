package com.sliit.echanneling.patient.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public class PatientUpdateDto {
    private String fullName;
    private String contactNumber;
    private String address;
    private String emergencyContact;
    private String bloodGroup;
    private Integer age;
    private String gender;
    private LocalDate dateOfBirth;

    @JsonProperty("isActive")
    @JsonAlias({"isActive", "active"})
    private Boolean isActive;
    private String profileImage;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    @JsonProperty("isActive")
    public Boolean getIsActive() { return isActive; }

    @JsonProperty("isActive")
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
}
