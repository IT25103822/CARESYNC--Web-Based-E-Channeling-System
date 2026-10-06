package com.sliit.echanneling.schedule.service;

import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.repository.DoctorRepository;
import com.sliit.echanneling.schedule.dto.CreateScheduleDto;
import com.sliit.echanneling.schedule.dto.CustomSlotDto;
import com.sliit.echanneling.schedule.dto.SetAvailabilityDto;
import com.sliit.echanneling.schedule.dto.UpdateScheduleDto;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.entity.Timeslot;
import com.sliit.echanneling.schedule.repository.ScheduleRepository;
import com.sliit.echanneling.schedule.repository.TimeslotRepository;
import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.schedule.entity.QueueNotification;
import com.sliit.echanneling.schedule.repository.QueueNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule Management Implementation
 */
@Service
@Transactional
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final TimeslotRepository timeslotRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueNotificationRepository queueNotificationRepository;
    private final RealtimeTimeExpirationService expirationService;
    private final com.sliit.echanneling.audit.service.AuditLogService auditLogService;

    @Autowired
    public ScheduleServiceImpl(ScheduleRepository scheduleRepository,
                               TimeslotRepository timeslotRepository,
                               DoctorRepository doctorRepository,
                               AppointmentRepository appointmentRepository,
                               QueueNotificationRepository queueNotificationRepository,
                               RealtimeTimeExpirationService expirationService,
                               com.sliit.echanneling.audit.service.AuditLogService auditLogService) {
        this.scheduleRepository = scheduleRepository;
        this.timeslotRepository = timeslotRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.queueNotificationRepository = queueNotificationRepository;
        this.expirationService = expirationService;
        this.auditLogService = auditLogService;
    }

    @Override
    public Schedule createSchedule(CreateScheduleDto dto) {
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        if (!doctor.getIsApproved()) {
            throw new BadRequestException("Cannot create schedule for doctor who is not yet approved by an Administrator.");
        }

        if (dto.getEndTime().isBefore(dto.getStartTime()) || dto.getEndTime().equals(dto.getStartTime())) {
            throw new BadRequestException("Session End Time must be after Start Time.");
        }

        Schedule schedule = new Schedule(
                doctor,
                dto.getCoordinatorId(),
                dto.getScheduleDate(),
                dto.getStartTime(),
                dto.getEndTime(),
                dto.getMaxCapacity(),
                dto.getHospitalLocation(),
                "SCHEDULED"
        );

        Schedule savedSchedule = scheduleRepository.save(schedule);

        // Generate discrete timeslots for this consultation session
        List<Timeslot> slots = new ArrayList<>();

        if (dto.getCustomSlots() != null && !dto.getCustomSlots().isEmpty()) {
            int slotIdx = 1;
            for (CustomSlotDto cSlot : dto.getCustomSlots()) {
                if (cSlot.getStartTime() == null) continue;
                int sNo = cSlot.getSlotNo() != null ? cSlot.getSlotNo() : slotIdx;
                LocalTime sTime = cSlot.getStartTime();
                LocalTime eTime = cSlot.getEndTime();
                slots.add(new Timeslot(savedSchedule, sNo, sTime, eTime, "AVAILABLE"));
                slotIdx++;
            }
        } else {
            // Auto-generate EXACTLY maxCapacity slots distributed between Start Time and End Time
            int capacity = dto.getMaxCapacity() != null && dto.getMaxCapacity() > 0 ? dto.getMaxCapacity() : 10;
            long totalMinutes = java.time.Duration.between(dto.getStartTime(), dto.getEndTime()).toMinutes();
            if (totalMinutes <= 0) {
                totalMinutes = 120;
            }
            long slotSeconds = Math.max(60, (totalMinutes * 60) / capacity);

            LocalTime currentSlotTime = dto.getStartTime();
            for (int slotNo = 1; slotNo <= capacity; slotNo++) {
                LocalTime slotEndTime = (slotNo == capacity) ? dto.getEndTime() : currentSlotTime.plusSeconds(slotSeconds);
                if (slotEndTime.isAfter(dto.getEndTime())) {
                    slotEndTime = dto.getEndTime();
                }
                slots.add(new Timeslot(savedSchedule, slotNo, currentSlotTime, slotEndTime, "AVAILABLE"));
                currentSlotTime = slotEndTime;
            }
        }

        timeslotRepository.saveAll(slots);
        savedSchedule.setTimeslots(slots);

        auditLogService.log(dto.getCoordinatorId(), "Kasun Fernando", "CHANNELING_COORDINATOR", "SCHEDULE_CREATED", "DoctorSchedule", savedSchedule.getScheduleId(),
                "Published session schedule with " + slots.size() + " slots for Dr. " + doctor.getFullName() + 
                " (" + doctor.getSpecialization() + ") on " + dto.getScheduleDate() + " at " + dto.getHospitalLocation(),
                "SUCCESS", "127.0.0.1");

        return savedSchedule;
    }

    @Override
    @Transactional(readOnly = true)
    public Schedule getScheduleById(Integer scheduleId) {
        return scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with ID: " + scheduleId));
    }

    @Override
    @Transactional
    public List<Schedule> getAllUpcomingSchedules() {
        expirationService.syncAllExpiredRecords();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        return scheduleRepository.findByScheduleDateGreaterThanEqualAndStatusNotOrderByScheduleDateAsc(
                today, "CANCELLED").stream()
                .filter(s -> !"COMPLETED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> !s.getScheduleDate().isEqual(today) || !s.getEndTime().isBefore(now))
                .toList();
    }

    @Override
    @Transactional
    public List<Schedule> getAllSchedules() {
        expirationService.syncAllExpiredRecords();
        return scheduleRepository.findAll().stream()
                .sorted((a, b) -> {
                    int dateCmp = b.getScheduleDate().compareTo(a.getScheduleDate());
                    if (dateCmp != 0) return dateCmp;
                    return a.getStartTime().compareTo(b.getStartTime());
                })
                .toList();
    }

    @Override
    @Transactional
    public List<Schedule> getSchedulesByDoctor(Integer doctorId) {
        expirationService.syncAllExpiredRecords();
        return scheduleRepository.findByDoctor_UserIdOrderByScheduleDateAscStartTimeAsc(doctorId);
    }

    @Override
    @Transactional
    public List<Timeslot> getTimeslotsBySchedule(Integer scheduleId) {
        expirationService.syncAllExpiredRecords();
        return timeslotRepository.findBySchedule_ScheduleIdOrderBySlotNoAsc(scheduleId);
    }

    @Override
    @Transactional
    public List<Timeslot> getAvailableTimeslots(Integer scheduleId) {
        expirationService.syncAllExpiredRecords();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        return timeslotRepository.findBySchedule_ScheduleIdAndSlotStatus(scheduleId, "AVAILABLE").stream()
                .filter(slot -> {
                    if (slot.getSchedule() == null) return true;
                    LocalDate d = slot.getSchedule().getScheduleDate();
                    LocalTime t = slot.getSlotTime();
                    if (d == null || t == null) return true;
                    return !d.isBefore(today) && (!d.isEqual(today) || !t.isBefore(now));
                })
                .toList();
    }

    @Override
    public Schedule updateSchedule(Integer scheduleId, UpdateScheduleDto dto) {
        Schedule schedule = getScheduleById(scheduleId);

        if (dto.getScheduleDate() != null) schedule.setScheduleDate(dto.getScheduleDate());
        if (dto.getStartTime() != null) schedule.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) schedule.setEndTime(dto.getEndTime());
        if (dto.getMaxCapacity() != null) schedule.setMaxCapacity(dto.getMaxCapacity());
        if (dto.getHospitalLocation() != null) schedule.setHospitalLocation(dto.getHospitalLocation());
        if (dto.getStatus() != null) {
            schedule.setStatus(dto.getStatus());
            if ("CANCELLED".equalsIgnoreCase(dto.getStatus()) || "ON_LEAVE".equalsIgnoreCase(dto.getStatus())) {
                List<Timeslot> availableSlots = timeslotRepository.findBySchedule_ScheduleIdAndSlotStatus(schedule.getScheduleId(), "AVAILABLE");
                for (Timeslot slot : availableSlots) {
                    slot.setSlotStatus("CANCELLED");
                }
                timeslotRepository.saveAll(availableSlots);
            } else if ("SCHEDULED".equalsIgnoreCase(dto.getStatus())) {
                List<Timeslot> allSlots = timeslotRepository.findBySchedule_ScheduleIdOrderBySlotNoAsc(schedule.getScheduleId());
                List<Appointment> apps = appointmentRepository.findBySchedule_ScheduleId(schedule.getScheduleId());
                Set<Integer> bookedSlotIds = apps.stream()
                        .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getAppointmentStatus()))
                        .map(a -> a.getTimeslot() != null ? a.getTimeslot().getTimeslotId() : null)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

                LocalDate today = LocalDate.now();
                LocalTime now = LocalTime.now();
                LocalDate sDate = schedule.getScheduleDate();

                for (Timeslot slot : allSlots) {
                    if (!bookedSlotIds.contains(slot.getTimeslotId())) {
                        boolean isExpired = (sDate != null && (sDate.isBefore(today) || (sDate.isEqual(today) && slot.getSlotTime() != null && slot.getSlotTime().isBefore(now))));
                        slot.setSlotStatus(isExpired ? "EXPIRED" : "AVAILABLE");
                    }
                }
                timeslotRepository.saveAll(allSlots);
            }
        }

        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule updateAvailability(SetAvailabilityDto dto) {
        Schedule schedule = getScheduleById(dto.getScheduleId());
        schedule.setStatus(dto.getStatus());

        if (dto.getReason() != null && !dto.getReason().isBlank()) {
            schedule.setQueueStatusNote(dto.getReason());
        }

        // If marked ON_LEAVE or CANCELLED, set all available timeslots to CANCELLED and notify Coordinator & Patients
        if ("ON_LEAVE".equalsIgnoreCase(dto.getStatus()) || "CANCELLED".equalsIgnoreCase(dto.getStatus())) {
            List<Timeslot> availableSlots = timeslotRepository.findBySchedule_ScheduleIdAndSlotStatus(schedule.getScheduleId(), "AVAILABLE");
            for (Timeslot slot : availableSlots) {
                slot.setSlotStatus("CANCELLED");
            }
            timeslotRepository.saveAll(availableSlots);

            // Fetch active booked appointments
            List<Appointment> bookedAppointments = appointmentRepository.findBySchedule_ScheduleId(schedule.getScheduleId())
                    .stream()
                    .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getAppointmentStatus()))
                    .toList();

            String reasonStr = (dto.getReason() != null && !dto.getReason().isBlank()) 
                    ? dto.getReason() 
                    : ("Doctor marked " + dto.getStatus());

            String docName = schedule.getDoctor().getFullName();
            if (!docName.startsWith("Dr.") && !docName.startsWith("Dr ")) {
                docName = "Dr. " + docName;
            }

            // 1. Dispatch High-Priority Emergency Notice to Channeling Coordinator
            QueueNotification coordNotice = new QueueNotification();
            coordNotice.setScheduleId(schedule.getScheduleId());
            coordNotice.setDoctorId(schedule.getDoctor().getUserId());
            coordNotice.setUserId(schedule.getCoordinatorId() != null ? schedule.getCoordinatorId() : 2);
            coordNotice.setTargetRole("COORDINATOR");
            coordNotice.setRecipientName("Channeling Operations Desk");
            coordNotice.setRecipientPhone("0112345678");
            coordNotice.setTokenNo(0);
            coordNotice.setMessageType("DOCTOR_LEAVE");
            coordNotice.setTitle("🚨 Urgent: Doctor Emergency Leave - " + docName);
            coordNotice.setMessageBody(String.format("%s has marked %s for Session #%d on %s (%s - %s). Reason: %s. %d booked patient(s) affected and require urgent rescheduling.",
                    docName,
                    dto.getStatus(),
                    schedule.getScheduleId(),
                    schedule.getScheduleDate(),
                    schedule.getStartTime(),
                    schedule.getEndTime(),
                    reasonStr,
                    bookedAppointments.size()));
            coordNotice.setDeliveryStatus("DELIVERED");
            coordNotice.setIsRead(false);
            coordNotice.setSentAt(LocalDateTime.now());
            queueNotificationRepository.save(coordNotice);

            // 2. Dispatch In-App Notice to all affected Booked Patients
            for (Appointment app : bookedAppointments) {
                QueueNotification patientNotice = new QueueNotification();
                patientNotice.setScheduleId(schedule.getScheduleId());
                patientNotice.setAppointmentId(app.getAppointmentId());
                patientNotice.setPatientId(app.getPatient().getUserId());
                patientNotice.setUserId(app.getPatient().getUserId());
                patientNotice.setDoctorId(schedule.getDoctor().getUserId());
                patientNotice.setTargetRole("PATIENT");
                patientNotice.setRecipientName(app.getPatient().getFullName());
                patientNotice.setRecipientPhone(app.getPatient().getContactNumber() != null ? app.getPatient().getContactNumber() : "0771234567");
                patientNotice.setTokenNo(app.getTimeslot() != null ? app.getTimeslot().getSlotNo() : 0);
                patientNotice.setMessageType("DOCTOR_LEAVE");
                patientNotice.setTitle("Session Postponed: " + docName + " On Leave");
                patientNotice.setMessageBody(String.format("Dear %s, %s is unavailable on %s (%s) due to: %s. Our hospital channeling desk will reschedule your appointment shortly.",
                        app.getPatient().getFullName(),
                        docName,
                        schedule.getScheduleDate(),
                        schedule.getHospitalLocation(),
                        reasonStr));
                patientNotice.setDeliveryStatus("DELIVERED");
                patientNotice.setIsRead(false);
                patientNotice.setSentAt(LocalDateTime.now());
                queueNotificationRepository.save(patientNotice);
            }
        }

        return scheduleRepository.save(schedule);
    }

    @Override
    public void deleteSchedule(Integer scheduleId) {
        Schedule schedule = getScheduleById(scheduleId);
        List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(scheduleId);

        if (appointments.isEmpty()) {
            List<Timeslot> slots = timeslotRepository.findBySchedule_ScheduleIdOrderBySlotNoAsc(scheduleId);
            timeslotRepository.deleteAll(slots);
            scheduleRepository.delete(schedule);
        } else {
            schedule.setStatus("CANCELLED");
            List<Timeslot> slots = timeslotRepository.findBySchedule_ScheduleIdOrderBySlotNoAsc(scheduleId);
            for (Timeslot slot : slots) {
                if ("AVAILABLE".equalsIgnoreCase(slot.getSlotStatus())) {
                    slot.setSlotStatus("CANCELLED");
                }
            }
            timeslotRepository.saveAll(slots);
            scheduleRepository.save(schedule);
        }
    }
}
