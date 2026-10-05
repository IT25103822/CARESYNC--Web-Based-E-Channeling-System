package com.sliit.echanneling.feedback.service;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.repository.DoctorRepository;
import com.sliit.echanneling.feedback.dto.FeedbackCreateDto;
import com.sliit.echanneling.feedback.entity.Feedback;
import com.sliit.echanneling.feedback.repository.FeedbackRepository;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Autowired
    public FeedbackServiceImpl(FeedbackRepository feedbackRepository,
                               AppointmentRepository appointmentRepository,
                               PatientRepository patientRepository,
                               DoctorRepository doctorRepository) {
        this.feedbackRepository = feedbackRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    @Override
    public Feedback submitFeedback(FeedbackCreateDto dto) {
        if (feedbackRepository.findByAppointment_AppointmentId(dto.getAppointmentId()).isPresent()) {
            throw new BadRequestException("Feedback has already been submitted for Appointment ID: " + dto.getAppointmentId());
        }

        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + dto.getAppointmentId()));
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        Feedback feedback = new Feedback(patient, doctor, appointment, dto.getRating(), dto.getComments());
        return feedbackRepository.save(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Feedback> getFeedbacksByDoctor(Integer doctorId) {
        return feedbackRepository.findByDoctor_UserIdOrderBySubmittedDateDesc(doctorId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Feedback> getFeedbacksByPatient(Integer patientId) {
        return feedbackRepository.findByPatient_UserIdOrderBySubmittedDateDesc(patientId);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getAverageRatingForDoctor(Integer doctorId) {
        List<Feedback> feedbacks = getFeedbacksByDoctor(doctorId);
        if (feedbacks.isEmpty()) return 0.0;
        return feedbacks.stream().mapToInt(Feedback::getRating).average().orElse(0.0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAllByOrderBySubmittedDateDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDoctorRatingsSummary() {
        List<Doctor> doctors = doctorRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (Doctor doc : doctors) {
            List<Feedback> feedbacks = feedbackRepository.findByDoctor_UserIdOrderBySubmittedDateDesc(doc.getUserId());
            double avg = feedbacks.isEmpty() ? 5.0 : feedbacks.stream().mapToInt(Feedback::getRating).average().orElse(5.0);

            Map<String, Object> map = new HashMap<>();
            map.put("doctorId", doc.getUserId());
            map.put("doctorName", doc.getFullName());
            map.put("specialization", doc.getSpecialization());
            map.put("hospitalAffiliation", doc.getHospitalAffiliation());
            map.put("profileImage", doc.getProfileImage());
            map.put("averageRating", Math.round(avg * 10.0) / 10.0);
            map.put("totalReviews", feedbacks.size());
            map.put("feedbacks", feedbacks);
            list.add(map);
        }
        return list;
    }

    @Override
    public Feedback toggleFeaturedStatus(Integer feedbackId, Boolean isFeatured) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with ID: " + feedbackId));
        if (isFeatured != null) {
            feedback.setIsFeatured(isFeatured);
        } else {
            feedback.setIsFeatured(!feedback.getIsFeatured());
        }
        return feedbackRepository.save(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Feedback> getFeaturedFeedbacks() {
        return feedbackRepository.findByIsFeaturedTrueOrderBySubmittedDateDesc();
    }
}
