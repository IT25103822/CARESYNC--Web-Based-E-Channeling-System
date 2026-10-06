package com.sliit.echanneling.schedule.dto;

public class UpdateCurrentTokenDto {
    private Integer targetToken;
    private String queueStatusNote;
    private Boolean notifyUpcomingPatients = true;

    public UpdateCurrentTokenDto() {}

    public Integer getTargetToken() { return targetToken; }
    public void setTargetToken(Integer targetToken) { this.targetToken = targetToken; }

    public String getQueueStatusNote() { return queueStatusNote; }
    public void setQueueStatusNote(String queueStatusNote) { this.queueStatusNote = queueStatusNote; }

    public Boolean getNotifyUpcomingPatients() { return notifyUpcomingPatients; }
    public void setNotifyUpcomingPatients(Boolean notifyUpcomingPatients) { this.notifyUpcomingPatients = notifyUpcomingPatients; }
}
