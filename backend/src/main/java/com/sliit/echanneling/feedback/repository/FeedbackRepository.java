package com.sliit.echanneling.feedback.repository;

import com.sliit.echanneling.feedback.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - Feedback Repository
 */
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    List<Feedback> findByDoctor_UserIdOrderBySubmittedDateDesc(Integer doctorId);
    List<Feedback> findByPatient_UserIdOrderBySubmittedDateDesc(Integer patientId);
    Optional<Feedback> findByAppointment_AppointmentId(Integer appointmentId);
    List<Feedback> findAllByOrderBySubmittedDateDesc();
    List<Feedback> findByIsFeaturedTrueOrderBySubmittedDateDesc();
}
