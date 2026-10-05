package com.sliit.echanneling.audit.controller;

import com.sliit.echanneling.audit.entity.SystemLog;
import com.sliit.echanneling.audit.service.AuditLogService;
import com.sliit.echanneling.common.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Autowired
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemLog>>> getAllLogs() {
        List<SystemLog> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.ok("System audit logs retrieved successfully", logs));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<SystemLog>>> getRecentLogs() {
        List<SystemLog> logs = auditLogService.getRecentLogs();
        return ResponseEntity.ok(ApiResponse.ok("Recent system audit logs retrieved", logs));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLogStats() {
        Map<String, Object> stats = auditLogService.getLogStats();
        return ResponseEntity.ok(ApiResponse.ok("Audit log statistics retrieved", stats));
    }

    @PostMapping("/record")
    public ResponseEntity<ApiResponse<SystemLog>> recordClientLog(@RequestBody Map<String, Object> body) {
        Integer userId = body.get("userId") != null ? Integer.valueOf(body.get("userId").toString()) : null;
        String performerName = body.get("performerName") != null ? body.get("performerName").toString() : "System";
        String performerRole = body.get("performerRole") != null ? body.get("performerRole").toString() : "ADMINISTRATOR";
        String actionType = body.get("actionType") != null ? body.get("actionType").toString() : "MANUAL_LOG";
        String entityName = body.get("entityName") != null ? body.get("entityName").toString() : "System";
        Integer entityId = body.get("entityId") != null ? Integer.valueOf(body.get("entityId").toString()) : null;
        String description = body.get("description") != null ? body.get("description").toString() : "Manual operation recorded";
        String severity = body.get("severity") != null ? body.get("severity").toString() : "INFO";
        String ipAddress = body.get("ipAddress") != null ? body.get("ipAddress").toString() : "127.0.0.1";

        SystemLog saved = auditLogService.log(userId, performerName, performerRole, actionType, entityName, entityId, description, severity, ipAddress);
        return ResponseEntity.ok(ApiResponse.ok("System log recorded successfully", saved));
    }
}
