package com.sliit.echanneling.schedule.service;

import com.sliit.echanneling.schedule.dto.CreateScheduleDto;
import com.sliit.echanneling.schedule.dto.SetAvailabilityDto;
import com.sliit.echanneling.schedule.dto.UpdateScheduleDto;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.entity.Timeslot;

import java.util.List;

/**
 * OOP Demonstration: Abstraction
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule Management Interface
 */
public interface ScheduleService {
    Schedule createSchedule(CreateScheduleDto dto);
    Schedule getScheduleById(Integer scheduleId);
    List<Schedule> getAllUpcomingSchedules();
    List<Schedule> getAllSchedules();
    List<Schedule> getSchedulesByDoctor(Integer doctorId);
    List<Timeslot> getTimeslotsBySchedule(Integer scheduleId);
    List<Timeslot> getAvailableTimeslots(Integer scheduleId);
    Schedule updateSchedule(Integer scheduleId, UpdateScheduleDto dto);
    Schedule updateAvailability(SetAvailabilityDto dto);
    void deleteSchedule(Integer scheduleId);
}
