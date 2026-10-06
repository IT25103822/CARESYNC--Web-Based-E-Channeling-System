package com.sliit.echanneling.schedule.dto;

public class QueuePatientSlotDto {
    private Integer appointmentId;
    private Integer slotNo;
    private String slotTime;
    private Integer patientId;
    private String patientName;
    private String patientPhone;
    private String appointmentStatus;
    private boolean isCurrentToken;
    private boolean isCompleted;
    private Integer tokensAhead;
    private Integer estimatedWaitMinutes;

    public QueuePatientSlotDto() {}

    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }

    public String getSlotTime() { return slotTime; }
    public void setSlotTime(String slotTime) { this.slotTime = slotTime; }

    public Integer getPatientId() { return patientId; }
    public void setPatientId(Integer patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getAppointmentStatus() { return appointmentStatus; }
    public void setAppointmentStatus(String appointmentStatus) { this.appointmentStatus = appointmentStatus; }

    public boolean isCurrentToken() { return isCurrentToken; }
    public void setCurrentToken(boolean currentToken) { isCurrentToken = currentToken; }

    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { isCompleted = completed; }

    public Integer getTokensAhead() { return tokensAhead; }
    public void setTokensAhead(Integer tokensAhead) { this.tokensAhead = tokensAhead; }

    public Integer getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(Integer estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }
}
