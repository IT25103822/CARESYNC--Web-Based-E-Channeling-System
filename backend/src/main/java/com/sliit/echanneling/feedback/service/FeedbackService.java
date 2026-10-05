package com.sliit.echanneling.feedback.service;

import com.sliit.echanneling.feedback.dto.FeedbackCreateDto;
import com.sliit.echanneling.feedback.entity.Feedback;

import java.util.List;
import java.util.Map;

public interface FeedbackService {
    Feedback submitFeedback(FeedbackCreateDto dto);
    List<Feedback> getFeedbacksByDoctor(Integer doctorId);
    List<Feedback> getFeedbacksByPatient(Integer patientId);
    Double getAverageRatingForDoctor(Integer doctorId);
    List<Feedback> getAllFeedbacks();
    List<Map<String, Object>> getDoctorRatingsSummary();
    Feedback toggleFeaturedStatus(Integer feedbackId, Boolean isFeatured);
    List<Feedback> getFeaturedFeedbacks();
}
