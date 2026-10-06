package com.sliit.echanneling.patient.service;

import com.sliit.echanneling.patient.dto.PatientRegistrationDto;
import com.sliit.echanneling.patient.dto.PatientUpdateDto;
import com.sliit.echanneling.patient.entity.Patient;

import java.util.List;

public interface PatientService {
    Patient registerPatient(PatientRegistrationDto dto);
    Patient getPatientById(Integer patientId);
    Patient getPatientByUsername(String username);
    List<Patient> getAllPatients();
    Patient updatePatientProfile(Integer patientId, PatientUpdateDto dto);
    Patient togglePatientStatus(Integer patientId, Boolean isActive);
    void deletePatient(Integer patientId);
}
