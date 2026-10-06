package com.sliit.echanneling.appointment.controller;

import com.sliit.echanneling.appointment.dto.BookAppointmentDto;
import com.sliit.echanneling.appointment.dto.RescheduleAppointmentDto;
import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.service.AppointmentService;
import com.sliit.echanneling.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 4: Devindra P.P.C.G (IT25103823) - Appointment Management REST Controller
 */
@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @Autowired
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Appointment>> bookAppointment(@Valid @RequestBody BookAppointmentDto dto) {
        Appointment appointment = appointmentService.bookAppointment(dto);
        return new ResponseEntity<>(ApiResponse.ok("Doctor appointment booked and timeslot reserved successfully", appointment), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Appointment>> getAppointmentById(@PathVariable Integer id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment details fetched", appointment));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAppointmentsByPatient(@PathVariable Integer patientId) {
        List<Appointment> list = appointmentService.getAppointmentsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.ok("Patient appointments fetched", list));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAppointmentsByDoctor(@PathVariable Integer doctorId) {
        List<Appointment> list = appointmentService.getAppointmentsByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Doctor appointments fetched", list));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Appointment>>> getAllAppointments() {
        List<Appointment> list = appointmentService.getAllAppointments();
        return ResponseEntity.ok(ApiResponse.ok("All channeling appointments fetched", list));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse<Appointment>> rescheduleAppointment(@PathVariable Integer id, @Valid @RequestBody RescheduleAppointmentDto dto) {
        Appointment updated = appointmentService.rescheduleAppointment(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rescheduled successfully to new timeslot", updated));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Appointment>> cancelAppointment(@PathVariable Integer id) {
        Appointment cancelled = appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled and timeslot released successfully", cancelled));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAppointment(@PathVariable Integer id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment permanently deleted successfully", "Success"));
    }
}
