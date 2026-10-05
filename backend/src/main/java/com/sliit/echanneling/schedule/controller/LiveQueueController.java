package com.sliit.echanneling.schedule.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.schedule.dto.*;
import com.sliit.echanneling.schedule.service.LiveQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Live Queue & Smart Token Tracking REST Controller
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule & Live Queue Management
 */
@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class LiveQueueController {

    private final LiveQueueService liveQueueService;

    @Autowired
    public LiveQueueController(LiveQueueService liveQueueService) {
        this.liveQueueService = liveQueueService;
    }

    @GetMapping("/{id}/live-queue")
    public ResponseEntity<ApiResponse<LiveQueueDto>> getLiveQueue(@PathVariable Integer id) {
        LiveQueueDto dto = liveQueueService.getLiveQueue(id);
        return ResponseEntity.ok(ApiResponse.ok("Live queue details retrieved", dto));
    }

    @GetMapping("/live-queue/today")
    public ResponseEntity<ApiResponse<List<LiveQueueDto>>> getTodayLiveQueues() {
        List<LiveQueueDto> list = liveQueueService.getTodayLiveQueues();
        return ResponseEntity.ok(ApiResponse.ok("Today's live queue sessions retrieved", list));
    }

    @GetMapping("/live-queue/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<LiveQueueDto>>> getDoctorLiveQueues(@PathVariable Integer doctorId) {
        List<LiveQueueDto> list = liveQueueService.getLiveQueuesByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Doctor's live queue sessions retrieved", list));
    }

    @PutMapping("/{id}/live-queue/arrival")
    public ResponseEntity<ApiResponse<LiveQueueDto>> updateDoctorArrival(
            @PathVariable Integer id,
            @RequestBody UpdateDoctorArrivalDto dto) {
        LiveQueueDto updated = liveQueueService.updateDoctorArrival(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Doctor arrival status updated & patient notifications dispatched", updated));
    }

    @PutMapping("/{id}/live-queue/token")
    public ResponseEntity<ApiResponse<LiveQueueDto>> updateCurrentToken(
            @PathVariable Integer id,
            @RequestBody UpdateCurrentTokenDto dto) {
        LiveQueueDto updated = liveQueueService.updateCurrentToken(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Current consulting token advanced & SMS alerts dispatched", updated));
    }

    @PutMapping("/{id}/live-queue/delay")
    public ResponseEntity<ApiResponse<LiveQueueDto>> updateQueueDelay(
            @PathVariable Integer id,
            @RequestBody UpdateQueueDelayDto dto) {
        LiveQueueDto updated = liveQueueService.updateQueueDelay(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Session delay recorded & SMS alert dispatched", updated));
    }

    @PutMapping("/{id}/live-queue/conclude")
    public ResponseEntity<ApiResponse<LiveQueueDto>> concludeQueue(@PathVariable Integer id) {
        LiveQueueDto updated = liveQueueService.concludeQueue(id);
        return ResponseEntity.ok(ApiResponse.ok("Session queue concluded successfully", updated));
    }

    @PutMapping("/{id}/live-queue/reset")
    public ResponseEntity<ApiResponse<LiveQueueDto>> resetQueue(@PathVariable Integer id) {
        LiveQueueDto updated = liveQueueService.resetQueue(id);
        return ResponseEntity.ok(ApiResponse.ok("Session queue recalibrated to Token #1", updated));
    }

    @PostMapping("/{id}/live-queue/send-sms")
    public ResponseEntity<ApiResponse<QueueNotificationDto>> sendQueueSms(
            @PathVariable Integer id,
            @RequestBody SendQueueSmsDto dto) {
        dto.setScheduleId(id);
        QueueNotificationDto sent = liveQueueService.sendQueueSms(dto);
        return ResponseEntity.ok(ApiResponse.ok("SMS notification dispatched to patient", sent));
    }

    @GetMapping("/live-queue/patient/{patientId}/notifications")
    public ResponseEntity<ApiResponse<List<QueueNotificationDto>>> getPatientNotifications(@PathVariable Integer patientId) {
        List<QueueNotificationDto> list = liveQueueService.getPatientNotifications(patientId);
        return ResponseEntity.ok(ApiResponse.ok("Patient queue SMS alerts history retrieved", list));
    }

    @GetMapping("/{id}/live-queue/notifications")
    public ResponseEntity<ApiResponse<List<QueueNotificationDto>>> getScheduleNotifications(@PathVariable Integer id) {
        List<QueueNotificationDto> list = liveQueueService.getScheduleNotifications(id);
        return ResponseEntity.ok(ApiResponse.ok("Schedule queue notifications retrieved", list));
    }
}
