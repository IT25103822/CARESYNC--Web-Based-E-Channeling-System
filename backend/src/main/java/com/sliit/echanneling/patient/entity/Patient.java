package com.sliit.echanneling.patient.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sliit.echanneling.auth.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * OOP Demonstration: Inheritance (Patient IS A User)
 * Member 1: Jayasundara U.R (IT25103820) - Patient Management
 */
@Entity
@Table(name = "Patients")
@PrimaryKeyJoinColumn(name = "PatientId")
public class Patient extends User {

    @Column(name = "DateOfBirth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "Gender", nullable = false, length = 20)
    private String gender;

    @Column(name = "Address", nullable = false, length = 500)
    private String address;

    @Column(name = "BloodGroup", nullable = false, length = 20)
    private String bloodGroup;

    @Column(name = "Age", nullable = false)
    private Integer age;

    @Column(name = "EmergencyContact", length = 50)
    private String emergencyContact;

    @Lob
    @Column(name = "ProfileImage", columnDefinition = "NVARCHAR(MAX)")
    private String profileImage;

    public Patient() {
        super();
        this.setRole("PATIENT");
    }

    public Patient(String username, String passwordHash, String fullName, String contactNumber, String nic,
                   LocalDate dateOfBirth, String gender, String address, String bloodGroup, Integer age, String emergencyContact) {
        super(username, passwordHash, fullName, contactNumber, nic, "PATIENT");
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.bloodGroup = bloodGroup;
        this.age = age;
        this.emergencyContact = emergencyContact;
    }

    // Getters and Setters
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    @JsonProperty("patientId")
    public Integer getPatientId() {
        return getUserId();
    }

    @JsonProperty("customPatientId")
    public String getCustomPatientId() {
        return getUserId() != null ? String.format("PAT%04d", getUserId()) : null;
    }

    @JsonProperty("customPatientId")
    public void setCustomPatientId(String customPatientId) {
        // Read-only formatted property
    }
}
