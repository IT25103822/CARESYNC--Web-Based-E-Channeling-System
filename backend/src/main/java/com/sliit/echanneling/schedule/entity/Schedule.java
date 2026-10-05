package com.sliit.echanneling.schedule.entity;

import com.sliit.echanneling.doctor.entity.Doctor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Doctor Schedule Entity
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule Management
 */
@Entity
@Table(name = "Schedules")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ScheduleId")
    private Integer scheduleId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DoctorId", nullable = false)
    private Doctor doctor;

    @Column(name = "CoordinatorId")
    private Integer coordinatorId;

    @Column(name = "ScheduleDate", nullable = false)
    private LocalDate scheduleDate;

    @Column(name = "StartTime", nullable = false)
    private LocalTime startTime;

    @Column(name = "EndTime", nullable = false)
    private LocalTime endTime;

    @Column(name = "MaxCapacity", nullable = false)
    private Integer maxCapacity = 20;

    @Column(name = "HospitalLocation", nullable = false, length = 150)
    private String hospitalLocation;

    @Column(name = "Status", nullable = false, length = 50)
    private String status = "SCHEDULED"; // SCHEDULED, FULLY_BOOKED, CANCELLED, COMPLETED, ON_LEAVE

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "DoctorArrivalStatus", length = 50)
    private String doctorArrivalStatus = "NOT_ARRIVED"; // NOT_ARRIVED, ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED

    @Column(name = "DoctorArrivalTime")
    private LocalTime doctorArrivalTime;

    @Column(name = "CurrentToken")
    private Integer currentToken = 0;

    @Column(name = "EstimatedDelayMinutes")
    private Integer estimatedDelayMinutes = 0;

    @Column(name = "QueueStatusNote", length = 255)
    private String queueStatusNote;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("schedule")
    private List<Timeslot> timeslots = new ArrayList<>();

    public Schedule() {}

    public Schedule(Doctor doctor, Integer coordinatorId, LocalDate scheduleDate, LocalTime startTime,
                    LocalTime endTime, Integer maxCapacity, String hospitalLocation, String status) {
        this.doctor = doctor;
        this.coordinatorId = coordinatorId;
        this.scheduleDate = scheduleDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxCapacity = maxCapacity;
        this.hospitalLocation = hospitalLocation;
        this.status = status != null ? status : "SCHEDULED";
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Integer getCoordinatorId() { return coordinatorId; }
    public void setCoordinatorId(Integer coordinatorId) { this.coordinatorId = coordinatorId; }

    public LocalDate getScheduleDate() { return scheduleDate; }
    public void setScheduleDate(LocalDate scheduleDate) { this.scheduleDate = scheduleDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public String getHospitalLocation() { return hospitalLocation; }
    public void setHospitalLocation(String hospitalLocation) { this.hospitalLocation = hospitalLocation; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Timeslot> getTimeslots() { return timeslots; }
    public void setTimeslots(List<Timeslot> timeslots) { this.timeslots = timeslots; }

    public String getDoctorArrivalStatus() { return doctorArrivalStatus; }
    public void setDoctorArrivalStatus(String doctorArrivalStatus) { this.doctorArrivalStatus = doctorArrivalStatus; }

    public LocalTime getDoctorArrivalTime() { return doctorArrivalTime; }
    public void setDoctorArrivalTime(LocalTime doctorArrivalTime) { this.doctorArrivalTime = doctorArrivalTime; }

    public Integer getCurrentToken() { return currentToken; }
    public void setCurrentToken(Integer currentToken) { this.currentToken = currentToken; }

    public Integer getEstimatedDelayMinutes() { return estimatedDelayMinutes; }
    public void setEstimatedDelayMinutes(Integer estimatedDelayMinutes) { this.estimatedDelayMinutes = estimatedDelayMinutes; }

    public String getQueueStatusNote() { return queueStatusNote; }
    public void setQueueStatusNote(String queueStatusNote) { this.queueStatusNote = queueStatusNote; }
}
