package com.sliit.echanneling.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class PasswordResetDto {
    @NotBlank(message = "Username or NIC is required")
    private String identifier;

    @NotBlank(message = "New password is required")
    private String newPassword;

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
