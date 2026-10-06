package com.sliit.echanneling.payment.repository;

import com.sliit.echanneling.payment.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Member 6: Brahmananayaka N.M (IT25103825) - Receipt Repository
 */
@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Integer> {
    Optional<Receipt> findByPayment_PaymentId(Integer paymentId);
    Optional<Receipt> findByPayment_Appointment_AppointmentId(Integer appointmentId);
    Optional<Receipt> findByReceiptNumber(String receiptNumber);
}
