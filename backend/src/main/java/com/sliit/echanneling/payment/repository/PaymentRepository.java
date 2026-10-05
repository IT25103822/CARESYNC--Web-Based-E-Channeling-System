package com.sliit.echanneling.payment.repository;

import com.sliit.echanneling.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * Member 6: Brahmananayaka N.M (IT25103825) - Payment Management
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByAppointment_AppointmentId(Integer appointmentId);
    Optional<Payment> findByTransactionReference(String transactionReference);
    boolean existsByTransactionReference(String transactionReference);
    List<Payment> findAllByOrderByPaymentDateDesc();
}
