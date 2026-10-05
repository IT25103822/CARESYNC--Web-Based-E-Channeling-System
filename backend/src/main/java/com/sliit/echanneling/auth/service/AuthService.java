package com.sliit.echanneling.auth.service;

import com.sliit.echanneling.auth.dto.LoginRequestDto;
import com.sliit.echanneling.auth.dto.LoginResponseDto;
import com.sliit.echanneling.auth.dto.PasswordResetDto;
import com.sliit.echanneling.auth.dto.RecoveryVerificationDto;
import com.sliit.echanneling.auth.entity.User;
import java.util.Map;

/**
 * OOP Demonstration: Abstraction
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - User Login & Feedback Management
 */
public interface AuthService {
    LoginResponseDto login(LoginRequestDto dto);
    Map<String, Object> verifyRecoveryIdentity(RecoveryVerificationDto dto);
    void resetPassword(PasswordResetDto dto);
    User getUserByUsername(String username);
    User getUserById(Integer userId);
}
