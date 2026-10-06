package com.sliit.echanneling.feedback.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.feedback.dto.FeedbackCreateDto;
import com.sliit.echanneling.feedback.entity.Feedback;
import com.sliit.echanneling.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - Feedback REST Controller
 */
@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final com.sliit.echanneling.audit.service.AuditLogService auditLogService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService,
                              com.sliit.echanneling.audit.service.AuditLogService auditLogService) {
        this.feedbackService = feedbackService;
        this.auditLogService = auditLogService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Feedback>> submitFeedback(@Valid @RequestBody FeedbackCreateDto dto) {
        Feedback feedback = feedbackService.submitFeedback(dto);
        return new ResponseEntity<>(ApiResponse.ok("Feedback submitted successfully", feedback), HttpStatus.CREATED);
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Feedback>>> getFeedbacksByDoctor(@PathVariable Integer doctorId) {
        List<Feedback> feedbacks = feedbackService.getFeedbacksByDoctor(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Doctor feedbacks fetched successfully", feedbacks));
    }

    @GetMapping("/doctor/{doctorId}/rating")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDoctorAverageRating(@PathVariable Integer doctorId) {
        Double avg = feedbackService.getAverageRatingForDoctor(doctorId);
        List<Feedback> list = feedbackService.getFeedbacksByDoctor(doctorId);
        Map<String, Object> result = new HashMap<>();
        result.put("doctorId", doctorId);
        result.put("averageRating", Math.round(avg * 10.0) / 10.0);
        result.put("totalReviews", list.size());
        return ResponseEntity.ok(ApiResponse.ok("Doctor rating summary fetched", result));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Feedback>>> getFeedbacksByPatient(@PathVariable Integer patientId) {
        List<Feedback> feedbacks = feedbackService.getFeedbacksByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.ok("Patient submitted feedbacks fetched", feedbacks));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Feedback>>> getAllFeedbacks() {
        List<Feedback> feedbacks = feedbackService.getAllFeedbacks();
        return ResponseEntity.ok(ApiResponse.ok("All feedbacks fetched successfully", feedbacks));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDoctorRatingsSummary() {
        List<Map<String, Object>> summary = feedbackService.getDoctorRatingsSummary();
        return ResponseEntity.ok(ApiResponse.ok("Doctor ratings summary fetched successfully", summary));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<Feedback>>> getFeaturedFeedbacks() {
        List<Feedback> list = feedbackService.getFeaturedFeedbacks();
        return ResponseEntity.ok(ApiResponse.ok("Featured landing page reviews fetched successfully", list));
    }

    @PutMapping("/{id}/toggle-featured")
    public ResponseEntity<ApiResponse<Feedback>> toggleFeatured(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Boolean> body) {
        Boolean targetState = (body != null && body.containsKey("isFeatured")) ? body.get("isFeatured") : null;
        Feedback updated = feedbackService.toggleFeaturedStatus(id, targetState);
        String msg = Boolean.TRUE.equals(updated.getIsFeatured()) 
                ? "Feedback marked as featured for landing page" 
                : "Feedback removed from landing page display";

        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "FEEDBACK_CURATED", "Feedback", id,
                (Boolean.TRUE.equals(updated.getIsFeatured()) ? "Featured" : "Unfeatured") + 
                " patient testimonial #" + id + " for public landing page", "INFO", "127.0.0.1");

        return ResponseEntity.ok(ApiResponse.ok(msg, updated));
    }
}
