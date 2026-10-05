package com.sliit.echanneling.feedback.repository;

import com.sliit.echanneling.feedback.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - Complaint Repository
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Integer> {
    List<Complaint> findByPatient_UserIdOrderByDateSubmittedDesc(Integer patientId);
    List<Complaint> findByComplaintStatusOrderByDateSubmittedDesc(String status);
    List<Complaint> findAllByOrderByDateSubmittedDesc();
}
