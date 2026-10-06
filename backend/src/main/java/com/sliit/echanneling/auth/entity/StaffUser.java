package com.sliit.echanneling.auth.entity;

import jakarta.persistence.*;

/**
 * OOP Demonstration: Inheritance (StaffUser IS A User)
 * Represents Controlling Staff, Finance Officer, CSE, Administrator
 */
@Entity
@Table(name = "StaffUsers")
@PrimaryKeyJoinColumn(name = "StaffId")
public class StaffUser extends User {

    @Column(name = "StaffRole", nullable = false, length = 50)
    private String staffRole;

    @Column(name = "Department", length = 100)
    private String department;

    @Column(name = "Permissions", length = 500)
    private String permissions;

    public StaffUser() {
        super();
    }

    public StaffUser(String username, String passwordHash, String fullName, String contactNumber, String nic,
                     String role, String staffRole, String department) {
        super(username, passwordHash, fullName, contactNumber, nic, role);
        this.staffRole = staffRole;
        this.department = department;
    }

    public StaffUser(String username, String passwordHash, String fullName, String contactNumber, String nic,
                     String role, String staffRole, String department, String permissions) {
        super(username, passwordHash, fullName, contactNumber, nic, role);
        this.staffRole = staffRole;
        this.department = department;
        this.permissions = permissions;
    }

    public String getStaffRole() { return staffRole; }
    public void setStaffRole(String staffRole) { this.staffRole = staffRole; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getPermissions() { return permissions; }
    public void setPermissions(String permissions) { this.permissions = permissions; }

    @com.fasterxml.jackson.annotation.JsonProperty("customStaffId")
    public String getCustomStaffId() {
        return getUserId() != null ? String.format("STAFF%04d", getUserId()) : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("customStaffId")
    public void setCustomStaffId(String customStaffId) {
        // Read-only formatted property
    }
}
