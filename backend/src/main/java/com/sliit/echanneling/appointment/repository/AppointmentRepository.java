package com.sliit.echanneling.appointment.repository;

import com.sliit.echanneling.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Member 4: Devindra P.P.C.G (IT25103823) - Appointment Management Repository
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByPatient_UserIdOrderByAppointmentDateDescStartTimeDesc(Integer patientId);
    List<Appointment> findByDoctor_UserIdOrderByAppointmentDateDescStartTimeDesc(Integer doctorId);
    List<Appointment> findByDoctor_UserIdAndAppointmentDate(Integer doctorId, LocalDate date);
    List<Appointment> findBySchedule_ScheduleId(Integer scheduleId);
    boolean existsByTimeslot_TimeslotIdAndAppointmentStatusNot(Integer timeslotId, String appointmentStatus);
}
