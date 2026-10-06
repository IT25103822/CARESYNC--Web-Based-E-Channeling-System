package com.sliit.echanneling.payment.repository;

import com.sliit.echanneling.payment.entity.CustomBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Custom Bill Repository
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment & Financial Governance
 */
@Repository
public interface CustomBillRepository extends JpaRepository<CustomBill, Integer> {
    Optional<CustomBill> findByInvoiceNumber(String invoiceNumber);
    List<CustomBill> findAllByOrderByCreatedAtDesc();
    List<CustomBill> findByPatientIdIgnoreCaseOrderByCreatedAtDesc(String patientId);
    List<CustomBill> findByPatientIdIgnoreCaseOrPatientNicIgnoreCaseOrPatientContactOrderByCreatedAtDesc(String patientId, String patientNic, String patientContact);
}
