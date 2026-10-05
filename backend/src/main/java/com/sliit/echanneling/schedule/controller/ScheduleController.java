package com.sliit.echanneling.schedule.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.schedule.dto.CreateScheduleDto;
import com.sliit.echanneling.schedule.dto.SetAvailabilityDto;
import com.sliit.echanneling.schedule.dto.UpdateScheduleDto;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.entity.Timeslot;
import com.sliit.echanneling.schedule.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule REST Controller
 */
@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class ScheduleController {

    private final ScheduleService scheduleService;

    @Autowired
    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Schedule>> createSchedule(@Valid @RequestBody CreateScheduleDto dto) {
        Schedule schedule = scheduleService.createSchedule(dto);
        return new ResponseEntity<>(ApiResponse.ok("Consultation session and time-slots generated successfully", schedule), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Schedule>>> getAllSchedules() {
        List<Schedule> schedules = scheduleService.getAllSchedules();
        return ResponseEntity.ok(ApiResponse.ok("All consultation sessions retrieved successfully", schedules));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<Schedule>>> getAllUpcomingSchedules() {
        List<Schedule> schedules = scheduleService.getAllUpcomingSchedules();
        return ResponseEntity.ok(ApiResponse.ok("Upcoming schedules fetched successfully", schedules));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Schedule>> getScheduleById(@PathVariable Integer id) {
        Schedule schedule = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(ApiResponse.ok("Schedule details fetched", schedule));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Schedule>>> getSchedulesByDoctor(@PathVariable Integer doctorId) {
        List<Schedule> schedules = scheduleService.getSchedulesByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Doctor schedules fetched", schedules));
    }

    @GetMapping("/{id}/timeslots")
    public ResponseEntity<ApiResponse<List<Timeslot>>> getTimeslotsBySchedule(@PathVariable Integer id) {
        List<Timeslot> slots = scheduleService.getTimeslotsBySchedule(id);
        return ResponseEntity.ok(ApiResponse.ok("Timeslots fetched for schedule", slots));
    }

    @GetMapping("/{id}/available-slots")
    public ResponseEntity<ApiResponse<List<Timeslot>>> getAvailableTimeslots(@PathVariable Integer id) {
        List<Timeslot> slots = scheduleService.getAvailableTimeslots(id);
        return ResponseEntity.ok(ApiResponse.ok("Available timeslots fetched", slots));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Schedule>> updateSchedule(@PathVariable Integer id, @RequestBody UpdateScheduleDto dto) {
        Schedule updated = scheduleService.updateSchedule(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Schedule updated successfully", updated));
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse<Schedule>> updateAvailability(@Valid @RequestBody SetAvailabilityDto dto) {
        Schedule updated = scheduleService.updateAvailability(dto);
        return ResponseEntity.ok(ApiResponse.ok("Doctor availability and leave status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteSchedule(@PathVariable Integer id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.ok("Schedule cancelled successfully", "Success"));
    }
}
