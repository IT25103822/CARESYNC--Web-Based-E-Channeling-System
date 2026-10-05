package com.sliit.echanneling.audit.repository;

import com.sliit.echanneling.audit.entity.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Integer> {

    List<SystemLog> findAllByOrderByTimestampDesc();

    List<SystemLog> findTop200ByOrderByTimestampDesc();

    List<SystemLog> findByPerformerRoleIgnoreCaseOrderByTimestampDesc(String role);

    List<SystemLog> findByActionTypeIgnoreCaseOrderByTimestampDesc(String actionType);

    List<SystemLog> findBySeverityIgnoreCaseOrderByTimestampDesc(String severity);

    long countByTimestampAfter(LocalDateTime dateTime);
}
