package com.sliit.echanneling.schedule.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Queue Notification Entity (Simulated Real-Time SMS & Push Alerts)
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule & Live Queue Management
 */
@Entity
@Table(name = "QueueNotifications")
public class QueueNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NotificationId")
    private Integer notificationId;

    @Column(name = "ScheduleId", nullable = false)
    private Integer scheduleId;

    @Column(name = "PatientId")
    private Integer patientId;

    @Column(name = "AppointmentId")
    private Integer appointmentId;

    @Column(name = "RecipientPhone", nullable = false, length = 30)
    private String recipientPhone;

    @Column(name = "RecipientName", length = 150)
    private String recipientName;

    @Column(name = "TokenNo", nullable = false)
    private Integer tokenNo;

    @Column(name = "MessageType", nullable = false, length = 50)
    private String messageType; // DOCTOR_ARRIVED, APPROACHING_TURN, TOKEN_CALLED, SESSION_DELAYED, GENERAL_ALERT

    @Column(name = "MessageBody", nullable = false, length = 500)
    private String messageBody;

    @Column(name = "SentAt", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "DeliveryStatus", nullable = false, length = 50)
    private String deliveryStatus = "DELIVERED";

    @Column(name = "DoctorId")
    private Integer doctorId;

    @Column(name = "UserId")
    private Integer userId;

    @Column(name = "TargetRole", length = 50)
    private String targetRole; // PATIENT, DOCTOR, STAFF, ALL

    @Column(name = "Title", length = 150)
    private String title;

    @Column(name = "IsRead", nullable = false)
    private Boolean isRead = false;

    public QueueNotification() {}

    public QueueNotification(Integer scheduleId, Integer patientId, Integer appointmentId,
                             String recipientPhone, String recipientName, Integer tokenNo,
                             String messageType, String messageBody, String deliveryStatus) {
        this.scheduleId = scheduleId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.recipientPhone = recipientPhone;
        this.recipientName = recipientName;
        this.tokenNo = tokenNo;
        this.messageType = messageType;
        this.messageBody = messageBody;
        this.deliveryStatus = deliveryStatus != null ? deliveryStatus : "DELIVERED";
        this.sentAt = LocalDateTime.now();
    }

    public Integer getNotificationId() { return notificationId; }
    public void setNotificationId(Integer notificationId) { this.notificationId = notificationId; }

    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }

    public Integer getPatientId() { return patientId; }
    public void setPatientId(Integer patientId) { this.patientId = patientId; }

    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public Integer getTokenNo() { return tokenNo; }
    public void setTokenNo(Integer tokenNo) { this.tokenNo = tokenNo; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getMessageBody() { return messageBody; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public Integer getDoctorId() { return doctorId; }
    public void setDoctorId(Integer doctorId) { this.doctorId = doctorId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
}
