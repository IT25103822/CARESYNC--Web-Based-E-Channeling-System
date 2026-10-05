package com.sliit.echanneling.schedule.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class LiveQueueDto {
    private Integer scheduleId;
    private Integer doctorId;
    private String doctorName;
    private String doctorRegNo;
    private String specialization;
    private String hospitalLocation;
    private LocalDate scheduleDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String sessionStatus;
    private String doctorArrivalStatus; // NOT_ARRIVED, ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED
    private LocalTime doctorArrivalTime;
    private Integer currentToken;
    private Integer estimatedDelayMinutes;
    private String queueStatusNote;
    private Integer maxCapacity;
    private Integer totalBookedTokens;
    private Integer totalCompletedTokens;
    private Integer maxBookedToken;
    private Boolean isQueueFinished;
    private Integer nextAvailableToken;
    private Integer estimatedWaitMinutesPerPatient = 10;
    private List<QueuePatientSlotDto> queueSlots = new ArrayList<>();
    private List<QueueNotificationDto> recentNotifications = new ArrayList<>();

    public LiveQueueDto() {}

    public Integer getMaxBookedToken() { return maxBookedToken; }
    public void setMaxBookedToken(Integer maxBookedToken) { this.maxBookedToken = maxBookedToken; }

    public Boolean getIsQueueFinished() { return isQueueFinished; }
    public void setIsQueueFinished(Boolean isQueueFinished) { this.isQueueFinished = isQueueFinished; }

    public Integer getNextAvailableToken() { return nextAvailableToken; }
    public void setNextAvailableToken(Integer nextAvailableToken) { this.nextAvailableToken = nextAvailableToken; }

    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }

    public Integer getDoctorId() { return doctorId; }
    public void setDoctorId(Integer doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorRegNo() { return doctorRegNo; }
    public void setDoctorRegNo(String doctorRegNo) { this.doctorRegNo = doctorRegNo; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getHospitalLocation() { return hospitalLocation; }
    public void setHospitalLocation(String hospitalLocation) { this.hospitalLocation = hospitalLocation; }

    public LocalDate getScheduleDate() { return scheduleDate; }
    public void setScheduleDate(LocalDate scheduleDate) { this.scheduleDate = scheduleDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public String getSessionStatus() { return sessionStatus; }
    public void setSessionStatus(String sessionStatus) { this.sessionStatus = sessionStatus; }

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

    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public Integer getTotalBookedTokens() { return totalBookedTokens; }
    public void setTotalBookedTokens(Integer totalBookedTokens) { this.totalBookedTokens = totalBookedTokens; }

    public Integer getTotalCompletedTokens() { return totalCompletedTokens; }
    public void setTotalCompletedTokens(Integer totalCompletedTokens) { this.totalCompletedTokens = totalCompletedTokens; }

    public Integer getEstimatedWaitMinutesPerPatient() { return estimatedWaitMinutesPerPatient; }
    public void setEstimatedWaitMinutesPerPatient(Integer estimatedWaitMinutesPerPatient) { this.estimatedWaitMinutesPerPatient = estimatedWaitMinutesPerPatient; }

    public List<QueuePatientSlotDto> getQueueSlots() { return queueSlots; }
    public void setQueueSlots(List<QueuePatientSlotDto> queueSlots) { this.queueSlots = queueSlots; }

    public List<QueueNotificationDto> getRecentNotifications() { return recentNotifications; }
    public void setRecentNotifications(List<QueueNotificationDto> recentNotifications) { this.recentNotifications = recentNotifications; }
}
