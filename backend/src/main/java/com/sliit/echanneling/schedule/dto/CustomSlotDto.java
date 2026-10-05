package com.sliit.echanneling.schedule.dto;

import java.time.LocalTime;

public class CustomSlotDto {
    private Integer slotNo;
    private LocalTime startTime;
    private LocalTime endTime;

    public CustomSlotDto() {}

    public CustomSlotDto(Integer slotNo, LocalTime startTime, LocalTime endTime) {
        this.slotNo = slotNo;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Integer getSlotNo() { return slotNo; }
    public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
