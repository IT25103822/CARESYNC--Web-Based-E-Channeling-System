package com.sliit.echanneling.auth.repository;

import com.sliit.echanneling.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Member 3: Karunathilake B.M.G.T.P (IT25103822) - User Login & Feedback Management
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByNic(String nic);
    boolean existsByUsername(String username);
}
