package com.sliit.echanneling.patient.repository;

import com.sliit.echanneling.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {
    Optional<Patient> findByUsername(String username);
    Optional<Patient> findByNic(String nic);
    boolean existsByUsername(String username);
    boolean existsByNic(String nic);
}
