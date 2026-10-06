package com.sliit.echanneling.doctor.service;

import com.sliit.echanneling.doctor.dto.*;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.entity.Prescription;

import java.util.List;

/**
 * OOP Demonstration: Abstraction
 * Member 2: Adhikari A.M.S.T (IT25103821) - Doctor Management & Admin Interface
 */
public interface DoctorService {
    Doctor registerDoctor(DoctorRegistrationDto dto);

    // ── Admin-facing (no isActive filter) ──────────────────────────────────
    Doctor getDoctorById(Integer doctorId);
    List<Doctor> getAllDoctors();
    List<Doctor> getApprovedDoctors();
    List<Doctor> getPendingDoctors();
    Doctor updateDoctorProfile(Integer doctorId, DoctorUpdateDto dto);
    Doctor approveOrRejectDoctor(Integer doctorId, DoctorApprovalDto dto);
    Doctor toggleDoctorStatus(Integer doctorId, Boolean isActive);
    void deleteDoctor(Integer doctorId);

    // ── Patient-facing (only approved AND active doctors are returned) ──────
    List<Doctor> getActiveDoctors();
    List<Doctor> searchActiveDoctorsBySpecialization(String specialization);
    Doctor getActiveDoctorById(Integer doctorId);

    // ── Prescription ────────────────────────────────────────────────────────
    Prescription issuePrescription(PrescriptionCreateDto dto);
    List<Prescription> getPrescriptionsByPatient(Integer patientId);
    List<Prescription> getPrescriptionsByDoctor(Integer doctorId);
}
