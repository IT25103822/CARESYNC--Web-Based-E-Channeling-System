package com.sliit.echanneling.schedule.dto;

public class UpdateQueueDelayDto {
    private Integer delayMinutes;
    private String reasonNote;
    private Boolean broadcastSms = true;

    public UpdateQueueDelayDto() {}

    public Integer getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(Integer delayMinutes) { this.delayMinutes = delayMinutes; }

    public String getReasonNote() { return reasonNote; }
    public void setReasonNote(String reasonNote) { this.reasonNote = reasonNote; }

    public Boolean getBroadcastSms() { return broadcastSms; }
    public void setBroadcastSms(Boolean broadcastSms) { this.broadcastSms = broadcastSms; }
}
