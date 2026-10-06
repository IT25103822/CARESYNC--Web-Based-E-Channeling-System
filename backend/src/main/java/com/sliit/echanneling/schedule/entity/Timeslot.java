package com.sliit.echanneling.schedule.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalTime;

/**
 * Individual Timeslot Entity
 * Represents specific consultation slot inside a Doctor's Schedule
 */
@Entity
@Table(name = "Timeslots")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Timeslot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TimeslotId")
    private Integer timeslotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ScheduleId", nullable = false)
    @JsonIgnoreProperties("timeslots")
    private Schedule schedule;

    @Column(name = "SlotNo", nullable = false)
    private Integer slotNo;

    @Column(name = "SlotTime", nullable = false)
    private LocalTime slotTime;

    @Column(name = "SlotEndTime", nullable = true)
    private LocalTime slotEndTime;

    @Column(name = "SlotStatus", nullable = false, length = 50)
    private String slotStatus = "AVAILABLE"; // AVAILABLE, RESERVED, BOOKED, CANCELLED

    public Timeslot() {}

    public Timeslot(Schedule schedule, Integer slotNo, LocalTime slotTime, String slotStatus) {
        this(schedule, slotNo, slotTime, null, slotStatus);
    }

    public Timeslot(Schedule schedule, Integer slotNo, LocalTime slotTime, LocalTime slotEndTime, String slotStatus) {
        this.schedule = schedule;
        this.slotNo = slotNo;
        this.slotTime = slotTime;
        this.slotEndTime = slotEndTime;
        this.slotStatus = slotStatus != null ? slotStatus : "AVAILABLE";
    }

    // Getters and Setters
    public Integer getTimeslotId() { return timeslotId; }
    public void setTimeslotId(Integer timeslotId) { this.timeslotId = timeslotId; }

    public Schedule getSchedule() { return schedule; }
    public void setSchedule(Schedule schedule) { this.schedule = schedule; }

    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }

    public LocalTime getSlotTime() { return slotTime; }
    public void setSlotTime(LocalTime slotTime) { this.slotTime = slotTime; }

    public LocalTime getSlotEndTime() { return slotEndTime; }
    public void setSlotEndTime(LocalTime slotEndTime) { this.slotEndTime = slotEndTime; }

    public String getSlotStatus() { return slotStatus; }
    public void setSlotStatus(String slotStatus) { this.slotStatus = slotStatus; }
}
