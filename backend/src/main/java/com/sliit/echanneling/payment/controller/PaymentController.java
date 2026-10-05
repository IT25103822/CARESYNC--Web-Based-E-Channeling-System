package com.sliit.echanneling.payment.controller;

import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.payment.dto.ProcessPaymentDto;
import com.sliit.echanneling.payment.dto.ReconciliationSummaryDto;
import com.sliit.echanneling.payment.entity.Payment;
import com.sliit.echanneling.payment.entity.Receipt;
import com.sliit.echanneling.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment Management REST Controller
 */
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @Autowired
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<Payment>> processPayment(@Valid @RequestBody ProcessPaymentDto dto) {
        Payment payment = paymentService.processPayment(dto);
        return new ResponseEntity<>(ApiResponse.ok("Payment processed successfully & digital receipt issued", payment), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        List<Payment> list = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.ok("All transactions fetched", list));
    }

    @GetMapping("/{paymentId}/receipt")
    public ResponseEntity<ApiResponse<Receipt>> getReceiptByPaymentId(@PathVariable Integer paymentId) {
        Receipt receipt = paymentService.getReceiptByPaymentId(paymentId);
        return ResponseEntity.ok(ApiResponse.ok("Receipt details fetched", receipt));
    }

    @GetMapping("/appointment/{appointmentId}/receipt")
    public ResponseEntity<ApiResponse<Receipt>> getReceiptByAppointmentId(@PathVariable Integer appointmentId) {
        Receipt receipt = paymentService.getReceiptByAppointmentId(appointmentId);
        return ResponseEntity.ok(ApiResponse.ok("Appointment receipt details fetched", receipt));
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<ApiResponse<ReconciliationSummaryDto>> getReconciliationReport() {
        ReconciliationSummaryDto report = paymentService.getReconciliationReport();
        return ResponseEntity.ok(ApiResponse.ok("Financial reconciliation report generated", report));
    }

    @PostMapping({"/custom-bill", "/custom-bills"})
    public ResponseEntity<ApiResponse<com.sliit.echanneling.payment.entity.CustomBill>> createCustomBill(
            @Valid @RequestBody com.sliit.echanneling.payment.dto.CreateCustomBillDto dto) {
        com.sliit.echanneling.payment.entity.CustomBill bill = paymentService.createCustomBill(dto);
        return new ResponseEntity<>(ApiResponse.ok("Custom hospital bill generated & recorded", bill), HttpStatus.CREATED);
    }

    @GetMapping("/custom-bills")
    public ResponseEntity<ApiResponse<List<com.sliit.echanneling.payment.entity.CustomBill>>> getAllCustomBills() {
        List<com.sliit.echanneling.payment.entity.CustomBill> list = paymentService.getAllCustomBills();
        return ResponseEntity.ok(ApiResponse.ok("Custom bills retrieved", list));
    }

    @GetMapping("/custom-bills/{invoiceNumber}")
    public ResponseEntity<ApiResponse<com.sliit.echanneling.payment.entity.CustomBill>> getCustomBillByInvoiceNumber(
            @PathVariable String invoiceNumber) {
        com.sliit.echanneling.payment.entity.CustomBill bill = paymentService.getCustomBillByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(ApiResponse.ok("Custom bill retrieved", bill));
    }

    @PutMapping("/custom-bills/{billId}/pay")
    public ResponseEntity<ApiResponse<com.sliit.echanneling.payment.entity.CustomBill>> payCustomBill(
            @PathVariable Integer billId,
            @RequestBody com.sliit.echanneling.payment.dto.PayCustomBillDto dto) {
        com.sliit.echanneling.payment.entity.CustomBill bill = paymentService.payCustomBill(billId, dto);
        return ResponseEntity.ok(ApiResponse.ok("Custom hospital bill settled & paid successfully", bill));
    }

    @GetMapping("/custom-bills/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<com.sliit.echanneling.payment.entity.CustomBill>>> getCustomBillsForPatient(
            @PathVariable String patientId,
            @RequestParam(required = false) String nic,
            @RequestParam(required = false) String contact) {
        List<com.sliit.echanneling.payment.entity.CustomBill> list = paymentService.getCustomBillsForPatient(patientId, nic, contact);
        return ResponseEntity.ok(ApiResponse.ok("Patient custom bills fetched", list));
    }
}
