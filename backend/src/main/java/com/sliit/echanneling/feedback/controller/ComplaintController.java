package com.sliit.echanneling.feedback.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.feedback.dto.ComplaintCreateDto;
import com.sliit.echanneling.feedback.dto.ComplaintResolveDto;
import com.sliit.echanneling.feedback.entity.Complaint;
import com.sliit.echanneling.feedback.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - Complaint REST Controller
 */
@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService complaintService;

    @Autowired
    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Complaint>> raiseComplaint(@Valid @RequestBody ComplaintCreateDto dto) {
        Complaint complaint = complaintService.raiseComplaint(dto);
        return new ResponseEntity<>(ApiResponse.ok("Complaint registered successfully with support", complaint), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Complaint>>> getAllComplaints() {
        List<Complaint> list = complaintService.getAllComplaints();
        return ResponseEntity.ok(ApiResponse.ok("All customer complaints fetched", list));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Complaint>>> getComplaintsByPatient(@PathVariable Integer patientId) {
        List<Complaint> list = complaintService.getComplaintsByPatient(patientId);
        return ResponseEntity.ok(ApiResponse.ok("Patient complaints fetched", list));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<Complaint>>> getComplaintsByStatus(@PathVariable String status) {
        List<Complaint> list = complaintService.getComplaintsByStatus(status);
        return ResponseEntity.ok(ApiResponse.ok("Complaints with status " + status + " fetched", list));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Complaint>> resolveComplaint(@PathVariable Integer id, @Valid @RequestBody ComplaintResolveDto dto) {
        Complaint resolved = complaintService.resolveComplaint(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Complaint updated/resolved successfully", resolved));
    }
}
