package com.sliit.echanneling.auth.dto;

public class LoginResponseDto {
    private Integer userId;
    private String username;
    private String fullName;
    private String role;
    private String token;
    private Object profileDetails;

    public LoginResponseDto() {}

    public LoginResponseDto(Integer userId, String username, String fullName, String role, String token, Object profileDetails) {
        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
        this.token = token;
        this.profileDetails = profileDetails;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Object getProfileDetails() { return profileDetails; }
    public void setProfileDetails(Object profileDetails) { this.profileDetails = profileDetails; }
}
