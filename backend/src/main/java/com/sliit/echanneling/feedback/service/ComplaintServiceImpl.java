package com.sliit.echanneling.feedback.service;

import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.feedback.dto.ComplaintCreateDto;
import com.sliit.echanneling.feedback.dto.ComplaintResolveDto;
import com.sliit.echanneling.feedback.entity.Complaint;
import com.sliit.echanneling.feedback.repository.ComplaintRepository;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final PatientRepository patientRepository;

    @Autowired
    public ComplaintServiceImpl(ComplaintRepository complaintRepository, PatientRepository patientRepository) {
        this.complaintRepository = complaintRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public Complaint raiseComplaint(ComplaintCreateDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Complaint complaint = new Complaint(patient, dto.getComplaintType(), dto.getDescription());
        return complaintRepository.save(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAllByOrderByDateSubmittedDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Complaint> getComplaintsByPatient(Integer patientId) {
        return complaintRepository.findByPatient_UserIdOrderByDateSubmittedDesc(patientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Complaint> getComplaintsByStatus(String status) {
        return complaintRepository.findByComplaintStatusOrderByDateSubmittedDesc(status);
    }

    @Override
    public Complaint resolveComplaint(Integer complaintId, ComplaintResolveDto dto) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + complaintId));

        complaint.setCustomerServiceId(dto.getCustomerServiceId());
        complaint.setComplaintStatus(dto.getStatus());
        complaint.setResolutionNotes(dto.getResolutionNotes());
        complaint.setResolvedDate(LocalDateTime.now());

        return complaintRepository.save(complaint);
    }
}
