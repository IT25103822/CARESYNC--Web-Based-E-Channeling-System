package com.sliit.echanneling.audit.service.impl;

import com.sliit.echanneling.audit.entity.SystemLog;
import com.sliit.echanneling.audit.repository.SystemLogRepository;
import com.sliit.echanneling.audit.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final SystemLogRepository systemLogRepository;

    @Autowired
    public AuditLogServiceImpl(SystemLogRepository systemLogRepository) {
        this.systemLogRepository = systemLogRepository;
    }

    @Override
    @Transactional
    public SystemLog log(Integer userId, String performerName, String performerRole, String actionType,
                          String entityName, Integer entityId, String description, String severity, String ipAddress) {
        try {
            SystemLog entry = new SystemLog(
                    userId,
                    performerName != null ? performerName : "System",
                    performerRole != null ? performerRole : "SYSTEM",
                    actionType != null ? actionType : "GENERAL_ACTIVITY",
                    entityName != null ? entityName : "System",
                    entityId,
                    description != null ? description : "System operation performed",
                    severity != null ? severity : "INFO",
                    ipAddress != null ? ipAddress : "127.0.0.1"
            );
            return systemLogRepository.save(entry);
        } catch (Exception e) {
            System.err.println("Warning: Failed to save system audit log: " + e.getMessage());
            return null;
        }
    }

    @Override
    @Transactional
    public SystemLog log(String performerName, String performerRole, String actionType,
                          String entityName, Integer entityId, String description, String severity) {
        return log(null, performerName, performerRole, actionType, entityName, entityId, description, severity, "127.0.0.1");
    }

    @Override
    public List<SystemLog> getAllLogs() {
        return systemLogRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    public List<SystemLog> getRecentLogs() {
        return systemLogRepository.findTop200ByOrderByTimestampDesc();
    }

    @Override
    public Map<String, Object> getLogStats() {
        Map<String, Object> stats = new HashMap<>();
        long total = systemLogRepository.count();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayCount = systemLogRepository.countByTimestampAfter(startOfDay);

        List<SystemLog> all = systemLogRepository.findAllByOrderByTimestampDesc();
        long staffCount = all.stream()
                .filter(l -> l.getPerformerRole() != null &&
                        !"PATIENT".equalsIgnoreCase(l.getPerformerRole()) &&
                        !"SYSTEM".equalsIgnoreCase(l.getPerformerRole()))
                .count();

        long criticalCount = all.stream()
                .filter(l -> l.getSeverity() != null &&
                        ("CRITICAL".equalsIgnoreCase(l.getSeverity()) || "WARNING".equalsIgnoreCase(l.getSeverity())))
                .count();

        stats.put("totalLogs", total);
        stats.put("todayLogs", todayCount);
        stats.put("staffLogs", staffCount);
        stats.put("criticalOrWarningLogs", criticalCount);
        return stats;
    }
}
