package com.sliit.echanneling.notification;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.schedule.entity.QueueNotification;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.repository.QueueNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * OOP Principles:
 *   - Encapsulation  : All SMS/call message-building logic lives here, hidden
 *                      from callers behind the NotificationService interface.
 *   - Single Responsibility : This class only cares about building and
 *                             persisting (simulated) outbound notifications.
 *   - Open/Closed   : New channels (email, push, voice-call) can be added by
 *                     extending or decorating this class without touching callers.
 *
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) — Doctor Schedule & Live Queue Management
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    // ── Message-type constants ──────────────────────────────────────────────
    public static final String TYPE_DOCTOR_ARRIVED    = "DOCTOR_ARRIVED";
    public static final String TYPE_DOCTOR_EN_ROUTE   = "DOCTOR_EN_ROUTE";
    public static final String TYPE_QUEUE_STATUS      = "QUEUE_STATUS_UPDATE";
    public static final String TYPE_TOKEN_CALLED      = "TOKEN_CALLED";
    public static final String TYPE_APPROACHING_TURN  = "APPROACHING_TURN";
    public static final String TYPE_SESSION_DELAYED   = "SESSION_DELAYED";
    public static final String TYPE_GENERAL_ALERT     = "GENERAL_ALERT";

    private static final String DEFAULT_PHONE         = "0771234567";
    private static final DateTimeFormatter TIME_FMT   = DateTimeFormatter.ofPattern("hh:mm a");

    private final QueueNotificationRepository notificationRepository;

    @Autowired
    public NotificationServiceImpl(QueueNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    @Override
    public void broadcastDoctorArrived(Schedule schedule, List<Appointment> appointments) {
        String docName  = doctorName(schedule);
        String location = schedule.getHospitalLocation();
        String timeStr  = schedule.getDoctorArrivalTime() != null
                ? schedule.getDoctorArrivalTime().format(TIME_FMT) : "now";

        for (Appointment appt : activeOnly(appointments)) {
            String body = "CareSync Notification: " + docName + " has arrived at " + location
                    + " (" + timeStr + "). Your Token is #" + tokenOf(appt)
                    + ". Please be seated in the waiting lobby.";
            persist(schedule.getScheduleId(), appt, TYPE_DOCTOR_ARRIVED, body);
        }
    }

    @Override
    public void broadcastDoctorEnRoute(Schedule schedule, List<Appointment> appointments) {
        String docName  = doctorName(schedule);
        String location = schedule.getHospitalLocation();

        for (Appointment appt : activeOnly(appointments)) {
            String body = "CareSync Notification: " + docName + " is en route to " + location
                    + ". Session will commence shortly.";
            persist(schedule.getScheduleId(), appt, TYPE_DOCTOR_EN_ROUTE, body);
        }
    }

    @Override
    public void broadcastQueueStatus(Schedule schedule, List<Appointment> appointments) {
        String docName   = doctorName(schedule);
        String statusNote = schedule.getQueueStatusNote();

        for (Appointment appt : activeOnly(appointments)) {
            String body = "CareSync Notification: " + docName + " clinic update: " + statusNote;
            persist(schedule.getScheduleId(), appt, TYPE_QUEUE_STATUS, body);
        }
    }

    @Override
    public void broadcastSessionDelay(Schedule schedule, List<Appointment> appointments,
                                      int delayMinutes, String reasonNote) {
        String docName = doctorName(schedule);

        for (Appointment appt : waitingOnly(appointments)) {
            String body = "CareSync Notification: " + docName
                    + "'s clinic is delayed by approximately " + delayMinutes + " minutes. "
                    + (reasonNote != null && !reasonNote.isBlank()
                        ? "Reason: " + reasonNote
                        : "Thank you for your patience.");
            persist(schedule.getScheduleId(), appt, TYPE_SESSION_DELAYED, body);
        }
    }

    @Override
    public void notifyTokenCalled(Schedule schedule, Appointment appointment, int currentToken) {
        String docName  = doctorName(schedule);
        String location = schedule.getHospitalLocation();
        String body = "CareSync Priority Notice: Token #" + currentToken + " is NOW CALLED into "
                + location + " with " + docName + ". Please enter the room immediately.";
        persist(schedule.getScheduleId(), appointment, TYPE_TOKEN_CALLED, body);
    }

    @Override
    public void notifyNextInLine(Schedule schedule, Appointment appointment) {
        String docName  = doctorName(schedule);
        String location = schedule.getHospitalLocation();
        int    slotNo   = tokenOf(appointment);
        String body = "CareSync Priority Notice: You are NEXT IN LINE! Token #" + slotNo
                + " for " + docName + ". Please be right by the door of " + location + ".";
        persist(schedule.getScheduleId(), appointment, TYPE_APPROACHING_TURN, body);
    }

    @Override
    public void notifyApproachingTurn(Schedule schedule, Appointment appointment, int tokensAhead) {
        String docName = doctorName(schedule);
        int    slotNo  = tokenOf(appointment);
        int    estMins = tokensAhead * 10;
        String body = "CareSync Queue Update: You have " + tokensAhead
                + " patient(s) ahead (~" + estMins + " mins). Your Token: #" + slotNo
                + " | " + docName + ".";
        persist(schedule.getScheduleId(), appointment, TYPE_APPROACHING_TURN, body);
    }

    @Override
    public Integer sendCustomSms(Integer scheduleId, Integer patientId, Integer tokenNo,
                                 String messageType, String messageBody) {
        QueueNotification n = new QueueNotification(
                scheduleId,
                patientId,
                null,
                DEFAULT_PHONE,
                "Patient",
                tokenNo != null ? tokenNo : 1,
                messageType != null ? messageType : TYPE_GENERAL_ALERT,
                messageBody,
                "ACTIVE"
        );
        n.setUserId(patientId);
        n.setTargetRole("PATIENT");
        n.setTitle("Live Queue Priority Notice");
        n.setIsRead(false);
        return notificationRepository.save(n).getNotificationId();
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    /** Builds and persists a QueueNotification for a single appointment. */
    private void persist(Integer scheduleId, Appointment appt,
                         String messageType, String body) {
        Integer patId = appt.getPatient() != null ? appt.getPatient().getUserId() : null;
        Integer docId = appt.getDoctor() != null ? appt.getDoctor().getUserId() : null;

        String title = switch (messageType) {
            case TYPE_DOCTOR_ARRIVED -> "Doctor Arrived at Clinic";
            case TYPE_APPROACHING_TURN -> "Approaching Consultation Turn";
            case TYPE_TOKEN_CALLED -> "Now Calling Your Token";
            case TYPE_SESSION_DELAYED -> "Clinic Session Delay Notice";
            case TYPE_DOCTOR_EN_ROUTE -> "Doctor En Route to Clinic";
            default -> "Queue Priority Notice";
        };

        QueueNotification n = new QueueNotification(
                scheduleId,
                patId,
                appt.getAppointmentId(),
                phoneOf(appt),
                nameOf(appt),
                tokenOf(appt),
                messageType,
                body,
                "ACTIVE"
        );
        n.setUserId(patId);
        n.setDoctorId(docId);
        n.setTargetRole("PATIENT");
        n.setTitle(title);
        n.setIsRead(false);
        notificationRepository.save(n);
    }

    /** Returns the doctor's display name, never null. */
    private String doctorName(Schedule schedule) {
        return (schedule.getDoctor() != null && schedule.getDoctor().getFullName() != null)
                ? schedule.getDoctor().getFullName()
                : "Your Consultant";
    }

    /** Returns the patient's mobile number, falling back to a placeholder. */
    private String phoneOf(Appointment appt) {
        return (appt.getPatient() != null && appt.getPatient().getContactNumber() != null)
                ? appt.getPatient().getContactNumber()
                : DEFAULT_PHONE;
    }

    /** Returns the patient's name, never null. */
    private String nameOf(Appointment appt) {
        return (appt.getPatient() != null && appt.getPatient().getFullName() != null)
                ? appt.getPatient().getFullName()
                : "Patient";
    }

    /** Returns the slot/token number for this appointment, defaulting to 1. */
    private int tokenOf(Appointment appt) {
        return (appt.getTimeslot() != null && appt.getTimeslot().getSlotNo() != null)
                ? appt.getTimeslot().getSlotNo()
                : 1;
    }

    /** Filters out CANCELLED appointments. */
    private List<Appointment> activeOnly(List<Appointment> appointments) {
        return appointments.stream()
                .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getAppointmentStatus()))
                .toList();
    }

    /** Filters to appointments still waiting (not CANCELLED / COMPLETED). */
    private List<Appointment> waitingOnly(List<Appointment> appointments) {
        return appointments.stream()
                .filter(a -> !"CANCELLED".equalsIgnoreCase(a.getAppointmentStatus())
                          && !"COMPLETED".equalsIgnoreCase(a.getAppointmentStatus()))
                .toList();
    }
}
