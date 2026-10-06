package com.sliit.echanneling.notification;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.schedule.dto.QueueNotificationDto;
import com.sliit.echanneling.schedule.entity.QueueNotification;
import com.sliit.echanneling.schedule.repository.QueueNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CareSync Central Notification Manager REST Controller
 * Provides real-time notifications with role-specific filtering for Patients and Doctors,
 * unread badges, mark as read, and notification cleanup.
 *
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule & Live Queue Management
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final QueueNotificationRepository notificationRepository;

    @Autowired
    public NotificationController(QueueNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Retrieve notifications filtered specifically for Patient or Doctor persona.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<QueueNotificationDto>>> getNotifications(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly) {

        List<QueueNotification> list;

        if ("PATIENT".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else if ("DOCTOR".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForDoctor(userId);
        } else if (userId != null && role != null) {
            list = notificationRepository.findByUserAndRole(userId, role);
        } else if (userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else {
            list = notificationRepository.findAll().stream()
                    .sorted((a, b) -> b.getSentAt().compareTo(a.getSentAt()))
                    .limit(50)
                    .toList();
        }

        if (Boolean.TRUE.equals(unreadOnly)) {
            list = list.stream()
                    .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                    .toList();
        }

        List<QueueNotificationDto> dtos = list.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Notifications fetched successfully", dtos));
    }

    /**
     * Quick lightweight endpoint for header notification badge counter.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String role) {

        List<QueueNotification> list;
        if ("PATIENT".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else if ("DOCTOR".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForDoctor(userId);
        } else if (userId != null && role != null) {
            list = notificationRepository.findByUserAndRole(userId, role);
        } else if (userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else {
            list = notificationRepository.findAll();
        }

        long unreadCount = list.stream()
                .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                .count();

        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        response.put("totalCount", list.size());
        return ResponseEntity.ok(ApiResponse.ok("Unread notification count fetched", response));
    }

    /**
     * Mark a single notification as read.
     */
    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<QueueNotificationDto>> markAsRead(@PathVariable Integer id) {
        QueueNotification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));
        n.setIsRead(true);
        QueueNotification saved = notificationRepository.saveAndFlush(n);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", mapToDto(saved)));
    }

    /**
     * Mark all notifications for the specified patient or doctor as read.
     */
    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String role) {

        List<QueueNotification> list;
        if ("PATIENT".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else if ("DOCTOR".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForDoctor(userId);
        } else if (userId != null && role != null) {
            list = notificationRepository.findByUserAndRole(userId, role);
        } else if (userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else {
            list = notificationRepository.findAll();
        }

        for (QueueNotification n : list) {
            n.setIsRead(true);
        }
        notificationRepository.saveAllAndFlush(list);

        Map<String, Object> res = new HashMap<>();
        res.put("updatedCount", list.size());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", res));
    }

    /**
     * Delete an individual notification.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteNotification(@PathVariable Integer id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification not found with ID: " + id);
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Notification removed", "SUCCESS"));
    }

    /**
     * Clear all notifications for user.
     */
    @DeleteMapping("/clear-all")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearAll(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String role) {

        List<QueueNotification> list;
        if ("PATIENT".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else if ("DOCTOR".equalsIgnoreCase(role) && userId != null) {
            list = notificationRepository.findForDoctor(userId);
        } else if (userId != null && role != null) {
            list = notificationRepository.findByUserAndRole(userId, role);
        } else if (userId != null) {
            list = notificationRepository.findForPatient(userId);
        } else {
            list = notificationRepository.findAll();
        }

        notificationRepository.deleteAll(list);

        Map<String, Object> res = new HashMap<>();
        res.put("clearedCount", list.size());
        return ResponseEntity.ok(ApiResponse.ok("Notifications cleared successfully", res));
    }

    /**
     * Ad-hoc simulation trigger for live demonstrations.
     */
    @PostMapping("/trigger-demo")
    public ResponseEntity<ApiResponse<QueueNotificationDto>> triggerDemoNotification(
            @RequestBody Map<String, Object> payload) {

        Integer userId = payload.get("userId") != null ? Integer.parseInt(payload.get("userId").toString()) : 8;
        String role = payload.get("role") != null ? payload.get("role").toString() : "PATIENT";
        String title = payload.get("title") != null ? payload.get("title").toString() : "CareSync Priority Notice";
        String messageType = payload.get("messageType") != null ? payload.get("messageType").toString() : "GENERAL_ALERT";
        String messageBody = payload.get("messageBody") != null ? payload.get("messageBody").toString() : "Hospital announcement.";

        QueueNotification n = new QueueNotification();
        n.setScheduleId(1);
        if ("DOCTOR".equalsIgnoreCase(role)) {
            n.setDoctorId(userId);
            n.setUserId(userId);
            n.setTargetRole("DOCTOR");
            n.setRecipientName(payload.get("recipientName") != null ? payload.get("recipientName").toString() : "Doctor");
            n.setRecipientPhone("0779988776");
            n.setTokenNo(0);
        } else {
            n.setPatientId(userId);
            n.setUserId(userId);
            n.setTargetRole("PATIENT");
            n.setRecipientName(payload.get("recipientName") != null ? payload.get("recipientName").toString() : "Patient");
            n.setRecipientPhone("0775566778");
            n.setTokenNo(payload.get("tokenNo") != null ? Integer.parseInt(payload.get("tokenNo").toString()) : 1);
        }

        n.setTitle(title);
        n.setMessageType(messageType);
        n.setMessageBody(messageBody);
        n.setDeliveryStatus("ACTIVE");
        n.setIsRead(false);
        n.setSentAt(LocalDateTime.now());

        QueueNotification saved = notificationRepository.saveAndFlush(n);
        return ResponseEntity.ok(ApiResponse.ok("Demo notification generated", mapToDto(saved)));
    }

    private QueueNotificationDto mapToDto(QueueNotification entity) {
        QueueNotificationDto dto = new QueueNotificationDto();
        dto.setNotificationId(entity.getNotificationId());
        dto.setScheduleId(entity.getScheduleId());
        dto.setPatientId(entity.getPatientId());
        dto.setDoctorId(entity.getDoctorId());
        dto.setUserId(entity.getUserId());
        dto.setTargetRole(entity.getTargetRole());
        dto.setTitle(entity.getTitle() != null ? entity.getTitle() : formatTitle(entity.getMessageType()));
        dto.setAppointmentId(entity.getAppointmentId());
        dto.setRecipientPhone(entity.getRecipientPhone());
        dto.setRecipientName(entity.getRecipientName());
        dto.setTokenNo(entity.getTokenNo());
        dto.setMessageType(entity.getMessageType());
        dto.setMessageBody(entity.getMessageBody());
        dto.setSentAt(entity.getSentAt());
        dto.setDeliveryStatus(entity.getDeliveryStatus());
        dto.setIsRead(entity.getIsRead() != null ? entity.getIsRead() : false);
        return dto;
    }

    private String formatTitle(String messageType) {
        if (messageType == null) return "CareSync Alert";
        return switch (messageType) {
            case "DOCTOR_ARRIVED" -> "Doctor Arrived at Clinic";
            case "APPROACHING_TURN" -> "Queue Alert: Approaching Turn";
            case "TOKEN_CALLED" -> "Now Calling Your Token";
            case "SESSION_DELAYED" -> "Clinic Session Delay";
            case "DOCTOR_EN_ROUTE" -> "Doctor En Route to Clinic";
            case "NEW_BOOKING" -> "New Patient Appointment Booked";
            case "PATIENT_FEEDBACK" -> "New Patient Review";
            case "CLINIC_SCHEDULE" -> "Upcoming Clinic Reminder";
            case "PRESCRIPTION_ISSUED" -> "New Prescription Issued";
            case "REFUND_STATUS" -> "Refund Claim Update";
            default -> "CareSync System Notice";
        };
    }
}
