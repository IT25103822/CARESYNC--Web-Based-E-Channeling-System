package com.sliit.echanneling.payment.repository;

import com.sliit.echanneling.payment.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Member 6: Brahmananayaka N.M (IT25103825) - Refund Repository
 */
@Repository
public interface RefundRepository extends JpaRepository<Refund, Integer> {
    Optional<Refund> findByAppointment_AppointmentId(Integer appointmentId);
    List<Refund> findByRefundStatusOrderByRefundDateDesc(String refundStatus);
    List<Refund> findAllByOrderByRefundDateDesc();
    List<Refund> findByAppointment_Patient_UserIdOrderByRefundDateDesc(Integer patientId);
}
