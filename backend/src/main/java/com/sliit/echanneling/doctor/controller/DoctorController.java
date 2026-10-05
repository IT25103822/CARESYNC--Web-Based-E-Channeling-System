package com.sliit.echanneling.doctor.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.doctor.dto.*;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.entity.Prescription;
import com.sliit.echanneling.doctor.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 2: Adhikari A.M.S.T (IT25103821) - Doctor REST Controller
 */
@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;

    @Autowired
    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Doctor>> registerDoctor(@Valid @RequestBody DoctorRegistrationDto dto) {
        Doctor created = doctorService.registerDoctor(dto);
        return new ResponseEntity<>(ApiResponse.ok("Doctor registration submitted for verification", created), HttpStatus.CREATED);
    }

    /**
     * Patient-facing: lists only doctors who are approved AND active.
     * Deactivated doctors are hidden from patients automatically.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Doctor>>> getActiveDoctors() {
        List<Doctor> doctors = doctorService.getActiveDoctors();
        return ResponseEntity.ok(ApiResponse.ok("Active approved doctors fetched successfully", doctors));
    }

    /**
     * Patient-facing: returns a single doctor only if approved AND active.
     * Returns 404 if the doctor is deactivated.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Doctor>> getDoctorById(@PathVariable Integer id) {
        Doctor doctor = doctorService.getActiveDoctorById(id);
        return ResponseEntity.ok(ApiResponse.ok("Doctor details fetched successfully", doctor));
    }

    /**
     * Patient-facing: searches only among approved AND active doctors.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Doctor>>> searchBySpecialization(@RequestParam String specialization) {
        List<Doctor> results = doctorService.searchActiveDoctorsBySpecialization(specialization);
        return ResponseEntity.ok(ApiResponse.ok("Doctors matching specialization fetched", results));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Doctor>> updateDoctorProfile(@PathVariable Integer id, @RequestBody DoctorUpdateDto dto) {
        Doctor updated = doctorService.updateDoctorProfile(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Doctor profile updated successfully", updated));
    }

    @PostMapping("/prescriptions")
    public ResponseEntity<ApiResponse<Prescription>> issuePrescription(@Valid @RequestBody PrescriptionCreateDto dto) {
        Prescription prescription = doctorService.issuePrescription(dto);
        return new ResponseEntity<>(ApiResponse.ok("Prescription issued successfully", prescription), HttpStatus.CREATED);
    }

    @GetMapping("/prescriptions/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Prescription>>> getPrescriptionsByPatient(@PathVariable Integer patientId) {
        List<Prescription> prescriptions = doctorService.getPrescriptionsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.ok("Patient prescriptions fetched", prescriptions));
    }

    @GetMapping("/prescriptions/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Prescription>>> getPrescriptionsByDoctor(@PathVariable Integer doctorId) {
        List<Prescription> prescriptions = doctorService.getPrescriptionsByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Doctor prescriptions fetched", prescriptions));
    }
}
