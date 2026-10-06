package com.sliit.echanneling.payment.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.payment.dto.RefundDecisionDto;
import com.sliit.echanneling.payment.dto.RefundRequestDto;
import com.sliit.echanneling.payment.entity.Refund;
import com.sliit.echanneling.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 6: Brahmananayaka N.M (IT25103825) - Refund REST Controller
 */
@RestController
@RequestMapping("/api/refunds")
@CrossOrigin(origins = "*")
public class RefundController {

    private final PaymentService paymentService;

    @Autowired
    public RefundController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Refund>> requestRefund(@Valid @RequestBody RefundRequestDto dto) {
        Refund refund = paymentService.requestRefund(dto);
        return new ResponseEntity<>(ApiResponse.ok("Refund request submitted successfully", refund), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Refund>>> getAllRefunds() {
        List<Refund> list = paymentService.getAllRefunds();
        return ResponseEntity.ok(ApiResponse.ok("All refund requests fetched", list));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Refund>>> getRefundsByPatient(@PathVariable Integer patientId) {
        List<Refund> list = paymentService.getRefundsByPatientId(patientId);
        return ResponseEntity.ok(ApiResponse.ok("Patient refund requests fetched", list));
    }

    @PostMapping("/custom")
    public ResponseEntity<ApiResponse<Object>> createCustomRefund(@Valid @RequestBody com.sliit.echanneling.payment.dto.CustomRefundDto dto) {
        Object result = paymentService.createCustomRefund(dto);
        return new ResponseEntity<>(ApiResponse.ok("Custom refund authorized and financial ledger updated successfully", result), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/process")
    public ResponseEntity<ApiResponse<Refund>> processRefundDecision(@PathVariable Integer id, @Valid @RequestBody RefundDecisionDto dto) {
        Refund updated = paymentService.processRefundDecision(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Refund status updated to " + dto.getStatus(), updated));
    }
}
