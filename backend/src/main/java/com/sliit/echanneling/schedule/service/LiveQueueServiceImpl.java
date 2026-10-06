package com.sliit.echanneling.schedule.service;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.notification.NotificationService;
import com.sliit.echanneling.schedule.dto.*;
import com.sliit.echanneling.schedule.entity.QueueNotification;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.repository.QueueNotificationRepository;
import com.sliit.echanneling.schedule.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OOP Principle: Implementation of Abstraction (LiveQueueService)
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule & Live Queue Management
 */
@Service
@Transactional
public class LiveQueueServiceImpl implements LiveQueueService {

    private final ScheduleRepository scheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueNotificationRepository queueNotificationRepository;
    private final NotificationService notificationService;
    private final RealtimeTimeExpirationService expirationService;

    @Autowired
    public LiveQueueServiceImpl(ScheduleRepository scheduleRepository,
                                AppointmentRepository appointmentRepository,
                                QueueNotificationRepository queueNotificationRepository,
                                NotificationService notificationService,
                                RealtimeTimeExpirationService expirationService) {
        this.scheduleRepository = scheduleRepository;
        this.appointmentRepository = appointmentRepository;
        this.queueNotificationRepository = queueNotificationRepository;
        this.notificationService = notificationService;
        this.expirationService = expirationService;
    }

    @Override
    @Transactional
    public LiveQueueDto getLiveQueue(Integer scheduleId) {
        expirationService.syncAllExpiredRecords();
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + scheduleId));
        return buildLiveQueueDto(schedule);
    }

    @Override
    @Transactional
    public List<LiveQueueDto> getTodayLiveQueues() {
        expirationService.syncAllExpiredRecords();
        LocalDate today = LocalDate.now();
        List<Schedule> todaySchedules = scheduleRepository.findAll().stream()
                .filter(s -> !s.getStatus().equalsIgnoreCase("CANCELLED"))
                .sorted(Comparator.comparing(Schedule::getScheduleDate).reversed()
                        .thenComparing(Schedule::getStartTime))
                .collect(Collectors.toList());

        // Return today's schedules first, or recent schedules if none today
        List<Schedule> filtered = todaySchedules.stream()
                .filter(s -> s.getScheduleDate().equals(today))
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            filtered = todaySchedules.stream().limit(8).collect(Collectors.toList());
        }

        return filtered.stream().map(this::buildLiveQueueDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<LiveQueueDto> getLiveQueuesByDoctor(Integer doctorId) {
        expirationService.syncAllExpiredRecords();
        List<Schedule> schedules = scheduleRepository.findByDoctor_UserIdOrderByScheduleDateAscStartTimeAsc(doctorId);
        return schedules.stream().map(this::buildLiveQueueDto).collect(Collectors.toList());
    }

    @Override
    public LiveQueueDto updateDoctorArrival(Integer scheduleId, UpdateDoctorArrivalDto dto) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + scheduleId));

        String arrivalStatus = dto.getDoctorArrivalStatus() != null ? dto.getDoctorArrivalStatus().toUpperCase() : "ARRIVED";
        schedule.setDoctorArrivalStatus(arrivalStatus);

        LocalTime arrivalTime = dto.getDoctorArrivalTime() != null ? dto.getDoctorArrivalTime() : LocalTime.now();
        schedule.setDoctorArrivalTime(arrivalTime);

        if (dto.getQueueStatusNote() != null && !dto.getQueueStatusNote().trim().isEmpty()) {
            schedule.setQueueStatusNote(dto.getQueueStatusNote());
        } else {
            String doctorName = schedule.getDoctor() != null ? schedule.getDoctor().getFullName() : "Doctor";
            if ("ARRIVED".equals(arrivalStatus)) {
                schedule.setQueueStatusNote(doctorName + " arrived at " + arrivalTime.format(DateTimeFormatter.ofPattern("hh:mm a")) + ". Consultation starting.");
                if (schedule.getCurrentToken() == null || schedule.getCurrentToken() == 0) {
                    schedule.setCurrentToken(1);
                }
            } else if ("ON_THE_WAY".equals(arrivalStatus)) {
                schedule.setQueueStatusNote(doctorName + " is on the way to " + schedule.getHospitalLocation() + ".");
            } else if ("IN_PROGRESS".equals(arrivalStatus)) {
                schedule.setQueueStatusNote("Consultation session in progress at " + schedule.getHospitalLocation() + ".");
            } else if ("COMPLETED".equals(arrivalStatus)) {
                schedule.setQueueStatusNote("Doctor consultation session completed for today.");
                schedule.setStatus("COMPLETED");
            }
        }

        Schedule saved = scheduleRepository.save(schedule);

        // ── Smart SMS Alerts (delegated to NotificationService) ──────────────
        if (Boolean.TRUE.equals(dto.getBroadcastSms())) {
            List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(scheduleId);

            if ("ARRIVED".equals(arrivalStatus)) {
                notificationService.broadcastDoctorArrived(saved, appointments);
            } else if ("ON_THE_WAY".equals(arrivalStatus)) {
                notificationService.broadcastDoctorEnRoute(saved, appointments);
            } else {
                notificationService.broadcastQueueStatus(saved, appointments);
            }
        }

        return buildLiveQueueDto(saved);
    }

    @Override
    public LiveQueueDto updateCurrentToken(Integer scheduleId, UpdateCurrentTokenDto dto) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + scheduleId));

        List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(scheduleId);
        List<Appointment> activeAppts = appointments.stream()
                .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getAppointmentStatus()))
                .sorted(Comparator.comparingInt(a -> (a.getTimeslot() != null && a.getTimeslot().getSlotNo() != null) ? a.getTimeslot().getSlotNo() : 0))
                .collect(Collectors.toList());

        if (activeAppts.isEmpty()) {
            throw new IllegalArgumentException("No booked patient appointments exist for this schedule. Cannot advance queue.");
        }

        int maxBookedToken = activeAppts.stream()
                .mapToInt(a -> (a.getTimeslot() != null && a.getTimeslot().getSlotNo() != null) ? a.getTimeslot().getSlotNo() : 0)
                .max().orElse(activeAppts.size());

        int currentToken = schedule.getCurrentToken() != null ? schedule.getCurrentToken() : 0;

        // Find the next uncalled token in sequence
        Integer nextAvailableToken = null;
        for (Appointment a : activeAppts) {
            int slot = (a.getTimeslot() != null && a.getTimeslot().getSlotNo() != null) ? a.getTimeslot().getSlotNo() : 0;
            if (!"COMPLETED".equalsIgnoreCase(a.getAppointmentStatus()) && slot > currentToken) {
                nextAvailableToken = slot;
                break;
            }
        }
        if (nextAvailableToken == null) {
            for (Appointment a : activeAppts) {
                int slot = (a.getTimeslot() != null && a.getTimeslot().getSlotNo() != null) ? a.getTimeslot().getSlotNo() : 0;
                if (!"COMPLETED".equalsIgnoreCase(a.getAppointmentStatus())) {
                    nextAvailableToken = slot;
                    break;
                }
            }
        }

        Integer targetToken = dto.getTargetToken();
        if (targetToken == null || targetToken < 1) {
            if (nextAvailableToken != null) {
                targetToken = nextAvailableToken;
            } else {
                // All booked patients already completed!
                throw new IllegalArgumentException("All " + activeAppts.size() + " booked patient appointments for this session have already been completed. Queue has concluded.");
            }
        }

        // STRICT CHECK: Target token must NOT exceed the maximum booked token for this doctor's schedule!
        if (targetToken > maxBookedToken) {
            throw new IllegalArgumentException("Token #" + targetToken + " exceeds the maximum booked appointment token (#" + maxBookedToken + ") for Dr. " 
                    + (schedule.getDoctor() != null ? schedule.getDoctor().getFullName() : "Doctor") + ". Queue advancement is strictly limited to booked appointments.");
        }

        schedule.setCurrentToken(targetToken);
        if ("NOT_ARRIVED".equals(schedule.getDoctorArrivalStatus())) {
            schedule.setDoctorArrivalStatus("IN_PROGRESS");
            if (schedule.getDoctorArrivalTime() == null) {
                schedule.setDoctorArrivalTime(LocalTime.now());
            }
        }

        if (dto.getQueueStatusNote() != null && !dto.getQueueStatusNote().trim().isEmpty()) {
            schedule.setQueueStatusNote(dto.getQueueStatusNote());
        } else {
            schedule.setQueueStatusNote("Now consulting Token #" + targetToken + " in " + schedule.getHospitalLocation());
        }

        Schedule saved = scheduleRepository.save(schedule);

        // ── Update appointment states & delegate per-patient SMS ──────────────
        for (Appointment appt : appointments) {
            if ("CANCELLED".equalsIgnoreCase(appt.getAppointmentStatus())) continue;
            Integer slotNo = appt.getTimeslot() != null ? appt.getTimeslot().getSlotNo() : 0;

            if (slotNo < targetToken) {
                if (!"COMPLETED".equalsIgnoreCase(appt.getAppointmentStatus())) {
                    appt.setAppointmentStatus("COMPLETED");
                    appointmentRepository.save(appt);
                }
            } else if (slotNo.equals(targetToken)) {
                appt.setAppointmentStatus("IN_CONSULTATION");
                appointmentRepository.save(appt);

                // Current token → "NOW CALLED" alert
                if (Boolean.TRUE.equals(dto.getNotifyUpcomingPatients())) {
                    notificationService.notifyTokenCalled(saved, appt, targetToken);
                }
            } else if (slotNo == targetToken + 1 && Boolean.TRUE.equals(dto.getNotifyUpcomingPatients())) {
                // Next in line → "NEXT IN LINE" alert
                notificationService.notifyNextInLine(saved, appt);
            } else if ((slotNo == targetToken + 2 || slotNo == targetToken + 3)
                    && Boolean.TRUE.equals(dto.getNotifyUpcomingPatients())) {
                // 2-3 tokens away → "X patients ahead" alert
                int ahead = slotNo - targetToken;
                notificationService.notifyApproachingTurn(saved, appt, ahead);
            }
        }

        return buildLiveQueueDto(saved);
    }

    @Override
    public LiveQueueDto updateQueueDelay(Integer scheduleId, UpdateQueueDelayDto dto) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + scheduleId));

        int delay = dto.getDelayMinutes() != null ? dto.getDelayMinutes() : 0;
        schedule.setEstimatedDelayMinutes(delay);

        if (dto.getReasonNote() != null && !dto.getReasonNote().trim().isEmpty()) {
            schedule.setQueueStatusNote("Session delay: ~" + delay + " mins. " + dto.getReasonNote());
        }

        Schedule saved = scheduleRepository.save(schedule);

        // ── Session Delay SMS (delegated to NotificationService) ──────────────
        if (Boolean.TRUE.equals(dto.getBroadcastSms()) && delay > 0) {
            List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(scheduleId);
            notificationService.broadcastSessionDelay(saved, appointments, delay, dto.getReasonNote());
        }

        return buildLiveQueueDto(saved);
    }

    @Override
    public QueueNotificationDto sendQueueSms(SendQueueSmsDto dto) {
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + dto.getScheduleId()));

        String docName = schedule.getDoctor() != null ? schedule.getDoctor().getFullName() : "Doctor";
        String messageType = dto.getMessageType() != null ? dto.getMessageType() : "GENERAL_ALERT";
        String body = dto.getMessageBody();
        if (body == null || body.trim().isEmpty()) {
            body = "CareSync Alert from " + docName + ": Clinic session update for your scheduled consultation.";
        }

        // ── Delegate to NotificationService ──────────────────────────────────
        Integer notifId = notificationService.sendCustomSms(
                dto.getScheduleId(), dto.getTargetPatientId(),
                dto.getTargetToken(), messageType, body);

        QueueNotification saved = queueNotificationRepository.findById(notifId)
                .orElseThrow(() -> new IllegalStateException("Notification not found after save"));
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueNotificationDto> getPatientNotifications(Integer patientId) {
        return queueNotificationRepository.findByPatientIdOrderBySentAtDesc(patientId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueNotificationDto> getScheduleNotifications(Integer scheduleId) {
        return queueNotificationRepository.findByScheduleIdOrderBySentAtDesc(scheduleId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    // Helper: Build LiveQueueDto with accurate slot-by-slot tracking calculations
    private LiveQueueDto buildLiveQueueDto(Schedule schedule) {
        LiveQueueDto dto = new LiveQueueDto();
        dto.setScheduleId(schedule.getScheduleId());
        dto.setScheduleDate(schedule.getScheduleDate());
        dto.setStartTime(schedule.getStartTime());
        dto.setEndTime(schedule.getEndTime());
        dto.setSessionStatus(schedule.getStatus());
        dto.setHospitalLocation(schedule.getHospitalLocation());
        dto.setMaxCapacity(schedule.getMaxCapacity());

        if (schedule.getDoctor() != null) {
            dto.setDoctorId(schedule.getDoctor().getUserId());
            dto.setDoctorName(schedule.getDoctor().getFullName());
            dto.setDoctorRegNo(schedule.getDoctor().getMedicalLicenseNo());
            dto.setSpecialization(schedule.getDoctor().getSpecialization());
        }

        dto.setDoctorArrivalStatus(schedule.getDoctorArrivalStatus() != null ? schedule.getDoctorArrivalStatus() : "NOT_ARRIVED");
        dto.setDoctorArrivalTime(schedule.getDoctorArrivalTime());
        int currentToken = schedule.getCurrentToken() != null ? schedule.getCurrentToken() : 0;
        dto.setCurrentToken(currentToken);
        int delay = schedule.getEstimatedDelayMinutes() != null ? schedule.getEstimatedDelayMinutes() : 0;
        dto.setEstimatedDelayMinutes(delay);
        dto.setQueueStatusNote(schedule.getQueueStatusNote());

        // Process Appointments
        List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(schedule.getScheduleId());
        List<QueuePatientSlotDto> slotDtos = new ArrayList<>();
        int completedCount = 0;
        int bookedCount = 0;
        int maxBookedToken = 0;

        // Sort appointments by SlotNo
        appointments.sort((a, b) -> {
            int slotA = (a.getTimeslot() != null && a.getTimeslot().getSlotNo() != null) ? a.getTimeslot().getSlotNo() : 0;
            int slotB = (b.getTimeslot() != null && b.getTimeslot().getSlotNo() != null) ? b.getTimeslot().getSlotNo() : 0;
            return Integer.compare(slotA, slotB);
        });

        for (Appointment appt : appointments) {
            if ("CANCELLED".equalsIgnoreCase(appt.getAppointmentStatus())) {
                continue;
            }
            bookedCount++;
            int slotNo = (appt.getTimeslot() != null && appt.getTimeslot().getSlotNo() != null)
                    ? appt.getTimeslot().getSlotNo() : bookedCount;
            if (slotNo > maxBookedToken) {
                maxBookedToken = slotNo;
            }

            QueuePatientSlotDto slot = new QueuePatientSlotDto();
            slot.setAppointmentId(appt.getAppointmentId());
            slot.setSlotNo(slotNo);
            slot.setSlotTime(appt.getTimeslot() != null && appt.getTimeslot().getSlotTime() != null
                    ? appt.getTimeslot().getSlotTime().format(DateTimeFormatter.ofPattern("hh:mm a"))
                    : (appt.getStartTime() != null ? appt.getStartTime().format(DateTimeFormatter.ofPattern("hh:mm a")) : ""));

            if (appt.getPatient() != null) {
                slot.setPatientId(appt.getPatient().getUserId());
                slot.setPatientName(appt.getPatient().getFullName());
                slot.setPatientPhone(appt.getPatient().getContactNumber());
            }

            boolean isCurrent = currentToken > 0 && slotNo == currentToken;
            boolean isCompleted = "COMPLETED".equalsIgnoreCase(appt.getAppointmentStatus()) || (currentToken > slotNo);

            slot.setCurrentToken(isCurrent);
            slot.setCompleted(isCompleted);
            slot.setAppointmentStatus(isCurrent ? "IN_CONSULTATION" : (isCompleted ? "COMPLETED" : appt.getAppointmentStatus()));

            if (isCompleted) {
                completedCount++;
                slot.setTokensAhead(0);
                slot.setEstimatedWaitMinutes(0);
            } else if (isCurrent) {
                slot.setTokensAhead(0);
                slot.setEstimatedWaitMinutes(0);
            } else {
                int ahead = Math.max(0, slotNo - currentToken);
                slot.setTokensAhead(ahead);
                slot.setEstimatedWaitMinutes((ahead * 10) + delay);
            }

            slotDtos.add(slot);
        }

        // Auto-recalibrate rogue currentToken if it exceeded maximum booked tokens
        if (maxBookedToken > 0 && currentToken > maxBookedToken) {
            currentToken = maxBookedToken;
            schedule.setCurrentToken(maxBookedToken);
            scheduleRepository.save(schedule);
        }

        dto.setCurrentToken(currentToken);
        dto.setTotalBookedTokens(bookedCount);
        dto.setTotalCompletedTokens(completedCount);
        dto.setMaxBookedToken(maxBookedToken);

        boolean isFinished = (bookedCount > 0 && completedCount >= bookedCount);
        dto.setIsQueueFinished(isFinished);

        // Find next available uncalled/uncompleted token
        Integer nextAvailable = null;
        if (!isFinished) {
            for (QueuePatientSlotDto s : slotDtos) {
                if (!s.isCompleted() && !s.isCurrentToken()) {
                    nextAvailable = s.getSlotNo();
                    break;
                }
            }
        }
        dto.setNextAvailableToken(nextAvailable);
        dto.setQueueSlots(slotDtos);

        // Fetch recent notifications
        List<QueueNotification> notifications = queueNotificationRepository.findTop20ByScheduleIdOrderBySentAtDesc(schedule.getScheduleId());
        dto.setRecentNotifications(notifications.stream().map(this::mapToDto).collect(Collectors.toList()));

        return dto;
    }

    @Override
    public LiveQueueDto concludeQueue(Integer scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + scheduleId));

        List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(scheduleId);
        int maxBookedToken = 0;
        for (Appointment appt : appointments) {
            if ("CANCELLED".equalsIgnoreCase(appt.getAppointmentStatus())) continue;
            int slot = (appt.getTimeslot() != null && appt.getTimeslot().getSlotNo() != null) ? appt.getTimeslot().getSlotNo() : 0;
            if (slot > maxBookedToken) maxBookedToken = slot;
            appt.setAppointmentStatus("COMPLETED");
            appointmentRepository.save(appt);
        }

        if (maxBookedToken > 0) {
            schedule.setCurrentToken(maxBookedToken);
        }
        schedule.setDoctorArrivalStatus("COMPLETED");
        schedule.setStatus("COMPLETED");
        schedule.setQueueStatusNote("All booked patient consultations completed. Session successfully concluded.");

        Schedule saved = scheduleRepository.save(schedule);
        return buildLiveQueueDto(saved);
    }

    @Override
    public LiveQueueDto resetQueue(Integer scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + scheduleId));

        List<Appointment> appointments = appointmentRepository.findBySchedule_ScheduleId(scheduleId);
        for (Appointment appt : appointments) {
            if (!"CANCELLED".equalsIgnoreCase(appt.getAppointmentStatus())) {
                appt.setAppointmentStatus("BOOKED");
                appointmentRepository.save(appt);
            }
        }

        schedule.setCurrentToken(1);
        schedule.setDoctorArrivalStatus("ARRIVED");
        schedule.setStatus("SCHEDULED");
        schedule.setEstimatedDelayMinutes(0);
        schedule.setQueueStatusNote("Session queue recalibrated to Token #1. Ready for consultations.");

        Schedule saved = scheduleRepository.save(schedule);
        return buildLiveQueueDto(saved);
    }

    private QueueNotificationDto mapToDto(QueueNotification entity) {
        QueueNotificationDto dto = new QueueNotificationDto();
        dto.setNotificationId(entity.getNotificationId());
        dto.setScheduleId(entity.getScheduleId());
        dto.setPatientId(entity.getPatientId());
        dto.setAppointmentId(entity.getAppointmentId());
        dto.setRecipientPhone(entity.getRecipientPhone());
        dto.setRecipientName(entity.getRecipientName());
        dto.setTokenNo(entity.getTokenNo());
        dto.setMessageType(entity.getMessageType());
        dto.setMessageBody(entity.getMessageBody());
        dto.setSentAt(entity.getSentAt());
        dto.setDeliveryStatus(entity.getDeliveryStatus());
        dto.setDoctorId(entity.getDoctorId());
        dto.setUserId(entity.getUserId());
        dto.setTargetRole(entity.getTargetRole());
        dto.setTitle(entity.getTitle());
        dto.setIsRead(entity.getIsRead() != null ? entity.getIsRead() : false);
        return dto;
    }
}
