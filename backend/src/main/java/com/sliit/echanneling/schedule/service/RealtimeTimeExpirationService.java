package com.sliit.echanneling.schedule.service;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.entity.Timeslot;
import com.sliit.echanneling.schedule.repository.ScheduleRepository;
import com.sliit.echanneling.schedule.repository.TimeslotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Real-time Time & Expiration Management Service
 * Automatically checks and expires past timeslots, concludes completed schedules,
 * and updates appointment states in 100% real-time synchronization.
 */
@Service
@Transactional
public class RealtimeTimeExpirationService {

    private final TimeslotRepository timeslotRepository;
    private final ScheduleRepository scheduleRepository;
    private final AppointmentRepository appointmentRepository;

    @Autowired
    public RealtimeTimeExpirationService(TimeslotRepository timeslotRepository,
                                         ScheduleRepository scheduleRepository,
                                         AppointmentRepository appointmentRepository) {
        this.timeslotRepository = timeslotRepository;
        this.scheduleRepository = scheduleRepository;
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Synchronize all time-sensitive records against current real time.
     */
    @Transactional
    public void syncAllExpiredRecords() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 1. Sync expired Timeslots (AVAILABLE -> EXPIRED)
        List<Timeslot> availableSlots = timeslotRepository.findAvailableWithSchedule();
        List<Timeslot> updatedSlots = new ArrayList<>();
        for (Timeslot slot : availableSlots) {
            if (slot.getSchedule() != null) {
                LocalDate schedDate = slot.getSchedule().getScheduleDate();
                LocalTime slotTime = slot.getSlotTime();
                if (schedDate != null && slotTime != null) {
                    if (schedDate.isBefore(today) || (schedDate.isEqual(today) && slotTime.isBefore(now))) {
                        slot.setSlotStatus("EXPIRED");
                        updatedSlots.add(slot);
                    }
                }
            }
        }
        if (!updatedSlots.isEmpty()) {
            timeslotRepository.saveAll(updatedSlots);
        }

        // 2. Sync finished Schedules (SCHEDULED / FULLY_BOOKED -> COMPLETED)
        List<Schedule> allSchedules = scheduleRepository.findAll();
        List<Schedule> updatedSchedules = new ArrayList<>();
        for (Schedule sched : allSchedules) {
            String status = sched.getStatus();
            if ("SCHEDULED".equalsIgnoreCase(status) || "FULLY_BOOKED".equalsIgnoreCase(status)) {
                LocalDate schedDate = sched.getScheduleDate();
                LocalTime endTime = sched.getEndTime();
                if (schedDate != null && endTime != null) {
                    if (schedDate.isBefore(today) || (schedDate.isEqual(today) && endTime.isBefore(now))) {
                        sched.setStatus("COMPLETED");
                        sched.setDoctorArrivalStatus("COMPLETED");
                        updatedSchedules.add(sched);
                    }
                }
            }
        }
        if (!updatedSchedules.isEmpty()) {
            scheduleRepository.saveAll(updatedSchedules);
        }

        // 3. Sync past Appointments (CONFIRMED / RESCHEDULED -> COMPLETED, PENDING_PAYMENT -> EXPIRED)
        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Appointment> updatedAppointments = new ArrayList<>();
        for (Appointment app : allAppointments) {
            String appStatus = app.getAppointmentStatus();
            if ("CONFIRMED".equalsIgnoreCase(appStatus) || "RESCHEDULED".equalsIgnoreCase(appStatus) || "PENDING_PAYMENT".equalsIgnoreCase(appStatus)) {
                LocalDate appDate = app.getAppointmentDate();
                LocalTime endOrStartTime = app.getEndTime() != null ? app.getEndTime() : app.getStartTime();
                if (appDate != null && endOrStartTime != null) {
                    if (appDate.isBefore(today) || (appDate.isEqual(today) && endOrStartTime.isBefore(now))) {
                        if ("PENDING_PAYMENT".equalsIgnoreCase(appStatus)) {
                            app.setAppointmentStatus("EXPIRED");
                        } else {
                            app.setAppointmentStatus("COMPLETED");
                        }
                        updatedAppointments.add(app);
                    }
                }
            }
        }
        if (!updatedAppointments.isEmpty()) {
            appointmentRepository.saveAll(updatedAppointments);
        }
    }

    /**
     * Periodic background sweep running every 30 seconds
     */
    @Scheduled(fixedRate = 30000)
    public void scheduledExpirationSweep() {
        try {
            syncAllExpiredRecords();
        } catch (Exception e) {
            System.err.println("Notice: scheduledExpirationSweep encountered: " + e.getMessage());
        }
    }
}
