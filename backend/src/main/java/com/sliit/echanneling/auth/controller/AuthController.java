package com.sliit.echanneling.auth.controller;

import com.sliit.echanneling.auth.dto.LoginRequestDto;
import com.sliit.echanneling.auth.dto.LoginResponseDto;
import com.sliit.echanneling.auth.dto.PasswordResetDto;
import com.sliit.echanneling.auth.dto.RecoveryVerificationDto;
import com.sliit.echanneling.auth.service.AuthService;
import com.sliit.echanneling.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - User Login & Feedback Management
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto dto) {
        LoginResponseDto response = authService.login(dto);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/verify-recovery")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyRecovery(@Valid @RequestBody RecoveryVerificationDto dto) {
        Map<String, Object> result = authService.verifyRecoveryIdentity(dto);
        return ResponseEntity.ok(ApiResponse.ok("Identity verified successfully", result));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody PasswordResetDto dto) {
        authService.resetPassword(dto);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully", "Success"));
    }
}
