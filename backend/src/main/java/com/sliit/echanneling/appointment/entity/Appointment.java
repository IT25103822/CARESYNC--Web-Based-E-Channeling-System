package com.sliit.echanneling.appointment.entity;

import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.entity.Timeslot;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * Appointment Entity
 * Member 4: Devindra P.P.C.G (IT25103823) - Appointment Management
 */
@Entity
@Table(name = "Appointments")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AppointmentId")
    private Integer appointmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PatientId", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DoctorId", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ScheduleId", nullable = false)
    private Schedule schedule;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TimeslotId", nullable = false, unique = true)
    private Timeslot timeslot;

    @Column(name = "BookingDate", nullable = false)
    private LocalDateTime bookingDate = LocalDateTime.now();

    @Column(name = "AppointmentDate", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "StartTime", nullable = false)
    private LocalTime startTime;

    @Column(name = "EndTime", nullable = false)
    private LocalTime endTime;

    @Column(name = "AppointmentStatus", nullable = false, length = 50)
    private String appointmentStatus = "CONFIRMED"; // PENDING_PAYMENT, CONFIRMED, RESCHEDULED, CANCELLED, COMPLETED

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Appointment() {}

    public Appointment(Patient patient, Doctor doctor, Schedule schedule, Timeslot timeslot,
                       LocalDate appointmentDate, LocalTime startTime, LocalTime endTime, String appointmentStatus) {
        this.patient = patient;
        this.doctor = doctor;
        this.schedule = schedule;
        this.timeslot = timeslot;
        this.appointmentDate = appointmentDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.appointmentStatus = appointmentStatus != null ? appointmentStatus : "CONFIRMED";
        this.bookingDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Schedule getSchedule() { return schedule; }
    public void setSchedule(Schedule schedule) { this.schedule = schedule; }

    public Timeslot getTimeslot() { return timeslot; }
    public void setTimeslot(Timeslot timeslot) { this.timeslot = timeslot; }

    public LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDateTime bookingDate) { this.bookingDate = bookingDate; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public String getAppointmentStatus() { return appointmentStatus; }
    public void setAppointmentStatus(String appointmentStatus) { this.appointmentStatus = appointmentStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
