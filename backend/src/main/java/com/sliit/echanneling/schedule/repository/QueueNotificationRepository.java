package com.sliit.echanneling.schedule.repository;

import com.sliit.echanneling.schedule.entity.QueueNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Queue Notification Repository
 */
@Repository
public interface QueueNotificationRepository extends JpaRepository<QueueNotification, Integer> {
    List<QueueNotification> findByScheduleIdOrderBySentAtDesc(Integer scheduleId);
    List<QueueNotification> findByPatientIdOrderBySentAtDesc(Integer patientId);
    List<QueueNotification> findTop20ByScheduleIdOrderBySentAtDesc(Integer scheduleId);
    List<QueueNotification> findTop10ByPatientIdOrderBySentAtDesc(Integer patientId);

    @Query("SELECT q FROM QueueNotification q WHERE q.patientId = :patientId OR q.userId = :patientId ORDER BY q.sentAt DESC")
    List<QueueNotification> findForPatient(@Param("patientId") Integer patientId);

    @Query("SELECT q FROM QueueNotification q WHERE q.doctorId = :doctorId OR (q.userId = :doctorId AND q.targetRole = 'DOCTOR') ORDER BY q.sentAt DESC")
    List<QueueNotification> findForDoctor(@Param("doctorId") Integer doctorId);

    @Query("SELECT q FROM QueueNotification q WHERE (q.userId = :userId) OR (q.targetRole = 'ALL') OR (q.targetRole = :role) OR (:role LIKE '%COORDINATOR%' AND q.targetRole = 'COORDINATOR') OR (:role = 'PATIENT' AND q.patientId = :userId) OR (:role = 'DOCTOR' AND q.doctorId = :userId) ORDER BY q.sentAt DESC")
    List<QueueNotification> findByUserAndRole(@Param("userId") Integer userId, @Param("role") String role);
}
