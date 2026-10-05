package com.sliit.echanneling.feedback.service;

import com.sliit.echanneling.feedback.dto.ComplaintCreateDto;
import com.sliit.echanneling.feedback.dto.ComplaintResolveDto;
import com.sliit.echanneling.feedback.entity.Complaint;

import java.util.List;

public interface ComplaintService {
    Complaint raiseComplaint(ComplaintCreateDto dto);
    List<Complaint> getAllComplaints();
    List<Complaint> getComplaintsByPatient(Integer patientId);
    List<Complaint> getComplaintsByStatus(String status);
    Complaint resolveComplaint(Integer complaintId, ComplaintResolveDto dto);
}
