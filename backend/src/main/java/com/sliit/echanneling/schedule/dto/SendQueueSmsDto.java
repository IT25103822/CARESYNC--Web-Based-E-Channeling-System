package com.sliit.echanneling.schedule.dto;

public class SendQueueSmsDto {
    private Integer scheduleId;
    private Integer targetPatientId;
    private Integer targetToken;
    private String messageType; // GENERAL_ALERT, APPROACHING_TURN, DOCTOR_ARRIVED, SESSION_DELAYED
    private String messageBody;

    public SendQueueSmsDto() {}

    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }

    public Integer getTargetPatientId() { return targetPatientId; }
    public void setTargetPatientId(Integer targetPatientId) { this.targetPatientId = targetPatientId; }

    public Integer getTargetToken() { return targetToken; }
    public void setTargetToken(Integer targetToken) { this.targetToken = targetToken; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getMessageBody() { return messageBody; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }
}
