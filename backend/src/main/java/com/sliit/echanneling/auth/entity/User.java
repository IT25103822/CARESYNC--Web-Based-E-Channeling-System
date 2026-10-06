package com.sliit.echanneling.auth.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * OOP Core Entity: Base User class using Joined Table Inheritance.
 * Demonstrates: Encapsulation, Abstraction, and Inheritance.
 * 
 * Subclasses: Patient, Doctor, StaffUser
 */
@Entity
@Table(name = "Users")
@Inheritance(strategy = InheritanceType.JOINED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserId")
    private Integer userId;

    @Column(name = "Username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "PasswordHash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "FullName", nullable = false, length = 255)
    private String fullName;

    @Column(name = "ContactNumber", nullable = false, length = 50)
    private String contactNumber;

    @Column(name = "NIC", nullable = false, unique = true, length = 20)
    private String nic;

    @Column(name = "Role", nullable = false, length = 50)
    private String role; // PATIENT, DOCTOR, ADMINISTRATOR, CHANNELING_COORDINATOR, FINANCE_OFFICER, CUSTOMER_SERVICE_EXECUTIVE

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonProperty("isActive")
    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    // Default Constructor
    public User() {}

    // Parameterized Constructor
    public User(String username, String passwordHash, String fullName, String contactNumber, String nic, String role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.contactNumber = contactNumber;
        this.nic = nic;
        this.role = role;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }

    // Getters and Setters (Encapsulation)
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @JsonProperty("isActive")
    public Boolean getIsActive() { return isActive; }

    @JsonProperty("isActive")
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    @JsonProperty("customId")
    public String getCustomId() {
        if (userId == null) return null;
        if ("DOCTOR".equalsIgnoreCase(role)) {
            return String.format("DOC%04d", userId);
        } else if ("PATIENT".equalsIgnoreCase(role)) {
            return String.format("PAT%04d", userId);
        } else {
            return String.format("STAFF%04d", userId);
        }
    }

    @JsonProperty("customId")
    public void setCustomId(String customId) {
        // Read-only formatted property
    }
}
