package com.sliit.echanneling.doctor.repository;

import com.sliit.echanneling.doctor.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    List<Prescription> findByPatient_UserId(Integer patientId);
    List<Prescription> findByDoctor_UserId(Integer doctorId);
    Optional<Prescription> findByAppointment_AppointmentId(Integer appointmentId);
}
