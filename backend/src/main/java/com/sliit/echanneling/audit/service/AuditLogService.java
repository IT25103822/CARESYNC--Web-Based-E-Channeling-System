package com.sliit.echanneling.audit.service;

import com.sliit.echanneling.audit.entity.SystemLog;
import java.util.List;
import java.util.Map;

public interface AuditLogService {

    SystemLog log(Integer userId, String performerName, String performerRole, String actionType,
                  String entityName, Integer entityId, String description, String severity, String ipAddress);

    SystemLog log(String performerName, String performerRole, String actionType,
                  String entityName, Integer entityId, String description, String severity);

    List<SystemLog> getAllLogs();

    List<SystemLog> getRecentLogs();

    Map<String, Object> getLogStats();
}
