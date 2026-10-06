package com.sliit.echanneling.appointment.service;

import com.sliit.echanneling.appointment.dto.BookAppointmentDto;
import com.sliit.echanneling.appointment.dto.RescheduleAppointmentDto;
import com.sliit.echanneling.appointment.entity.Appointment;

import java.util.List;

/**
 * OOP Demonstration: Abstraction
 * Member 4: Devindra P.P.C.G (IT25103823) - Appointment Management Interface
 */
public interface AppointmentService {
    Appointment bookAppointment(BookAppointmentDto dto);
    Appointment getAppointmentById(Integer appointmentId);
    List<Appointment> getAppointmentsByPatient(Integer patientId);
    List<Appointment> getAppointmentsByDoctor(Integer doctorId);
    List<Appointment> getAllAppointments();
    Appointment rescheduleAppointment(Integer appointmentId, RescheduleAppointmentDto dto);
    Appointment cancelAppointment(Integer appointmentId);
    void deleteAppointment(Integer appointmentId);
}
