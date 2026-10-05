package com.sliit.echanneling.schedule.service;

import com.sliit.echanneling.schedule.dto.*;

import java.util.List;

/**
 * OOP Principle: Abstraction & Interface Segregation
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule & Live Queue Management
 */
public interface LiveQueueService {
    LiveQueueDto getLiveQueue(Integer scheduleId);
    List<LiveQueueDto> getTodayLiveQueues();
    List<LiveQueueDto> getLiveQueuesByDoctor(Integer doctorId);
    LiveQueueDto updateDoctorArrival(Integer scheduleId, UpdateDoctorArrivalDto dto);
    LiveQueueDto updateCurrentToken(Integer scheduleId, UpdateCurrentTokenDto dto);
    LiveQueueDto updateQueueDelay(Integer scheduleId, UpdateQueueDelayDto dto);
    QueueNotificationDto sendQueueSms(SendQueueSmsDto dto);
    List<QueueNotificationDto> getPatientNotifications(Integer patientId);
    List<QueueNotificationDto> getScheduleNotifications(Integer scheduleId);
    LiveQueueDto concludeQueue(Integer scheduleId);
    LiveQueueDto resetQueue(Integer scheduleId);
}
