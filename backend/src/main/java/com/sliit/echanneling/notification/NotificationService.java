package com.sliit.echanneling.notification;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.schedule.entity.Schedule;

import java.util.List;

/**
 * OOP Principle: Abstraction — Centralised notification contract.
 *
 * NotificationService decouples the "what to say" (business rules in
 * LiveQueueService) from the "how to send" (channel mechanics: SMS, call,
 * push, email).  Any future channel change only requires touching the impl.
 *
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) — Doctor Schedule & Live Queue Management
 */
public interface NotificationService {

    /**
     * Sends a Doctor-Arrived broadcast SMS to every active patient in the schedule.
     */
    void broadcastDoctorArrived(Schedule schedule, List<Appointment> appointments);

    /**
     * Sends a Doctor-En-Route broadcast SMS to every active patient in the schedule.
     */
    void broadcastDoctorEnRoute(Schedule schedule, List<Appointment> appointments);

    /**
     * Sends a generic queue-status broadcast SMS to every active patient.
     */
    void broadcastQueueStatus(Schedule schedule, List<Appointment> appointments);

    /**
     * Sends a session-delay broadcast SMS to every still-waiting patient.
     */
    void broadcastSessionDelay(Schedule schedule, List<Appointment> appointments,
                               int delayMinutes, String reasonNote);

    /**
     * Sends an instant "Your token is NOW CALLED" SMS to a single patient.
     */
    void notifyTokenCalled(Schedule schedule, Appointment appointment, int currentToken);

    /**
     * Sends a "You are NEXT IN LINE" SMS to a single patient.
     */
    void notifyNextInLine(Schedule schedule, Appointment appointment);

    /**
     * Sends an "N patients ahead, ~X minutes" SMS to a single patient.
     */
    void notifyApproachingTurn(Schedule schedule, Appointment appointment, int tokensAhead);

    /**
     * Sends a custom ad-hoc SMS (used by sendQueueSms endpoint).
     *
     * @return the persisted QueueNotification id
     */
    Integer sendCustomSms(Integer scheduleId, Integer patientId, Integer tokenNo,
                          String messageType, String messageBody);
}
