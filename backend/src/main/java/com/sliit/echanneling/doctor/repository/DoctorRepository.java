package com.sliit.echanneling.doctor.repository;

import com.sliit.echanneling.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Member 2: Adhikari A.M.S.T (IT25103821) - Doctor Management & Administration
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    Optional<Doctor> findByUsername(String username);
    Optional<Doctor> findByMedicalLicenseNo(String licenseNo);
    boolean existsByMedicalLicenseNo(String licenseNo);
    boolean existsByUsername(String username);
    boolean existsByNic(String nic);

    // Admin views (approval status only — does not filter by isActive)
    List<Doctor> findByIsApprovedTrue();
    List<Doctor> findByIsApprovedFalse();

    // Patient-facing views: only approved AND active doctors are visible
    List<Doctor> findByIsApprovedTrueAndIsActiveTrue();
    List<Doctor> findBySpecializationContainingIgnoreCaseAndIsApprovedTrueAndIsActiveTrue(String specialization);
}
