package com.sliit.echanneling.patient.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.patient.dto.PatientRegistrationDto;
import com.sliit.echanneling.patient.dto.PatientUpdateDto;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 1: Jayasundara U.R (IT25103820) - Patient Management REST Controller
 */
@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    @Autowired
    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Patient>> registerPatient(@Valid @RequestBody PatientRegistrationDto dto) {
        Patient createdPatient = patientService.registerPatient(dto);
        return new ResponseEntity<>(ApiResponse.ok("Patient registered successfully", createdPatient), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Patient>> getPatientById(@PathVariable Integer id) {
        Patient patient = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.ok("Patient details fetched successfully", patient));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<ApiResponse<Patient>> getPatientByUsername(@PathVariable String username) {
        Patient patient = patientService.getPatientByUsername(username);
        return ResponseEntity.ok(ApiResponse.ok("Patient details fetched successfully", patient));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Patient>>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return ResponseEntity.ok(ApiResponse.ok("All patients fetched successfully", patients));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Patient>> updatePatientProfile(@PathVariable Integer id, @RequestBody PatientUpdateDto dto) {
        // Patient self-update is strictly restricted to: contact numbers (primary & emergency), address, and profile picture.
        // Identity details (Full Name, NIC, Date of Birth, Age, Gender, Blood Group, Active Status) are protected and cannot be altered by patients.
        PatientUpdateDto restrictedDto = new PatientUpdateDto();
        restrictedDto.setContactNumber(dto.getContactNumber());
        restrictedDto.setEmergencyContact(dto.getEmergencyContact());
        restrictedDto.setAddress(dto.getAddress());
        restrictedDto.setProfileImage(dto.getProfileImage());

        Patient updated = patientService.updatePatientProfile(id, restrictedDto);
        return ResponseEntity.ok(ApiResponse.ok("Patient profile updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Patient>> togglePatientStatus(@PathVariable Integer id, @RequestParam Boolean isActive) {
        Patient updated = patientService.togglePatientStatus(id, isActive);
        String statusStr = Boolean.TRUE.equals(isActive) ? "activated" : "deactivated";
        return ResponseEntity.ok(ApiResponse.ok("Patient account " + statusStr + " successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePatient(@PathVariable Integer id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.ok("Patient account deactivated successfully", "Success"));
    }
}
