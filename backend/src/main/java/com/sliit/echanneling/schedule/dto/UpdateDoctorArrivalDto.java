package com.sliit.echanneling.schedule.dto;

import java.time.LocalTime;

public class UpdateDoctorArrivalDto {
    private String doctorArrivalStatus; // NOT_ARRIVED, ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED
    private LocalTime doctorArrivalTime;
    private String queueStatusNote;
    private Boolean broadcastSms = true;

    public UpdateDoctorArrivalDto() {}

    public String getDoctorArrivalStatus() { return doctorArrivalStatus; }
    public void setDoctorArrivalStatus(String doctorArrivalStatus) { this.doctorArrivalStatus = doctorArrivalStatus; }

    public LocalTime getDoctorArrivalTime() { return doctorArrivalTime; }
    public void setDoctorArrivalTime(LocalTime doctorArrivalTime) { this.doctorArrivalTime = doctorArrivalTime; }

    public String getQueueStatusNote() { return queueStatusNote; }
    public void setQueueStatusNote(String queueStatusNote) { this.queueStatusNote = queueStatusNote; }

    public Boolean getBroadcastSms() { return broadcastSms; }
    public void setBroadcastSms(Boolean broadcastSms) { this.broadcastSms = broadcastSms; }
}
