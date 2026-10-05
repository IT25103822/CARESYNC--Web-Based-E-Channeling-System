package com.sliit.echanneling.patient.service;

import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.patient.dto.PatientRegistrationDto;
import com.sliit.echanneling.patient.dto.PatientUpdateDto;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Member 1: Jayasundara U.R (IT25103820) - Patient Management Implementation
 */
@Service
@Transactional
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Autowired
    public PatientServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public Patient registerPatient(PatientRegistrationDto dto) {
        if (patientRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username '" + dto.getUsername() + "' is already taken.");
        }
        if (patientRepository.existsByNic(dto.getNic())) {
            throw new BadRequestException("NIC '" + dto.getNic() + "' is already registered.");
        }

        Integer calculatedAge = dto.getAge();
        if (dto.getDateOfBirth() != null) {
            int years = java.time.Period.between(dto.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            calculatedAge = years >= 0 ? years : 0;
        }
        if (calculatedAge == null) {
            calculatedAge = 0;
        }

        Patient patient = new Patient(
                dto.getUsername(),
                dto.getPassword(), // Encrypted or plain in dev
                dto.getFullName(),
                dto.getContactNumber(),
                dto.getNic(),
                dto.getDateOfBirth(),
                dto.getGender(),
                dto.getAddress(),
                dto.getBloodGroup(),
                calculatedAge,
                dto.getEmergencyContact()
        );

        if (dto.getProfileImage() != null && !dto.getProfileImage().isBlank()) {
            patient.setProfileImage(dto.getProfileImage());
        }

        return patientRepository.save(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public Patient getPatientById(Integer patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));
    }

    @Override
    @Transactional(readOnly = true)
    public Patient getPatientByUsername(String username) {
        return patientRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with username: " + username));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @Override
    public Patient updatePatientProfile(Integer patientId, PatientUpdateDto dto) {
        Patient patient = getPatientById(patientId);

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            patient.setFullName(dto.getFullName());
        }
        if (dto.getContactNumber() != null && !dto.getContactNumber().isBlank()) {
            patient.setContactNumber(dto.getContactNumber());
        }
        if (dto.getAddress() != null && !dto.getAddress().isBlank()) {
            patient.setAddress(dto.getAddress());
        }
        if (dto.getEmergencyContact() != null) {
            patient.setEmergencyContact(dto.getEmergencyContact());
        }
        if (dto.getBloodGroup() != null && !dto.getBloodGroup().isBlank()) {
            patient.setBloodGroup(dto.getBloodGroup());
        }
        if (dto.getGender() != null && !dto.getGender().isBlank()) {
            patient.setGender(dto.getGender());
        }
        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(dto.getDateOfBirth());
            int years = java.time.Period.between(dto.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            patient.setAge(years >= 0 ? years : 0);
        } else if (dto.getAge() != null) {
            patient.setAge(dto.getAge());
        }
        if (dto.getIsActive() != null) {
            patient.setIsActive(dto.getIsActive());
        }
        if (dto.getProfileImage() != null) {
            patient.setProfileImage(dto.getProfileImage());
        }

        return patientRepository.saveAndFlush(patient);
    }

    @Override
    public Patient togglePatientStatus(Integer patientId, Boolean isActive) {
        Patient patient = getPatientById(patientId);
        patient.setIsActive(isActive);
        return patientRepository.saveAndFlush(patient);
    }

    @Override
    public void deletePatient(Integer patientId) {
        Patient patient = getPatientById(patientId);
        patient.setIsActive(false);
        patientRepository.saveAndFlush(patient);
    }
}
