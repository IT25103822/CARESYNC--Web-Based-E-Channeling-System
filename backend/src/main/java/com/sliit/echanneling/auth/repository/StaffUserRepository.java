package com.sliit.echanneling.auth.repository;

import com.sliit.echanneling.auth.entity.StaffUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Staff User Repository for Role-Based Staff Management
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) & Member 2: Adhikari A.M.S.T (IT25103821)
 */
@Repository
public interface StaffUserRepository extends JpaRepository<StaffUser, Integer> {
    List<StaffUser> findByStaffRole(String staffRole);
    Optional<StaffUser> findByUsername(String username);
    Optional<StaffUser> findByNic(String nic);
    boolean existsByUsername(String username);
    boolean existsByNic(String nic);
}
